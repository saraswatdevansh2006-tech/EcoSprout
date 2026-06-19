import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBellAlert } from 'react-icons/hi2';
import { supabase } from '@/lib/supabase';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function PushManager({ isVisible = true }: { isVisible?: boolean }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const [showAutoPrompt, setShowAutoPrompt] = useState(false);

  const subscribeButtonOnClick = async () => {
    setShowAutoPrompt(false);
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) throw new Error("Missing VAPID Key");

      if (Notification.permission === 'denied') {
        showStatus("Please allow notifications in your browser settings.", "error");
        setIsLoading(false);
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error("Permission not granted");
      }
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      setSubscription(sub);
      setIsSubscribed(true);

      const subData = sub.toJSON();
      const { error } = await supabase
        .from('subscriptions')
        .upsert(
          { endpoint: sub.endpoint, auth: subData.keys?.auth || "", p256dh: subData.keys?.p256dh || "" },
          { onConflict: 'endpoint' }
        );

      if (error) throw new Error("Failed to save subscription to database");
      
      // Trigger instant welcome notification from Gemini
      try {
        await fetch('/api/welcome-nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: {
              endpoint: sub.endpoint,
              keys: {
                auth: subData.keys?.auth || "",
                p256dh: subData.keys?.p256dh || ""
              }
            }
          })
        });
      } catch (welcomeErr) {
        console.error("Welcome notification error:", welcomeErr);
      }
      
      showStatus("Subscribed successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      if (Notification.permission === 'denied' || error.name === 'NotAllowedError' || error.message?.includes('permission denied')) {
        showStatus("Notifications are blocked by your browser.", "error");
      } else {
        showStatus("Failed to enable push notifications.", "error");
      }
      setIsSubscribed(false);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeButtonOnClick = async () => {
    if (!subscription) return;
    setIsLoading(true);
    try {
      await supabase.from('subscriptions').delete().eq('endpoint', subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);
      showStatus("Unsubscribed successfully!");
    } catch (err) {
      console.error("Unsubscribe error:", err);
      showStatus("Failed to unsubscribe.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub && Notification.permission === 'granted') {
            setIsSubscribed(true);
            setSubscription(sub);
            const subData = sub.toJSON();
            const p256dh = subData.keys?.p256dh || "";
            const auth = subData.keys?.auth || "";
            
            supabase.from('subscriptions').upsert(
              { endpoint: sub.endpoint, auth: auth, p256dh: p256dh },
              { onConflict: 'endpoint' }
            ).then(({ error }) => {
              if (error) console.error("Background sync error:", error);
            });
          } else {
            // Clean up stale subscription if permission is revoked or reset
            if (sub && Notification.permission !== 'granted') {
              sub.unsubscribe();
            }
            
            if (Notification.permission === 'default') {
              // Modern browsers block native prompts on load without a user gesture.
              // So we show our own beautiful modal first!
              setShowAutoPrompt(true);
            } else if (Notification.permission === 'granted') {
              subscribeButtonOnClick();
            }
          }
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return (
    <>
      <AnimatePresence>
        {showAutoPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <HiOutlineBellAlert className="text-3xl text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Stay Updated! 🌱
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {"Enable daily nudges to keep your eco-plant thriving. We'll only send one quick reminder a day!"}
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowAutoPrompt(false)}
                  aria-label="Dismiss notification prompt"
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-white/5 transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={subscribeButtonOnClick}
                  disabled={isLoading}
                  aria-label="Enable daily push notifications"
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center"
                >
                  {isLoading ? "Enabling..." : "Enable"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex flex-col space-y-1 pb-2">
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-[10px] text-center px-2 py-1 mx-4 rounded-md mb-1 ${
                  statusMsg.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {statusMsg.text}
              </motion.div>
            )}

            {!isSubscribed ? (
              <button
                onClick={subscribeButtonOnClick}
                disabled={isLoading}
                aria-label="Enable push notifications"
                className="w-full text-left px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? "Enabling..." : "Enable Push Notifications"}
              </button>
            ) : (
              <>
                <button
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const res = await fetch('/api/cron/daily-nudge');
                      const data = await res.json();
                      if (data.success) {
                        showStatus("Test notification sent!");
                      } else {
                        showStatus("Failed to send.", "error");
                      }
                    } catch {
                      showStatus("Failed to send.", "error");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  aria-label="Send test push notification"
                  className="w-full text-left px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Test Notification"}
                </button>
                <button
                  onClick={unsubscribeButtonOnClick}
                  disabled={isLoading}
                  aria-label="Disable push notifications"
                  className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  Disable Notifications
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

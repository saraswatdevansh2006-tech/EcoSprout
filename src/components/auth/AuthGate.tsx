"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { PiPlantFill } from "react-icons/pi";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { useCarbonStore } from "@/store/carbon-store";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setLocalUser] = useState<User | null>(null);
  const setUser = useCarbonStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setLocalUser(u);
      setUser(u);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setLocalUser(u);
      setUser(u);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });
        if (error) throw error;
        setSuccessMsg("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to sign in with ${provider}`);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)]">
        Loading EcoSprout...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-md p-8 glass-card border border-[var(--border-subtle)] rounded-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg mb-4">
              <PiPlantFill className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
              EcoSprout
            </h1>
            <p className="text-[var(--text-muted)] mt-2">
              Sign in to secure your plant's data.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
            {successMsg && <p className="text-emerald-400 text-sm text-center">{successMsg}</p>}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]"></div>
            </div>
            <span className="relative px-3 bg-[var(--bg-primary)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-medium hover:bg-[var(--border-subtle)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FaGoogle className="text-red-400 text-lg" />
              <span>Google</span>
            </button>
            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-medium hover:bg-[var(--border-subtle)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FaGithub className="text-[var(--text-primary)] text-lg" />
              <span>GitHub</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); setSuccessMsg(""); }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors cursor-pointer"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

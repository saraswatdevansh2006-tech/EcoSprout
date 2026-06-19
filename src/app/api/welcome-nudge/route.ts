import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import webpush from "web-push";

interface WelcomeRequest {
  subscription: {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  };
}

/**
 * POST handler for sending an instant welcome push notification to a newly subscribed user.
 * Generates an eager, welcoming greeting from Sprout using Gemini and delivers it via Web Push.
 * @param {NextRequest} request - The incoming API request containing Web Push subscription keys.
 * @returns {Promise<NextResponse>} A JSON response confirming successful delivery.
 */
export async function POST(request: NextRequest) {
  try {
    const body: WelcomeRequest = await request.json();
    if (!body || !body.subscription || !body.subscription.endpoint) {
      return NextResponse.json({ error: "Missing subscription info" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let welcomeMessage = "Welcome to EcoSprout! 🌱 Let's grow a greener future together!";

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `You are Sprout, a tiny, adorable, eco-companion virtual plant.
The user has just enabled push notifications to track their carbon footprint and take care of you.
Write an enthusiastic, cute welcome message from Sprout (MAXIMUM 15 words) expressing your excitement. Keep it cute and use 1-2 emojis!
Respond with ONLY the message text, nothing else.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/['"]/g, "");
        if (text) welcomeMessage = text;
      } catch (err) {
        console.warn("Welcome Gemini generation failed, using fallback:", err);
      }
    } else {
      console.warn("GEMINI_API_KEY missing, using fallback welcome message.");
    }

    // Configure webpush
    webpush.setVapidDetails(
      'mailto:test@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const payload = JSON.stringify({
      title: 'Welcome to EcoSprout! 🌿',
      body: welcomeMessage,
    });

    const pushSubscription = {
      endpoint: body.subscription.endpoint,
      keys: {
        auth: body.subscription.keys.auth,
        p256dh: body.subscription.keys.p256dh,
      }
    };

    await webpush.sendNotification(pushSubscription, payload);

    return NextResponse.json({ success: true, message: welcomeMessage });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Welcome nudge error:", err);
    return NextResponse.json({ error: err.message || "Failed to send welcome push" }, { status: 500 });
  }
}

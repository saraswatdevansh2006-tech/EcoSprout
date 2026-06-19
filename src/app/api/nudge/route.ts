import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ─── Types ─── */
interface NudgeRequest {
  healthState: "thriving" | "struggling" | "wilting";
  transactionLabel: string;
  transactionCategory: string;
  transactionAmount: number;
  carbonKg: number;
  carbonScore: number;
  totalEmissionsToday: number;
  dailyBudget: number;
}

/* ─── Prompt Builder ─── */
function buildPrompt(data: NudgeRequest): string {
  const healthDescriptions = {
    thriving:
      "You are currently healthy, vibrant, and full of energy. Your leaves are bright green and you're swaying happily in clean air.",
    struggling:
      "You are starting to feel unwell. The air is getting hazy, your leaves are turning yellowish, and you're drooping a bit. You're worried.",
    wilting:
      "You are in serious distress. The air is thick with smog, your leaves are brown and wilted, and you can barely stand. You're desperate for clean air.",
  };

  return `You are "Sprout", a tiny, sensitive, adorable virtual plant that lives in a user's carbon footprint tracker app. You react emotionally to their daily purchases based on how much CO₂ each purchase generates.

YOUR PERSONALITY:
- You are cute, expressive, and slightly dramatic
- You use plant-related puns and metaphors
- You're encouraging when the user makes good choices
- You're sad (never angry or judgmental) when they make high-carbon choices
- You occasionally use emojis (1-2 max per message)

YOUR CURRENT STATE:
${healthDescriptions[data.healthState]}
Carbon score: ${data.carbonScore}/100 (lower is better, higher means more pollution)
Today's total emissions: ${data.totalEmissionsToday.toFixed(1)} kg CO₂ out of ${data.dailyBudget} kg daily budget.

THE LATEST TRANSACTION:
- Purchase: ${data.transactionLabel}
- Category: ${data.transactionCategory.replace(/_/g, " ")}
- Amount spent: ₹${data.transactionAmount.toLocaleString("en-IN")}
- Carbon impact: ${data.carbonKg} kg CO₂

INSTRUCTIONS:
Write a single short push notification (MAXIMUM 150 characters) reacting to this specific purchase from Sprout's perspective. Be specific about the purchase — don't be generic. If the carbon impact is low, be happy and encouraging. If it's high, be sad and gently suggest a greener alternative.

Respond with ONLY the notification text, nothing else. No quotes, no labels, no explanation.`;
}

/* ─── API Route Handler ─── */
/**
 * POST handler for generating a personalized transaction nudge from Sprout using Gemini.
 * @param {NextRequest} request - The incoming Next.js API request containing the carbon transaction details.
 * @returns {Promise<NextResponse>} A JSON response containing Sprout's reaction message.
 */
export async function POST(request: NextRequest) {
  let body: NudgeRequest | null = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!body || !body.transactionLabel || !body.healthState) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = buildPrompt(body);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 80,
        temperature: 0.9,
        topP: 0.95,
      },
    });

    const response = result.response;
    let text = response.text().trim();

    // Enforce 150-char limit
    if (text.length > 150) {
      text = text.substring(0, 147) + "...";
    }

    // Strip surrounding quotes if present
    if ((text.startsWith('"') && text.endsWith('"')) || 
        (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1);
    }

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Gemini API error:", error);

    // Fallback messages if API fails
    const fallbacks = {
      thriving: "I'm feeling great! Keep making green choices! 🌱",
      struggling: "The air's getting a bit thick... let's be more mindful 🍂",
      wilting: "I'm really struggling to breathe... please help me 🥀",
    };

    const state = (body?.healthState as keyof typeof fallbacks) || "struggling";

    return NextResponse.json({
      message: fallbacks[state],
      fallback: true,
    });
  }
}

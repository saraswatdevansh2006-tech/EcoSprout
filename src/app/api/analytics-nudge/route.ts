import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ─── Types ─── */
interface AnalyticsRequest {
  weeklyEmissions: number[];
  monthlyScore: number;
}

/* ─── Prompt Builder ─── */
function buildPrompt(data: AnalyticsRequest): string {
  const isHealthy = data.monthlyScore <= 30;
  const isStruggling = data.monthlyScore > 30 && data.monthlyScore <= 70;
  
  let personality = "";
  if (isHealthy) {
    personality = "You are a happy, thriving virtual plant. Your leaves are bright green, and you are highly motivating. Praise the user for keeping their carbon footprint low.";
  } else if (isStruggling) {
    personality = "You are a struggling virtual plant. The air feels smoggy. You are slightly disappointed but still encouraging. Gently warn the user to cut back on high-emission activities.";
  } else {
    personality = "You are an angry, wilting virtual plant! You are desperate for clean air and very demanding. Tell the user strongly that their emissions are way too high and they MUST lower their carbon footprint immediately. Use all caps for emphasis if needed.";
  }

  const totalWeekly = data.weeklyEmissions.reduce((sum, val) => sum + val, 0);
  const averageDaily = (totalWeekly / 7).toFixed(1);

  return `You are "Sprout", an adorable, sensitive virtual plant living in an eco-tracking dashboard. 

YOUR CURRENT STATE & PERSONALITY:
${personality}

USER'S DATA:
- Monthly Carbon Score: ${data.monthlyScore}/100 (Lower is better. 0-30 = Good, 31-70 = Warning, 71+ = Bad)
- Total Weekly Emissions: ${totalWeekly.toFixed(1)} kg CO₂
- Average Daily Emissions: ${averageDaily} kg CO₂

INSTRUCTIONS:
Write a short, expressive message (MAXIMUM 200 characters) directly addressing the user. Speak from the perspective of the plant.
Base your tone heavily on the Monthly Carbon Score.
Include 1-2 emojis.

Respond with ONLY the spoken message, nothing else.`;
}

/* ─── API Route Handler ─── */
export async function POST(request: NextRequest) {
  let body: AnalyticsRequest | null = null;

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

    if (!body || typeof body.monthlyScore !== "number") {
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
        maxOutputTokens: 100,
        temperature: 0.9,
      },
    });

    const response = result.response;
    let text = response.text().trim();

    // Enforce char limit roughly
    if (text.length > 200) {
      text = text.substring(0, 197) + "...";
    }

    // Strip surrounding quotes if present
    if ((text.startsWith('"') && text.endsWith('"')) || 
        (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1);
    }

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Gemini API error (Analytics):", error);

    // Fallbacks
    const score = body?.monthlyScore ?? 50;
    const isHealthy = score <= 30;
    const isStruggling = score > 30 && score <= 70;
    
    let fallbackText = "This is too much CO₂! I'm struggling here, please cut down on the high-emission purchases! 🥀";
    if (isHealthy) {
      fallbackText = "You're doing amazing! We are breathing easy this month! Keep up the green choices! 🌱✨";
    } else if (isStruggling) {
      fallbackText = "It's getting a bit smoggy... Try swapping some deliveries for home cooking or taking public transit! 🍂";
    }

    return NextResponse.json({
      message: fallbackText,
      fallback: true,
    });
  }
}

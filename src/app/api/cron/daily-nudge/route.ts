import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';

// Initialize Supabase with the Service Role Key to bypass RLS for background jobs
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

// Configure web-push
webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const DAILY_BUDGET_KG = 6;

export async function GET(req: Request) {
  try {
    // 1. Fetch transactions from the last 30 days to calculate score
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('carbon_kg')
      .gte('timestamp', thirtyDaysAgo);

    if (txError) throw txError;

    const totalMonthEmissions = (txs || []).reduce((sum, t) => sum + Number(t.carbon_kg), 0);
    const avgDailyEmissions = totalMonthEmissions / 30;
    const monthlyScore = Math.round((avgDailyEmissions / DAILY_BUDGET_KG) * 100);

    let aiMessage = "";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      let stateDesc = "";
      if (monthlyScore <= 30) stateDesc = "thriving and happy";
      else if (monthlyScore <= 70) stateDesc = "struggling and a bit yellow";
      else stateDesc = "wilting and brown";

      const prompt = `You are Sprout, a cute eco-companion virtual plant.
Your current carbon score is ${monthlyScore} (lower is better, under 30 is great, over 70 is bad).
You are currently ${stateDesc}.
Write a very short, engaging push notification (max 15 words) to send to the user's phone to remind them about you and encourage eco-friendly actions today.
Make it sound like it's coming directly from Sprout.`;

      const result = await model.generateContent(prompt);
      aiMessage = result.response.text().trim().replace(/['"]/g, "");
    } catch (err) {
      console.warn("Gemini API rate limit hit during nudge, using fallback message.", err);
      if (monthlyScore <= 30) {
        aiMessage = "I'm thriving! Keep up the great eco-friendly work today! 🌱";
      } else if (monthlyScore <= 70) {
        aiMessage = "I'm feeling a bit dry... Let's try to lower emissions today! 🍂";
      } else {
        aiMessage = "I'm wilting! Please help me by making greener choices today! 🥀";
      }
    }

    // 3. Fetch all subscriptions
    const { data: subs, error: subError } = await supabase
      .from('subscriptions')
      .select('*');

    if (subError) throw subError;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' });
    }

    // 4. Send push notification to all subscribers
    const payload = JSON.stringify({
      title: 'Sprout Update 🌱',
      body: aiMessage,
    });

    const sendPromises = subs.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      };
      return webpush.sendNotification(pushSubscription, payload).catch(err => {
        console.error('Error sending push to endpoint:', sub.endpoint, err);
        // Optional: Remove invalid subscriptions here
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, messageSent: aiMessage, recipients: subs.length });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

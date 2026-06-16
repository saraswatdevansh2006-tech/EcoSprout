# 🌱 EcoSprout — Gamified Carbon Tracker

EcoSprout is an interactive, gamified web application designed to encourage eco-friendly habits by visualizing your real-world sustainability efforts as a growing 3D digital plant.

## 🏆 Your Chosen Vertical
**Sustainability & Environmental Tech / Gamification**

## 🧠 Approach and Logic
The core philosophy behind EcoSprout is that **positive reinforcement and visual feedback** are the most effective ways to build long-term habits. 

Instead of showing users boring charts of carbon emissions, we translate their daily actions (like carpooling, recycling, or using reusable bags) into points. These points are directly tied to the health and growth stage of a central 3D "Eco-Plant." 
- **Engagement:** A streak system encourages users to log actions daily.
- **Retention:** AI-powered, personalized push notifications remind users to care for their plant, making the experience feel alive.

## ⚙️ How the Solution Works
EcoSprout is built using a modern, highly responsive web stack:
1. **Frontend (Next.js & Tailwind CSS):** Provides a sleek, glassmorphism-inspired UI with smooth Framer Motion animations.
2. **3D Rendering (Three.js & React-Three-Fiber):** Dynamically renders the user's plant. As the user gains points and levels up, the 3D model changes to reflect their progress.
3. **Backend & Auth (Supabase):** Securely manages user accounts, authenticates sessions, stores the user's carbon log history, and securely saves push notification endpoints.
4. **AI Integration (Google Gemini API):** Analyzes the user's current progress and generates personalized, contextual, and encouraging push notification nudges.
5. **Background Sync (Web Push & Service Workers):** Delivers the AI-generated nudges to the user's device even when the app is closed.

## ⚠️ Any Assumptions Made
- **Device Capabilities:** The user is operating a modern web browser capable of rendering WebGL for the 3D experience.
- **Push Permissions:** The user is willing to grant push notification permissions to experience the dynamic daily nudges. (The app gracefully degrades to a manual UI if blocked).
- **Environment Configuration:** The project assumes that Supabase API keys, Google Gemini API keys, and secure VAPID keys for push notifications are properly configured in the deployment environment.

---

## 🚀 Running Locally

First, install the dependencies:
```bash
npm install
```

Ensure your `.env.local` file is populated with the required keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
GEMINI_API_KEY=your_gemini_api_key
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

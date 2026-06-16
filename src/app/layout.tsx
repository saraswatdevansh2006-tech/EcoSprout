import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoSprout — Gamified Carbon Footprint Tracker",
  description:
    "Watch your virtual plant thrive or wilt based on your daily carbon footprint. AI-powered nudges help you make greener choices.",
  keywords: ["carbon footprint", "sustainability", "eco tracker", "gamification", "green living"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-screen w-screen overflow-hidden">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}

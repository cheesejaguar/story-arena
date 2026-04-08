import type { Metadata } from "next";
import { Cormorant_Garamond, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/footer";

// Display: Cormorant Garamond — refined high-contrast serif with elegant italics.
// The wordmark uses this.
const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body: Fraunces — variable serif that holds its own next to Cormorant.
// Used for running text and the story-prose utility.
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

// Labels / metadata: IBM Plex Mono — precise grotesque monospace.
// Used for masthead chrome, small-caps-style labels, volume numbers.
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Story Arena — Three frontier AIs. One prompt. You choose.",
  description:
    "A blind contest of fiction between frontier language models. Read the work, pick the finest pen, turn each judgment into a benchmark label.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${cormorant.variable} ${fraunces.variable} ${plexMono.variable} min-h-full flex flex-col paper-grain`}
      >
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}

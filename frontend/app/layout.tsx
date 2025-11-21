import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Brand fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brand metadata
export const metadata: Metadata = {
  title: "ArrangeIQ – The Intelligent Seating Engine",
  description:
    "ArrangeIQ is the intelligent, solver-first seating engine for weddings, corporate events, and large-scale professional planning.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-50">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
          min-h-screen
          font-sans
          bg-slate-950
          text-slate-50
        `}
      >
        {/* GLOBAL BRAND WRAPPER */}
        <div className="min-h-screen bg-slate-950">
          {children}
        </div>
      </body>
    </html>
  );
}

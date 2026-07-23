import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bengaliSans = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

import { PostHogProvider } from "./PostHogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LangSync } from "@/components/LangSync";
import WebVitals from "@/components/WebVitals";

export const metadata: Metadata = {
  title: {
    default: "OpsHub — Enterprise Operations Hub",
    template: "%s · OpsHub",
  },
  description: "Enterprise Operations Hub — HR, payroll, attendance and team management",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0e14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bengaliSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <LangSync />
            <WebVitals />
            {children}
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

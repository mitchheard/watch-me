import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";
// import { Header } from "../components/Header"; // Removed Header import
import LayoutShell from "@/components/LayoutShell"; // Added LayoutShell import
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import {
  UMAMI_SCRIPT_SRC,
  UMAMI_WEBSITE_ID,
} from "@/lib/umami-bootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Watch Me",
  description: "Track your movies and TV shows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <Script
          src={UMAMI_SCRIPT_SRC}
          strategy="beforeInteractive"
          data-website-id={UMAMI_WEBSITE_ID}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <LayoutShell>
            {children}
            <Toaster position="bottom-right" reverseOrder={false} />
          </LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}

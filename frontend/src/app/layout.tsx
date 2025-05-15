import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthButton } from "../components/AuthButton";
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
          <div className="container flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold">Watch Me</h1>
            <AuthButton />
          </div>
        </header>
        <main className="container px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

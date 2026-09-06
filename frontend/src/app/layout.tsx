import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/AuthContext';
import LayoutShell from '@/components/LayoutShell';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { UMAMI_SCRIPT_SRC, UMAMI_WEBSITE_ID } from '@/lib/umami-bootstrap';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Watch Me',
  description: 'What do we watch tonight?',
  applicationName: 'Watch Me',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Watch Me',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c0b0a',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-canvas text-ink`}>
        <AuthProvider>
          <LayoutShell>
            {children}
            <Toaster
              position="top-center"
              reverseOrder={false}
              toastOptions={{
                style: {
                  background: 'var(--wm-elevated)',
                  color: 'var(--wm-ink)',
                  border: '1px solid var(--wm-line)',
                },
              }}
            />
          </LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}

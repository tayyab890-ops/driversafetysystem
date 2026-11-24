import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/themeContext';
import { AuthProvider } from '@/lib/authContext';
import { Antonio, Manrope, JetBrains_Mono } from 'next/font/google';

const antonio = Antonio({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-antonio',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DriveGuard AI — Intelligent Driver Safety Monitoring Platform',
  description: 'Automotive-grade AI platform monitoring driver fatigue, attention, and in-cabin threat candidates in real time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${antonio.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col font-sans">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


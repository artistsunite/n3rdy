import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import FirebaseAnalytics from '@/components/FirebaseAnalytics';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'N3RDY — AI Market Intelligence',
  description:
    'Bloomberg-grade AI market intelligence delivered to Telegram. Continuous news scanning, source trust scoring, story clustering, sentiment analysis, and 7-day predictive briefings powered by Claude Fable 5.',
  keywords: [
    'market intelligence', 'AI trading', 'financial analysis', 'Telegram bot',
    'Bloomberg terminal', 'market briefings', 'Claude AI', 'predictive analysis',
  ],
  openGraph: {
    title: 'N3RDY — AI Market Intelligence',
    description: 'Your AI market intelligence desk. Before markets react.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-n3-bg text-n3-text antialiased overflow-x-hidden">
        <Providers>
          <FirebaseAnalytics />
          {children}
        </Providers>
      </body>
    </html>
  );
}

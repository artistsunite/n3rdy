import type { Metadata } from 'next';
import { Poppins, Source_Serif_4 } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic', 'normal'],
  variable: '--font-source-serif-4',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bloom — AI Floral Design Platform',
  description:
    'AI-powered plant and floral design platform. Generate, sculpt, and compose botanical masterpieces with intelligent design tools.',
};

export default function BloomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${poppins.variable} ${sourceSerif4.variable}`}
      style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}

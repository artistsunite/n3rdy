'use client';

import { signIn } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 bg-n3-bg">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-n3-text mb-4">
          Your personal AI intelligence analyst.{' '}
          <span className="text-n3-primary">Free to start.</span>
        </h2>
        <p className="text-n3-muted text-lg mb-10">
          Add your sources, set your watchlist, and receive your first briefing in minutes.
          No credit card required.
        </p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg font-semibold px-10 py-4 rounded-lg hover:bg-n3-primary/90 transition-colors text-base"
        >
          Sign in with Google — it&apos;s free
          <ArrowRight size={18} />
        </button>
        <p className="text-n3-muted text-sm mt-4">
          All AI predictions are informational only and do not constitute financial advice.
        </p>
      </div>
    </section>
  );
}

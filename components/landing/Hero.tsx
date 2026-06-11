'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-n3-bg">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#00E5FF 1px, transparent 1px), linear-gradient(90deg, #00E5FF 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-n3-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-n3-primary/10 border border-n3-primary/30 rounded-full px-4 py-1.5 text-n3-primary text-sm font-medium mb-8"
        >
          <Zap size={14} />
          AI-Powered Market Intelligence
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-n3-text leading-tight mb-6"
        >
          Know what matters{' '}
          <span className="text-n3-primary">before the</span>
          <br />
          market does.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-n3-muted max-w-2xl mx-auto mb-10"
        >
          Collect intelligence from hundreds of sources. AI ranks, analyses, and delivers
          personalised executive briefings for founders, investors, traders, and analysts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg font-semibold px-8 py-3.5 rounded-lg hover:bg-n3-primary/90 transition-colors text-base"
          >
            Start free — sign in with Google
            <ArrowRight size={18} />
          </button>
          <a
            href="#features"
            className="inline-flex items-center gap-2 border border-n3-border text-n3-text px-8 py-3.5 rounded-lg hover:border-n3-primary/50 hover:text-n3-primary transition-colors text-base"
          >
            See how it works
          </a>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto border-t border-n3-border pt-10"
        >
          {[
            { value: '500+', label: 'Sources monitored' },
            { value: '< 2min', label: 'Briefing delivery' },
            { value: '24/7', label: 'Market coverage' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-n3-primary">{value}</div>
              <div className="text-sm text-n3-muted mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

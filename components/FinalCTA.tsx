'use client';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard, Zap } from 'lucide-react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="relative py-36 overflow-hidden" style={{ background: '#050816' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.07) 0%, transparent 65%)' }} />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-n3-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-n3-primary/20 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-n3-primary/25 bg-n3-primary/5 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-n3-success animate-pulse" />
            <span className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase">AI Market Intelligence · Powered by Claude Fable 5</span>
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-n3-text leading-[1.05] tracking-tight mb-5">
            Markets Move Fast.
          </h2>

          <h3 className="text-3xl sm:text-4xl font-bold text-n3-primary mb-8 text-glow">
            Intelligence Should Move Faster.
          </h3>

          <p className="text-lg text-n3-muted max-w-xl mx-auto leading-relaxed mb-12">
            Sign in to access the N3RDY operator dashboard. Generate briefings, configure alerts,
            and control your intelligence pipeline from anywhere.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 px-8 py-4 bg-n3-primary text-n3-bg font-bold rounded-xl shadow-glow-lg text-base transition-all hover:bg-n3-primary/90"
              >
                <Zap size={18} />
                Access Dashboard
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <a
                href="#report"
                className="flex items-center gap-2.5 px-8 py-4 border border-n3-border hover:border-n3-primary/40 bg-n3-card text-n3-text font-semibold rounded-xl text-base transition-all"
              >
                <LayoutDashboard size={18} />
                View Sample Brief
              </a>
            </motion.div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-n3-border/40">
            {[
              { v: 'Claude Fable 5', l: 'AI Engine' },
              { v: '32+', l: 'Tests Passing' },
              { v: '127+', l: 'News Sources' },
              { v: '8', l: 'Asset Classes' },
              { v: '24', l: 'Admin Commands' },
            ].map(item => (
              <div key={item.l} className="text-center">
                <div className="text-xl font-black font-mono text-n3-primary">{item.v}</div>
                <div className="text-xs text-n3-muted mt-0.5">{item.l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

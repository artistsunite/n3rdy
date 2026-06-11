'use client';
import { motion } from 'framer-motion';
import { Rss, ShieldCheck, Filter, Layers, TrendingUp, Brain, FileText } from 'lucide-react';

const steps = [
  {
    icon: Rss, num: '01', label: 'News Sources',
    desc: '127+ RSS feeds, JSON APIs, economic calendars, and social signals collected every 15 minutes. Sources scored by trust tier from official central banks (92) down to social media (35).',
    color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)',
  },
  {
    icon: ShieldCheck, num: '02', label: 'Trust Scoring',
    desc: 'Every source is evaluated for trust, bias, accuracy, and speed. Official sources (.gov, central banks) rank highest. Social signals rank lowest. Confidence is propagated through the pipeline.',
    color: '#00FF88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.2)',
  },
  {
    icon: Filter, num: '03', label: 'Deduplication',
    desc: 'SequenceMatcher similarity analysis removes duplicate articles above 0.86 threshold. SHA256 canonical hashing prevents re-processing the same content across collection runs.',
    color: '#FFC857', bg: 'rgba(255,200,87,0.08)', border: 'rgba(255,200,87,0.2)',
  },
  {
    icon: Layers, num: '04', label: 'Story Clustering',
    desc: 'Articles grouped by 0.62 topic similarity into clusters. Each cluster scored for market relevance, velocity (publication rate), and confidence. Facts separated from commentary.',
    color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)',
  },
  {
    icon: TrendingUp, num: '05', label: 'Market Impact Analysis',
    desc: 'Per-asset directional scoring across 8 asset classes: Stocks, Crypto, Oil, Gold, USD, AUD/USD, Bonds, Volatility. Evidence-based reasoning tied directly to cluster headlines.',
    color: '#00FF88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.2)',
  },
  {
    icon: Brain, num: '06', label: '7-Day Prediction Engine',
    desc: 'Scenario generation calibrated against 45 days of tracked outcomes. Base case, bullish path, and bearish risk calculated with confidence scores. Self-improving hit-rate tracking.',
    color: '#FFC857', bg: 'rgba(255,200,87,0.08)', border: 'rgba(255,200,87,0.2)',
  },
  {
    icon: FileText, num: '07', label: 'AI Intelligence Brief',
    desc: 'Claude Fable 5 synthesises all analysis into a Bloomberg-style brief with adaptive deep thinking. Executive summary, market impact forecast, and full 7-day per-asset outlook. Posted to Telegram.',
    color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)',
  },
];

export default function Pipeline() {
  return (
    <section id="pipeline" className="py-28 bg-n3-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.04) 0%, transparent 65%)' }} />

      <div className="relative max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-20">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">Intelligence Pipeline</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">How N3RDY Thinks</h2>
          <p className="text-n3-muted max-w-xl mx-auto">Seven stages transform raw global news into institutional-grade market intelligence.</p>
        </motion.div>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-6 sm:left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-n3-border to-transparent sm:-translate-x-px" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            const isRight = i % 2 === 0;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity:0, x: isRight ? -24 : 24 }}
                whileInView={{ opacity:1, x:0 }}
                transition={{ duration:0.55, delay:i*0.08 }}
                viewport={{ once:true, margin:'-60px' }}
                className={`relative flex items-start gap-6 sm:gap-8 mb-10 sm:mb-12 ${isRight ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
              >
                {/* Content */}
                <div className={`flex-1 ${isRight ? 'sm:text-right' : 'sm:text-left'} pl-16 sm:pl-0`}>
                  <div
                    className="inline-block px-5 py-4 rounded-xl mb-0"
                    style={{ background: step.bg, border: `1px solid ${step.border}` }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono font-bold tracking-widest" style={{ color: step.color }}>{step.num}</span>
                      <h3 className="font-bold text-n3-text text-base">{step.label}</h3>
                    </div>
                    <p className="text-sm text-n3-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>

                {/* Center node */}
                <div className="absolute left-0 sm:static sm:flex-shrink-0 flex items-center justify-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-card z-10"
                    style={{ background: step.bg, border: `1px solid ${step.border}` }}
                  >
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden sm:block flex-1" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

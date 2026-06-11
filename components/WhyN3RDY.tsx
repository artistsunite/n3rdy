'use client';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Zap } from 'lucide-react';

const pillars = [
  {
    icon: Brain,
    num: '01',
    label: 'Intelligence',
    color: '#00E5FF',
    bg: 'rgba(0,229,255,0.08)',
    border: 'rgba(0,229,255,0.2)',
    headline: 'Multi-source analysis and clustering.',
    points: [
      '127+ trusted sources, continuously monitored',
      'Trust scoring: central banks 92, social media 35',
      'Topic clustering at 0.62 similarity threshold',
      'Facts vs. commentary separation',
      'Market relevance scored per-cluster',
    ],
  },
  {
    icon: TrendingUp,
    num: '02',
    label: 'Prediction',
    color: '#00FF88',
    bg: 'rgba(0,255,136,0.08)',
    border: 'rgba(0,255,136,0.2)',
    headline: '7-day forward scenario modeling.',
    points: [
      'Base case, bullish, and bearish paths',
      'Calibrated against 45 days of tracked outcomes',
      'Confidence adjusted by historical hit rate',
      'Per-asset outlook across 8 asset classes',
      'Second-order chain analysis',
    ],
  },
  {
    icon: Zap,
    num: '03',
    label: 'Speed',
    color: '#FFC857',
    bg: 'rgba(255,200,87,0.08)',
    border: 'rgba(255,200,87,0.2)',
    headline: 'Continuous monitoring and automated alerts.',
    points: [
      'News collected every 15 minutes',
      'Briefings generated hourly',
      'Breaking alerts within minutes of detection',
      'Confidence-gated: ≥78% before any alert posts',
      'Q&A responses to Telegram questions in seconds',
    ],
  },
];

export default function WhyN3RDY() {
  return (
    <section className="py-28 relative overflow-hidden" style={{ background: '#060B17' }}>
      <div className="absolute inset-0 bg-grid opacity-25" />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-16">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">Core Advantage</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">Why N3RDY</h2>
          <p className="text-n3-muted max-w-xl mx-auto">Three principles that separate N3RDY from news aggregators, alert bots, and generic AI chatbots.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.label}
                initial={{ opacity:0, y:24 }}
                whileInView={{ opacity:1, y:0 }}
                transition={{ duration:0.55, delay:i*0.12 }}
                viewport={{ once:true }}
                className="rounded-2xl p-7 flex flex-col"
                style={{ background: p.bg, border: `1px solid ${p.border}` }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                    <Icon size={22} style={{ color: p.color }} />
                  </div>
                  <span className="text-4xl font-black font-mono" style={{ color: `${p.color}20` }}>{p.num}</span>
                </div>

                <div className="text-[10px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: p.color }}>{p.label}</div>
                <h3 className="text-lg font-bold text-n3-text mb-4 leading-snug">{p.headline}</h3>

                <ul className="space-y-2.5 flex-1">
                  {p.points.map(pt => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-sm text-n3-muted leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* vs row */}
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.4 }} viewport={{ once:true }}
          className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Not a news aggregator', sub: 'News aggregators collect. N3RDY analyses, scores, clusters, and predicts.' },
            { label: 'Not a chatbot', sub: 'N3RDY generates structured intelligence briefs on a schedule, not on demand.' },
            { label: 'Not a trading signal', sub: 'N3RDY provides context for human decisions. Not financial advice.' },
          ].map(item => (
            <div key={item.label} className="p-4 rounded-xl border border-n3-border bg-n3-card">
              <div className="text-sm font-semibold text-n3-text mb-1.5 flex items-center gap-2">
                <span className="text-n3-danger text-base leading-none">✕</span>
                {item.label}
              </div>
              <p className="text-xs text-n3-muted leading-relaxed">{item.sub}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

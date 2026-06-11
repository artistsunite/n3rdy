'use client';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

const chains = [
  {
    event: { label: 'Fed Rate Decision', desc: 'Federal Reserve holds rates above 5.25%', color: '#FF4D6D', bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.3)' },
    first: { label: 'USD Strength', desc: 'Higher rates attract capital; DXY surges', color: '#FFC857', bg: 'rgba(255,200,87,0.08)', border: 'rgba(255,200,87,0.25)' },
    second: { label: 'Global Liquidity Tightens', desc: 'Dollar-denominated debt costs rise worldwide; EM currencies under pressure; equity multiples compress', color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)' },
  },
  {
    event: { label: 'Oil Supply Cut', desc: 'OPEC+ reduces output by 1.5M barrels/day', color: '#FFC857', bg: 'rgba(255,200,87,0.1)', border: 'rgba(255,200,87,0.3)' },
    first: { label: 'Higher Energy Costs', desc: 'Brent crude surges; transport and manufacturing input costs spike', color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.2)' },
    second: { label: 'Inflation Expectations Rise', desc: 'CPI forecasts revised upward; central banks delay rate cuts; bonds sell off; energy stocks outperform', color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)' },
  },
  {
    event: { label: 'Bitcoin ETF Inflows', desc: 'Spot BTC ETF records $900M net inflows in one session', color: '#00FF88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)' },
    first: { label: 'Demand Increase', desc: 'Institutional capital allocates to BTC; spot price rises; altcoins follow', color: '#FFC857', bg: 'rgba(255,200,87,0.08)', border: 'rgba(255,200,87,0.2)' },
    second: { label: 'Risk Appetite Expands', desc: 'Broader crypto market rallies; tech and growth stocks lift; gold weakens as risk-on sentiment dominates', color: '#00FF88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.2)' },
  },
];

function ChainCard({ data, label, delay }: { data: { label: string; desc: string; color: string; bg: string; border: string }; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="rounded-xl p-4 relative"
      style={{ background: data.bg, border: `1px solid ${data.border}` }}
    >
      <div className="text-[10px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: data.color }}>
        {label}
      </div>
      <div className="text-sm font-bold text-n3-text mb-1.5">{data.label}</div>
      <div className="text-xs text-n3-muted leading-relaxed">{data.desc}</div>
    </motion.div>
  );
}

export default function PredictiveChains() {
  return (
    <section className="py-28 relative overflow-hidden" style={{ background: '#060B17' }}>
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.05) 0%, transparent 55%)' }} />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-20">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">Predictive Analysis</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">
            Stop Reading Headlines.
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-n3-primary mb-6">Start Understanding Consequences.</h3>
          <p className="text-n3-muted max-w-xl mx-auto">
            N3RDY traces first and second-order effects through rates, liquidity, USD, volatility, sector rotation, and commodities — not just the headline event.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {chains.map((chain, ci) => (
            <div key={ci} className="flex flex-col gap-3">
              <ChainCard data={chain.event} label="Event" delay={ci * 0.1} />
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: ci * 0.1 + 0.15 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-0.5"
              >
                {[0,1,2].map(d => (
                  <div key={d} className="w-px h-2 bg-n3-border rounded" />
                ))}
                <ArrowDown size={13} className="text-n3-muted" />
              </motion.div>
              <ChainCard data={chain.first} label="First-Order Effect" delay={ci * 0.1 + 0.2} />
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: ci * 0.1 + 0.3 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-0.5"
              >
                {[0,1,2].map(d => (
                  <div key={d} className="w-px h-2 bg-n3-border rounded" />
                ))}
                <ArrowDown size={13} className="text-n3-muted" />
              </motion.div>
              <ChainCard data={chain.second} label="Second-Order Effect" delay={ci * 0.1 + 0.35} />
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.4 }} viewport={{ once:true }}
          className="mt-16 p-6 rounded-2xl border border-n3-primary/20 bg-n3-primary/5 text-center">
          <p className="text-sm text-n3-muted max-w-2xl mx-auto leading-relaxed">
            N3RDY&apos;s 7-day prediction engine traces causal chains through <span className="text-n3-text font-medium">liquidity, rate expectations, oil/commodity channels, USD direction, volatility demand, earnings-risk repricing</span>, and cross-asset confirmation — calibrated against 45 days of tracked outcomes.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

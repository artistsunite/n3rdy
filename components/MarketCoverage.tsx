'use client';
import { motion } from 'framer-motion';
import { TrendingUp, Bitcoin, Droplets, Gem, DollarSign, BarChart2, Calendar, Landmark, Globe2, Cpu, Zap, Shield } from 'lucide-react';

const categories = [
  { icon: TrendingUp, label: 'Stocks', sub: 'S&P 500, NASDAQ, ASX', activity: 'high', live: true, color: '#00FF88' },
  { icon: Bitcoin, label: 'Crypto', sub: 'BTC, ETH, Altcoins', activity: 'high', live: true, color: '#FFC857' },
  { icon: Droplets, label: 'Oil', sub: 'WTI, Brent, OPEC', activity: 'medium', live: true, color: '#FF4D6D' },
  { icon: Gem, label: 'Gold', sub: 'Spot, Futures, ETF', activity: 'medium', live: false, color: '#FFC857' },
  { icon: BarChart2, label: 'Bonds', sub: 'UST, Gilts, Yields', activity: 'high', live: true, color: '#00E5FF' },
  { icon: DollarSign, label: 'FX', sub: 'USD, EUR, AUD, JPY', activity: 'high', live: true, color: '#00E5FF' },
  { icon: Calendar, label: 'Economic Events', sub: 'CPI, NFP, GDP, FOMC', activity: 'medium', live: false, color: '#FFC857' },
  { icon: Landmark, label: 'Central Banks', sub: 'Fed, ECB, RBA, BoE', activity: 'high', live: true, color: '#FF4D6D' },
  { icon: Globe2, label: 'Geopolitics', sub: 'Conflict, Sanctions, Trade', activity: 'low', live: false, color: '#94A3B8' },
  { icon: Cpu, label: 'Technology', sub: 'AI, Semis, Big Tech', activity: 'medium', live: true, color: '#00E5FF' },
  { icon: Zap, label: 'Energy', sub: 'Renewables, Gas, Coal', activity: 'low', live: false, color: '#FFC857' },
  { icon: Shield, label: 'Defence', sub: 'Defence stocks, NATO', activity: 'low', live: false, color: '#94A3B8' },
];

const activityColors: Record<string, string> = { high: '#00FF88', medium: '#FFC857', low: '#94A3B8' };

export default function MarketCoverage() {
  return (
    <section id="coverage" className="py-28 relative overflow-hidden" style={{ background: '#070C18' }}>
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-14">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">Coverage Universe</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">Real-Time Market Coverage</h2>
          <p className="text-n3-muted max-w-xl mx-auto">Every market that matters. Continuous monitoring across 12 categories with configurable topic weighting.</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const actColor = activityColors[cat.activity];
            return (
              <motion.div
                key={cat.label}
                initial={{ opacity:0, scale:0.95 }}
                whileInView={{ opacity:1, scale:1 }}
                transition={{ duration:0.4, delay:i*0.04 }}
                viewport={{ once:true }}
                whileHover={{ borderColor: `${cat.color}40`, scale: 1.02 }}
                className="p-4 rounded-xl border border-n3-border bg-n3-card cursor-default transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}25` }}>
                    <Icon size={17} style={{ color: cat.color }} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {cat.live && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-n3-success animate-pulse" />
                        <span className="text-[9px] font-mono font-bold text-n3-success">LIVE</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: actColor }} />
                      <span className="text-[9px] font-mono capitalize" style={{ color: actColor }}>{cat.activity}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-n3-text mb-0.5">{cat.label}</div>
                <div className="text-xs text-n3-muted">{cat.sub}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-5 justify-center mt-10">
          {Object.entries(activityColors).map(([level, color]) => (
            <div key={level} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs font-mono capitalize text-n3-muted">{level} activity</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-n3-success animate-pulse" />
            <span className="text-xs font-mono text-n3-muted">Live monitoring active</span>
          </div>
        </div>
      </div>
    </section>
  );
}

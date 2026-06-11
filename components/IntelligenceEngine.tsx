'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Source Trust ─────────────────────────────────────────────────────────────
const sources = [
  { name: 'Federal Reserve', score: 95, type: 'Central Bank' },
  { name: 'Reuters', score: 92, type: 'Wire Service' },
  { name: 'Bloomberg', score: 90, type: 'Financial Press' },
  { name: 'Financial Times', score: 88, type: 'Financial Press' },
  { name: 'Wall Street Journal', score: 86, type: 'Financial Press' },
  { name: 'RBA (Aus. Reserve Bank)', score: 94, type: 'Central Bank' },
  { name: 'BIS', score: 93, type: 'Official' },
  { name: 'CNBC Markets', score: 72, type: 'News Media' },
  { name: 'CoinDesk', score: 68, type: 'Crypto Press' },
  { name: 'Reddit r/investing', score: 35, type: 'Social' },
];

function TrustBar({ name, score, type, delay }: { name: string; score: number; type: string; delay: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setWidth(score), delay * 120); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [score, delay]);

  const color = score >= 80 ? '#00FF88' : score >= 60 ? '#FFC857' : '#FF4D6D';
  return (
    <div ref={ref} className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <div>
          <span className="text-xs font-medium text-n3-text">{name}</span>
          <span className="ml-2 text-[10px] font-mono text-n3-muted">{type}</span>
        </div>
        <span className="text-xs font-mono font-bold" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 bg-n3-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, background: color, boxShadow: `0 0 6px ${color}60`, transitionDelay: `${delay * 60}ms` }}
        />
      </div>
    </div>
  );
}

// ── Clustering ───────────────────────────────────────────────────────────────
function ClusteringViz() {
  const [active, setActive] = useState(0);
  const stages = [
    { label: '247 Articles', sub: 'Collected · Last 12h', color: '#94A3B8' },
    { label: '18 Clusters', sub: 'Grouped by topic similarity', color: '#FFC857' },
    { label: '3 Signals', sub: 'High-confidence drivers', color: '#00FF88' },
  ];

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % stages.length), 1400);
    return () => clearInterval(id);
  }, [stages.length]);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {stages.map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <motion.div
            animate={{ scale: active === i ? 1.04 : 1, opacity: active === i ? 1 : 0.55 }}
            transition={{ duration: 0.3 }}
            className="px-6 py-3 rounded-xl border text-center min-w-[180px]"
            style={{ borderColor: active === i ? s.color : '#1E293B', background: active === i ? `${s.color}12` : '#0B1220' }}
          >
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.label}</div>
            <div className="text-[11px] text-n3-muted mt-0.5">{s.sub}</div>
          </motion.div>
          {i < stages.length - 1 && (
            <div className="flex flex-col items-center my-1 gap-0.5">
              {[0,1,2].map(d => (
                <motion.div key={d} className="w-px h-1.5 rounded"
                  animate={{ backgroundColor: active > i ? '#00FF88' : '#1E293B' }}
                  transition={{ delay: d * 0.05, duration: 0.3 }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Sentiment Arc ────────────────────────────────────────────────────────────
function SentimentGauge({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = value / max;
  const r = 36; const cx = 52; const cy = 52;
  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - pct);
  return (
    <div className="flex flex-col items-center">
      <svg width="104" height="64" viewBox="0 0 104 64">
        <path d={`M 16 52 A ${r} ${r} 0 0 1 88 52`} fill="none" stroke="#1E293B" strokeWidth="7" strokeLinecap="round" />
        <motion.path
          d={`M 16 52 A ${r} ${r} 0 0 1 88 52`} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 4px ${color}90)` }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="15" fontWeight="700" fontFamily="monospace">{value}</text>
      </svg>
      <p className="text-xs text-n3-muted text-center -mt-1">{label}</p>
    </div>
  );
}

// ── Market Impact ─────────────────────────────────────────────────────────────
const assets = [
  { name: 'Stocks', dir: 'Bearish', conf: 74, up: false },
  { name: 'Crypto', dir: 'Bearish', conf: 68, up: false },
  { name: 'Oil', dir: 'Bullish', conf: 71, up: true },
  { name: 'Gold', dir: 'Bullish', conf: 65, up: true },
  { name: 'USD', dir: 'Bullish', conf: 78, up: true },
  { name: 'AUD/USD', dir: 'Bearish', conf: 62, up: false },
  { name: 'Bonds', dir: 'Bullish', conf: 58, up: true },
  { name: 'Volatility', dir: 'Rising', conf: 70, up: false },
];

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['Source Trust', 'Clustering', 'Sentiment', 'Market Impact'];

export default function IntelligenceEngine() {
  const [tab, setTab] = useState(0);

  return (
    <section id="intelligence" className="py-28 relative overflow-hidden" style={{ background: '#070C18' }}>
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-14">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">Under the Hood</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">The Intelligence Engine</h2>
          <p className="text-n3-muted max-w-xl mx-auto">Four sub-systems working in concert to produce institutional-grade market analysis.</p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-mono ${
                tab === i
                  ? 'bg-n3-primary text-n3-bg shadow-glow-sm'
                  : 'bg-n3-card border border-n3-border text-n3-muted hover:text-n3-text hover:border-n3-primary/30'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Panel */}
        <motion.div key={tab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
          className="bg-n3-card border border-n3-border rounded-2xl p-6 sm:p-8 shadow-card min-h-[420px]">

          {tab === 0 && (
            <div>
              <h3 className="text-base font-bold text-n3-text mb-1">Source Trust Engine</h3>
              <p className="text-xs text-n3-muted mb-6">Trust scores determine how heavily each source influences confidence calculations. Official sources scored on trust, bias, accuracy, and speed.</p>
              {sources.map((s, i) => <TrustBar key={s.name} {...s} delay={i} />)}
            </div>
          )}

          {tab === 1 && (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1">
                <h3 className="text-base font-bold text-n3-text mb-1">Story Clustering</h3>
                <p className="text-xs text-n3-muted mb-4">Articles clustered by 0.62 topic similarity. Each cluster scored for market relevance, velocity, and confidence.</p>
                <div className="space-y-3 mt-6">
                  {[
                    { label: 'Fed Rate Decision', art: 24, conf: 91, rel: 95 },
                    { label: 'Oil Supply Dynamics', art: 17, conf: 84, rel: 88 },
                    { label: 'BTC Institutional Flow', art: 12, conf: 78, rel: 82 },
                    { label: 'USD Strength Thesis', art: 9, conf: 72, rel: 79 },
                  ].map(c => (
                    <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg bg-n3-bg border border-n3-border/60">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-n3-text truncate">{c.label}</div>
                        <div className="text-xs text-n3-muted mt-0.5">{c.art} articles</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-n3-success">{c.conf}% conf</div>
                        <div className="text-xs font-mono text-n3-primary">{c.rel}% rel</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <h4 className="text-xs font-mono text-n3-muted uppercase tracking-widest mb-4 text-center">Pipeline Flow</h4>
                <ClusteringViz />
              </div>
            </div>
          )}

          {tab === 2 && (
            <div>
              <h3 className="text-base font-bold text-n3-text mb-1">Sentiment Engine</h3>
              <p className="text-xs text-n3-muted mb-8">Risk and sentiment derived from keyword density, source weighting, and Fear &amp; Greed indices.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                <SentimentGauge label="Risk Level" value={72} max={100} color="#FF4D6D" />
                <SentimentGauge label="Market Confidence" value={58} max={100} color="#FFC857" />
                <SentimentGauge label="Stock F&G (CNN)" value={31} max={100} color="#FF4D6D" />
                <SentimentGauge label="Crypto F&G (CMC)" value={44} max={100} color="#FFC857" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Overall Sentiment', val: 'Risk-Off', color: '#FF4D6D' },
                  { label: 'Risk Level', val: 'HIGH', color: '#FF4D6D' },
                  { label: 'Dominant Theme', val: 'Rate/Inflation', color: '#FFC857' },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg bg-n3-bg border border-n3-border text-center">
                    <div className="text-xs text-n3-muted mb-1">{item.label}</div>
                    <div className="text-sm font-mono font-bold" style={{ color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 3 && (
            <div>
              <h3 className="text-base font-bold text-n3-text mb-1">Market Impact Engine</h3>
              <p className="text-xs text-n3-muted mb-6">Evidence-based directional scoring across 8 asset classes. Confidence derived from cluster confidence × source trust.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {assets.map((a, i) => (
                  <motion.div key={a.name} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                    className="p-4 rounded-xl border bg-n3-bg"
                    style={{ borderColor: a.up ? 'rgba(0,255,136,0.2)' : a.dir === 'Rising' ? 'rgba(255,200,87,0.2)' : 'rgba(255,77,109,0.2)' }}>
                    <div className="text-xs font-mono font-semibold text-n3-muted mb-2">{a.name}</div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {a.up ? <TrendingUp size={14} className="text-n3-success" /> : a.dir === 'Rising' ? <TrendingUp size={14} className="text-n3-warning" /> : <TrendingDown size={14} className="text-n3-danger" />}
                      <span className="text-sm font-bold" style={{ color: a.up ? '#00FF88' : a.dir === 'Rising' ? '#FFC857' : '#FF4D6D' }}>{a.dir}</span>
                    </div>
                    <div className="text-xs font-mono text-n3-muted">Conf: <span className="text-n3-text font-semibold">{a.conf}%</span></div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

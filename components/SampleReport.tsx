'use client';
import { motion } from 'framer-motion';
import { Globe, Flame, FileText, Frown, Target, Brain, Cog, Eye, Tag, Link2 } from 'lucide-react';

const reportLines = [
  { icon: Globe, color: '#00E5FF', bold: true, text: 'GLOBAL MARKET INTELLIGENCE BRIEF' },
  { icon: null, color: '#94A3B8', bold: false, text: 'Time: 11/06/2026 14:00 UTC / 00:00 AEST' },
  { icon: null, color: '#1E293B', bold: false, text: '─────────────────────────────────────' },
  { icon: Flame, color: '#FFC857', bold: true, text: 'Top Market-Moving Stories:' },
  { icon: null, color: '#F8FAFC', bold: false, text: '1. Fed holds rates; signals no cuts before Q4 as core PCE holds above 3%' },
  { icon: null, color: '#F8FAFC', bold: false, text: '2. OPEC+ delays production increase; Brent holds above $87' },
  { icon: null, color: '#F8FAFC', bold: false, text: '3. Bitcoin tests $62k support as institutional outflows accelerate' },
  { icon: null, color: '#1E293B', bold: false, text: '─────────────────────────────────────' },
  { icon: FileText, color: '#00E5FF', bold: true, text: 'Executive Summary:' },
  { icon: null, color: '#94A3B8', bold: false, text: 'Lead: Fed rate-hold confirmation reprices front-end yields and strengthens USD.' },
  { icon: null, color: '#94A3B8', bold: false, text: '' },
  { icon: null, color: '#94A3B8', bold: false, text: 'Also moving: OPEC+ supply delay, Bitcoin sentiment weakness, European PMI.' },
  { icon: null, color: '#94A3B8', bold: false, text: '' },
  { icon: null, color: '#94A3B8', bold: false, text: 'Dominant themes: rate/inflation, energy supply, crypto risk-off — converging' },
  { icon: null, color: '#94A3B8', bold: false, text: 'on a high-risk, mixed tone.' },
  { icon: null, color: '#1E293B', bold: false, text: '─────────────────────────────────────' },
  { icon: Frown, color: '#FF4D6D', bold: true, text: 'Fear & Greed:' },
  { icon: null, color: '#F8FAFC', bold: false, text: '📈 Stocks: CNN Fear & Greed: 31 (Fear)' },
  { icon: null, color: '#F8FAFC', bold: false, text: '🪙 Crypto: CoinMarketCap: 44 (Fear)' },
  { icon: null, color: '#1E293B', bold: false, text: '─────────────────────────────────────' },
  { icon: Target, color: '#00FF88', bold: true, text: 'Market Impact Forecast:' },
  { icon: null, color: '#00FF88', bold: false, text: '📈 Stocks: Bearish' },
  { icon: null, color: '#94A3B8', bold: false, text: 'Reason: Rate-hold + USD strength compress multiples; tech leads lower.' },
  { icon: null, color: '#FFC857', bold: false, text: 'Confidence: 74' },
  { icon: null, color: '#1E293B', bold: false, text: '─────────────────────────────────────' },
  { icon: Brain, color: '#00E5FF', bold: true, text: 'N3RDY Prediction:' },
  { icon: null, color: '#94A3B8', bold: false, text: "The Fed's explicit pushback tightens conditions through stronger USD and" },
  { icon: null, color: '#94A3B8', bold: false, text: 'higher real yields, compressing growth multiples. OPEC+ supply delay adds' },
  { icon: null, color: '#94A3B8', bold: false, text: 'an inflationary layer. Second-order: defensive rotation, AUD/EM pressure.' },
  { icon: null, color: '#94A3B8', bold: false, text: '' },
  { icon: null, color: '#F8FAFC', bold: false, text: '7-day base case: Stocks bearish; primary drivers: Fed hold, OPEC+ delay.' },
  { icon: null, color: '#94A3B8', bold: false, text: '' },
  { icon: null, color: '#00FF88', bold: false, text: '📈 Stocks:  Bearish — rate-hold + USD compress multiples; tech exposed.' },
  { icon: null, color: '#FF4D6D', bold: false, text: '🪙 Crypto:  Bearish — risk-off reduces speculative allocation.' },
  { icon: null, color: '#00FF88', bold: false, text: '🛢  Oil:     Bullish — supply delay removes near-term downward pressure.' },
  { icon: null, color: '#00FF88', bold: false, text: '🥇 Gold:    Bullish — safe-haven demand rises as real yields plateau.' },
  { icon: null, color: '#00FF88', bold: false, text: '💵 USD:     Bullish — Fed vs ECB/RBA divergence holds carry advantage.' },
  { icon: null, color: '#FF4D6D', bold: false, text: '🦘 AUD/USD: Bearish — USD + commodity risk-off squeeze AUD below 0.6450.' },
  { icon: null, color: '#00FF88', bold: false, text: '🏛  Bonds:   Bullish — front-end repricing complete; duration attractive.' },
  { icon: null, color: '#FFC857', bold: false, text: '⚡ Volatility: Rising — VIX re-rating likely ahead of CPI Friday.' },
  { icon: null, color: '#1E293B', bold: false, text: '─────────────────────────────────────' },
  { icon: Cog, color: '#FFC857', bold: true, text: 'Key Drivers:' },
  { icon: null, color: '#F8FAFC', bold: false, text: '1. Fed rate-hold signal — no cuts before Q4' },
  { icon: null, color: '#F8FAFC', bold: false, text: '2. OPEC+ supply delay — Brent support intact' },
  { icon: null, color: '#F8FAFC', bold: false, text: '3. CPI print Friday — pivotal for direction' },
  { icon: null, color: '#1E293B', bold: false, text: '─────────────────────────────────────' },
  { icon: Eye, color: '#94A3B8', bold: true, text: 'Watch Next:' },
  { icon: null, color: '#94A3B8', bold: false, text: '- CPI print Friday — upside surprise extends USD/yield move' },
  { icon: null, color: '#94A3B8', bold: false, text: '- Bitcoin $60k support — break accelerates crypto unwind' },
  { icon: Tag, color: '#94A3B8', bold: true, text: 'Trend Tags:' },
  { icon: null, color: '#94A3B8', bold: false, text: 'rate-hold · USD-strength · risk-off · oil-supply · crypto-unwind' },
  { icon: Link2, color: '#94A3B8', bold: true, text: 'Sources:' },
  { icon: null, color: '#94A3B8', bold: false, text: '1. Reuters — reuters.com/markets/fed-hold' },
  { icon: null, color: '#94A3B8', bold: false, text: '2. Bloomberg — bloomberg.com/opec-delay' },
  { icon: null, color: '#1E293B', bold: false, text: '' },
  { icon: null, color: '#94A3B8', bold: false, text: 'Not financial advice.' },
];

export default function SampleReport() {
  return (
    <section id="report" className="py-28 bg-n3-bg relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,229,255,0.04) 0%, transparent 55%)' }} />

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-14">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">Live Sample</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">Intelligence Brief</h2>
          <p className="text-n3-muted max-w-xl mx-auto">A real N3RDY briefing. Generated by Claude Fable 5 with adaptive deep thinking, formatted for Telegram, posted automatically.</p>
        </motion.div>

        <motion.div initial={{ opacity:0, y:32 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.7 }} viewport={{ once:true }}
          className="rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,229,255,0.08)]"
          style={{ border: '1px solid rgba(0,229,255,0.15)' }}>

          {/* Terminal titlebar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: '#0A1628', borderColor: '#1E293B' }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF4D6D]/70" />
              <div className="w-3 h-3 rounded-full bg-[#FFC857]/70" />
              <div className="w-3 h-3 rounded-full bg-[#00FF88]/70" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs font-mono text-n3-muted">@N3RDY_Intel_Bot · #market-intelligence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-n3-success animate-pulse" />
              <span className="text-[10px] font-mono text-n3-success">LIVE</span>
            </div>
          </div>

          {/* Report content */}
          <div className="p-6 sm:p-8 max-h-[580px] overflow-y-auto" style={{ background: '#080F1E' }}>
            <div className="font-mono text-xs sm:text-[13px] leading-relaxed space-y-0.5">
              {reportLines.map((line, i) => {
                const Icon = line.icon;
                if (line.color === '#1E293B') {
                  return <div key={i} className="text-n3-border py-1 select-none">{line.text}</div>;
                }
                return (
                  <div key={i} className={`flex items-start gap-2 ${line.text === '' ? 'h-3' : ''}`}>
                    {Icon && <Icon size={13} style={{ color: line.color, marginTop: 2, flexShrink: 0 }} />}
                    {!Icon && line.text !== '' && <span className="w-3.5 flex-shrink-0" />}
                    {line.text !== '' && (
                      <span style={{ color: line.color }} className={line.bold ? 'font-semibold' : ''}>
                        {line.text}
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="h-2" />
              <div className="text-n3-primary font-medium cursor-blink" />
            </div>
          </div>
        </motion.div>

        {/* Caption row */}
        <div className="flex flex-wrap gap-6 justify-center mt-8">
          {[
            { label: 'Claude Fable 5', sub: 'Adaptive thinking' },
            { label: 'Generated in', sub: '~8 seconds' },
            { label: 'Posted to', sub: 'Telegram channel' },
            { label: 'Frequency', sub: 'Every 60 minutes' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-xs font-mono font-semibold text-n3-primary">{item.label}</div>
              <div className="text-xs text-n3-muted">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';
import { motion } from 'framer-motion';
import { Send, AlertTriangle, BarChart3, Settings, List, Bell, Info } from 'lucide-react';

const commands = [
  { cmd: '/brief_now', desc: 'Generate and post a briefing immediately', icon: Send, color: '#00E5FF' },
  { cmd: '/risk_level', desc: 'Show current risk level and sentiment reading', icon: AlertTriangle, color: '#FF4D6D' },
  { cmd: '/status', desc: 'Current intervals, model, and scheduler state', icon: Info, color: '#94A3B8' },
  { cmd: '/sources', desc: 'List top 15 approved sources by trust score', icon: List, color: '#FFC857' },
  { cmd: '/set_alert_threshold', desc: 'Change breaking alert trigger thresholds', icon: Bell, color: '#FF4D6D' },
  { cmd: '/set_brief_interval', desc: 'Change briefing generation frequency', icon: Settings, color: '#94A3B8' },
  { cmd: '/last_brief', desc: 'Show the most recently generated briefing', icon: BarChart3, color: '#00FF88' },
  { cmd: '/menu', desc: 'Opens full inline control panel', icon: Settings, color: '#00E5FF' },
];

const messages = [
  {
    type: 'alert',
    time: '14:02',
    content: '🚨 BREAKING MARKET ALERT\n\nFed Chair signals no rate cuts before Q4 — rates to hold at 5.25–5.50%.\n\nMarket Impact: Stocks Bearish · USD Bullish\nConfidence: 91%\n\nNot financial advice.',
    color: '#FF4D6D',
  },
  {
    type: 'command',
    time: '14:05',
    content: '/risk_level',
    isUser: true,
  },
  {
    type: 'response',
    time: '14:05',
    content: '⚠️ Risk Level: HIGH\n\nOverall Sentiment: Risk-Off\nFear & Greed (Stocks): 31 — Fear\nFear & Greed (Crypto): 44 — Fear\n\nDominant theme: rate/inflation\nTop signal: Fed rate-hold confirmation',
    color: '#FFC857',
  },
];

export default function TelegramDemo() {
  return (
    <section id="telegram" className="py-28 bg-n3-bg relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(0,229,255,0.04) 0%, transparent 55%)' }} />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-16">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">Command Center</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">Telegram Intelligence Hub</h2>
          <p className="text-n3-muted max-w-xl mx-auto">24 admin commands. Full real-time control from Telegram. Breaking alerts posted automatically when confidence thresholds are met.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Phone mockup */}
          <motion.div initial={{ opacity:0, x:-24 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}>
            <div className="relative mx-auto" style={{ maxWidth: '320px' }}>
              {/* Phone frame */}
              <div className="rounded-[2.4rem] border-4 border-n3-border overflow-hidden shadow-card" style={{ background: '#1A1F2E' }}>
                {/* Status bar */}
                <div className="flex justify-between items-center px-5 pt-3 pb-2" style={{ background: '#1A1F2E' }}>
                  <span className="text-[11px] text-n3-muted font-medium">14:07</span>
                  <div className="flex gap-1 items-center">
                    <div className="w-1 h-1 rounded-full bg-n3-muted" />
                    <div className="w-1 h-1 rounded-full bg-n3-muted" />
                    <div className="w-1 h-1 rounded-full bg-n3-muted" />
                  </div>
                </div>

                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
                  <div className="w-9 h-9 rounded-full bg-n3-primary/20 border border-n3-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-n3-primary">N3</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-n3-text">N3RDY Intel Bot</div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-n3-success" />
                      <span className="text-[10px] text-n3-muted">online</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="px-3 py-4 space-y-3 min-h-[320px]" style={{ background: '#151B27' }}>
                  {messages.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:8 }} whileInView={{ opacity:1, y:0 }} transition={{ delay:i*0.15, duration:0.4 }} viewport={{ once:true }}
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 ${msg.isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                        style={{
                          background: msg.isUser ? '#2C6FA3' : msg.color === '#FF4D6D' ? 'rgba(255,77,109,0.12)' : 'rgba(30,41,59,0.8)',
                          border: !msg.isUser ? `1px solid ${msg.color ? msg.color + '30' : '#1E293B'}` : 'none',
                        }}
                      >
                        <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed" style={{ color: msg.isUser ? '#fff' : msg.color || '#F8FAFC' }}>
                          {msg.content}
                        </pre>
                        <div className="text-[9px] text-right mt-1 opacity-50">{msg.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-2 px-3 py-3 border-t border-white/5" style={{ background: '#1A1F2E' }}>
                  <div className="flex-1 h-8 rounded-full bg-white/5 border border-white/10 px-3 flex items-center">
                    <span className="text-xs text-n3-muted opacity-50">Message...</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-n3-primary/20 flex items-center justify-center">
                    <Send size={14} className="text-n3-primary" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Commands list */}
          <motion.div initial={{ opacity:0, x:24 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
            className="space-y-2">
            <p className="text-xs font-mono font-semibold text-n3-muted uppercase tracking-widest mb-5">Admin Commands</p>
            {commands.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <motion.div key={cmd.cmd} initial={{ opacity:0, x:12 }} whileInView={{ opacity:1, x:0 }} transition={{ delay:i*0.06, duration:0.4 }} viewport={{ once:true }}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-n3-border bg-n3-card hover:border-n3-primary/25 transition-all group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cmd.color}15`, border: `1px solid ${cmd.color}30` }}>
                    <Icon size={14} style={{ color: cmd.color }} />
                  </div>
                  <div>
                    <code className="text-xs font-mono font-bold text-n3-primary group-hover:text-n3-primary/90">{cmd.cmd}</code>
                    <p className="text-xs text-n3-muted mt-0.5">{cmd.desc}</p>
                  </div>
                </motion.div>
              );
            })}
            <div className="pt-2 text-xs text-n3-muted font-mono pl-1">
              + 16 more commands · <span className="text-n3-primary">24 total</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

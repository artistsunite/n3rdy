'use client';
import { motion } from 'framer-motion';
import { Rss, GitBranch, Brain, MessageCircle, Users, ArrowRight } from 'lucide-react';

const nodes = [
  {
    icon: Rss,
    label: 'Data Sources',
    color: '#FFC857',
    sub: ['RSS Feeds', 'JSON APIs', 'Economic Calendar', 'Fear & Greed'],
    desc: '127+ sources collected every 15 min',
  },
  {
    icon: GitBranch,
    label: 'Intelligence Pipeline',
    color: '#00E5FF',
    sub: ['Deduplicate', 'Cluster', 'Score & Rank', 'Impact Analysis'],
    desc: 'Multi-stage analysis engine',
  },
  {
    icon: Brain,
    label: 'Claude Fable 5',
    color: '#00FF88',
    sub: ['Adaptive Thinking', 'Deep Analysis', 'Effort: Max', '8192 tokens'],
    desc: 'AI briefing generation',
  },
  {
    icon: MessageCircle,
    label: 'Telegram Bot',
    color: '#00E5FF',
    sub: ['Format HTML', 'Post Briefs', 'Alerts', 'Q&A'],
    desc: 'Intelligence delivery layer',
  },
  {
    icon: Users,
    label: 'Operators',
    color: '#FFC857',
    sub: ['Admin Commands', 'Channel Subs', 'Alerts', 'Q&A Replies'],
    desc: 'End users & administrators',
  },
];

export default function Architecture() {
  return (
    <section id="architecture" className="py-28 bg-n3-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-35" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.04) 0%, transparent 60%)' }} />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-16">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">System Design</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">Technical Architecture</h2>
          <p className="text-n3-muted max-w-xl mx-auto">Five layers from raw data to delivered intelligence. FastAPI + Python + Claude + Telegram.</p>
        </motion.div>

        {/* Desktop flow */}
        <div className="hidden lg:flex items-stretch gap-0 mb-12">
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={i} className="flex items-center flex-1">
                <motion.div
                  initial={{ opacity:0, y:20 }}
                  whileInView={{ opacity:1, y:0 }}
                  transition={{ duration:0.5, delay:i*0.1 }}
                  viewport={{ once:true }}
                  className="flex-1 rounded-2xl p-5 relative group hover:scale-[1.02] transition-transform duration-200"
                  style={{
                    background: '#0B1220',
                    border: `1px solid ${node.color}25`,
                    boxShadow: `0 0 30px ${node.color}0A`,
                  }}
                >
                  {/* Node number */}
                  <div className="text-[10px] font-mono font-bold tracking-widest text-n3-muted mb-3">
                    LAYER {String(i+1).padStart(2,'0')}
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                    style={{ background: `${node.color}15`, border: `1px solid ${node.color}30` }}>
                    <Icon size={18} style={{ color: node.color }} />
                  </div>

                  {/* Label */}
                  <h3 className="text-sm font-bold text-n3-text mb-1">{node.label}</h3>
                  <p className="text-[11px] text-n3-muted mb-3">{node.desc}</p>

                  {/* Sub-items */}
                  <div className="space-y-1">
                    {node.sub.map(s => (
                      <div key={s} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full" style={{ background: node.color }} />
                        <span className="text-[11px] font-mono text-n3-muted">{s}</span>
                      </div>
                    ))}
                  </div>

                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 30px ${node.color}08` }} />
                </motion.div>

                {/* Arrow connector */}
                {i < nodes.length - 1 && (
                  <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} transition={{ delay:i*0.1+0.3, duration:0.4 }} viewport={{ once:true }}
                    className="flex flex-col items-center gap-1 px-2 flex-shrink-0">
                    <ArrowRight size={16} className="text-n3-border" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile stack */}
        <div className="lg:hidden space-y-3">
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.div key={i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:0.45, delay:i*0.08 }} viewport={{ once:true }}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: '#0B1220', border: `1px solid ${node.color}25` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${node.color}15`, border: `1px solid ${node.color}30` }}>
                  <Icon size={18} style={{ color: node.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-n3-muted">0{i+1}</span>
                    <span className="text-sm font-bold text-n3-text">{node.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {node.sub.map(s => (
                      <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${node.color}12`, color: node.color }}>{s}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tech stack footer */}
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.5 }} viewport={{ once:true }}
          className="mt-12 p-6 rounded-2xl border border-n3-border bg-n3-card">
          <p className="text-xs font-mono text-n3-muted uppercase tracking-widest mb-4 text-center">Built With</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['FastAPI', 'Python 3.12', 'Claude Fable 5', 'SQLAlchemy', 'APScheduler', 'Docker', 'PostgreSQL', 'python-telegram-bot', 'httpx', 'feedparser'].map(tech => (
              <span key={tech} className="px-3 py-1.5 rounded-lg border border-n3-border text-xs font-mono text-n3-muted hover:border-n3-primary/30 hover:text-n3-text transition-all cursor-default">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

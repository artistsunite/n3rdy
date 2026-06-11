'use client';
import { motion } from 'framer-motion';
import { Star, GitFork, Code2, Server, Database, Container, Lock, Settings } from 'lucide-react';
import GithubIcon from './GithubIcon';

const techStack = [
  { label: 'Python 3.12', icon: Code2, color: '#FFC857' },
  { label: 'FastAPI', icon: Server, color: '#00FF88' },
  { label: 'Claude Fable 5', icon: Code2, color: '#00E5FF' },
  { label: 'PostgreSQL', icon: Database, color: '#00E5FF' },
  { label: 'Docker', icon: Container, color: '#00E5FF' },
  { label: 'SQLAlchemy', icon: Database, color: '#94A3B8' },
  { label: 'APScheduler', icon: Settings, color: '#94A3B8' },
  { label: 'Telegram Bot API', icon: Server, color: '#00E5FF' },
];

const features = [
  { icon: Lock, label: 'MIT License', desc: 'Completely free. Use, modify, distribute.' },
  { icon: Server, label: 'Self-Hosted', desc: 'Your server. Your data. No SaaS dependency.' },
  { icon: Settings, label: 'Fully Configurable', desc: 'Sources, weights, intervals, thresholds — all YAML.' },
  { icon: Container, label: 'Docker Support', desc: 'One docker-compose up and you\'re running.' },
  { icon: Database, label: 'PostgreSQL Ready', desc: 'SQLite for dev, PostgreSQL for production.' },
  { icon: Code2, label: 'Anthropic SDK', desc: 'Pluggable AI. Swap models or disable AI entirely.' },
];

export default function OpenSource() {
  return (
    <section id="open-source" className="py-28 bg-n3-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
          className="text-center mb-14">
          <p className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase mb-4">Open Source</p>
          <h2 className="text-4xl sm:text-5xl font-black text-n3-text tracking-tight mb-4">Free. Open. Self-Hosted.</h2>
          <p className="text-n3-muted max-w-xl mx-auto">N3RDY is MIT-licensed. Run it on your own infrastructure, customize every parameter, and own your intelligence pipeline.</p>
        </motion.div>

        {/* GitHub card */}
        <motion.a
          href="https://github.com/artistsunite/n3rdy"
          target="_blank" rel="noopener noreferrer"
          initial={{ opacity:0, y:20 }}
          whileInView={{ opacity:1, y:0 }}
          transition={{ duration:0.55 }}
          viewport={{ once:true }}
          whileHover={{ scale: 1.01 }}
          className="block p-6 sm:p-8 rounded-2xl border border-n3-primary/20 bg-n3-card shadow-card mb-10 group cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-n3-primary/10 border border-n3-primary/25 flex items-center justify-center flex-shrink-0 group-hover:border-n3-primary/50 transition-colors">
              <GithubIcon size={28} className="text-n3-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-n3-text font-mono">artistsunite/n3rdy</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-n3-success/15 text-n3-success border border-n3-success/25 rounded-full">MIT</span>
              </div>
              <p className="text-sm text-n3-muted">Bloomberg-grade AI market intelligence bot for Telegram. Claude Fable 5 powered. Self-hosted.</p>
            </div>
            <div className="flex gap-4 sm:flex-col sm:items-end">
              <div className="flex items-center gap-1.5 text-n3-muted">
                <Star size={14} className="text-n3-warning" />
                <span className="text-sm font-mono font-medium text-n3-text">Star</span>
              </div>
              <div className="flex items-center gap-1.5 text-n3-muted">
                <GitFork size={14} />
                <span className="text-sm font-mono font-medium text-n3-text">Fork</span>
              </div>
            </div>
          </div>
        </motion.a>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Features */}
          <motion.div initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:0.5 }} viewport={{ once:true }}>
            <p className="text-xs font-mono font-semibold text-n3-muted uppercase tracking-widest mb-5">Features</p>
            <div className="space-y-3">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.label} initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }} transition={{ delay:i*0.07, duration:0.4 }} viewport={{ once:true }}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-n3-border bg-n3-card hover:border-n3-primary/25 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-n3-primary/10 border border-n3-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-n3-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-n3-text">{f.label}</div>
                      <div className="text-xs text-n3-muted mt-0.5">{f.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Tech stack */}
          <motion.div initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:0.5 }} viewport={{ once:true }}>
            <p className="text-xs font-mono font-semibold text-n3-muted uppercase tracking-widest mb-5">Tech Stack</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {techStack.map((t, i) => {
                const Icon = t.icon;
                return (
                  <motion.div key={t.label} initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} transition={{ delay:i*0.05, duration:0.35 }} viewport={{ once:true }}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-n3-border bg-n3-bg hover:border-n3-primary/25 transition-colors">
                    <Icon size={14} style={{ color: t.color }} />
                    <span className="text-xs font-mono text-n3-text">{t.label}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick start */}
            <div className="rounded-xl overflow-hidden border border-n3-border">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-n3-border" style={{ background: '#0A1628' }}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-n3-danger/60" />
                  <div className="w-2 h-2 rounded-full bg-n3-warning/60" />
                  <div className="w-2 h-2 rounded-full bg-n3-success/60" />
                </div>
                <span className="text-[11px] font-mono text-n3-muted">Quick Start</span>
              </div>
              <div className="p-4" style={{ background: '#080F1E' }}>
                <pre className="text-xs font-mono text-n3-muted leading-relaxed">
{`<span style="color:#94A3B8"># Clone and run</span>
git clone github.com/artistsunite/n3rdy
cd n3rdy
cp .env.example .env
<span style="color:#94A3B8"># Add your ANTHROPIC_API_KEY + Telegram token</span>
docker-compose up -d`}
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { signIn } from 'next-auth/react';
import {
  Activity, ArrowRight, Rss, Brain, TrendingUp,
  Bell, BarChart2, Globe, Menu, Zap, ChevronDown,
} from 'lucide-react';
import Footer from '@/components/Footer';

const SERIF = "'Instrument Serif', Georgia, serif";

const FEATURES = [
  { icon: Rss,        title: 'Custom Source Engine',   sub: '500+ feeds',       desc: 'Add any RSS feed, news site, competitor page, or government source. Organise by category, region, and trust level.' },
  { icon: Brain,      title: 'AI Article Analysis',    sub: 'Claude Fable 5',   desc: 'Every article is scored for sentiment, market impact, urgency, and risk. Entities, sectors, and second-order effects extracted automatically.' },
  { icon: TrendingUp, title: 'Trending Intelligence',  sub: 'Velocity tracking', desc: 'Detect what\'s accelerating across your sources before it reaches mainstream media. Velocity-weighted topic tracking.' },
  { icon: BarChart2,  title: 'Sentiment Dashboards',   sub: 'Live charts',      desc: 'Live sentiment across markets, crypto, macro, geopolitics, and technology. Visualised as trends over time with source weighting.' },
  { icon: Bell,       title: 'Smart Alerts',           sub: 'Configurable',     desc: 'Get notified when keywords spike, sentiment shifts, or high-impact stories emerge. Configurable thresholds per topic.' },
  { icon: Globe,      title: 'Executive Briefings',    sub: 'Daily or on-demand', desc: 'AI-generated briefings with top stories, market forecasts, risk signals, and bull/bear outlook delivered on your schedule.' },
];

const USE_CASES = [
  { persona: 'Founder',   quote: 'Competitor launched a new feature at 7am. I had the full market context and competitor analysis in my briefing by 7:05.', tags: ['Competitor monitoring', 'Industry alerts', 'Strategic briefings'] },
  { persona: 'Investor',  quote: 'I track 40 companies. N3RDY surfaces the signal across earnings, management changes, and macro shifts — before my Bloomberg terminal does.', tags: ['Watchlist tracking', 'Earnings alerts', 'Sentiment shifts'] },
  { persona: 'Trader',    quote: 'Geopolitical events move commodities in minutes. Having AI pre-analyse the impact across my positions changes everything.', tags: ['Breaking news alerts', 'Market impact scores', 'Risk signals'] },
  { persona: 'Analyst',   quote: 'I used to spend 3 hours reading before writing a report. Now I get a structured briefing and spend that time on actual analysis.', tags: ['Structured summaries', 'Source credibility', 'Export reports'] },
];

export default function Home() {
  return (
    <div className="relative overflow-x-hidden bg-black" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Fixed video background ── */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        className="fixed inset-0 w-full h-full object-cover object-bottom z-0"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Subtle cyan tint overlay so N3RDY palette reads through */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.35)' }} />

      {/* ══════════════════════════════════════
          HERO — Two-panel full screen
      ══════════════════════════════════════ */}
      <div className="relative z-10 flex min-h-screen">

        {/* LEFT PANEL — 52% */}
        <div className="w-full lg:w-[52%] relative flex flex-col min-h-screen p-4 lg:p-6">

          {/* Glass overlay */}
          <div className="liquid-glass-strong absolute inset-4 lg:inset-6 rounded-3xl" />

          <div className="relative z-10 flex flex-col h-full">

            {/* Nav */}
            <nav className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="text-white font-semibold text-2xl tracking-tighter">N3RDY</span>
              </div>
              <button className="liquid-glass rounded-full px-4 py-2 flex items-center gap-2 text-white/80 text-sm font-medium hover:scale-105 transition-transform">
                <Menu className="w-4 h-4" />
                Menu
              </button>
            </nav>

            {/* Hero centre */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">

              <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-1.5 text-white/70 text-sm font-medium mb-8">
                <Zap className="w-3.5 h-3.5" style={{ color: '#00E5FF' }} />
                AI-Powered Market Intelligence
              </div>

              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-8"
                style={{ boxShadow: '0 0 40px rgba(0,229,255,0.15)' }}>
                <Activity className="w-10 h-10 text-white" />
              </div>

              <h1
                className="text-6xl lg:text-7xl font-medium text-white leading-[1.08] mb-8"
                style={{ letterSpacing: '-0.05em' }}
              >
                Know what matters
                <br />
                <em
                  style={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    color: 'rgba(0,229,255,0.9)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  before the market
                </em>
                {' '}does.
              </h1>

              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="liquid-glass-strong rounded-full px-8 py-4 flex items-center gap-3 text-white font-medium hover:scale-105 active:scale-95 transition-transform mb-8"
              >
                Start free with Google
                <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>

              <div className="flex flex-wrap gap-2 justify-center">
                {['Market Intelligence', 'AI Analysis', 'Real-time Alerts'].map((label) => (
                  <span key={label} className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80 font-medium">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom quote */}
            <div className="px-8 pb-8 text-center">
              <p className="text-xs tracking-widest uppercase text-white/50 mb-3">MARKET INTELLIGENCE</p>
              <p className="text-white/80 text-lg font-medium mb-3">
                "Before markets react,{' '}
                <em style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'rgba(255,255,255,1)' }}>
                  N3RDY already knows.
                </em>
                "
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex-1 h-px bg-white/20 max-w-[80px]" />
                <span className="text-white/50 text-xs tracking-widest">INTELLIGENCE BRIEF</span>
                <div className="flex-1 h-px bg-white/20 max-w-[80px]" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — 48%, desktop only */}
        <div className="hidden lg:flex w-[48%] flex-col p-6 gap-6">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="liquid-glass rounded-full px-4 py-2.5 flex items-center gap-3">
              <span className="text-white/60 text-xs tracking-wider">500+ SOURCES</span>
              <div className="w-px h-4 bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/60 text-xs">LIVE</span>
              <div className="w-px h-4 bg-white/20" />
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="liquid-glass rounded-full px-4 py-2.5 flex items-center gap-2 text-white text-sm font-medium hover:scale-105 transition-transform"
            >
              <Zap className="w-4 h-4" style={{ color: '#00E5FF' }} />
              Dashboard
            </button>
          </div>

          {/* Intelligence card */}
          <div className="liquid-glass rounded-2xl p-5 w-56">
            <h3 className="text-white font-medium text-sm mb-1.5">Enter the intelligence desk</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Track markets, competitors, and macro signals — all in one briefing.
            </p>
          </div>

          <div className="flex-1" />

          {/* Bottom feature section */}
          <div className="liquid-glass rounded-[2.5rem] p-5 space-y-3">

            <div className="grid grid-cols-2 gap-3">
              <div className="liquid-glass rounded-3xl p-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Rss className="w-4 h-4 text-white" />
                </div>
                <p className="text-white text-sm font-medium">Source Engine</p>
                <p className="text-white/50 text-xs mt-0.5">500+ feeds</p>
              </div>
              <div className="liquid-glass rounded-3xl p-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <p className="text-white text-sm font-medium">AI Analysis</p>
                <p className="text-white/50 text-xs mt-0.5">Claude Fable 5</p>
              </div>
            </div>

            {/* Briefing preview card */}
            <div className="liquid-glass rounded-3xl p-4 flex items-center gap-4">
              <div
                className="w-24 h-16 rounded-xl flex-shrink-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(0,229,255,0.05) 50%, rgba(139,92,246,0.15) 100%)' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <BarChart2 className="w-7 h-7 text-white/25" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">Morning Briefing</p>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">
                  AI-curated market intelligence, delivered.
                </p>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xl leading-none hover:scale-105 transition-transform flex-shrink-0 font-light">
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="relative z-10 flex justify-center py-6">
        <div className="liquid-glass rounded-full p-2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-white/60" />
        </div>
      </div>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">
            <span className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-white/70 text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" style={{ color: '#00E5FF' }} />
              Platform Features
            </span>
            <h2
              className="text-4xl sm:text-5xl font-medium text-white leading-tight mb-4"
              style={{ letterSpacing: '-0.04em' }}
            >
              Intelligence, not just{' '}
              <em style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'rgba(0,229,255,0.9)' }}>
                noise
              </em>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              We turn thousands of daily signals into structured intelligence you can act on.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, sub, desc }) => (
              <div key={title} className="liquid-glass rounded-3xl p-6 hover:scale-[1.02] transition-transform">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-medium mb-0.5">{title}</p>
                <p className="text-white/40 text-xs mb-3">{sub}</p>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════ */}
      <div className="relative z-10 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="liquid-glass-strong rounded-3xl px-8 py-8 grid grid-cols-3 gap-8">
            {[
              { value: '500+',   label: 'Sources monitored' },
              { value: '< 2min', label: 'Briefing delivery' },
              { value: '24/7',   label: 'Market coverage' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div
                  className="text-3xl font-semibold mb-1"
                  style={{ color: '#00E5FF', letterSpacing: '-0.04em' }}
                >
                  {value}
                </div>
                <div className="text-white/50 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          USE CASES
      ══════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl font-medium text-white leading-tight mb-4"
              style={{ letterSpacing: '-0.04em' }}
            >
              Built for people who{' '}
              <em style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'rgba(0,229,255,0.9)' }}>
                need to know
              </em>
            </h2>
            <p className="text-white/50 text-lg">
              From solo founders to institutional analysts, N3RDY adapts to how you work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {USE_CASES.map(({ persona, quote, tags }) => (
              <div key={persona} className="liquid-glass rounded-3xl p-6">
                <div
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: '#00E5FF' }}
                >
                  {persona}
                </div>
                <p
                  className="text-white/80 text-sm leading-relaxed mb-5"
                  style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem' }}
                >
                  "{quote}"
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-xs text-white/60 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA
      ══════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="liquid-glass-strong rounded-[2.5rem] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8"
              style={{ boxShadow: '0 0 40px rgba(0,229,255,0.2)' }}>
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2
              className="text-4xl sm:text-5xl font-medium text-white leading-tight mb-4"
              style={{ letterSpacing: '-0.04em' }}
            >
              Your personal AI
              <br />
              <em style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'rgba(0,229,255,0.9)' }}>
                intelligence analyst.
              </em>
            </h2>
            <p className="text-white/50 text-lg mb-10">
              Add your sources, set your watchlist, and receive your first briefing in minutes.
              No credit card required.
            </p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="liquid-glass rounded-full px-8 py-4 flex items-center gap-3 text-white font-medium hover:scale-105 active:scale-95 transition-transform mx-auto"
              style={{ border: '1px solid rgba(0,229,255,0.3)' }}
            >
              Sign in with Google — it&apos;s free
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <p className="text-white/30 text-xs mt-5">
              All AI predictions are informational only and do not constitute financial advice.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

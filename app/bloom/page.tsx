'use client';

import { Flower2, Download, Wand2, BookOpen, ArrowRight, Menu, X, Globe, Camera, Sparkles } from 'lucide-react';

const SERIF = "var(--font-source-serif-4, 'Georgia', serif)";
const SANS  = "var(--font-poppins, 'Poppins', sans-serif)";

export default function BloomPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black" style={{ fontFamily: SANS }}>

      {/* ── Video Background ── */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        className="absolute inset-0 w-full h-full object-cover object-bottom z-0"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* ── Two-Panel Layout ── */}
      <div className="relative z-10 flex min-h-screen">

        {/* ══════════════════════════════════════
            LEFT PANEL — 52%
        ══════════════════════════════════════ */}
        <div className="w-full lg:w-[52%] relative flex flex-col min-h-screen p-4 lg:p-6">

          {/* Glass overlay (behind left-panel content) */}
          <div className="liquid-glass-strong absolute inset-4 lg:inset-6 rounded-3xl" />

          {/* Left panel content */}
          <div className="relative z-10 flex flex-col h-full">

            {/* Nav */}
            <nav className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Flower2 className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="text-white font-semibold text-2xl tracking-tighter">
                  bloom
                </span>
              </div>

              <button className="liquid-glass rounded-full px-4 py-2 flex items-center gap-2 text-white/80 text-sm font-medium hover:scale-105 transition-transform">
                <Menu className="w-4 h-4" />
                Menu
              </button>
            </nav>

            {/* ── Hero Centre ── */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">

              {/* Large logo mark */}
              <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center mb-8">
                <Flower2 className="w-10 h-10 text-white" />
              </div>

              {/* H1 */}
              <h1
                className="text-6xl lg:text-7xl font-medium text-white leading-[1.08] mb-8"
                style={{ letterSpacing: '-0.05em', fontFamily: SANS }}
              >
                Designing the
                <br />
                <em
                  style={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    color: 'rgba(255,255,255,0.8)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  spirit of bloom
                </em>
                {' '}AI
              </h1>

              {/* CTA */}
              <button className="liquid-glass-strong rounded-full px-8 py-4 flex items-center gap-3 text-white font-medium hover:scale-105 active:scale-95 transition-transform mb-8">
                Explore Now
                <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4" />
                </span>
              </button>

              {/* Pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['Flower Library', 'AI Generation', '3D Compositions'].map((label) => (
                  <span
                    key={label}
                    className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80 font-medium"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Bottom Quote ── */}
            <div className="px-8 pb-8 text-center">
              <p className="text-xs tracking-widest uppercase text-white/50 mb-3">
                VISIONARY DESIGN
              </p>
              <p className="text-white/80 text-lg font-medium mb-3" style={{ fontFamily: SANS }}>
                "We imagined a garden{' '}
                <em style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'rgba(255,255,255,1)' }}>
                  with no ending.
                </em>
                "
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex-1 h-px bg-white/20 max-w-[80px]" />
                <span className="text-white/50 text-xs tracking-widest">ARIA BLOOM</span>
                <div className="flex-1 h-px bg-white/20 max-w-[80px]" />
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT PANEL — 48%  (desktop only)
        ══════════════════════════════════════ */}
        <div className="hidden lg:flex w-[48%] flex-col p-6 gap-6">

          {/* Top Bar */}
          <div className="flex items-center justify-between">

            {/* Social icons + arrow pill */}
            <div className="liquid-glass rounded-full px-4 py-2.5 flex items-center gap-3">
              {([X, Globe, Camera] as const).map((Icon, i) => (
                <a key={i} href="#" className="text-white hover:text-white/80 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
              <div className="w-px h-4 bg-white/20" />
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>

            {/* Account button */}
            <button className="liquid-glass rounded-full px-4 py-2.5 flex items-center gap-2 text-white text-sm font-medium hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
              Account
            </button>
          </div>

          {/* Community Card */}
          <div className="liquid-glass rounded-2xl p-5 w-56">
            <h3 className="text-white font-medium text-sm mb-1.5" style={{ fontFamily: SANS }}>
              Enter the Bloom ecosystem
            </h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Join thousands of floral designers creating with AI-powered tools.
            </p>
          </div>

          {/* Push feature section to bottom */}
          <div className="flex-1" />

          {/* ── Bottom Feature Section ── */}
          <div className="liquid-glass rounded-[2.5rem] p-5 space-y-3">

            {/* Two side-by-side feature cards */}
            <div className="grid grid-cols-2 gap-3">

              <div className="liquid-glass rounded-3xl p-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-white text-sm font-medium" style={{ fontFamily: SANS }}>
                  AI Processing
                </p>
                <p className="text-white/50 text-xs mt-0.5">Generate & refine</p>
              </div>

              <div className="liquid-glass rounded-3xl p-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <p className="text-white text-sm font-medium" style={{ fontFamily: SANS }}>
                  Growth Archive
                </p>
                <p className="text-white/50 text-xs mt-0.5">Design history</p>
              </div>
            </div>

            {/* Flower thumbnail card */}
            <div className="liquid-glass rounded-3xl p-4 flex items-center gap-4">

              {/* Thumbnail — replace src with @/assets/hero-flowers.png once added */}
              <div
                className="w-24 h-16 rounded-xl flex-shrink-0 overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(134,239,172,0.18) 0%, rgba(167,243,208,0.12) 50%, rgba(52,211,153,0.18) 100%)',
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Flower2 className="w-7 h-7 text-white/25" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium" style={{ fontFamily: SANS }}>
                  Advanced Plant Sculpting
                </p>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">
                  AI-driven botanical compositions at scale.
                </p>
              </div>

              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xl leading-none hover:scale-105 transition-transform flex-shrink-0 font-light">
                +
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

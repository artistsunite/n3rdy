'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, LogIn, LayoutDashboard } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4';

function fade(el: HTMLVideoElement, from: number, to: number, duration = 500): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      el.style.opacity = String(from + (to - from) * t);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadingOut = useRef(false);
  const [email, setEmail] = useState('');
  const { data: session, status } = useSession();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = '0';

    const onCanPlay = () => {
      video.play().catch(() => null);
      fade(video, 0, 1, 500);
    };

    const onTimeUpdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= 0.55 && !fadingOut.current) {
        fadingOut.current = true;
        fade(video, parseFloat(video.style.opacity) || 1, 0, 500);
      }
    };

    const onEnded = async () => {
      video.style.opacity = '0';
      fadingOut.current = false;
      await new Promise(r => setTimeout(r, 100));
      video.currentTime = 0;
      video.play().catch(() => null);
      fade(video, 0, 1, 500);
    };

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      {/* Background video */}
      <video
        ref={videoRef}
        src={HERO_VIDEO}
        muted
        autoPlay
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover object-bottom"
        style={{ opacity: 0 }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Navbar */}
      <nav className="relative z-20 px-6 py-6">
        <div className="liquid-glass rounded-full max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <Activity size={22} className="text-white" />
              <span className="text-white font-semibold text-lg tracking-wide">N3RDY</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 ml-8">
              {['Intelligence', 'Architecture', 'How It Works'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {status === 'authenticated' && session ? (
              <>
                <Link href="/dashboard" className="text-white text-sm font-medium hidden sm:flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <Link href="/dashboard">
                  {session.user?.image
                    ? <Image src={session.user.image} alt="" width={30} height={30} className="rounded-full border border-white/20" />
                    : <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-white">{session.user?.name?.[0] ?? 'U'}</span>
                      </div>
                  }
                </Link>
              </>
            ) : (
              <>
                <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="text-white text-sm font-medium opacity-80 hover:opacity-100 transition-opacity">
                  Sign In
                </button>
                <button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Get Access
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[10%]">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-7xl md:text-8xl lg:text-9xl text-white tracking-tight whitespace-nowrap mb-8"
          style={{ fontFamily: '"Instrument Serif", serif' }}
        >
          Know it <em className="italic">before.</em>
        </motion.h1>

        {/* Email input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full mb-6"
        >
          <div className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email for market briefings"
              className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm outline-none min-w-0"
            />
            <button className="bg-white rounded-full p-3 text-black hover:bg-white/90 transition-colors flex-shrink-0">
              <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-white/70 text-sm leading-relaxed px-4 max-w-md mb-8"
        >
          AI-powered market intelligence delivered before consensus forms.
          Claude Fable 5 scans 127+ sources and briefs you ahead of the market.
        </motion.p>

        {/* Manifesto button */}
        <motion.a
          href="#how-it-works"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors"
        >
          How It Works
        </motion.a>
      </div>

      {/* Social / stat row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="relative z-10 flex justify-center gap-4 pb-12"
      >
        {[
          { label: '127+', sub: 'Sources' },
          { label: 'Live', sub: 'Intelligence' },
          { label: 'Fable 5', sub: 'AI Engine' },
        ].map(s => (
          <div key={s.label} className="liquid-glass rounded-full px-6 py-3 text-center">
            <div className="text-white text-sm font-semibold">{s.label}</div>
            <div className="text-white/50 text-xs">{s.sub}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

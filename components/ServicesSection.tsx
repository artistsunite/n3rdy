'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const CARDS = [
  {
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
    tag: 'Intelligence',
    title: 'Signal to Brief',
    description: 'We scan global news, economic calendars, and market data — scoring trust, clustering events, and surfacing the insights that drive market-moving decisions.',
  },
  {
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4',
    tag: 'Delivery',
    title: 'Telegram Briefings',
    description: 'From raw signal to polished briefing — Claude Fable 5 synthesises the analysis and pushes a beautifully formatted report to your Telegram, every hour.',
  },
];

export default function ServicesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="bg-black py-28 md:py-40 px-6 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)]">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex items-end justify-between mb-12 md:mb-16"
          >
            <h2
              className="text-3xl md:text-5xl text-white tracking-tight"
              style={{ fontFamily: '"Instrument Serif", serif' }}
            >
              What N3RDY does
            </h2>
            <span className="text-white/40 text-sm hidden md:block">Our services</span>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="liquid-glass rounded-3xl overflow-hidden group"
              >
                {/* Video */}
                <div className="aspect-video relative overflow-hidden">
                  <video
                    src={card.videoUrl}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    muted
                    autoPlay
                    loop
                    playsInline
                    preload="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Body */}
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs tracking-widest uppercase">{card.tag}</span>
                    <div className="liquid-glass rounded-full p-2">
                      <ArrowUpRight size={14} className="text-white/70" />
                    </div>
                  </div>
                  <h3
                    className="text-white text-xl md:text-2xl mb-3 tracking-tight"
                    style={{ fontFamily: '"Instrument Serif", serif' }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

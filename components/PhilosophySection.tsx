'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4';

export default function PhilosophySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id="architecture"
      className="bg-black py-28 md:py-40 px-6 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl text-white tracking-tight mb-16 md:mb-24"
          style={{ fontFamily: '"Instrument Serif", serif' }}
        >
          Analysis{' '}
          <em className="italic text-white/40">x</em>
          {' '}Speed
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Video */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="rounded-3xl overflow-hidden aspect-[4/3]"
          >
            <video
              src={VIDEO_URL}
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
            />
          </motion.div>

          {/* Text blocks */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex flex-col justify-center gap-8"
          >
            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-4">Real-time signals</p>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                Every meaningful insight begins where raw data meets disciplined analysis.
                N3RDY operates at that intersection — continuously scanning, scoring, and clustering
                signals from 127+ vetted sources to surface what matters before the crowd sees it.
              </p>
            </div>

            <div className="w-full h-px bg-white/10" />

            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-4">Predictive briefings</p>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                We believe the best intelligence arrives before it becomes obvious.
                Claude Fable 5 synthesises the signal, builds a predictive narrative,
                and delivers a formatted briefing to Telegram — ahead of the market move.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

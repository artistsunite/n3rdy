'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Activity, LayoutDashboard, LogIn } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

const links = [
  { label: 'Intelligence', href: '#intelligence' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Architecture', href: '#architecture' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-n3-bg/90 backdrop-blur-xl border-b border-n3-border/60'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded border border-n3-primary/40 flex items-center justify-center group-hover:border-n3-primary/70 transition-colors">
              <Activity size={14} className="text-n3-primary" />
            </div>
            <span className="font-mono font-semibold text-n3-text tracking-wider text-sm">N3RDY</span>
            <span className="hidden sm:block text-[10px] font-mono text-n3-muted tracking-widest uppercase border border-n3-border px-1.5 py-0.5 rounded">
              Intel
            </span>
          </a>

          <div className="hidden md:flex items-center gap-7">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-n3-muted hover:text-n3-text transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {status === 'authenticated' && session ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-n3-muted hover:text-n3-text border border-n3-border hover:border-n3-primary/40 rounded-lg transition-all duration-200"
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
                <Link href="/dashboard" className="flex items-center gap-1.5">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="" width={30} height={30} className="rounded-full border border-n3-border" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-n3-primary/20 border border-n3-primary/30 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-n3-primary">{session.user?.name?.[0] ?? 'U'}</span>
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-n3-muted hover:text-n3-text border border-n3-border hover:border-n3-border/80 rounded-lg transition-all duration-200"
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>
                <a
                  href="#report"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-n3-bg bg-n3-primary hover:bg-n3-primary/90 rounded-lg transition-all duration-200 shadow-glow-sm"
                >
                  View Intel
                </a>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-n3-muted hover:text-n3-text"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-n3-bg/95 backdrop-blur-xl border-b border-n3-border/60 md:hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-n3-muted hover:text-n3-text transition-colors py-1"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-n3-border flex gap-3">
                {status === 'authenticated' ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-n3-bg bg-n3-primary rounded-lg"
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => { signIn('google', { callbackUrl: '/dashboard' }); setMobileOpen(false); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-n3-muted border border-n3-border rounded-lg"
                    >
                      <LogIn size={14} /> Sign In
                    </button>
                    <a
                      href="#report"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-n3-bg bg-n3-primary rounded-lg"
                    >
                      View Intel
                    </a>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { Activity } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-3">
            <Activity size={18} className="text-white" />
            <span className="text-white font-semibold tracking-wide">N3RDY</span>
          </Link>
          <p className="text-white/30 text-xs leading-relaxed max-w-xs">
            AI-powered market intelligence. Claude Fable 5 · 127+ sources · Live briefings.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-6 md:gap-10">
          {[
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Intelligence', href: '#intelligence' },
            { label: 'Dashboard', href: '/dashboard', internal: true },
            { label: 'Sign In', href: '/login', internal: true },
          ].map(item =>
            'internal' in item ? (
              <Link key={item.label} href={item.href} className="text-white/40 hover:text-white text-sm transition-colors">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="text-white/40 hover:text-white text-sm transition-colors">
                {item.label}
              </a>
            )
          )}
        </div>

        {/* Copyright + legal */}
        <div className="flex flex-col items-start md:items-end gap-2 text-white/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span>© 2026 N3RDY</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/50 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

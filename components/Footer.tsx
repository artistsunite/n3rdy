import { Activity, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

const links = {
  Product: [
    { label: 'Intelligence Pipeline', href: '#pipeline' },
    { label: 'Sample Report', href: '#report' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Admin Commands', href: '#telegram' },
  ],
  Platform: [
    { label: 'Operator Dashboard', href: '/dashboard', internal: true },
    { label: 'Sign In', href: '/login', internal: true },
    { label: 'Market Coverage', href: '#coverage' },
    { label: 'Why N3RDY', href: '#why' },
  ],
  Coverage: [
    { label: 'Stocks & Equities', href: '#coverage' },
    { label: 'Crypto Markets', href: '#coverage' },
    { label: 'FX & Commodities', href: '#coverage' },
    { label: 'Economic Calendar', href: '#coverage' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-n3-border/50 bg-n3-bg">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded border border-n3-primary/40 flex items-center justify-center">
                <Activity size={14} className="text-n3-primary" />
              </div>
              <span className="font-mono font-semibold text-n3-text tracking-wider text-sm">N3RDY</span>
            </div>
            <p className="text-sm text-n3-muted leading-relaxed mb-4">
              Your AI market intelligence desk. Bloomberg-grade analysis delivered to Telegram, powered by Claude Fable 5.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-n3-muted hover:text-n3-primary transition-colors"
            >
              <LayoutDashboard size={14} />
              Operator Dashboard
            </Link>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-mono font-semibold text-n3-muted uppercase tracking-widest mb-4">
                {group}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {'internal' in item && item.internal ? (
                      <Link
                        href={item.href}
                        className="text-sm text-n3-muted hover:text-n3-text transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-sm text-n3-muted hover:text-n3-text transition-colors"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-n3-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-n3-muted">
            © 2026 N3RDY Market Intelligence · Powered by Claude Fable 5
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-n3-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-n3-success animate-pulse" />
            <span>System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

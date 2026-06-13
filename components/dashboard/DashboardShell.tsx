'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Newspaper,
  TrendingUp,
  BarChart2,
  Rss,
  Star,
  FileText,
  Calendar,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Target,
  Megaphone,
  Crosshair,
  Brain,
  Building2,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/news', icon: Newspaper, label: 'News Feed' },
  { href: '/dashboard/trending', icon: TrendingUp, label: 'Trending' },
  { href: '/dashboard/sentiment', icon: BarChart2, label: 'Sentiment' },
  { href: '/dashboard/briefings', icon: FileText, label: 'Briefings' },
  { href: '/dashboard/predictions', icon: Target, label: 'Predictions' },
  { href: '/dashboard/marketing', icon: Megaphone, label: 'Marketing' },
  { href: '/dashboard/sources', icon: Rss, label: 'Sources' },
  { href: '/dashboard/watchlist', icon: Star, label: 'Watchlist' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/dashboard/competitors', icon: Crosshair, label: 'Competitors' },
  { href: '/dashboard/growth', icon: Zap, label: 'Growth' },
  { href: '/dashboard/advisor', icon: Brain, label: 'Advisor' },
];

interface Props {
  children: React.ReactNode;
  userName?: string | null;
  userImage?: string | null;
}

export default function DashboardShell({ children, userName, userImage }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 15% 0%, rgba(0,229,255,0.05) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 100%, rgba(139,92,246,0.04) 0%, transparent 55%),
          #111111
        `,
      }}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 liquid-glass-strong flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="w-7 h-7 bg-[#00E5FF]/20 rounded flex items-center justify-center">
            <Zap size={14} className="text-[#00E5FF]" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">N3RDY</span>
          <span className="text-xs text-white/40 ml-auto font-mono">INTEL</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-white/10 text-[#00E5FF] font-medium'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Building2 size={16} />
            Business Profile
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings size={16} />
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-[#FF4D6D] hover:bg-[#FF4D6D]/10 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
          {userName && (
            <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
              {userImage ? (
                <img src={userImage} alt={userName} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 bg-[#00E5FF]/20 rounded-full flex items-center justify-center text-xs text-[#00E5FF] font-semibold">
                  {userName[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-white/40 truncate">{userName}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 liquid-glass-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/50 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#00E5FF]" />
            <span className="font-bold text-white">N3RDY INTEL</span>
          </div>
          <Bell size={18} className="ml-auto text-white/40" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

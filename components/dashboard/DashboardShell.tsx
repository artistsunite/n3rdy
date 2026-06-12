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
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/news', icon: Newspaper, label: 'News Feed' },
  { href: '/dashboard/trending', icon: TrendingUp, label: 'Trending' },
  { href: '/dashboard/sentiment', icon: BarChart2, label: 'Sentiment' },
  { href: '/dashboard/briefings', icon: FileText, label: 'Briefings' },
  { href: '/dashboard/predictions', icon: Target, label: 'Predictions' },
  { href: '/dashboard/sources', icon: Rss, label: 'Sources' },
  { href: '/dashboard/watchlist', icon: Star, label: 'Watchlist' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
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
    <div className="flex h-screen bg-n3-bg overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 bg-n3-card border-r border-n3-border flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-n3-border">
          <div className="w-7 h-7 bg-n3-primary rounded flex items-center justify-center">
            <Zap size={14} className="text-n3-bg" />
          </div>
          <span className="font-bold text-n3-text text-lg tracking-tight">N3RDY</span>
          <span className="text-xs text-n3-muted ml-auto font-mono">INTEL</span>
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-n3-primary/10 text-n3-primary font-medium'
                    : 'text-n3-muted hover:text-n3-text hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-n3-border space-y-0.5">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-n3-muted hover:text-n3-text hover:bg-white/5 transition-colors"
          >
            <Settings size={16} />
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-n3-muted hover:text-n3-danger hover:bg-n3-danger/10 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
          {userName && (
            <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
              {userImage ? (
                <img src={userImage} alt={userName} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 bg-n3-primary/20 rounded-full flex items-center justify-center text-xs text-n3-primary font-semibold">
                  {userName[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-n3-muted truncate">{userName}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-n3-border bg-n3-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-n3-muted hover:text-n3-text"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-n3-primary" />
            <span className="font-bold text-n3-text">N3RDY INTEL</span>
          </div>
          <Bell size={18} className="ml-auto text-n3-muted" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Crosshair, Zap, Brain, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'competitor_event' | 'opportunity' | 'report';
  title: string;
  subtitle: string;
  href: string;
  timestamp: string;
  importance?: string;
}

interface Badges { unreadEvents: number; newOpportunities: number }

interface Props {
  badges: Badges;
}

export default function NotificationPanel({ badges }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const totalCount = badges.unreadEvents + badges.newOpportunities;

  async function load() {
    setLoading(true);
    const [evtCompRes, oppRes] = await Promise.allSettled([
      fetch('/api/competitors').then(r => r.json()),
      fetch('/api/growth/opportunities?status=new').then(r => r.json()),
    ]);

    const notifs: Notification[] = [];

    if (evtCompRes.status === 'fulfilled') {
      const competitors: Array<{ id: string; name: string }> = evtCompRes.value.competitors ?? [];
      for (const c of competitors.slice(0, 4)) {
        const r = await fetch(`/api/competitors/${c.id}/events`).then(x => x.json()).catch(() => ({ events: [] })) as { events: Array<{ id: string; title: string; eventType: string; detectedAt: string; importance: string; isRead: boolean }> };
        const unread = (r.events ?? []).filter(e => !e.isRead).slice(0, 2);
        for (const e of unread) {
          notifs.push({
            id: e.id,
            type: 'competitor_event',
            title: e.title,
            subtitle: c.name,
            href: '/dashboard/competitors',
            timestamp: e.detectedAt,
            importance: e.importance,
          });
        }
      }
    }

    if (oppRes.status === 'fulfilled') {
      const opps: Array<{ id: string; title: string; type: string; urgencyScore: number; generatedAt: string }> = oppRes.value.opportunities ?? [];
      for (const o of opps.slice(0, 3)) {
        notifs.push({
          id: o.id,
          type: 'opportunity',
          title: o.title,
          subtitle: `Urgency ${(o.urgencyScore * 10).toFixed(1)}/10`,
          href: '/dashboard/growth',
          timestamp: o.generatedAt,
        });
      }
    }

    notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setNotifications(notifs.slice(0, 8));
    setLoading(false);
  }

  useEffect(() => {
    if (open && notifications.length === 0) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function markAllRead() {
    setMarkingRead(true);
    try {
      await fetch('/api/competitors', { method: 'PATCH' });
      setNotifications(prev => prev.filter(n => n.type !== 'competitor_event'));
    } finally {
      setMarkingRead(false);
    }
  }

  function timeAgo(ts: string) {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / 86400)}d ago`;
  }

  const TypeIcon = ({ type, importance }: { type: string; importance?: string }) => {
    if (type === 'competitor_event') return <Crosshair size={13} className={importance === 'high' ? 'text-red-400' : 'text-orange-400/70'} />;
    if (type === 'opportunity') return <Zap size={13} className="text-cyan-400" />;
    return <Brain size={13} className="text-purple-400" />;
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 text-white/40 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 liquid-glass-strong rounded-2xl overflow-hidden z-50 border border-white/10"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white text-sm font-semibold">Notifications</span>
              <div className="flex items-center gap-2">
                {badges.unreadEvents > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={markingRead}
                    className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
                    title="Mark all competitor events as read"
                  >
                    <CheckCheck size={12} />
                    Mark read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-white/30 text-sm py-8">All caught up!</div>
              ) : (
                notifications.map(n => (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                      <TypeIcon type={n.type} importance={n.importance} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-xs group-hover:text-white transition-colors line-clamp-2 leading-relaxed">{n.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/30 text-[10px]">{n.subtitle}</span>
                        <span className="text-white/20 text-[10px]">·</span>
                        <span className="text-white/25 text-[10px]">{timeAgo(n.timestamp)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {(badges.unreadEvents > 0 || badges.newOpportunities > 0) && (
              <div className="px-4 py-2 border-t border-white/10 flex gap-3">
                {badges.unreadEvents > 0 && (
                  <Link href="/dashboard/competitors" onClick={() => setOpen(false)}
                    className="text-[10px] text-red-400/70 hover:text-red-300 transition-colors">
                    {badges.unreadEvents} competitor events
                  </Link>
                )}
                {badges.newOpportunities > 0 && (
                  <Link href="/dashboard/growth" onClick={() => setOpen(false)}
                    className="text-[10px] text-cyan-400/70 hover:text-cyan-300 transition-colors">
                    {badges.newOpportunities} opportunities
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

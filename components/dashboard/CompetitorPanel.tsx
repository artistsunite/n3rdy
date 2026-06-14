'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Plus, X, RefreshCw, DollarSign, FileEdit, BookOpen, Newspaper, Package, Users, TrendingUp, Clock, ExternalLink, ChevronRight } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  website?: string | null;
  pricingUrl?: string | null;
  blogUrl?: string | null;
  productUrl?: string | null;
  isActive: boolean;
  lastCheckedAt?: string | null;
  _count?: { events: number };
}

interface CompetitorEvent {
  id: string;
  eventType: string;
  title: string;
  description: string;
  aiSummary: string;
  importance: 'low' | 'medium' | 'high';
  sourceUrl?: string | null;
  detectedAt: string;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  pricing_change: DollarSign,
  content_change: FileEdit,
  new_post: BookOpen,
  news_mention: Newspaper,
  product_change: Package,
  hiring: Users,
  funding: TrendingUp,
};

const IMPORTANCE_COLORS: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-white/50',
};

export default function CompetitorPanel() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selected, setSelected] = useState<Competitor | null>(null);
  const [events, setEvents] = useState<CompetitorEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanningAll, setScanningAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', website: '', pricingUrl: '', blogUrl: '', productUrl: '' });

  const load = useCallback(async () => {
    const r = await fetch('/api/competitors');
    const d = await r.json() as { competitors: Competitor[] };
    setCompetitors(d.competitors);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Refresh competitor unread counts every 5 minutes
    const interval = setInterval(() => {
      fetch('/api/competitors').then(r => r.json()).then((d: { competitors: Competitor[] }) => {
        setCompetitors(prev => prev.map(c => {
          const fresh = d.competitors.find(f => f.id === c.id);
          return fresh ? { ...c, _count: fresh._count } : c;
        }));
      }).catch(() => null);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const selectCompetitor = useCallback(async (c: Competitor) => {
    setSelected(c);
    const r = await fetch(`/api/competitors/${c.id}/events`);
    const d = await r.json() as { events: CompetitorEvent[] };
    setEvents(d.events);
    // Clear the unread badge on the list item after events are marked read
    setCompetitors(prev => prev.map(comp =>
      comp.id === c.id ? { ...comp, _count: { events: 0 } } : comp
    ));
  }, []);

  const addCompetitor = useCallback(async () => {
    if (!form.name.trim()) return;
    const r = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json() as { competitor: Competitor };
    setCompetitors(prev => [...prev, { ...d.competitor, _count: { events: 0 } }]);
    setForm({ name: '', website: '', pricingUrl: '', blogUrl: '', productUrl: '' });
    setShowAdd(false);
  }, [form]);

  const scanCompetitor = useCallback(async (id: string) => {
    setScanning(true);
    await fetch(`/api/competitors/${id}/scan`, { method: 'POST' });
    setScanning(false);
  }, []);

  const scanAll = useCallback(async () => {
    setScanningAll(true);
    await Promise.allSettled(competitors.map(c => fetch(`/api/competitors/${c.id}/scan`, { method: 'POST' })));
    setScanningAll(false);
  }, [competitors]);

  const deleteCompetitor = useCallback(async (id: string) => {
    await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
    setCompetitors(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }, [selected]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crosshair className="text-cyan-400" size={22} />
          <h2 className="text-white font-semibold text-xl">Competitor Intelligence</h2>
        </div>
        <div className="flex items-center gap-2">
          {competitors.length > 1 && (
            <button
              onClick={scanAll}
              disabled={scanningAll}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              title="Trigger scan for all competitors"
            >
              <RefreshCw size={13} className={scanningAll ? 'animate-spin' : ''} />
              {scanningAll ? 'Scanning…' : 'Scan All'}
            </button>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={14} />
            Add Competitor
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="liquid-glass-card rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-white/70 text-sm font-medium mb-3">New Competitor</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name', placeholder: 'Company name *', className: 'col-span-2' },
                { key: 'website', placeholder: 'Homepage URL', className: '' },
                { key: 'pricingUrl', placeholder: 'Pricing page URL', className: '' },
                { key: 'blogUrl', placeholder: 'Blog URL', className: '' },
                { key: 'productUrl', placeholder: 'Product page URL', className: '' },
              ].map(({ key, placeholder, className }) => (
                <input
                  key={key}
                  className={`liquid-glass rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-white/20 focus:ring-1 focus:ring-cyan-500/40 ${className}`}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addCompetitor} className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-xl text-sm font-medium transition-all">
                Add
              </button>
              <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white/60 px-4 py-2 text-sm transition-all">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {competitors.length === 0 ? (
        <div className="liquid-glass-card rounded-2xl p-8 text-center">
          <Crosshair className="mx-auto mb-3 text-white/20" size={32} />
          <p className="text-white/40 text-sm">No competitors tracked yet.</p>
          <p className="text-white/30 text-xs mt-1">Add a competitor to start tracking their changes.</p>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="w-72 flex-shrink-0 space-y-2">
            {competitors.map(c => (
              <motion.button
                key={c.id}
                onClick={() => selectCompetitor(c)}
                className={`w-full text-left liquid-glass-card rounded-2xl p-4 transition-all group ${selected?.id === c.id ? 'ring-1 ring-cyan-500/40' : ''}`}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm truncate">{c.name}</div>
                    {c.website && <div className="text-white/30 text-xs truncate mt-0.5">{c.website}</div>}
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {(c._count?.events ?? 0) > 0 && (
                      <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full">{c._count!.events}</span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); deleteCompetitor(c.id); }}
                      className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                {c.lastCheckedAt && (
                  <div className="flex items-center gap-1 mt-2 text-white/25 text-xs">
                    <Clock size={10} />
                    Last scanned {new Date(c.lastCheckedAt).toLocaleDateString()}
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {selected ? (
              <div className="space-y-4">
                <div className="liquid-glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">{selected.name}</h3>
                    <button
                      onClick={() => scanCompetitor(selected.id)}
                      disabled={scanning}
                      className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    >
                      <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
                      {scanning ? 'Scanning…' : 'Scan Now'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Homepage', url: selected.website },
                      { label: 'Pricing', url: selected.pricingUrl },
                      { label: 'Blog', url: selected.blogUrl },
                      { label: 'Product', url: selected.productUrl },
                    ].filter(p => p.url).map(p => (
                      <a key={p.label} href={p.url!} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 text-xs px-2.5 py-1 rounded-full transition-all">
                        {p.label} <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>

                {events.length === 0 ? (
                  <div className="liquid-glass-card rounded-2xl p-6 text-center">
                    <p className="text-white/40 text-sm">No events detected yet.</p>
                    <p className="text-white/25 text-xs mt-1">Scan this competitor to detect changes.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-white/50 text-xs px-1">Timeline</div>
                    {events.map(event => {
                      const Icon = EVENT_ICONS[event.eventType] ?? ChevronRight;
                      return (
                        <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="liquid-glass-card rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex-shrink-0 ${IMPORTANCE_COLORS[event.importance]}`}>
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white text-sm font-medium">{event.title}</span>
                                <span className={`text-xs ${IMPORTANCE_COLORS[event.importance]}`}>{event.importance}</span>
                              </div>
                              <p className="text-white/50 text-xs leading-relaxed">{event.aiSummary}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-white/25 text-xs">{new Date(event.detectedAt).toLocaleDateString()}</span>
                                {event.sourceUrl && (
                                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-cyan-400/60 hover:text-cyan-400 text-xs transition-all">
                                    View source <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="liquid-glass-card rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                <Crosshair className="mb-3 text-white/20" size={32} />
                <p className="text-white/40 text-sm">Select a competitor to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

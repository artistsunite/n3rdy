'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Newspaper, Zap, Crosshair, FlaskConical, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SearchResults {
  articles: Array<{ id: string; title: string; url: string; source: { name: string }; analysis: { marketImpactScore: number; shortSummary?: string } | null }>;
  opportunities: Array<{ id: string; title: string; type: string; urgencyScore: number }>;
  competitors: Array<{ id: string; name: string; _count?: { events: number } }>;
  experiments: Array<{ id: string; hypothesis: string; status: string }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const d = await r.json() as SearchResults;
      setResults(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose(); }
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const total = results ? results.articles.length + results.opportunities.length + results.competitors.length + results.experiments.length : 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl liquid-glass-strong rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search size={16} className="text-white/40 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search articles, opportunities, competitors…"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults(null); }} className="text-white/30 hover:text-white/60 transition-colors">
                  <X size={14} />
                </button>
              )}
              {loading && <div className="w-3.5 h-3.5 border border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin flex-shrink-0" />}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!query && (
                <p className="text-center text-white/30 text-sm py-8">Start typing to search across all your intelligence data</p>
              )}

              {query && !loading && results && total === 0 && (
                <p className="text-center text-white/30 text-sm py-8">No results for &ldquo;{query}&rdquo;</p>
              )}

              {results && results.articles.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-white/30 text-[10px] font-semibold uppercase tracking-widest">
                    <Newspaper size={10} /> Articles
                  </div>
                  {results.articles.map(a => (
                    <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                      onClick={onClose}>
                      <Newspaper size={13} className="text-white/30 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 group-hover:text-white line-clamp-1 transition-colors">{a.title}</p>
                        <p className="text-[10px] text-white/30">{a.source.name}</p>
                      </div>
                      <ArrowRight size={12} className="text-white/20 group-hover:text-white/50 mt-1 flex-shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              )}

              {results && results.opportunities.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-white/30 text-[10px] font-semibold uppercase tracking-widest">
                    <Zap size={10} /> Growth Opportunities
                  </div>
                  {results.opportunities.map(o => (
                    <Link key={o.id} href="/dashboard/growth" onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                      <Zap size={13} className="text-cyan-400/50 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 group-hover:text-white line-clamp-1 transition-colors">{o.title}</p>
                        <p className="text-[10px] text-white/30 capitalize">{o.type.replace(/_/g, ' ')} · urgency {(o.urgencyScore * 10).toFixed(1)}/10</p>
                      </div>
                      <ArrowRight size={12} className="text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}

              {results && results.competitors.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-white/30 text-[10px] font-semibold uppercase tracking-widest">
                    <Crosshair size={10} /> Competitors
                  </div>
                  {results.competitors.map(c => (
                    <Link key={c.id} href="/dashboard/competitors" onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                      <Crosshair size={13} className="text-red-400/50 flex-shrink-0" />
                      <span className="flex-1 text-sm text-white/80 group-hover:text-white transition-colors">{c.name}</span>
                      {(c._count?.events ?? 0) > 0 && (
                        <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c._count!.events} new</span>
                      )}
                      <ArrowRight size={12} className="text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}

              {results && results.experiments.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-white/30 text-[10px] font-semibold uppercase tracking-widest">
                    <FlaskConical size={10} /> Experiments
                  </div>
                  {results.experiments.map(e => (
                    <Link key={e.id} href="/dashboard/growth" onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                      <FlaskConical size={13} className="text-purple-400/50 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 group-hover:text-white line-clamp-1 transition-colors">{e.hypothesis}</p>
                        <p className="text-[10px] text-white/30 capitalize">{e.status}</p>
                      </div>
                      <ArrowRight size={12} className="text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3 text-[10px] text-white/20">
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">⌘K</kbd> close</span>
              <span><kbd className="font-mono">Esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

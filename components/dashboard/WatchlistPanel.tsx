'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Star, Sparkles, X, Loader2, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface WatchlistItem {
  id: string;
  type: string;
  value: string;
  label: string;
  priority: number;
}

interface ArticleResult {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: { name: string };
  analysis: { sentiment: string; marketImpactScore: number; shortSummary?: string } | null;
}

interface WatchlistSuggestion {
  value: string;
  type: 'KEYWORD' | 'COMPANY' | 'SECTOR' | 'PERSON';
  reason: string;
}

const TYPES = ['KEYWORD', 'COMPANY', 'ASSET', 'COUNTRY', 'PERSON', 'SECTOR', 'WEBSITE', 'SOCIAL_PAGE'];
const TYPE_COLORS: Record<string, string> = {
  KEYWORD:     'text-n3-primary bg-n3-primary/10',
  COMPANY:     'text-purple-400 bg-purple-400/10',
  ASSET:       'text-n3-success bg-n3-success/10',
  COUNTRY:     'text-n3-warning bg-n3-warning/10',
  PERSON:      'text-blue-400 bg-blue-400/10',
  SECTOR:      'text-orange-400 bg-orange-400/10',
  WEBSITE:     'text-cyan-400 bg-cyan-500/15',
  SOCIAL_PAGE: 'text-pink-400 bg-pink-500/15',
};

const TYPE_PLACEHOLDER: Record<string, string> = {
  WEBSITE:     'e.g. competitor.com.au',
  SOCIAL_PAGE: 'e.g. @CompetitorBrand',
};

export default function WatchlistPanel() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'KEYWORD', value: '', label: '' });
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<WatchlistSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [articleResults, setArticleResults] = useState<ArticleResult[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const exploreItem = async (item: WatchlistItem) => {
    if (selectedItem?.id === item.id) { setSelectedItem(null); return; }
    setSelectedItem(item);
    setArticleResults([]);
    setLoadingArticles(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(item.value)}`);
      const d = await res.json() as { articles: ArticleResult[] };
      setArticleResults(d.articles ?? []);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setLoading(false); });
  }, []);

  const addItem = async (type: string, value: string, label?: string) => {
    if (!value) return;
    setAdding(true);
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value, label: label || value }),
    });
    const data = await res.json();
    if (data.item) setItems((prev) => [...prev, data.item]);
    setForm((f) => ({ ...f, value: '', label: '' }));
    setAdding(false);
  };

  const removeItem = async (id: string) => {
    await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const res = await fetch('/api/watchlist/suggestions');
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addSuggestion = async (s: WatchlistSuggestion) => {
    setAddingId(s.value);
    await addItem(s.type, s.value);
    setSuggestions((prev) => prev.filter((x) => x.value !== s.value));
    setAddingId(null);
  };

  const grouped = TYPES.reduce<Record<string, WatchlistItem[]>>((acc, type) => {
    acc[type] = items.filter((i) => i.type === type);
    return acc;
  }, {});

  const existingValues = new Set(items.map((i) => i.value.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-white/50 text-sm mt-1">Track keywords, companies, assets, websites, and social pages</p>
        </div>
        <button
          onClick={loadSuggestions}
          disabled={loadingSuggestions}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loadingSuggestions ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          AI Suggest
        </button>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && (
        <div className="liquid-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-sm font-semibold text-white">AI Suggestions</span>
              <span className="text-xs text-white/40">based on your business profile &amp; trends</span>
            </div>
            <button onClick={() => setShowSuggestions(false)} className="text-white/30 hover:text-white/60">
              <X size={14} />
            </button>
          </div>

          {loadingSuggestions ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-3">
              No suggestions — set up your Business Profile for personalised recommendations.
            </p>
          ) : (
            <div className="space-y-2">
              {suggestions
                .filter((s) => !existingValues.has(s.value.toLowerCase()))
                .map((s) => (
                  <div key={s.value} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${TYPE_COLORS[s.type] ?? 'text-white/50 bg-white/5'}`}>
                      {s.type.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{s.value}</p>
                      <p className="text-xs text-white/40 truncate">{s.reason}</p>
                    </div>
                    <button
                      onClick={() => addSuggestion(s)}
                      disabled={addingId === s.value}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {addingId === s.value ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                      Add
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      <div className="liquid-glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Add to Watchlist</h2>
        <div className="flex flex-wrap gap-3 mb-3">
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, value: '', label: '' }))}
            className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-xl outline-none focus:border-n3-primary/50"
          >
            {TYPES.map((t) => <option key={t} value={t} className="bg-[#111]">{t}</option>)}
          </select>
          <input
            placeholder={TYPE_PLACEHOLDER[form.type] ?? 'Value (e.g. Bitcoin, Apple, AI infrastructure)'}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addItem(form.type, form.value, form.label)}
            className="flex-1 min-w-48 bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-xl outline-none focus:border-n3-primary/50 placeholder:text-white/30"
          />
          <input
            placeholder="Display label (optional)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="min-w-40 bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-xl outline-none focus:border-n3-primary/50 placeholder:text-white/30"
          />
        </div>
        <button
          onClick={() => addItem(form.type, form.value, form.label)}
          disabled={adding || !form.value}
          className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg px-4 py-2 rounded-xl text-sm font-semibold hover:bg-n3-primary/90 disabled:opacity-50 transition-colors"
        >
          <Plus size={14} />
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 liquid-glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="liquid-glass-card rounded-2xl p-8 text-center">
          <Star size={28} className="text-white/30 mx-auto mb-2" />
          <p className="text-white/50 text-sm">Your watchlist is empty. Start tracking what matters to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {TYPES.filter((t) => grouped[t]?.length > 0).map((type) => (
            <div key={type}>
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{type}S</div>
              <div className="flex flex-wrap gap-2">
                {grouped[type].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => exploreItem(item)}
                    className={`inline-flex items-center gap-2 liquid-glass-card rounded-full px-3 py-1.5 group transition-all ${selectedItem?.id === item.id ? 'ring-1 ring-n3-primary/40 bg-n3-primary/5' : 'hover:ring-1 hover:ring-white/10'}`}
                  >
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_COLORS[item.type] ?? ''}`}>
                      {item.type.charAt(0)}
                    </span>
                    <span className="text-sm text-white">{item.label}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      className="text-white/30 hover:text-n3-danger opacity-0 group-hover:opacity-100 transition-all ml-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Article explorer for selected watchlist item */}
          {selectedItem && (
            <div className="liquid-glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_COLORS[selectedItem.type] ?? 'text-white/50 bg-white/5'}`}>
                    {selectedItem.type.charAt(0)}
                  </span>
                  <span className="text-sm font-semibold text-white">{selectedItem.label}</span>
                  <span className="text-xs text-white/40">— recent news</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/news?search=${encodeURIComponent(selectedItem.value)}`}
                    className="flex items-center gap-1 text-xs text-n3-primary/70 hover:text-n3-primary transition-colors"
                  >
                    All results <ChevronRight size={11} />
                  </Link>
                  <button onClick={() => setSelectedItem(null)} className="text-white/30 hover:text-white/60">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {loadingArticles ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
                </div>
              ) : articleResults.length === 0 ? (
                <p className="text-xs text-white/40 py-2">No recent articles matching &ldquo;{selectedItem.value}&rdquo;</p>
              ) : (
                <div className="space-y-2">
                  {articleResults.slice(0, 5).map(a => {
                    const timeAgo = (() => {
                      const diff = Date.now() - new Date(a.publishedAt).getTime();
                      const h = Math.floor(diff / 3600000);
                      return h > 0 ? `${h}h ago` : `${Math.floor(diff / 60000)}m ago`;
                    })();
                    return (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 group/art p-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white/40 mb-0.5">{a.source.name} · {timeAgo}</div>
                          <div className="text-sm text-white/80 group-hover/art:text-white line-clamp-1 transition-colors">{a.title}</div>
                          {a.analysis?.shortSummary && (
                            <div className="text-xs text-white/40 mt-0.5 line-clamp-1">{a.analysis.shortSummary}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                          {a.analysis?.sentiment && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${a.analysis.sentiment === 'positive' ? 'bg-n3-success/10 text-n3-success' : a.analysis.sentiment === 'negative' ? 'bg-n3-danger/10 text-n3-danger' : 'bg-white/5 text-white/30'}`}>
                              {a.analysis.sentiment}
                            </span>
                          )}
                          <ExternalLink size={10} className="text-white/20 group-hover/art:text-white/50 transition-colors" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

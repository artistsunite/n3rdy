'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Rss, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  url: string;
  rssUrl?: string;
  category: string;
  region: string;
  trustScore: number;
  isActive: boolean;
  userSourceId?: string;
  priority: number;
}

const CATEGORIES = ['markets', 'crypto', 'macro', 'geopolitics', 'technology', 'business', 'general'];

export default function SourceManager() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', rssUrl: '', category: 'general' });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sources')
      .then((r) => r.json())
      .then((d) => { setSources(d.sources ?? []); setLoading(false); });
  }, []);

  const addSource = async () => {
    if (!form.name || !form.url) return;
    setAdding(true);
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.source) {
      setSources((prev) => [...prev, { ...data.source, isActive: true, priority: 5, userSourceId: data.userSource?.id }]);
      setForm({ name: '', url: '', rssUrl: '', category: 'general' });
    }
    setAdding(false);
  };

  const removeSource = async (sourceId: string) => {
    await fetch(`/api/sources?sourceId=${sourceId}`, { method: 'DELETE' });
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  const toggleSource = async (sourceId: string, current: boolean) => {
    setToggling(sourceId);
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, isActive: !current } : s));
    await fetch('/api/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, isActive: !current }),
    });
    setToggling(null);
  };

  const sourceCategories = ['all', ...Array.from(new Set(sources.map(s => s.category))).sort()];
  const filtered = categoryFilter === 'all' ? sources : sources.filter(s => s.category === categoryFilter);
  const activeCount = sources.filter(s => s.isActive).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Sources</h1>
        <p className="text-white/50 text-sm mt-1">Manage RSS feeds and news sources powering your intelligence feed</p>
      </div>

      {/* Add form */}
      <div className="liquid-glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Add Source</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input
            placeholder="Source name (e.g. Reuters)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 transition-colors placeholder:text-white/30"
          />
          <input
            placeholder="Website URL"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 transition-colors placeholder:text-white/30"
          />
          <input
            placeholder="RSS feed URL (optional)"
            value={form.rssUrl}
            onChange={(e) => setForm((f) => ({ ...f, rssUrl: e.target.value }))}
            className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 transition-colors placeholder:text-white/30"
          />
        </div>
        <div className="mb-4">
          <p className="text-xs text-white/40 mb-2">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  form.category === cat
                    ? 'bg-n3-primary/15 text-n3-primary border border-n3-primary/30'
                    : 'bg-white/5 text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={addSource}
          disabled={adding || !form.name || !form.url}
          className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-n3-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus size={14} />
          {adding ? 'Adding...' : 'Add Source'}
        </button>
      </div>

      {/* Source list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 liquid-glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : sources.length === 0 ? (
        <div className="liquid-glass-card border border-dashed border-white/15 rounded-xl p-8 text-center">
          <Rss size={28} className="text-white/30 mx-auto mb-2" />
          <p className="text-white/50 text-sm">No sources yet. Add your first RSS feed above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {sourceCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    categoryFilter === cat
                      ? 'bg-n3-primary/15 text-n3-primary border border-n3-primary/30'
                      : 'bg-white/5 text-white/40 hover:text-white/70 border border-transparent'
                  }`}
                >
                  {cat === 'all' ? `All (${sources.length})` : cat}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/30">{activeCount} active</span>
          </div>

          <div className="space-y-2">
            {filtered.map((source) => (
              <div
                key={source.id}
                className={`flex items-center gap-3 liquid-glass-card rounded-xl px-4 py-3 group transition-opacity ${source.isActive ? '' : 'opacity-50'}`}
              >
                <Rss size={16} className={`flex-shrink-0 ${source.isActive ? 'text-n3-primary' : 'text-white/30'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{source.name}</span>
                    <span className="text-xs bg-white/5 text-white/50 px-1.5 py-0.5 rounded capitalize flex-shrink-0">{source.category}</span>
                    {source.rssUrl && <span className="text-xs text-n3-success flex-shrink-0">RSS</span>}
                  </div>
                  <span className="text-xs text-white/40 truncate block">{source.url}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-white/50 hidden sm:block">
                    Trust: <span className={source.trustScore >= 0.8 ? 'text-n3-success' : source.trustScore >= 0.6 ? 'text-n3-warning' : 'text-n3-danger'}>{(source.trustScore * 100).toFixed(0)}%</span>
                  </span>
                  <button
                    onClick={() => toggleSource(source.id, source.isActive)}
                    disabled={toggling === source.id}
                    className="text-white/40 hover:text-white/70 transition-colors"
                    title={source.isActive ? 'Disable source' : 'Enable source'}
                  >
                    {source.isActive
                      ? <ToggleRight size={18} className="text-n3-success" />
                      : <ToggleLeft size={18} />}
                  </button>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-n3-primary transition-colors">
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => removeSource(source.id)}
                    className="text-white/50 hover:text-n3-danger transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

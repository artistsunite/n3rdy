'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Rss, ExternalLink } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  url: string;
  rssUrl?: string;
  category: string;
  region: string;
  trustScore: number;
  userSourceId?: string;
  priority: number;
}

const CATEGORIES = ['markets', 'crypto', 'macro', 'geopolitics', 'technology', 'business', 'general'];

export default function SourceManager() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', rssUrl: '', category: 'general' });

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
      setSources((prev) => [...prev, { ...data.source, priority: 5, userSourceId: data.userSource?.id }]);
      setForm({ name: '', url: '', rssUrl: '', category: 'general' });
    }
    setAdding(false);
  };

  const removeSource = async (sourceId: string) => {
    await fetch(`/api/sources?sourceId=${sourceId}`, { method: 'DELETE' });
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-n3-text">Sources</h1>
        <p className="text-n3-muted text-sm mt-1">Manage RSS feeds and news sources powering your intelligence feed</p>
      </div>

      {/* Add form */}
      <div className="bg-n3-card border border-n3-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-n3-text mb-4">Add Source</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            placeholder="Source name (e.g. Reuters)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-n3-bg border border-n3-border text-n3-text text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 transition-colors placeholder:text-n3-muted"
          />
          <input
            placeholder="Website URL"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            className="bg-n3-bg border border-n3-border text-n3-text text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 transition-colors placeholder:text-n3-muted"
          />
          <input
            placeholder="RSS feed URL (optional)"
            value={form.rssUrl}
            onChange={(e) => setForm((f) => ({ ...f, rssUrl: e.target.value }))}
            className="bg-n3-bg border border-n3-border text-n3-text text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 transition-colors placeholder:text-n3-muted"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="bg-n3-bg border border-n3-border text-n3-text text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 transition-colors"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-n3-bg capitalize">{c}</option>)}
          </select>
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
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-n3-card border border-n3-border rounded-xl animate-pulse" />)}
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-n3-card border border-dashed border-n3-border rounded-xl p-8 text-center">
          <Rss size={28} className="text-n3-muted mx-auto mb-2" />
          <p className="text-n3-muted text-sm">No sources yet. Add your first RSS feed above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center gap-3 bg-n3-card border border-n3-border rounded-xl px-4 py-3 group">
              <Rss size={16} className="text-n3-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-n3-text truncate">{source.name}</span>
                  <span className="text-xs bg-white/5 text-n3-muted px-1.5 py-0.5 rounded capitalize flex-shrink-0">{source.category}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-n3-muted truncate">{source.url}</span>
                  {source.rssUrl && <span className="text-xs text-n3-success flex-shrink-0">RSS ✓</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-n3-muted hidden sm:block">
                  Trust: <span className={source.trustScore >= 0.8 ? 'text-n3-success' : source.trustScore >= 0.6 ? 'text-n3-warning' : 'text-n3-danger'}>{(source.trustScore * 100).toFixed(0)}%</span>
                </span>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-n3-muted hover:text-n3-primary transition-colors">
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => removeSource(source.id)}
                  className="text-n3-muted hover:text-n3-danger transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

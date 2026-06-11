'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';

interface WatchlistItem {
  id: string;
  type: string;
  value: string;
  label: string;
  priority: number;
}

const TYPES = ['KEYWORD', 'COMPANY', 'ASSET', 'COUNTRY', 'PERSON', 'SECTOR'];
const TYPE_COLORS: Record<string, string> = {
  KEYWORD: 'text-n3-primary bg-n3-primary/10',
  COMPANY: 'text-purple-400 bg-purple-400/10',
  ASSET: 'text-n3-success bg-n3-success/10',
  COUNTRY: 'text-n3-warning bg-n3-warning/10',
  PERSON: 'text-blue-400 bg-blue-400/10',
  SECTOR: 'text-orange-400 bg-orange-400/10',
};

export default function WatchlistPanel() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'KEYWORD', value: '', label: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setLoading(false); });
  }, []);

  const addItem = async () => {
    if (!form.value) return;
    setAdding(true);
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, label: form.label || form.value }),
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

  const grouped = TYPES.reduce<Record<string, WatchlistItem[]>>((acc, type) => {
    acc[type] = items.filter((i) => i.type === type);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-n3-text">Watchlist</h1>
        <p className="text-n3-muted text-sm mt-1">Track keywords, companies, assets, and topics</p>
      </div>

      {/* Add form */}
      <div className="bg-n3-card border border-n3-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-n3-text mb-4">Add to Watchlist</h2>
        <div className="flex flex-wrap gap-3 mb-3">
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="bg-n3-bg border border-n3-border text-n3-text text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50"
          >
            {TYPES.map((t) => <option key={t} value={t} className="bg-n3-bg">{t}</option>)}
          </select>
          <input
            placeholder="Value (e.g. Bitcoin, Apple, AI infrastructure)"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 min-w-48 bg-n3-bg border border-n3-border text-n3-text text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 placeholder:text-n3-muted"
          />
          <input
            placeholder="Display label (optional)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="min-w-40 bg-n3-bg border border-n3-border text-n3-text text-sm px-3 py-2 rounded-lg outline-none focus:border-n3-primary/50 placeholder:text-n3-muted"
          />
        </div>
        <button
          onClick={addItem}
          disabled={adding || !form.value}
          className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-n3-primary/90 disabled:opacity-50 transition-colors"
        >
          <Plus size={14} />
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-n3-card border border-n3-border rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-n3-card border border-dashed border-n3-border rounded-xl p-8 text-center">
          <Star size={28} className="text-n3-muted mx-auto mb-2" />
          <p className="text-n3-muted text-sm">Your watchlist is empty. Start tracking what matters to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {TYPES.filter((t) => grouped[t]?.length > 0).map((type) => (
            <div key={type}>
              <div className="text-xs font-semibold text-n3-muted uppercase tracking-wider mb-2">{type}S</div>
              <div className="flex flex-wrap gap-2">
                {grouped[type].map((item) => (
                  <div
                    key={item.id}
                    className="inline-flex items-center gap-2 bg-n3-card border border-n3-border rounded-full px-3 py-1.5 group"
                  >
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_COLORS[item.type] ?? ''}`}>
                      {item.type.charAt(0)}
                    </span>
                    <span className="text-sm text-n3-text">{item.label}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-n3-muted hover:text-n3-danger opacity-0 group-hover:opacity-100 transition-all ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import ArticleCard from './ArticleCard';

interface Article {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: { name: string; category: string };
  analysis: {
    sentiment: string;
    sentimentScore: number;
    marketImpactScore: number;
    urgencyScore: number;
    riskLevel: string;
    shortSummary: string;
    bullishBearish: string;
    sectorsAffected: unknown[];
    keyFacts: unknown[];
  } | null;
}

const SENTIMENTS = ['all', 'positive', 'negative', 'neutral'];

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState('all');
  const [minImpact, setMinImpact] = useState(0);
  const [search, setSearch] = useState('');

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20', offset: String(reset ? 0 : offset) });
    if (sentiment !== 'all') params.set('sentiment', sentiment);
    if (minImpact > 0) params.set('minImpact', String(minImpact));
    const res = await fetch(`/api/articles?${params}`);
    const data = await res.json();
    if (reset) {
      setArticles(data.articles ?? []);
      setOffset(20);
    } else {
      setArticles((prev) => [...prev, ...(data.articles ?? [])]);
      setOffset((o) => o + 20);
    }
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [offset, sentiment, minImpact]);

  useEffect(() => {
    load(true);
  }, [sentiment, minImpact]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">News Feed</h1>
        <p className="text-white/50 text-sm mt-1">{total} articles from your sources</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        <input
          placeholder="Search articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full liquid-glass-card rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:ring-1 focus:ring-n3-primary/30"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 liquid-glass-card rounded-lg p-1">
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              onClick={() => setSentiment(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                sentiment === s
                  ? 'bg-n3-primary/10 text-n3-primary'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 liquid-glass-card rounded-lg px-3">
          <Filter size={14} className="text-white/50" />
          <select
            value={minImpact}
            onChange={(e) => setMinImpact(parseFloat(e.target.value))}
            className="bg-transparent text-xs text-white/50 py-2 outline-none cursor-pointer"
          >
            <option value={0}>Any impact</option>
            <option value={0.3}>Impact 3+</option>
            <option value={0.5}>Impact 5+</option>
            <option value={0.7}>High impact (7+)</option>
          </select>
        </div>
      </div>

      {/* Articles */}
      {(() => {
        const q = search.toLowerCase().trim();
        const filtered = q
          ? articles.filter(a => a.title.toLowerCase().includes(q) || a.analysis?.shortSummary?.toLowerCase().includes(q))
          : articles;

        if (loading && articles.length === 0) return (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 liquid-glass-card rounded-xl animate-pulse" />
            ))}
          </div>
        );

        if (filtered.length === 0) return (
          <div className="liquid-glass-card rounded-xl p-10 text-center">
            <p className="text-white/50 text-sm">
              {q ? `No articles matching "${search}"` : 'No articles found. Try adjusting filters or add more sources.'}
            </p>
          </div>
        );

        return (
          <>
            {q && (
              <p className="text-xs text-white/30 px-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
            )}
            <div className="space-y-3">
              {filtered.map((a) => (
              <ArticleCard
                key={a.id}
                title={a.title}
                url={a.url}
                sourceName={a.source.name}
                publishedAt={a.publishedAt}
                shortSummary={a.analysis?.shortSummary}
                sentiment={a.analysis?.sentiment}
                sentimentScore={a.analysis?.sentimentScore}
                marketImpactScore={a.analysis?.marketImpactScore}
                riskLevel={a.analysis?.riskLevel}
                bullishBearish={a.analysis?.bullishBearish}
                sectorsAffected={a.analysis?.sectorsAffected as string[]}
              />
              ))}
            </div>

            {!q && articles.length < total && (
              <button
                onClick={() => load(false)}
                disabled={loading}
                className="w-full py-3 liquid-glass-card text-white/50 text-sm rounded-xl hover:text-n3-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : `Load more (${total - articles.length} remaining)`}
              </button>
            )}
          </>
        );
      })()}
    </div>
  );
}

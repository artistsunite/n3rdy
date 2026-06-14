'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
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
    sectorsAffected: string[];
    keyFacts: string[];
  } | null;
}

const SENTIMENTS = ['all', 'positive', 'negative', 'neutral'];
const IMPACT_OPTIONS = [
  { label: 'Any impact', value: 0 },
  { label: 'Impact 3+', value: 0.3 },
  { label: 'Impact 5+', value: 0.5 },
  { label: 'High (7+)', value: 0.7 },
];

export default function NewsFeed() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState('all');
  const [minImpact, setMinImpact] = useState(0);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20', offset: String(reset ? 0 : offset) });
    if (sentiment !== 'all') params.set('sentiment', sentiment);
    if (minImpact > 0) params.set('minImpact', String(minImpact));
    if (category !== 'all') params.set('category', category);
    if (debouncedSearch.length >= 2) params.set('search', debouncedSearch);
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
  }, [offset, sentiment, minImpact, category, debouncedSearch]);

  useEffect(() => {
    load(true);
  }, [sentiment, minImpact, category, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive categories from loaded articles
  const categories = ['all', ...Array.from(new Set(articles.map(a => a.source.category).filter(Boolean)))].sort((a, b) => a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">News Feed</h1>
        <p className="text-white/50 text-sm mt-1">
          {debouncedSearch.length >= 2 ? `${total} results for "${debouncedSearch}"` : `${total} articles from your sources`}
        </p>
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
            <X size={14} />
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

        <div className="flex items-center gap-1 liquid-glass-card rounded-lg p-1">
          <Filter size={13} className="text-white/30 ml-1.5" />
          {IMPACT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMinImpact(opt.value)}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                minImpact === opt.value
                  ? 'bg-n3-primary/10 text-n3-primary'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                category === cat
                  ? 'bg-n3-primary/15 text-n3-primary border border-n3-primary/30'
                  : 'bg-white/5 text-white/40 hover:text-white/70 border border-transparent'
              }`}
            >
              {cat === 'all' ? 'All categories' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Articles */}
      {loading && articles.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 liquid-glass-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="liquid-glass-card rounded-xl p-10 text-center">
          <p className="text-white/50 text-sm">
            {debouncedSearch.length >= 2 ? `No articles matching "${debouncedSearch}"` : 'No articles found. Try adjusting filters or add more sources.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {articles.map((a) => (
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
                sectorsAffected={a.analysis?.sectorsAffected}
                keyFacts={a.analysis?.keyFacts}
              />
            ))}
          </div>
          {articles.length < total && (
            <button
              onClick={() => load(false)}
              disabled={loading}
              className="w-full py-3 liquid-glass-card text-white/50 text-sm rounded-xl hover:text-n3-primary transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : `Load more (${total - articles.length} remaining)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

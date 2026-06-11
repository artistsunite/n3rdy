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
        <h1 className="text-2xl font-bold text-n3-text">News Feed</h1>
        <p className="text-n3-muted text-sm mt-1">{total} articles from your sources</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 bg-n3-card border border-n3-border rounded-lg p-1">
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              onClick={() => setSentiment(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                sentiment === s
                  ? 'bg-n3-primary/10 text-n3-primary'
                  : 'text-n3-muted hover:text-n3-text'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-n3-card border border-n3-border rounded-lg px-3">
          <Filter size={14} className="text-n3-muted" />
          <select
            value={minImpact}
            onChange={(e) => setMinImpact(parseFloat(e.target.value))}
            className="bg-transparent text-xs text-n3-muted py-2 outline-none cursor-pointer"
          >
            <option value={0}>Any impact</option>
            <option value={0.3}>Impact 3+</option>
            <option value={0.5}>Impact 5+</option>
            <option value={0.7}>High impact (7+)</option>
          </select>
        </div>
      </div>

      {/* Articles */}
      {loading && articles.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-n3-card border border-n3-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-n3-card border border-dashed border-n3-border rounded-xl p-10 text-center">
          <p className="text-n3-muted text-sm">No articles found. Try adjusting filters or add more sources.</p>
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
                sectorsAffected={a.analysis?.sectorsAffected as string[]}
              />
            ))}
          </div>

          {articles.length < total && (
            <button
              onClick={() => load(false)}
              disabled={loading}
              className="w-full py-3 border border-n3-border text-n3-muted text-sm rounded-xl hover:border-n3-primary/40 hover:text-n3-primary transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : `Load more (${total - articles.length} remaining)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

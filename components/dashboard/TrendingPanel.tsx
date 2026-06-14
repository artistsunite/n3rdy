'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Zap, Star } from 'lucide-react';

interface TrendingTopic {
  id: string;
  name: string;
  category: string;
  mentionCount: number;
  velocity: number;
  sentimentScore: number;
}

export default function TrendingPanel() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistValues, setWatchlistValues] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      fetch('/api/trending?period=24h&limit=30').then((r) => r.json()),
      fetch('/api/watchlist').then((r) => r.json()),
    ]).then(([trendData, watchData]) => {
      setTopics(trendData.topics ?? []);
      const vals = new Set<string>(
        (watchData.items ?? []).map((i: { value: string }) => i.value.toLowerCase())
      );
      setWatchlistValues(vals);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(topics.map(t => t.category))).filter(Boolean).sort();
    return ['all', ...cats];
  }, [topics]);

  const filtered = useMemo(() =>
    activeCategory === 'all' ? topics : topics.filter(t => t.category === activeCategory),
    [topics, activeCategory]
  );

  const max = Math.max(...filtered.map((t) => t.mentionCount), 1);

  function isWatched(topicName: string): boolean {
    const lower = topicName.toLowerCase();
    return Array.from(watchlistValues).some(val => lower.includes(val) || val.includes(lower));
  }

  const watchedCount = filtered.filter(t => isWatched(t.name)).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Trending Topics</h1>
        <p className="text-white/50 text-sm mt-1">Most mentioned topics across your sources in the last 24 hours</p>
      </div>

      {!loading && categories.length > 2 && (
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${
                activeCategory === cat
                  ? 'bg-n3-primary/20 text-n3-primary'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'all' ? `All (${topics.length})` : cat}
            </button>
          ))}
          {watchedCount > 0 && (
            <button
              onClick={() => setActiveCategory(activeCategory === '__watchlist' ? 'all' : '__watchlist')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === '__watchlist'
                  ? 'bg-n3-primary/20 text-n3-primary'
                  : 'bg-n3-primary/5 text-n3-primary/70 hover:bg-n3-primary/10'
              }`}
            >
              <Star size={10} className="fill-current" />
              Watchlist ({watchedCount})
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 liquid-glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="liquid-glass-card rounded-xl p-10 text-center">
          <TrendingUp size={32} className="text-white/50 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No trending topics yet. Ingest and analyse articles to see trends.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(activeCategory === '__watchlist' ? filtered.filter(t => isWatched(t.name)) : filtered).map((topic, i) => {
            const watched = isWatched(topic.name);
            return (
              <div
                key={topic.id}
                className={`liquid-glass-card rounded-xl px-4 py-3 flex items-center gap-4 ${watched ? 'ring-1 ring-n3-primary/20' : ''}`}
              >
                <div className="text-sm font-bold text-white/50 w-6 flex-shrink-0">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white truncate">{topic.name}</span>
                    {topic.velocity > 0.5 && <Zap size={12} className="text-n3-warning flex-shrink-0" />}
                    {watched && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-n3-primary/10 text-n3-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
                        <Star size={9} className="fill-current" />
                        watchlist
                      </span>
                    )}
                    {activeCategory === 'all' && (
                      <span className="text-xs bg-white/5 text-white/50 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                        {topic.category}
                      </span>
                    )}
                  </div>
                  {/* Bar */}
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${watched ? 'bg-n3-primary' : 'bg-white/30'}`}
                      style={{ width: `${(topic.mentionCount / max) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-white">{topic.mentionCount}</div>
                  <div className="text-xs text-white/50">mentions</div>
                </div>
                <div className="flex-shrink-0">
                  <div
                    className={`text-xs font-medium ${
                      topic.sentimentScore > 0.1
                        ? 'text-n3-success'
                        : topic.sentimentScore < -0.1
                        ? 'text-n3-danger'
                        : 'text-white/50'
                    }`}
                  >
                    {topic.sentimentScore > 0.1 ? '↑' : topic.sentimentScore < -0.1 ? '↓' : '—'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

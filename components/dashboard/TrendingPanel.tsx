'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    Promise.all([
      fetch('/api/trending?period=24h&limit=20').then((r) => r.json()),
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

  const max = Math.max(...topics.map((t) => t.mentionCount), 1);

  function isWatched(topicName: string): boolean {
    const lower = topicName.toLowerCase();
    for (const val of watchlistValues) {
      if (lower.includes(val) || val.includes(lower)) return true;
    }
    return false;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Trending Topics</h1>
        <p className="text-white/50 text-sm mt-1">Most mentioned topics across your sources in the last 24 hours</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 liquid-glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : topics.length === 0 ? (
        <div className="liquid-glass-card rounded-xl p-10 text-center">
          <TrendingUp size={32} className="text-white/50 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No trending topics yet. Ingest and analyse articles to see trends.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic, i) => {
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
                    <span className="text-xs bg-white/5 text-white/50 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                      {topic.category}
                    </span>
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

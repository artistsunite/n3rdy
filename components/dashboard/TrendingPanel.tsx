'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Zap } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/trending?period=24h&limit=20')
      .then((r) => r.json())
      .then((d) => { setTopics(d.topics ?? []); setLoading(false); });
  }, []);

  const max = Math.max(...topics.map((t) => t.mentionCount), 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-n3-text">Trending Topics</h1>
        <p className="text-n3-muted text-sm mt-1">Most mentioned topics across your sources in the last 24 hours</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 liquid-glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : topics.length === 0 ? (
        <div className="liquid-glass-card rounded-xl p-10 text-center">
          <TrendingUp size={32} className="text-n3-muted mx-auto mb-3" />
          <p className="text-n3-muted text-sm">No trending topics yet. Ingest and analyse articles to see trends.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic, i) => (
            <div key={topic.id} className="liquid-glass-card rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="text-sm font-bold text-n3-muted w-6 flex-shrink-0">#{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-n3-text truncate">{topic.name}</span>
                  {topic.velocity > 0.5 && <Zap size={12} className="text-n3-warning flex-shrink-0" />}
                  <span className="text-xs bg-white/5 text-n3-muted px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                    {topic.category}
                  </span>
                </div>
                {/* Bar */}
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-n3-primary rounded-full transition-all"
                    style={{ width: `${(topic.mentionCount / max) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold text-n3-text">{topic.mentionCount}</div>
                <div className="text-xs text-n3-muted">mentions</div>
              </div>
              <div className="flex-shrink-0">
                <div
                  className={`text-xs font-medium ${
                    topic.sentimentScore > 0.1
                      ? 'text-n3-success'
                      : topic.sentimentScore < -0.1
                      ? 'text-n3-danger'
                      : 'text-n3-muted'
                  }`}
                >
                  {topic.sentimentScore > 0.1 ? '↑' : topic.sentimentScore < -0.1 ? '↓' : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

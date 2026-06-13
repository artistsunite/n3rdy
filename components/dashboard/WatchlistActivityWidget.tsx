'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import ExpandableWidget from './ExpandableWidget';

interface ActivityItem {
  id: string;
  type: string;
  value: string;
  label: string;
  count: number;
  latestHeadline: string | null;
  latestSentiment: string | null;
}

type Period = '24h' | '3d' | '5d' | '7d';

const SENTIMENT_COLOR: Record<string, string> = {
  positive: 'bg-n3-success/70',
  negative: 'bg-n3-danger/70',
  neutral: 'bg-n3-primary/60',
};

function sentimentBg(s: string | null): string {
  if (!s) return 'bg-white/20';
  return SENTIMENT_COLOR[s] ?? 'bg-white/20';
}

export default function WatchlistActivityWidget() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [period, setPeriod] = useState<Period>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/watchlist/activity?period=${period}`)
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const active = items.filter(i => i.count > 0);
  const maxCount = Math.max(...items.map(i => i.count), 1);

  const compactContent = (
    <div className="space-y-3">
      {loading ? (
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1 h-14 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-white/40 py-2">No watchlist items yet. Add items to start tracking.</p>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {items.slice(0, 6).map(item => (
            <div
              key={item.id}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg text-white text-xs font-bold ${sentimentBg(item.latestSentiment)} transition-opacity ${item.count === 0 ? 'opacity-30' : 'opacity-100'}`}
              title={item.latestHeadline ?? item.label}
            >
              <span className="text-[11px] font-semibold truncate w-full text-center px-1">{item.label.slice(0, 6)}</span>
              <span className="text-base font-bold">{item.count}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-white/40">
        {items.length} items monitored · {active.length} active today
      </p>
    </div>
  );

  const expandedContent = (
    <div className="space-y-4">
      {/* Period tabs */}
      <div className="flex gap-1">
        {(['24h', '3d', '5d', '7d'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${period === p ? 'bg-n3-primary/20 border-n3-primary/40 text-n3-primary' : 'bg-transparent border-white/10 text-white/50 hover:border-white/30'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/40 py-4 text-center">No watchlist items yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sentimentBg(item.latestSentiment)}`} />
                  <span className="text-white font-medium">{item.label}</span>
                  <span className="text-white/30">{item.type}</span>
                </div>
                <span className="text-white/60 font-semibold">{item.count} mentions</span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${sentimentBg(item.latestSentiment)}`}
                  style={{ width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 5 : 0)}%` }}
                />
              </div>
              {item.latestHeadline && (
                <p className="text-[11px] text-white/40 truncate">{item.latestHeadline}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <ExpandableWidget
      title="Watchlist Activity"
      icon={<Eye size={14} />}
      compactContent={compactContent}
      expandedContent={expandedContent}
    />
  );
}

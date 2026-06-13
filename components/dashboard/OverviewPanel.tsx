'use client';

import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ArticleCard from './ArticleCard';
import WatchlistActivityWidget from './WatchlistActivityWidget';
import MarketingCalendarWidget from './MarketingCalendarWidget';
import TrendingPostWidget from './TrendingPostWidget';
import UserProfileWidget from './UserProfileWidget';
import GoogleSyncBanner from './GoogleSyncBanner';
import ExpandableWidget from './ExpandableWidget';

interface SentimentData {
  overall: number;
  byCategory: Array<{ category: string; avgScore: number; articleCount: number; dominant: string }>;
  timeSeries: Array<{ time: string; avgScore: number; count: number }>;
}

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
  } | null;
}

function greet(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SentimentArrow({ score }: { score: number }) {
  if (score > 0.05) return <TrendingUp size={13} className="text-n3-success" />;
  if (score < -0.05) return <TrendingDown size={13} className="text-n3-danger" />;
  return <Minus size={13} className="text-white/50" />;
}

function SentimentLabel({ score }: { score: number }) {
  if (score > 0.2) return <span className="text-n3-success font-bold">BULLISH</span>;
  if (score > 0.05) return <span className="text-n3-success/80 font-bold">POSITIVE</span>;
  if (score < -0.2) return <span className="text-n3-danger font-bold">BEARISH</span>;
  if (score < -0.05) return <span className="text-n3-danger/80 font-bold">NEGATIVE</span>;
  return <span className="text-white/60 font-bold">NEUTRAL</span>;
}

export default function OverviewPanel({ userName }: { userName?: string | null }) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [s, a] = await Promise.all([
      fetch('/api/sentiment').then(r => r.json()),
      fetch('/api/articles?limit=6').then(r => r.json()),
    ]);
    setSentiment(s);
    setArticles(a.articles ?? []);
    setLastUpdated(new Date());
    return (a.articles ?? []).length as number;
  }, []);

  useEffect(() => {
    loadData().then((count) => {
      setLoading(false);
      if (count === 0) {
        // Auto-bootstrap when no articles yet
        fetch('/api/ingest/run', { method: 'POST' })
          .then(() => loadData())
          .catch(() => null);
      }
    }).catch(() => setLoading(false));
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData().catch(() => null);
    setRefreshing(false);
  }

  const overallScore = sentiment?.overall ?? 0;
  const opportunities = articles.filter(a => (a.analysis?.sentimentScore ?? 0) > 0.3).length;
  const risks = articles.filter(a => a.analysis?.riskLevel === 'high' || a.analysis?.riskLevel === 'critical').length;

  // Sparkline data from timeSeries
  const sparkData = (sentiment?.timeSeries ?? []).slice(-8);

  // Stat cards
  const stats = [
    {
      label: 'Industry Pulse',
      value: <SentimentLabel score={overallScore} />,
      sub: `Score: ${overallScore >= 0 ? '+' : ''}${overallScore.toFixed(2)}`,
      icon: <SentimentArrow score={overallScore} />,
      spark: sparkData,
    },
    {
      label: 'Articles Today',
      value: <span className="text-white font-bold">{articles.length}</span>,
      sub: 'in your feed',
      icon: null,
      spark: [],
    },
    {
      label: 'Opportunities',
      value: <span className="text-n3-success font-bold">+{opportunities}</span>,
      sub: 'bullish signals',
      icon: null,
      spark: [],
    },
    {
      label: 'Risk Flags',
      value: <span className={risks > 0 ? 'text-n3-danger font-bold' : 'text-white/50 font-bold'}>{risks}</span>,
      sub: risks > 0 ? 'high impact' : 'clear',
      icon: null,
      spark: [],
    },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Sentiment widget content
  const sentimentCompact = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <SentimentArrow score={overallScore} />
        <SentimentLabel score={overallScore} />
        <span className="text-xs text-white/40">{overallScore >= 0 ? '+' : ''}{overallScore.toFixed(2)}</span>
      </div>
      {sparkData.length > 0 && (
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="avgScore" stroke="#00E5FF" strokeWidth={1.5} fill="url(#sentGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  const sentimentExpanded = (
    <div className="space-y-4">
      {sparkData.length > 0 ? (
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="sentGradEx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={false} />
            <YAxis domain={[-1, 1]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: unknown) => [(v as number).toFixed(2), 'Sentiment']}
            />
            <Area type="monotone" dataKey="avgScore" stroke="#00E5FF" strokeWidth={2} fill="url(#sentGradEx)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-white/40 text-center py-4">No time series data yet.</p>
      )}
      {(sentiment?.byCategory ?? []).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {sentiment!.byCategory.map(cat => (
            <div key={cat.category} className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
              <SentimentArrow score={cat.avgScore} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-white capitalize truncate">{cat.category}</p>
                <p className="text-[10px] text-white/40">{cat.articleCount} articles</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const topStoriesCompact = (
    <div className="space-y-2">
      {articles.slice(0, 3).map(a => (
        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 group">
          <div
            className={`w-0.5 flex-shrink-0 h-full min-h-[32px] rounded-full ${
              (a.analysis?.sentimentScore ?? 0) > 0.05 ? 'bg-n3-success' :
              (a.analysis?.sentimentScore ?? 0) < -0.05 ? 'bg-n3-danger' : 'bg-white/20'
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/80 group-hover:text-white transition-colors line-clamp-2 leading-snug">
              {a.title}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">{a.source.name}</p>
          </div>
        </a>
      ))}
    </div>
  );

  const topStoriesExpanded = (
    <div className="space-y-3">
      {articles.slice(0, 6).map(a => (
        <ArticleCard key={a.id} article={a} />
      ))}
      {articles.length === 0 && (
        <p className="text-sm text-white/40 text-center py-4">No articles loaded yet. Refresh to ingest.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greet()}{userName ? `, ${userName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-white/40 text-sm mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/30 hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 liquid-glass-card rounded-xl text-white/50 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Google Sync Banner */}
      <GoogleSyncBanner />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="liquid-glass-card rounded-2xl p-4 space-y-1">
            <p className="text-xs text-white/40 font-medium">{stat.label}</p>
            <div className="flex items-center gap-1.5">
              {stat.icon}
              <span className="text-sm">{stat.value}</span>
            </div>
            <p className="text-[11px] text-white/30">{stat.sub}</p>
            {stat.spark.length > 0 && (
              <div className="pt-1">
                <ResponsiveContainer width="100%" height={28}>
                  <AreaChart data={stat.spark} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`sg${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="avgScore" stroke="#00E5FF" strokeWidth={1} fill={`url(#sg${i})`} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 liquid-glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <WatchlistActivityWidget />
          <MarketingCalendarWidget />
          <TrendingPostWidget />
          <UserProfileWidget />
          <ExpandableWidget
            title="Sentiment Pulse"
            icon={<Zap size={14} />}
            compactContent={sentimentCompact}
            expandedContent={sentimentExpanded}
          />
          <ExpandableWidget
            title="Top Stories"
            icon={<TrendingUp size={14} />}
            compactContent={topStoriesCompact}
            expandedContent={topStoriesExpanded}
          />
        </div>
      )}
    </div>
  );
}

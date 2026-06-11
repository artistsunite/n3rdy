'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, FileText } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import ArticleCard from './ArticleCard';

interface SentimentData {
  overall: number;
  byCategory: Array<{
    category: string;
    avgScore: number;
    articleCount: number;
    dominant: string;
  }>;
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

export default function OverviewPanel() {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/sentiment').then((r) => r.json()),
      fetch('/api/articles?limit=6').then((r) => r.json()),
    ]).then(([s, a]) => {
      setSentiment(s);
      setArticles(a.articles ?? []);
      setLoading(false);
    });
  }, []);

  const overallSentiment = sentiment?.overall ?? 0;
  const SentimentIcon = overallSentiment > 0.1 ? TrendingUp : overallSentiment < -0.1 ? TrendingDown : Minus;
  const sentimentColor = overallSentiment > 0.1 ? 'text-n3-success' : overallSentiment < -0.1 ? 'text-n3-danger' : 'text-n3-muted';

  const chartData = (sentiment?.timeSeries ?? []).map((d) => ({
    time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: parseFloat(d.avgScore.toFixed(3)),
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-n3-text">Intelligence Overview</h1>
        <p className="text-n3-muted text-sm mt-1">Last 24 hours across your monitored sources</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Market Sentiment"
          value={overallSentiment > 0.1 ? 'Bullish' : overallSentiment < -0.1 ? 'Bearish' : 'Neutral'}
          sub={overallSentiment.toFixed(2)}
          icon={<SentimentIcon size={16} className={sentimentColor} />}
          loading={loading}
        />
        <StatCard
          label="Articles Analysed"
          value={articles.length > 0 ? sentiment?.byCategory.reduce((a, b) => a + b.articleCount, 0)?.toString() ?? '0' : '0'}
          sub="past 24h"
          icon={<FileText size={16} className="text-n3-primary" />}
          loading={loading}
        />
        <StatCard
          label="High Impact"
          value={articles.filter((a) => (a.analysis?.marketImpactScore ?? 0) >= 0.7).length.toString()}
          sub="stories"
          icon={<AlertTriangle size={16} className="text-n3-warning" />}
          loading={loading}
        />
        <StatCard
          label="Breaking"
          value={articles.filter((a) => (a.analysis?.urgencyScore ?? 0) >= 0.8).length.toString()}
          sub="urgent alerts"
          icon={<Zap size={16} className="text-n3-danger" />}
          loading={loading}
        />
      </div>

      {/* Sentiment chart */}
      {chartData.length > 0 && (
        <div className="bg-n3-card border border-n3-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-n3-text mb-4">Sentiment Trend (24h)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
              <YAxis domain={[-1, 1]} tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0B1220', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#F8FAFC' }}
              />
              <Line type="monotone" dataKey="score" stroke="#00E5FF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category sentiment */}
      {sentiment && sentiment.byCategory.length > 0 && (
        <div className="bg-n3-card border border-n3-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-n3-text mb-4">Sentiment by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {sentiment.byCategory.map((c) => (
              <div key={c.category} className="text-center">
                <div className="text-xs text-n3-muted uppercase tracking-wider mb-1">{c.category}</div>
                <div className={`text-sm font-semibold ${c.avgScore > 0.1 ? 'text-n3-success' : c.avgScore < -0.1 ? 'text-n3-danger' : 'text-n3-muted'}`}>
                  {c.dominant}
                </div>
                <div className="text-xs text-n3-muted">{c.articleCount} articles</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top stories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-n3-text">Top Stories</h2>
          <a href="/dashboard/news" className="text-xs text-n3-primary hover:underline">View all</a>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-n3-card border border-n3-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState message="No articles yet. Add sources and trigger an ingest." />
        ) : (
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
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, loading }: {
  label: string; value: string; sub: string; icon: React.ReactNode; loading: boolean;
}) {
  return (
    <div className="bg-n3-card border border-n3-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-n3-muted">{label}</span>
        {icon}
      </div>
      {loading ? (
        <div className="h-7 bg-n3-border rounded animate-pulse w-16" />
      ) : (
        <>
          <div className="text-xl font-bold text-n3-text">{value}</div>
          <div className="text-xs text-n3-muted mt-0.5">{sub}</div>
        </>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-n3-card border border-dashed border-n3-border rounded-xl p-8 text-center">
      <p className="text-n3-muted text-sm">{message}</p>
    </div>
  );
}

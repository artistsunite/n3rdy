'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { useSession } from 'next-auth/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Cell,
} from 'recharts';

interface SentimentData {
  overall: number;
  byCategory: Array<{
    category: string;
    avgScore: number;
    articleCount: number;
    bullish: number;
    bearish: number;
    neutral: number;
    dominant: string;
  }>;
  timeSeries: Array<{ time: string; avgScore: number; count: number }>;
}

type Period = '24h' | '7d' | '30d';

export default function SentimentPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('24h');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sentiment?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const chartData = (data?.byCategory ?? []).map((c) => ({
    category: c.category,
    score: parseFloat(c.avgScore.toFixed(3)),
    articles: c.articleCount,
  }));

  const timeData = (data?.timeSeries ?? []).map((d) => ({
    time: period === '24h'
      ? new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(d.time).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: parseFloat(d.avgScore.toFixed(3)),
    count: d.count,
  }));

  const PERIOD_LABELS: Record<Period, string> = { '24h': 'last 24h', '7d': 'last 7 days', '30d': 'last 30 days' };

  return (
    <DashboardShell userName={session?.user?.name} userImage={session?.user?.image}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Sentiment Analysis</h1>
            <p className="text-white/50 text-sm mt-1">Aggregated sentiment across your monitored sources — {PERIOD_LABELS[period]}</p>
          </div>
          <div className="flex gap-1 liquid-glass-card rounded-lg p-1">
            {(['24h', '7d', '30d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  period === p ? 'bg-n3-primary/10 text-n3-primary' : 'text-white/50 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="h-64 liquid-glass-card rounded-xl animate-pulse" />
            <div className="h-64 liquid-glass-card rounded-xl animate-pulse" />
          </div>
        ) : !data ? (
          <div className="liquid-glass-card border border-dashed border-white/10 rounded-xl p-10 text-center">
            <p className="text-white/50 text-sm">No sentiment data yet. Add sources and ingest articles first.</p>
          </div>
        ) : (
          <>
            {/* Overall score card */}
            {(() => {
              const totalBullish = data.byCategory.reduce((sum, c) => sum + c.bullish, 0);
              const totalBearish = data.byCategory.reduce((sum, c) => sum + c.bearish, 0);
              const totalArticles = data.byCategory.reduce((sum, c) => sum + c.articleCount, 0);
              return (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 liquid-glass-card rounded-xl p-5 flex flex-col items-center justify-center gap-2">
                <div className="text-xs text-white/50 uppercase tracking-wider">Overall Sentiment</div>
                <div className={`text-5xl font-bold ${data.overall > 0.1 ? 'text-n3-success' : data.overall < -0.1 ? 'text-n3-danger' : 'text-white/50'}`}>
                  {data.overall > 0.1 ? '↑' : data.overall < -0.1 ? '↓' : '→'}
                </div>
                <div className="text-sm text-white font-semibold">
                  {data.overall > 0.1 ? 'Bullish' : data.overall < -0.1 ? 'Bearish' : 'Neutral'}
                </div>
                <div className="text-xs text-white/40 font-mono">{data.overall >= 0 ? '+' : ''}{data.overall.toFixed(3)}</div>
                {totalArticles > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-n3-success/10 text-n3-success px-2 py-0.5 rounded-full font-medium">↑{totalBullish}</span>
                    <span className="text-xs bg-n3-danger/10 text-n3-danger px-2 py-0.5 rounded-full font-medium">↓{totalBearish}</span>
                  </div>
                )}
                <div className="text-[10px] text-white/25">{totalArticles} articles analysed</div>
              </div>

              <div className="col-span-2 liquid-glass-card rounded-xl p-5">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">By Category</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
                    <YAxis domain={[-1, 1]} tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0B1220', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="score">
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.score > 0.1 ? '#00FF88' : entry.score < -0.1 ? '#FF4D6D' : '#94A3B8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
              );
            })()}

            {/* Time series */}
            {timeData.length > 0 && (
              <div className="liquid-glass-card rounded-xl p-5">
                <div className="text-sm font-semibold text-white mb-4">Sentiment Over Time ({period})</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={timeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
                    <YAxis domain={[-1, 1]} tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0B1220', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="#00E5FF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category breakdown table */}
            <div className="liquid-glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10">
                <span className="text-sm font-semibold text-white">Category Breakdown</span>
              </div>
              <div className="divide-y divide-white/10">
                {data.byCategory.map((c) => (
                  <div key={c.category} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-sm text-white capitalize w-28 flex-shrink-0">{c.category}</span>
                    <div className="flex-1">
                      {/* Stacked bullish/neutral/bearish bar */}
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                        {c.articleCount > 0 && (
                          <>
                            <div
                              className="h-full bg-n3-success"
                              style={{ width: `${(c.bullish / c.articleCount) * 100}%` }}
                            />
                            <div
                              className="h-full bg-white/20"
                              style={{ width: `${((c.articleCount - c.bullish - c.bearish) / c.articleCount) * 100}%` }}
                            />
                            <div
                              className="h-full bg-n3-danger"
                              style={{ width: `${(c.bearish / c.articleCount) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.bullish > 0 && (
                        <span className="text-[10px] bg-n3-success/10 text-n3-success px-1.5 py-0.5 rounded-full font-medium">
                          ↑{c.bullish}
                        </span>
                      )}
                      {c.bearish > 0 && (
                        <span className="text-[10px] bg-n3-danger/10 text-n3-danger px-1.5 py-0.5 rounded-full font-medium">
                          ↓{c.bearish}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-medium w-16 text-right flex-shrink-0 ${c.avgScore > 0.1 ? 'text-n3-success' : c.avgScore < -0.1 ? 'text-n3-danger' : 'text-white/50'}`}>
                      {c.dominant}
                    </span>
                    <span className="text-xs text-white/50 w-20 text-right flex-shrink-0">{c.articleCount} articles</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

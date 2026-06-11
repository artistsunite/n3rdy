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

export default function SentimentPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sentiment')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const chartData = (data?.byCategory ?? []).map((c) => ({
    category: c.category,
    score: parseFloat(c.avgScore.toFixed(3)),
    articles: c.articleCount,
  }));

  const timeData = (data?.timeSeries ?? []).map((d) => ({
    time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: parseFloat(d.avgScore.toFixed(3)),
    count: d.count,
  }));

  return (
    <DashboardShell userName={session?.user?.name} userImage={session?.user?.image}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-n3-text">Sentiment Analysis</h1>
          <p className="text-n3-muted text-sm mt-1">Aggregated sentiment across your monitored sources — last 24h</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="h-64 bg-n3-card border border-n3-border rounded-xl animate-pulse" />
            <div className="h-64 bg-n3-card border border-n3-border rounded-xl animate-pulse" />
          </div>
        ) : !data ? (
          <div className="bg-n3-card border border-dashed border-n3-border rounded-xl p-10 text-center">
            <p className="text-n3-muted text-sm">No sentiment data yet. Add sources and ingest articles first.</p>
          </div>
        ) : (
          <>
            {/* Overall score card */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 bg-n3-card border border-n3-border rounded-xl p-5 text-center">
                <div className="text-xs text-n3-muted uppercase tracking-wider mb-2">Overall</div>
                <div className={`text-4xl font-bold ${data.overall > 0.1 ? 'text-n3-success' : data.overall < -0.1 ? 'text-n3-danger' : 'text-n3-muted'}`}>
                  {data.overall > 0.1 ? '↑' : data.overall < -0.1 ? '↓' : '→'}
                </div>
                <div className="text-sm text-n3-text mt-1 font-medium">
                  {data.overall > 0.1 ? 'Bullish' : data.overall < -0.1 ? 'Bearish' : 'Neutral'}
                </div>
                <div className="text-xs text-n3-muted mt-1">{data.overall.toFixed(3)}</div>
              </div>

              <div className="col-span-2 bg-n3-card border border-n3-border rounded-xl p-5">
                <div className="text-xs font-semibold text-n3-muted uppercase tracking-wider mb-3">By Category</div>
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

            {/* Time series */}
            {timeData.length > 0 && (
              <div className="bg-n3-card border border-n3-border rounded-xl p-5">
                <div className="text-sm font-semibold text-n3-text mb-4">Sentiment Over Time (24h)</div>
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
            <div className="bg-n3-card border border-n3-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-n3-border">
                <span className="text-sm font-semibold text-n3-text">Category Breakdown</span>
              </div>
              <div className="divide-y divide-n3-border">
                {data.byCategory.map((c) => (
                  <div key={c.category} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-sm text-n3-text capitalize w-28 flex-shrink-0">{c.category}</span>
                    <div className="flex-1">
                      <div className="h-1.5 bg-n3-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.avgScore > 0.1 ? 'bg-n3-success' : c.avgScore < -0.1 ? 'bg-n3-danger' : 'bg-n3-muted'}`}
                          style={{ width: `${Math.abs(c.avgScore) * 50 + 50}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-sm font-medium w-16 text-right flex-shrink-0 ${c.avgScore > 0.1 ? 'text-n3-success' : c.avgScore < -0.1 ? 'text-n3-danger' : 'text-n3-muted'}`}>
                      {c.dominant}
                    </span>
                    <span className="text-xs text-n3-muted w-20 text-right flex-shrink-0">{c.articleCount} articles</span>
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

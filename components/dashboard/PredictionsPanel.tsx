'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Zap, AlertCircle } from 'lucide-react';
import PredictionCard, { PredictionData } from './PredictionCard';
import AccuracyDashboard from './AccuracyDashboard';
import FeedbackCard from './FeedbackCard';
import PredictionHistory from './PredictionHistory';

interface AccuracyRow {
  id: string;
  userId: string;
  targetType: string;
  confidenceBucket: string;
  totalPredictions: number;
  correct: number;
  hitRate: number | null;
}

type Tab = 'active' | 'feedback' | 'history';

export default function PredictionsPanel() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [accuracy, setAccuracy] = useState<AccuracyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('active');

  const load = useCallback(async () => {
    const res = await fetch('/api/predictions');
    if (!res.ok) return;
    const data = await res.json();
    setPredictions(data.predictions ?? []);
    setAccuracy(data.accuracy ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Generation failed.'); }
      else {
        setPredictions(prev => [...(data.predictions ?? []), ...prev]);
        setTab('active');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setGenerating(false); }
  };

  const handleOutcome = async (id: string, outcome: 'CORRECT' | 'INCORRECT' | 'PARTIAL') => {
    const res = await fetch(`/api/predictions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    });
    if (res.ok) {
      setPredictions(prev => prev.map(p => p.id === id ? { ...p, status: outcome } : p));
      // Reload accuracy stats
      const r2 = await fetch('/api/predictions');
      if (r2.ok) { const d = await r2.json(); setAccuracy(d.accuracy ?? []); }
    }
  };

  const handleFeedback = async (predictionId: string, feedbackId: string, answer: string) => {
    const res = await fetch(`/api/predictions/${predictionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackId, answer }),
    });
    const data = await res.json();
    setPredictions(prev => prev.map(p =>
      p.id === predictionId
        ? { ...p, feedback: (p.feedback ?? []).map(f => f.id === feedbackId ? { ...f, answer } : f) }
        : p
    ));
    return { insight: data.insight };
  };

  const now = new Date();
  const active = predictions.filter(p => p.status === 'PENDING' && new Date(p.expiresAt) > now);
  const awaitingFeedback = predictions.filter(p =>
    (p.status === 'PENDING' || p.status === 'PARTIAL') &&
    new Date(p.expiresAt) <= now &&
    (p.feedback ?? []).some(f => !f.answer)
  );
  const history = predictions.filter(p => ['CORRECT', 'INCORRECT', 'PARTIAL'].includes(p.status));

  const totalPredictions = predictions.filter(p => p.status !== 'PENDING').length;
  const correctPredictions = predictions.filter(p => p.status === 'CORRECT').length;

  // Simple streak: count consecutive outcomes from most recent
  let streak = 0;
  const resolved = [...predictions].filter(p => ['CORRECT', 'INCORRECT'].includes(p.status))
    .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
  if (resolved.length > 0) {
    const dir = resolved[0].status === 'CORRECT' ? 1 : -1;
    for (const p of resolved) {
      if ((dir === 1 && p.status === 'CORRECT') || (dir === -1 && p.status === 'INCORRECT')) streak += dir;
      else break;
    }
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'active', label: 'Active', count: active.length },
    { id: 'feedback', label: 'Awaiting Feedback', count: awaitingFeedback.length },
    { id: 'history', label: 'History', count: history.length },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Predictions</h1>
          <p className="text-white/50 text-sm mt-1">AI-powered market calls, self-calibrated over time</p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-n3-primary/90 transition-colors disabled:opacity-60"
        >
          <Zap size={14} />
          {generating ? 'Generating…' : 'Generate Now'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-n3-danger/10 border border-n3-danger/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-n3-danger mt-0.5 flex-shrink-0" />
          <p className="text-sm text-n3-danger">
            {error}
            {error.toLowerCase().includes('article') && (
              <Link href="/dashboard/sources" className="ml-2 underline text-red-300 hover:text-red-200 transition-colors">
                Set up Sources →
              </Link>
            )}
            {error.toLowerCase().includes('watchlist') && (
              <Link href="/dashboard/watchlist" className="ml-2 underline text-red-300 hover:text-red-200 transition-colors">
                Add Watchlist Items →
              </Link>
            )}
          </p>
        </div>
      )}

      {generating && (
        <div className="liquid-glass-card rounded-xl p-6 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-n3-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/50">Analysing your watchlist and news feed…</p>
          <p className="text-xs text-white/30">This takes 15–30 seconds</p>
        </div>
      )}

      {!loading && (
        <div className="flex gap-5 items-start">
          {/* Left: Accuracy sidebar */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <AccuracyDashboard
              accuracy={accuracy}
              totalPredictions={totalPredictions}
              correctPredictions={correctPredictions}
              streak={streak}
            />
          </div>

          {/* Right: tabs + content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile-only accuracy summary */}
            {totalPredictions > 0 && (
              <div className="lg:hidden flex items-center gap-4 liquid-glass-card rounded-xl px-4 py-3 text-sm">
                <div className="flex-1 text-center">
                  <div className="font-bold text-white">{Math.round((correctPredictions / totalPredictions) * 100)}%</div>
                  <div className="text-xs text-white/40">Accuracy</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex-1 text-center">
                  <div className="font-bold text-white">{correctPredictions}/{totalPredictions}</div>
                  <div className="text-xs text-white/40">Correct</div>
                </div>
                {streak !== 0 && (
                  <>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex-1 text-center">
                      <div className={`font-bold ${streak > 0 ? 'text-n3-success' : 'text-n3-danger'}`}>{streak > 0 ? `+${streak}` : streak}</div>
                      <div className="text-xs text-white/40">Streak</div>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/10">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-n3-primary text-white' : 'border-transparent text-white/50 hover:text-white'}`}
                >
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-n3-primary/20 text-n3-primary' : 'bg-white/10 text-white/50'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active tab */}
            {tab === 'active' && (
              <div className="space-y-3">
                {active.length === 0 && !generating ? (
                  <div className="liquid-glass-card border border-dashed border-white/15 rounded-xl p-10 text-center">
                    <Zap size={32} className="text-white/30 mx-auto mb-3" />
                    <p className="text-white/50 text-sm">No active predictions.</p>
                    <p className="text-white/30 text-xs mt-1">Click "Generate Now" to create your first batch.</p>
                  </div>
                ) : (
                  active.map(p => <PredictionCard key={p.id} prediction={p} onOutcome={handleOutcome} />)
                )}
              </div>
            )}

            {/* Awaiting feedback tab */}
            {tab === 'feedback' && (
              <div className="space-y-3">
                {awaitingFeedback.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-white/50">No predictions awaiting feedback.</p>
                    <p className="text-xs text-white/30 mt-1">Once predictions expire, they'll appear here for review.</p>
                  </div>
                ) : (
                  awaitingFeedback.map(p => (
                    <FeedbackCard
                      key={p.id}
                      prediction={p}
                      onOutcome={handleOutcome}
                      onFeedback={handleFeedback}
                    />
                  ))
                )}
              </div>
            )}

            {/* History tab */}
            {tab === 'history' && <PredictionHistory predictions={predictions} />}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 liquid-glass-card rounded-xl animate-pulse" />)}
        </div>
      )}
    </div>
  );
}

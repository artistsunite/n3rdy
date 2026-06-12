'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PredictionData } from './PredictionCard';

interface Props {
  predictions: PredictionData[];
}

type Filter = 'ALL' | 'CORRECT' | 'INCORRECT' | 'PARTIAL';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CORRECT', label: '✓ Correct' },
  { value: 'INCORRECT', label: '✗ Incorrect' },
  { value: 'PARTIAL', label: '~ Partial' },
];

function borderColor(status: string) {
  if (status === 'CORRECT') return 'border-l-n3-success';
  if (status === 'INCORRECT') return 'border-l-n3-danger';
  return 'border-l-amber-400';
}

function StatusChip({ status }: { status: string }) {
  if (status === 'CORRECT') return <span className="text-xs bg-n3-success/15 text-n3-success px-2 py-0.5 rounded-full">✓ Correct</span>;
  if (status === 'INCORRECT') return <span className="text-xs bg-n3-danger/15 text-n3-danger px-2 py-0.5 rounded-full">✗ Incorrect</span>;
  return <span className="text-xs bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full">~ Partial</span>;
}

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === 'BULLISH') return <TrendingUp size={13} className="text-n3-success" />;
  if (direction === 'BEARISH') return <TrendingDown size={13} className="text-n3-danger" />;
  return <Minus size={13} className="text-n3-muted" />;
}

function HistoryRow({ p }: { p: PredictionData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-l-2 pl-3 ${borderColor(p.status)}`}>
      <button className="w-full flex items-start justify-between gap-2 py-2 text-left hover:bg-white/2 rounded-r-lg pr-2 transition-colors" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2 flex-wrap">
          <DirectionIcon direction={p.direction} />
          <span className="text-sm text-n3-text font-medium">{p.target}</span>
          <span className="text-xs text-n3-muted">· {p.timeframe}</span>
          <StatusChip status={p.status} />
          {p.outcome?.validatedBy && (
            <span className="text-xs text-n3-muted/60">({p.outcome.validatedBy === 'AUTO' ? 'auto' : 'you'})</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <span className="text-xs text-n3-muted">{new Date(p.expiresAt).toLocaleDateString()}</span>
          {open ? <ChevronUp size={13} className="text-n3-muted" /> : <ChevronDown size={13} className="text-n3-muted" />}
        </div>
      </button>
      {open && (
        <div className="pb-3 space-y-2">
          <p className="text-xs text-n3-muted leading-relaxed">{p.reasoning}</p>
          {p.outcome?.actualDirection && (
            <p className="text-xs text-n3-muted">Actual: <span className="text-n3-text">{p.outcome.actualDirection}</span></p>
          )}
          {p.outcome?.userNotes && (
            <p className="text-xs text-n3-muted">Your notes: <span className="text-n3-text">{p.outcome.userNotes}</span></p>
          )}
          {p.feedback?.filter(f => f.answer).map(f => (
            <div key={f.id} className="text-xs space-y-0.5">
              <p className="text-n3-muted italic">"{f.question}"</p>
              <p className="text-n3-text">→ {f.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PredictionHistory({ predictions }: Props) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const resolved = predictions.filter(p => ['CORRECT', 'INCORRECT', 'PARTIAL'].includes(p.status));
  const filtered = filter === 'ALL' ? resolved : resolved.filter(p => p.status === filter);

  if (resolved.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-n3-muted">No resolved predictions yet.</p>
        <p className="text-xs text-n3-muted/60 mt-1">Predictions will appear here once their timeframe expires.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === f.value ? 'bg-n3-primary/20 border-n3-primary/40 text-n3-primary' : 'bg-transparent border-n3-border text-n3-muted hover:border-n3-muted'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="space-y-1">
        {filtered.map(p => <HistoryRow key={p.id} p={p} />)}
        {filtered.length === 0 && <p className="text-sm text-n3-muted text-center py-4">No {filter.toLowerCase()} predictions.</p>}
      </div>
    </div>
  );
}

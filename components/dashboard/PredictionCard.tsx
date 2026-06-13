'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PredictionSignals {
  sentiment: number;
  velocity: number;
  sourceQuality: number;
  calendarContext: number;
}

interface SubQuestion {
  question: string;
  answer: string;
  confidence: number;
}

export interface PredictionData {
  id: string;
  target: string;
  targetType: string;
  direction: string;
  confidence: number;
  calibratedConfidence: number | null;
  baseRate: number | null;
  contrarianFlag: boolean;
  reasoning: string;
  bullCase: string | null;
  bearCase: string | null;
  signals: PredictionSignals | null;
  subQuestions: SubQuestion[] | null;
  timeframe: string;
  expiresAt: string;
  status: string;
  outcome?: { outcome: string; actualDirection: string | null; validatedBy: string; userNotes?: string | null } | null;
  feedback?: Array<{ id: string; question: string; answer: string | null }>;
}

interface Props {
  prediction: PredictionData;
  onOutcome?: (id: string, outcome: 'CORRECT' | 'INCORRECT' | 'PARTIAL') => void;
}

const SIGNAL_LABELS = ['Sentiment', 'Velocity', 'Sources', 'Calendar'];
const SIGNAL_KEYS: (keyof PredictionSignals)[] = ['sentiment', 'velocity', 'sourceQuality', 'calendarContext'];

function SignalDots({ value }: { value: number }) {
  const filled = Math.round(value * 4);
  return (
    <span className="flex gap-0.5">
      {[0, 1, 2, 3].map(i => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < filled ? 'bg-n3-primary' : 'bg-white/10'}`} />
      ))}
    </span>
  );
}

function ConfidenceBar({ value, calibrated }: { value: number; calibrated?: number | null }) {
  const display = calibrated ?? value;
  const pct = Math.round(display * 100);
  const color = pct >= 70 ? 'bg-n3-success' : pct >= 50 ? 'bg-amber-400' : 'bg-n3-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${pct >= 70 ? 'text-n3-success' : pct >= 50 ? 'text-amber-400' : 'text-n3-danger'}`}>
        {pct}%
      </span>
    </div>
  );
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === 'BULLISH') return (
    <span className="inline-flex items-center gap-1 bg-n3-success/15 text-n3-success px-2.5 py-1 rounded-full text-xs font-bold">
      <TrendingUp size={11} /> BULLISH
    </span>
  );
  if (direction === 'BEARISH') return (
    <span className="inline-flex items-center gap-1 bg-n3-danger/15 text-n3-danger px-2.5 py-1 rounded-full text-xs font-bold">
      <TrendingDown size={11} /> BEARISH
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 bg-white/10 text-n3-muted px-2.5 py-1 rounded-full text-xs font-bold">
      <Minus size={11} /> NEUTRAL
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'CORRECT') return <span className="text-xs bg-n3-success/15 text-n3-success px-2 py-0.5 rounded-full">✓ Correct</span>;
  if (status === 'INCORRECT') return <span className="text-xs bg-n3-danger/15 text-n3-danger px-2 py-0.5 rounded-full">✗ Incorrect</span>;
  if (status === 'PARTIAL') return <span className="text-xs bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full">~ Partial</span>;
  return null;
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h remaining`;
  return `${h}h remaining`;
}

export default function PredictionCard({ prediction: p, onOutcome }: Props) {
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const isPending = p.status === 'PENDING';
  const isExpired = new Date(p.expiresAt) < new Date();
  const remaining = timeRemaining(p.expiresAt);

  const baseRateDelta = p.baseRate !== null && p.calibratedConfidence !== null
    ? Math.round((p.calibratedConfidence - p.baseRate) * 100)
    : null;

  return (
    <div className={`liquid-glass-card rounded-xl overflow-hidden transition-all ${!isPending && p.status === 'CORRECT' ? 'shadow-[inset_0_1px_0_rgba(0,255,136,0.2)]' : !isPending && p.status === 'INCORRECT' ? 'shadow-[inset_0_1px_0_rgba(255,77,109,0.2)]' : ''}`}>
      {/* Header row */}
      <button
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-white/2 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <DirectionBadge direction={p.direction} />
            <span className="text-xs bg-white/8 text-n3-muted px-2 py-0.5 rounded-full">{p.targetType}</span>
            <span className="text-sm font-semibold text-n3-text">{p.target}</span>
            <span className="text-xs text-n3-muted">· {p.timeframe}</span>
            {!isPending && <StatusBadge status={p.status} />}
          </div>

          <ConfidenceBar value={p.confidence} calibrated={p.calibratedConfidence} />

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {p.baseRate !== null && (
              <span className="text-n3-muted">
                Base rate: {Math.round(p.baseRate * 100)}%
                {baseRateDelta !== null && (
                  <span className={baseRateDelta >= 0 ? ' text-n3-success' : ' text-n3-danger'}>
                    {' '}({baseRateDelta >= 0 ? '+' : ''}{baseRateDelta}%)
                  </span>
                )}
              </span>
            )}
            {p.contrarianFlag && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle size={11} /> Contrarian risk
              </span>
            )}
            <span className={`${isExpired ? 'text-n3-danger' : 'text-n3-muted'}`}>{remaining}</span>
          </div>

          {/* Signal dots */}
          {p.signals && (
            <div className="flex flex-wrap gap-3">
              {SIGNAL_KEYS.map((k, i) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="text-xs text-n3-muted">{SIGNAL_LABELS[i]}</span>
                  <SignalDots value={p.signals![k]} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-1 text-n3-muted flex-shrink-0">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Reasoning */}
              <div>
                <p className="text-xs font-semibold text-n3-muted uppercase tracking-wider mb-1.5">Reasoning</p>
                <p className="text-sm text-n3-text leading-relaxed">{p.reasoning}</p>
              </div>

              {/* Sub-questions */}
              {p.subQuestions && p.subQuestions.length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-2 text-xs font-semibold text-n3-muted uppercase tracking-wider mb-1.5 hover:text-n3-text transition-colors"
                    onClick={() => setSubOpen(v => !v)}
                  >
                    Analysis Breakdown
                    {subOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                  <AnimatePresence>
                    {subOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="space-y-2 pt-1">
                          {p.subQuestions.map((sq, i) => {
                            const icon = sq.answer.toLowerCase() === 'yes' ? '✓' : sq.answer.toLowerCase() === 'no' ? '✗' : '~';
                            const color = sq.answer.toLowerCase() === 'yes' ? 'text-n3-success' : sq.answer.toLowerCase() === 'no' ? 'text-n3-danger' : 'text-amber-400';
                            return (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className={`${color} font-bold mt-0.5 flex-shrink-0`}>{icon}</span>
                                <div className="flex-1">
                                  <span className="text-n3-text">{sq.question}</span>
                                  <span className="text-n3-muted ml-1">— {sq.answer} ({Math.round(sq.confidence * 100)}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Bull / Bear cases */}
              {(p.bullCase || p.bearCase) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {p.bullCase && (
                    <div className="bg-n3-success/5 border border-n3-success/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-n3-success mb-1.5 flex items-center gap-1">
                        <TrendingUp size={11} /> Bull Case
                      </p>
                      <p className="text-xs text-n3-text leading-relaxed">{p.bullCase}</p>
                    </div>
                  )}
                  {p.bearCase && (
                    <div className="bg-n3-danger/5 border border-n3-danger/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-n3-danger mb-1.5 flex items-center gap-1">
                        <TrendingDown size={11} /> Bear Case
                      </p>
                      <p className="text-xs text-n3-text leading-relaxed">{p.bearCase}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manual outcome buttons for pending/expired predictions */}
              {isPending && isExpired && onOutcome && (
                <div>
                  <p className="text-xs font-semibold text-n3-muted uppercase tracking-wider mb-2">How did it go?</p>
                  <div className="flex gap-2">
                    <button onClick={() => onOutcome(p.id, 'CORRECT')} className="text-xs bg-n3-success/10 hover:bg-n3-success/20 text-n3-success border border-n3-success/20 px-3 py-1.5 rounded-lg transition-colors">✓ Correct</button>
                    <button onClick={() => onOutcome(p.id, 'INCORRECT')} className="text-xs bg-n3-danger/10 hover:bg-n3-danger/20 text-n3-danger border border-n3-danger/20 px-3 py-1.5 rounded-lg transition-colors">✗ Incorrect</button>
                    <button onClick={() => onOutcome(p.id, 'PARTIAL')} className="text-xs bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20 px-3 py-1.5 rounded-lg transition-colors">~ Partial</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

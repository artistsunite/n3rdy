'use client';

import { useState } from 'react';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PredictionData } from './PredictionCard';

interface FeedbackItem {
  id: string;
  question: string;
  answer: string | null;
}

interface Props {
  prediction: PredictionData;
  onOutcome: (id: string, outcome: 'CORRECT' | 'INCORRECT' | 'PARTIAL', userNotes?: string) => Promise<void>;
  onFeedback: (predictionId: string, feedbackId: string, answer: string) => Promise<{ insight?: string }>;
}

export default function FeedbackCard({ prediction: p, onOutcome, onFeedback }: Props) {
  const [outcomeSubmitting, setOutcomeSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, string>>({}); // feedbackId → insight
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  const unansweredFeedback = (p.feedback ?? []).filter(f => !f.answer);
  const autoOutcome = p.outcome?.outcome;

  const handleOutcome = async (outcome: 'CORRECT' | 'INCORRECT' | 'PARTIAL') => {
    setOutcomeSubmitting(true);
    await onOutcome(p.id, outcome);
    setOutcomeSubmitting(false);
  };

  const handleFeedbackSubmit = async (fb: FeedbackItem) => {
    const answer = answers[fb.id]?.trim();
    if (!answer) return;
    setSubmittingFeedback(fb.id);
    const result = await onFeedback(p.id, fb.id, answer);
    setSubmittedFeedback(prev => ({ ...prev, [fb.id]: result.insight ?? '💡 Insight saved.' }));
    setSubmittingFeedback(null);
  };

  const dirColor = p.direction === 'BULLISH' ? 'text-n3-success' : p.direction === 'BEARISH' ? 'text-n3-danger' : 'text-white/50';

  return (
    <div className="liquid-glass-card border border-amber-400/20 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${dirColor}`}>{p.direction}</span>
            <span className="text-sm text-white">{p.target}</span>
            <span className="text-xs text-white/50">· {p.timeframe}</span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Expired · {autoOutcome ? `Auto-assessed: ${autoOutcome}` : 'Awaiting your input'}
          </p>
        </div>
        <MessageSquare size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
      </div>

      {/* Outcome buttons (if no user outcome yet) */}
      {p.status !== 'CORRECT' && p.status !== 'INCORRECT' && (
        <div>
          <p className="text-xs text-white/50 mb-2">Confirm outcome:</p>
          <div className="flex gap-2 flex-wrap">
            {(['CORRECT', 'INCORRECT', 'PARTIAL'] as const).map(o => (
              <button
                key={o}
                disabled={outcomeSubmitting}
                onClick={() => handleOutcome(o)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50
                  ${o === 'CORRECT' ? 'bg-n3-success/10 hover:bg-n3-success/20 text-n3-success border-n3-success/20' :
                    o === 'INCORRECT' ? 'bg-n3-danger/10 hover:bg-n3-danger/20 text-n3-danger border-n3-danger/20' :
                    'bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border-amber-400/20'}`}
              >
                {o === 'CORRECT' ? '✓ Correct' : o === 'INCORRECT' ? '✗ Incorrect' : '~ Partial'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI feedback questions */}
      {unansweredFeedback.map(fb => (
        <div key={fb.id} className="border-t border-white/10 pt-3 space-y-2">
          <p className="text-sm text-white leading-relaxed">"{fb.question}"</p>
          <AnimatePresence>
            {submittedFeedback[fb.id] ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 bg-n3-primary/10 border border-n3-primary/20 rounded-lg px-3 py-2"
              >
                <CheckCircle size={14} className="text-n3-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-n3-primary">{submittedFeedback[fb.id]}</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                <input
                  className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-n3-primary/50 min-w-0"
                  placeholder="Your answer…"
                  value={answers[fb.id] ?? ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [fb.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleFeedbackSubmit(fb)}
                />
                <button
                  onClick={() => handleFeedbackSubmit(fb)}
                  disabled={!answers[fb.id]?.trim() || submittingFeedback === fb.id}
                  className="text-xs bg-n3-primary text-n3-bg px-3 py-2 rounded-lg font-semibold hover:bg-n3-primary/90 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {submittingFeedback === fb.id ? '…' : 'Submit'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

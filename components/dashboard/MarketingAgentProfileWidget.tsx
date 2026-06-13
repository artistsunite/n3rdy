'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface UserInsight {
  id: string;
  question: string;
  category: string;
  answer: string | null;
  answeredAt: string | null;
}

interface Props {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  questions: UserInsight[];
  onComplete: () => void;
}

type AnswerMap = Record<string, string>;

export default function MarketingAgentProfileWidget({ agentId, agentName, agentEmoji, questions, onComplete }: Props) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [commentMode, setCommentMode] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const allAnswered = questions.every(q => answers[q.id]?.trim());

  function selectAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setCommentMode(prev => ({ ...prev, [id]: false }));
  }

  function toggleComment(id: string) {
    setCommentMode(prev => ({ ...prev, [id]: !prev[id] }));
    if (answers[id] === 'YES' || answers[id] === 'NO') {
      setAnswers(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  }

  async function save() {
    const toSubmit = Object.entries(answers).filter(([, v]) => v.trim());
    if (toSubmit.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/profile/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: toSubmit.map(([insightId, answer]) => ({ insightId, answer })),
        }),
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="liquid-glass-card rounded-2xl p-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{agentEmoji}</span>
          <span className="text-sm font-bold text-white">{agentName} — Profile Setup</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">
          Answer 3 quick questions so this specialist understands your situation. You only need to do this once.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-xs text-white/30 flex-shrink-0 mt-0.5">{idx + 1}.</span>
              <p className="text-sm text-white leading-relaxed">{q.question}</p>
            </div>
            {commentMode[q.id] ? (
              <div className="flex gap-2 pl-4">
                <input
                  className="flex-1 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-n3-primary/50"
                  placeholder="Tell us more…"
                  value={typeof answers[q.id] === 'string' && answers[q.id] !== 'YES' && answers[q.id] !== 'NO' ? answers[q.id] : ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  autoFocus
                />
                <button
                  onClick={() => setCommentMode(prev => ({ ...prev, [q.id]: false }))}
                  className="text-xs text-white/40 hover:text-white px-2"
                >✕</button>
              </div>
            ) : (
              <div className="flex gap-2 pl-4 flex-wrap">
                {(['YES', 'NO'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => selectAnswer(q.id, v)}
                    className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                      answers[q.id] === v
                        ? v === 'YES'
                          ? 'bg-n3-success/20 border-n3-success/40 text-n3-success'
                          : 'bg-n3-danger/20 border-n3-danger/40 text-n3-danger'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {answers[q.id] === v && <Check size={13} />}
                    {v === 'YES' ? 'Yes' : 'No'}
                  </button>
                ))}
                <button
                  onClick={() => toggleComment(q.id)}
                  className="text-sm px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                >
                  ✏ Tell us more
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={!allAnswered || saving}
        className="w-full flex items-center justify-center gap-2 bg-n3-primary text-n3-bg py-2.5 rounded-xl text-sm font-semibold hover:bg-n3-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? (
          <><span className="w-4 h-4 border-2 border-n3-bg border-t-transparent rounded-full animate-spin" /> Saving…</>
        ) : (
          <>Save Profile →</>
        )}
      </button>
    </div>
  );
}

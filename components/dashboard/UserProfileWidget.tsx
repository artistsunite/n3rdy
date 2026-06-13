'use client';

import { useEffect, useState } from 'react';
import { Brain, Check } from 'lucide-react';
import ExpandableWidget from './ExpandableWidget';

interface UserInsight {
  id: string;
  question: string;
  category: string;
  answer: string | null;
  answeredAt: string | null;
}

interface AIProfile {
  summary: string;
  interests: string;
  businessFocus: string;
  profileScore: number;
}

type AnswerMap = Record<string, string>;

export default function UserProfileWidget() {
  const [profile, setProfile] = useState<AIProfile | null>(null);
  const [questions, setQuestions] = useState<UserInsight[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [commentMode, setCommentMode] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d.profile ?? null);
        setQuestions(d.questions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function submitAnswers() {
    const toSubmit = Object.entries(answers).filter(([, v]) => v.trim());
    if (toSubmit.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/profile/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: toSubmit.map(([insightId, answer]) => ({ insightId, answer })) }),
      });
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
      setAnswers({});
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      // Load next batch
      const fresh = await fetch('/api/profile').then(r => r.json());
      setQuestions(fresh.questions ?? []);
    } finally {
      setSubmitting(false);
    }
  }

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

  const score = profile?.profileScore ?? 0;
  const interests: string[] = (() => { try { return JSON.parse(profile?.interests ?? '[]') as string[]; } catch { return []; } })();
  const answeredCount = Object.values(answers).filter(v => v.trim()).length;

  // SVG ring
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  const compactContent = (
    <div className="space-y-3">
      {loading ? (
        <div className="h-16 bg-white/5 rounded-lg animate-pulse" />
      ) : (
        <div className="flex items-center gap-4">
          {/* Progress ring */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-16 h-16 -rotate-90">
              <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
              <circle
                cx="40" cy="40" r={radius}
                stroke="url(#profileGrad)"
                strokeWidth="8" fill="none"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              <defs>
                <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{score}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {interests.slice(0, 4).map(tag => (
                  <span key={tag} className="text-[10px] bg-white/8 text-white/70 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">Answer questions to build your profile.</p>
            )}
            <p className="text-xs text-white/40 mt-1.5">
              {profile ? `Profile ${score}% complete` : 'No profile yet — answer 3 questions to start'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-4">
      {profile?.summary && (
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">AI Profile Summary</p>
          <p className="text-sm text-white/80 italic leading-relaxed">{profile.summary}</p>
        </div>
      )}

      {interests.length > 0 && (
        <div>
          <p className="text-xs text-white/40 mb-2">Your interests</p>
          <div className="flex flex-wrap gap-1.5">
            {interests.map(tag => (
              <span key={tag} className="text-xs bg-n3-primary/10 text-n3-primary px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          {profile ? 'Continue building your profile' : 'Let\'s understand your business'}
        </p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-4">More questions coming soon. Check back later.</p>
        ) : (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="bg-white/5 rounded-xl p-3 space-y-2.5">
                <p className="text-sm text-white leading-relaxed">{q.question}</p>
                {commentMode[q.id] ? (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-n3-primary/50"
                      placeholder="Your answer…"
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
                  <div className="flex gap-2 flex-wrap">
                    {(['YES', 'NO'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => selectAnswer(q.id, v)}
                        className={`text-xs px-4 py-1.5 rounded-lg border font-semibold transition-colors ${
                          answers[q.id] === v
                            ? v === 'YES' ? 'bg-n3-success/20 border-n3-success/40 text-n3-success' : 'bg-n3-danger/20 border-n3-danger/40 text-n3-danger'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {v === 'YES' ? '✓ Yes' : '✗ No'}
                      </button>
                    ))}
                    <button
                      onClick={() => toggleComment(q.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                    >
                      ✏ Comment
                    </button>
                  </div>
                )}
                {answers[q.id] && (
                  <p className="text-[11px] text-n3-primary flex items-center gap-1">
                    <Check size={10} /> Answered
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {questions.length > 0 && (
        <button
          onClick={submitAnswers}
          disabled={submitting || answeredCount === 0}
          className="w-full flex items-center justify-center gap-2 bg-n3-primary text-n3-bg py-2 rounded-xl text-sm font-semibold hover:bg-n3-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? (
            <><span className="w-4 h-4 border-2 border-n3-bg border-t-transparent rounded-full animate-spin" /> Saving…</>
          ) : submitted ? (
            <><Check size={14} /> Profile updated!</>
          ) : (
            <>Submit {answeredCount > 0 ? `${answeredCount} ` : ''}Answer{answeredCount !== 1 ? 's' : ''}</>
          )}
        </button>
      )}
    </div>
  );

  return (
    <ExpandableWidget
      title="Intelligence Profile"
      icon={<Brain size={14} />}
      compactContent={compactContent}
      expandedContent={expandedContent}
    />
  );
}

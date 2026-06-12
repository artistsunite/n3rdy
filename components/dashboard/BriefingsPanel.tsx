'use client';

import { useEffect, useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Zap, AlertCircle } from 'lucide-react';

interface BriefingContent {
  executiveSummary: string;
  topStories: Array<{ headline: string; summary: string; impact: string; sentiment: string; source: string }>;
  marketImpactForecast: string;
  sentimentOverview: { overall: string; byCategory: Record<string, string> };
  riskSignals: string[];
  bullishDevelopments: string[];
  bearishDevelopments: string[];
  sevenDayOutlook: string;
  watchNext: string[];
}

interface Briefing {
  id: string;
  type: string;
  content: BriefingContent;
  plainText: string | null;
  read: boolean;
  createdAt: string;
}

export default function BriefingsPanel() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadBriefings = async () => {
    const res = await fetch('/api/briefings?limit=10');
    const data = await res.json();
    setBriefings(data.briefings ?? []);
    setLoading(false);
  };

  useEffect(() => { loadBriefings(); }, []);

  const triggerBriefing = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/briefings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'custom' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Generation failed. Try refreshing your news feed first.');
      } else if (data.briefing) {
        setBriefings((prev) => [data.briefing, ...prev]);
        setExpanded(data.briefing.id);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const markRead = async (id: string) => {
    await fetch('/api/briefings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setBriefings((prev) => prev.map((b) => b.id === id ? { ...b, read: true } : b));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-n3-text">Briefings</h1>
          <p className="text-n3-muted text-sm mt-1">AI-generated executive intelligence reports</p>
        </div>
        <button
          onClick={triggerBriefing}
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
          <p className="text-sm text-n3-danger">{error}</p>
        </div>
      )}

      {generating && (
        <div className="bg-n3-card border border-n3-border rounded-xl p-6 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-n3-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-n3-muted">Claude is analysing your news feed and writing your briefing…</p>
          <p className="text-xs text-n3-muted/60">This takes 15–30 seconds</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-n3-card border border-n3-border rounded-xl animate-pulse" />)}
        </div>
      ) : briefings.length === 0 && !generating ? (
        <div className="bg-n3-card border border-dashed border-n3-border rounded-xl p-10 text-center">
          <FileText size={32} className="text-n3-muted mx-auto mb-3" />
          <p className="text-n3-muted text-sm">No briefings yet.</p>
          <p className="text-n3-muted/60 text-xs mt-1">Make sure your news feed has articles, then click &quot;Generate Now&quot;.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefings.map((b) => {
            const isOpen = expanded === b.id;
            const content = b.content as BriefingContent;
            return (
              <div
                key={b.id}
                className={`bg-n3-card border rounded-xl overflow-hidden transition-colors ${b.read ? 'border-n3-border' : 'border-n3-primary/30'}`}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors"
                  onClick={() => {
                    setExpanded(isOpen ? null : b.id);
                    if (!b.read) markRead(b.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {!b.read && <div className="w-2 h-2 bg-n3-primary rounded-full flex-shrink-0" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-n3-text capitalize">{b.type} Briefing</span>
                        <span className="text-xs bg-n3-primary/10 text-n3-primary px-2 py-0.5 rounded-full">
                          {content?.sentimentOverview?.overall ?? 'mixed'}
                        </span>
                      </div>
                      <div className="text-xs text-n3-muted mt-0.5">
                        {new Date(b.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-n3-muted" /> : <ChevronDown size={16} className="text-n3-muted" />}
                </button>

                {isOpen && content && (
                  <div className="px-5 pb-5 space-y-5 border-t border-n3-border">
                    <Section title="Executive Summary">
                      <p className="text-sm text-n3-text leading-relaxed">{content.executiveSummary}</p>
                    </Section>

                    {content.topStories?.length > 0 && (
                      <Section title="Top Stories">
                        <div className="space-y-3">
                          {content.topStories.map((s, i) => (
                            <div key={i} className="border-l-2 border-n3-primary/30 pl-3">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-n3-text">{s.headline}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${s.sentiment === 'bullish' ? 'bg-n3-success/10 text-n3-success' : s.sentiment === 'bearish' ? 'bg-n3-danger/10 text-n3-danger' : 'bg-white/5 text-n3-muted'}`}>{s.sentiment}</span>
                              </div>
                              <p className="text-xs text-n3-muted">{s.summary}</p>
                              <p className="text-xs text-n3-primary mt-1">{s.impact}</p>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {content.bullishDevelopments?.length > 0 && (
                        <Section title="Bullish">
                          <ul className="space-y-1">
                            {content.bullishDevelopments.map((d, i) => (
                              <li key={i} className="text-xs text-n3-success flex gap-2">
                                <span>↑</span><span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </Section>
                      )}
                      {content.bearishDevelopments?.length > 0 && (
                        <Section title="Bearish">
                          <ul className="space-y-1">
                            {content.bearishDevelopments.map((d, i) => (
                              <li key={i} className="text-xs text-n3-danger flex gap-2">
                                <span>↓</span><span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </Section>
                      )}
                    </div>

                    {content.riskSignals?.length > 0 && (
                      <Section title="Risk Signals">
                        <ul className="space-y-1">
                          {content.riskSignals.map((r, i) => (
                            <li key={i} className="text-xs text-n3-warning flex gap-2">
                              <span>⚠</span><span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </Section>
                    )}

                    {content.marketImpactForecast && (
                      <Section title="Market Impact Forecast">
                        <p className="text-sm text-n3-text leading-relaxed">{content.marketImpactForecast}</p>
                      </Section>
                    )}

                    {content.sevenDayOutlook && (
                      <Section title="7-Day Outlook">
                        <p className="text-sm text-n3-text leading-relaxed">{content.sevenDayOutlook}</p>
                      </Section>
                    )}

                    {content.watchNext?.length > 0 && (
                      <Section title="Watch Next">
                        <ul className="flex flex-wrap gap-2">
                          {content.watchNext.map((w, i) => (
                            <li key={i} className="text-xs bg-n3-primary/10 text-n3-primary px-2.5 py-1 rounded-full">{w}</li>
                          ))}
                        </ul>
                      </Section>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4">
      <div className="text-xs font-semibold text-n3-muted uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  );
}

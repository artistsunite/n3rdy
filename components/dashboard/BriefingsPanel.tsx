'use client';

import { useEffect, useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Zap, AlertCircle, TrendingUp, Crosshair, ArrowRight, Mail, Check } from 'lucide-react';
import Link from 'next/link';

interface GrowthSignal {
  opportunities: Array<{ id: string; title: string; type: string; urgencyScore: number; potentialRevenue?: string | null }>;
  competitorEvents: Array<{ id: string; title: string; importance: string; detectedAt: string }>;
}

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
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [growthSignals, setGrowthSignals] = useState<GrowthSignal | null>(null);

  const loadBriefings = async () => {
    const res = await fetch('/api/briefings?limit=10');
    const data = await res.json();
    setBriefings(data.briefings ?? []);
    setLoading(false);
  };

  const loadGrowthSignals = async () => {
    const [oppRes, evtRes] = await Promise.all([
      fetch('/api/growth/opportunities?status=new'),
      fetch('/api/competitors/events?take=6'),
    ]);
    if (!oppRes.ok || !evtRes.ok) return;
    const [oppData, evtData] = await Promise.all([
      oppRes.json() as Promise<{ opportunities: GrowthSignal['opportunities'] }>,
      evtRes.json() as Promise<{ events: GrowthSignal['competitorEvents'] }>,
    ]);

    setGrowthSignals({
      opportunities: (oppData.opportunities ?? [])
        .sort((a, b) => b.urgencyScore - a.urgencyScore)
        .slice(0, 3),
      competitorEvents: (evtData.events ?? []).slice(0, 3),
    });
  };

  useEffect(() => {
    loadBriefings();
    loadGrowthSignals();
  }, []);

  const sendEmail = async () => {
    setEmailing(true);
    setError(null);
    try {
      const res = await fetch('/api/briefings/email', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Email send failed.');
      } else {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      }
    } catch {
      setError('Network error sending email.');
    } finally {
      setEmailing(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white">Briefings</h1>
          <p className="text-white/50 text-sm mt-1">AI-generated executive intelligence reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendEmail}
            disabled={emailing || briefings.length === 0}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            title="Email today's briefing to yourself"
          >
            {emailSent ? <Check size={14} className="text-n3-success" /> : <Mail size={14} />}
            {emailing ? 'Sending…' : emailSent ? 'Sent!' : 'Email Brief'}
          </button>
          <button
            onClick={triggerBriefing}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-n3-primary/90 transition-colors disabled:opacity-60"
          >
            <Zap size={14} />
            {generating ? 'Generating…' : 'Generate Now'}
          </button>
        </div>
      </div>

      {growthSignals && (growthSignals.opportunities.length > 0 || growthSignals.competitorEvents.length > 0) && (
        <div className="liquid-glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Growth Signals</span>
            <Link href="/dashboard/growth" className="flex items-center gap-1 text-cyan-400/60 hover:text-cyan-400 text-xs transition-all">
              View all <ArrowRight size={10} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {growthSignals.opportunities.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-green-400" />
                  <span className="text-white/40 text-xs">Top Opportunities</span>
                </div>
                <div className="space-y-1.5">
                  {growthSignals.opportunities.map(o => (
                    <div key={o.id} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-white/70 text-xs truncate">{o.title}</div>
                        {o.potentialRevenue && <div className="text-green-400/60 text-xs">{o.potentialRevenue}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {growthSignals.competitorEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Crosshair size={12} className="text-red-400" />
                  <span className="text-white/40 text-xs">Competitor Activity</span>
                </div>
                <div className="space-y-1.5">
                  {growthSignals.competitorEvents.map(e => (
                    <div key={e.id} className="flex items-start gap-2">
                      <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${e.importance === 'high' ? 'bg-red-400' : e.importance === 'medium' ? 'bg-yellow-400' : 'bg-white/30'}`} />
                      <div className="text-white/60 text-xs line-clamp-2">{e.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-n3-danger/10 border border-n3-danger/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-n3-danger mt-0.5 flex-shrink-0" />
          <p className="text-sm text-n3-danger">
            {error}
            {error.toLowerCase().includes('source') && (
              <Link href="/dashboard/sources" className="ml-2 underline text-red-300 hover:text-red-200 transition-colors">
                Set up Sources →
              </Link>
            )}
          </p>
        </div>
      )}

      {generating && (
        <div className="liquid-glass-card rounded-xl p-6 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-n3-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/50">Claude is analysing your news feed and writing your briefing…</p>
          <p className="text-xs text-white/30">This takes 15–30 seconds</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 liquid-glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : briefings.length === 0 && !generating ? (
        <div className="liquid-glass-card rounded-xl p-10 text-center">
          <FileText size={32} className="text-white/50 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No briefings yet.</p>
          <p className="text-white/30 text-xs mt-1">Make sure your news feed has articles, then click &quot;Generate Now&quot;.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefings.map((b) => {
            const isOpen = expanded === b.id;
            const content = b.content as BriefingContent;
            return (
              <div
                key={b.id}
                className={`liquid-glass-card rounded-xl overflow-hidden transition-all ${!b.read ? 'shadow-[inset_0_1px_0_rgba(0,229,255,0.2)]' : ''}`}
              >
                <button
                  className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors"
                  onClick={() => {
                    setExpanded(isOpen ? null : b.id);
                    if (!b.read) markRead(b.id);
                  }}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {!b.read && <div className="w-2 h-2 bg-n3-primary rounded-full flex-shrink-0 mt-1.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white capitalize">{b.type} Briefing</span>
                        <span className="text-xs bg-n3-primary/10 text-n3-primary px-2 py-0.5 rounded-full">
                          {content?.sentimentOverview?.overall ?? 'mixed'}
                        </span>
                        {content?.riskSignals?.length > 0 && (
                          <span className="text-xs bg-n3-warning/10 text-n3-warning px-2 py-0.5 rounded-full">
                            {content.riskSignals.length} risk{content.riskSignals.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">
                        {new Date(b.createdAt).toLocaleString()}
                      </div>
                      {!isOpen && content?.executiveSummary && (
                        <p className="text-xs text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
                          {content.executiveSummary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3 mt-0.5">
                    {isOpen ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
                  </div>
                </button>

                {isOpen && content && (
                  <div className="px-5 pb-5 space-y-5 border-t border-white/10">
                    <Section title="Executive Summary">
                      <p className="text-sm text-white leading-relaxed">{content.executiveSummary}</p>
                    </Section>

                    {content.topStories?.length > 0 && (
                      <Section title="Top Stories">
                        <div className="space-y-3">
                          {content.topStories.map((s, i) => (
                            <div key={i} className="border-l-2 border-n3-primary/30 pl-3">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-white">{s.headline}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${s.sentiment === 'bullish' ? 'bg-n3-success/10 text-n3-success' : s.sentiment === 'bearish' ? 'bg-n3-danger/10 text-n3-danger' : 'bg-white/5 text-white/50'}`}>{s.sentiment}</span>
                              </div>
                              <p className="text-xs text-white/50">{s.summary}</p>
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
                        <p className="text-sm text-white leading-relaxed">{content.marketImpactForecast}</p>
                      </Section>
                    )}

                    {content.sevenDayOutlook && (
                      <Section title="7-Day Outlook">
                        <p className="text-sm text-white leading-relaxed">{content.sevenDayOutlook}</p>
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
      <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, AlertCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import MarketingAgentCard from './MarketingAgentCard';
import MarketingOutputCard from './MarketingOutputCard';
import MarketingAgentProfileWidget from './MarketingAgentProfileWidget';
import { MARKETING_AGENTS } from '@/lib/marketing-agents';

interface AgentInsight {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  category: string;
}

interface HistoryItem {
  id: string;
  agentId: string;
  brief: string;
  createdAt: string;
  output: {
    id: string;
    content: string;
    aiProvider: string;
    createdAt: string;
  } | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MarketingPanel() {
  const [tab, setTab] = useState<'studio' | 'history'>('studio');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(MARKETING_AGENTS[0].id);
  const [brief, setBrief] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState<HistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [agentProfileMap, setAgentProfileMap] = useState<Record<string, { questions: AgentInsight[]; complete: boolean }>>({});
  const [loadingProfile, setLoadingProfile] = useState(false);

  const selectedAgent = MARKETING_AGENTS.find(a => a.id === selectedAgentId)!;

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/marketing');
      if (res.ok) {
        const data = await res.json() as { briefs: HistoryItem[] };
        setHistory(data.briefs);
      }
    } catch { /* non-fatal */ } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const loadAgentProfile = useCallback(async (agentId: string) => {
    if (agentProfileMap[agentId]) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/profile/marketing?agentId=${agentId}`);
      if (res.ok) {
        const data = await res.json() as { questions: AgentInsight[]; complete: boolean };
        setAgentProfileMap(prev => ({ ...prev, [agentId]: data }));
      }
    } catch { /* non-fatal */ } finally {
      setLoadingProfile(false);
    }
  }, [agentProfileMap]);

  useEffect(() => { loadAgentProfile(selectedAgentId); }, [selectedAgentId, loadAgentProfile]);

  function handleSelectAgent(id: string) {
    setSelectedAgentId(id);
    setOutput(null);
    setError(null);
  }

  function handleProfileComplete() {
    setAgentProfileMap(prev => {
      const existing = prev[selectedAgentId];
      if (!existing) return prev;
      return { ...prev, [selectedAgentId]: { ...existing, complete: true } };
    });
    // Reload to pick up new answered state
    fetch(`/api/profile/marketing?agentId=${selectedAgentId}`)
      .then(r => r.json())
      .then((d: { questions: AgentInsight[]; complete: boolean }) => {
        setAgentProfileMap(prev => ({ ...prev, [selectedAgentId]: d }));
      })
      .catch(() => null);
  }

  async function handleSubmit() {
    if (!brief.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setOutput(null);

    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId, brief }),
      });
      const data = await res.json() as { ok?: boolean; brief?: HistoryItem; error?: string };
      if (!res.ok || !data.brief) {
        throw new Error(data.error ?? 'Unknown error');
      }
      setOutput(data.brief);
      setBrief('');
      await loadHistory();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/marketing/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
      if (output?.id === id) setOutput(null);
    } catch { /* non-fatal */ }
  }

  function toggleHistoryExpand(id: string) {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const historyCount = history.length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing Division</h1>
          <p className="text-sm text-white/50 mt-1">AI marketing specialists from agency-agents · select an expert, describe your challenge</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-6">
        {(['studio', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-n3-primary text-white' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {t === 'history' ? `History${historyCount > 0 ? ` (${historyCount})` : ''}` : 'Studio'}
          </button>
        ))}
      </div>

      {/* Studio Tab */}
      {tab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Roster */}
          <div className="lg:col-span-1">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Select Specialist</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {MARKETING_AGENTS.map(agent => (
                <MarketingAgentCard
                  key={agent.id}
                  agent={agent}
                  selected={selectedAgentId === agent.id}
                  profileComplete={agentProfileMap[agent.id]?.complete}
                  onSelect={handleSelectAgent}
                />
              ))}
            </div>
          </div>

          {/* Brief Form + Output */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Selected agent info */}
            <div className={`${selectedAgent.color} border ${selectedAgent.borderColor} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{selectedAgent.emoji}</span>
                <span className={`font-semibold text-base ${selectedAgent.textColor}`}>{selectedAgent.name}</span>
              </div>
              <p className="text-sm text-white/60 italic">"{selectedAgent.vibe}"</p>
              <p className="text-xs text-white/40 mt-2">{selectedAgent.description}</p>
            </div>

            {/* Agent profile setup — show if profile not yet complete */}
            {loadingProfile && !agentProfileMap[selectedAgentId] ? (
              <div className="h-16 liquid-glass-card rounded-xl animate-pulse" />
            ) : agentProfileMap[selectedAgentId] && !agentProfileMap[selectedAgentId].complete ? (
              <MarketingAgentProfileWidget
                agentId={selectedAgentId}
                agentName={selectedAgent.name}
                agentEmoji={selectedAgent.emoji}
                questions={agentProfileMap[selectedAgentId].questions}
                onComplete={handleProfileComplete}
              />
            ) : null}

            {/* Profile context chips — show when complete */}
            {agentProfileMap[selectedAgentId]?.complete && agentProfileMap[selectedAgentId].questions.some(q => q.answer) && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {agentProfileMap[selectedAgentId].questions.filter(q => q.answer).map(q => (
                  <span key={q.id} className="text-[11px] bg-white/8 text-white/60 px-2 py-0.5 rounded-full">
                    {q.answer === 'YES' ? '✓' : q.answer === 'NO' ? '✗' : '💬'} {q.answer === 'YES' || q.answer === 'NO' ? q.question.split(' ').slice(0, 5).join(' ') + '…' : q.answer?.slice(0, 30)}
                  </span>
                ))}
              </div>
            )}

            {/* Brief textarea — only shown when profile is complete or no profile system for this agent */}
            {(!agentProfileMap[selectedAgentId] || agentProfileMap[selectedAgentId].complete) && (
            <div className="liquid-glass-card rounded-xl p-4">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Your Brief
              </label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder={`Describe what you need from the ${selectedAgent.name}. Be specific: include your product/service, target audience, current situation, and desired outcome.`}
                rows={5}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 resize-y outline-none"
                disabled={submitting}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-xs text-white/30">{brief.length} chars</span>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !brief.trim()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    submitting || !brief.trim()
                      ? 'bg-n3-primary/30 text-n3-primary/50 cursor-not-allowed'
                      : 'bg-n3-primary text-n3-bg hover:bg-n3-primary/90'
                  }`}
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-n3-bg border-t-transparent rounded-full animate-spin" />
                      Working...
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Submit Brief
                    </>
                  )}
                </button>
              </div>
            </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-n3-danger/10 border border-n3-danger/20 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="text-n3-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-n3-danger">{error}</p>
              </div>
            )}

            {/* Output */}
            {output?.output && (
              <MarketingOutputCard
                agentId={output.agentId}
                content={output.output.content}
                aiProvider={output.output.aiProvider}
                createdAt={output.output.createdAt}
                brief={output.brief}
              />
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {loadingHistory && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 liquid-glass-card rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loadingHistory && history.length === 0 && (
            <div className="liquid-glass-card rounded-xl p-8 text-center">
              <p className="text-white/50 text-sm">No marketing outputs yet.</p>
              <p className="text-white/30 text-xs mt-1">Submit a brief in the Studio tab to get started.</p>
            </div>
          )}

          {!loadingHistory && history.map(item => {
            const agent = MARKETING_AGENTS.find(a => a.id === item.agentId);
            const isExpanded = expandedHistory.has(item.id);
            return (
              <div key={item.id} className="liquid-glass-card rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/2 transition-colors"
                  onClick={() => toggleHistoryExpand(item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {agent && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agent.color} ${agent.textColor}`}>
                          {agent.emoji} {agent.name}
                        </span>
                      )}
                      <span className="text-xs text-white/40">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-sm text-white truncate">{item.brief}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                      className="p-1.5 text-white/50 hover:text-n3-danger transition-colors rounded-lg hover:bg-n3-danger/10"
                    >
                      <Trash2 size={13} />
                    </button>
                    {isExpanded ? <ChevronUp size={14} className="text-white/50" /> : <ChevronDown size={14} className="text-white/50" />}
                  </div>
                </button>

                {isExpanded && item.output && (
                  <div className="border-t border-white/10">
                    <MarketingOutputCard
                      agentId={item.agentId}
                      content={item.output.content}
                      aiProvider={item.output.aiProvider}
                      createdAt={item.output.createdAt}
                      brief={item.brief}
                    />
                  </div>
                )}

                {isExpanded && !item.output && (
                  <div className="border-t border-white/10 px-4 py-3">
                    <p className="text-xs text-white/50">No output recorded for this brief.</p>
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

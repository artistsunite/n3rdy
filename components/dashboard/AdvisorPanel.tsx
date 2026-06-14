'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, TrendingUp, AlertTriangle, CheckCircle, Eye, Clock, Send, Plus, ChevronLeft, Trash2, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface AdvisorReportContent {
  whatChanged: string;
  whyItMatters: string;
  topOpportunities: Array<{ title: string; impact: string; action: string }>;
  topThreats: Array<{ title: string; risk: string; mitigation: string }>;
  recommendedActions: string[];
  outlook7d: string;
  outlook30d: string;
}

interface AdvisorReport {
  id: string;
  content: AdvisorReportContent;
  generatedAt: string;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  title?: string | null;
  updatedAt: string;
  _count?: { messages: number };
}

type ActiveView = 'report' | 'chat';

export default function AdvisorPanel() {
  const [view, setView] = useState<ActiveView>('report');
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/advisor/report').then(r => r.json()),
      fetch('/api/advisor/conversations').then(r => r.json()),
    ]).then(([rd, cd]) => {
      if (rd.status === 'fulfilled' && rd.value.report) setReport(rd.value.report as AdvisorReport);
      if (cd.status === 'fulfilled') setConversations((cd.value as { conversations: Conversation[] }).conversations ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyReport = useCallback(() => {
    if (!report) return;
    const c = report.content;
    const lines = [
      `# AI Growth Advisor Report — ${new Date(report.generatedAt).toLocaleDateString()}`,
      '',
      '## What Changed',
      c.whatChanged,
      '',
      '## Why It Matters',
      c.whyItMatters,
      '',
      '## Top Opportunities',
      ...(c.topOpportunities ?? []).map(o => `- **${o.title}**: ${o.impact}\n  Action: ${o.action}`),
      '',
      '## Top Threats',
      ...(c.topThreats ?? []).map(t => `- **${t.title}**: ${t.risk}\n  Mitigation: ${t.mitigation}`),
      '',
      '## Recommended Actions',
      ...(c.recommendedActions ?? []).map((a, i) => `${i + 1}. ${a}`),
      '',
      '## 7-Day Outlook',
      c.outlook7d,
      '',
      '## 30-Day Outlook',
      c.outlook30d,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [report]);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    const r = await fetch('/api/advisor/report', { method: 'POST' });
    const d = await r.json() as { report?: AdvisorReport; error?: string };
    if (d.error) setError(d.error === 'Business profile required' ? 'Complete your Business Profile first.' : d.error);
    else if (d.report) setReport(d.report);
    setGenerating(false);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setLoadingConv(true);
    setActiveConvId(id);
    const r = await fetch(`/api/advisor/conversations/${id}`);
    const d = await r.json() as { conversation: { messages: Message[] } };
    setMessages(d.conversation.messages ?? []);
    setLoadingConv(false);
  }, []);

  const newConversation = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    inputRef.current?.focus();
  }, []);

  const deleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/advisor/conversations/${id}`, { method: 'DELETE' });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  }, [activeConvId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let convId = activeConvId;
    let fullText = '';

    try {
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId: convId }),
        signal: ctrl.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const data = JSON.parse(payload) as { text?: string; conversationId?: string };
            if (data.conversationId && !convId) {
              convId = data.conversationId;
              setActiveConvId(convId);
            }
            if (data.text) {
              fullText += data.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullText };
                return updated;
              });
            }
          } catch { /* skip malformed */ }
        }
      }

      // Update conversation list
      if (convId) {
        const finalConvId = convId;
        setConversations(prev => {
          const exists = prev.find(c => c.id === finalConvId);
          if (exists) return prev.map(c => c.id === finalConvId ? { ...c, updatedAt: new Date().toISOString() } : c);
          return [{ id: finalConvId, title: text.slice(0, 60), updatedAt: new Date().toISOString() }, ...prev];
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      // If assistant message ended up empty (stream error), replace with error text
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          return [...prev.slice(0, -1), { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }];
        }
        return prev;
      });
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, activeConvId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="text-cyan-400" size={22} />
          <h2 className="text-white font-semibold text-xl">AI Growth Advisor</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 liquid-glass rounded-xl">
            {(['report', 'chat'] as ActiveView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${view === v ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50 hover:text-white/70'}`}>
                {v}
              </button>
            ))}
          </div>
          {view === 'report' && (
            <div className="flex items-center gap-2">
              {report && (
                <button onClick={copyReport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 text-sm transition-all"
                  title="Copy report as markdown">
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
              <button onClick={generate} disabled={generating}
                className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                {generating ? 'Generating…' : report ? 'Regenerate' : 'Generate Report'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="liquid-glass-card rounded-2xl p-4 border border-red-500/20">
          <p className="text-red-400 text-sm">
            {error}
            {error.includes('Business Profile') && (
              <Link href="/dashboard/profile" className="ml-2 underline text-red-300 hover:text-red-200 transition-colors">
                Go to Profile →
              </Link>
            )}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'report' && (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {!report && !generating && (
              <div className="liquid-glass-card rounded-2xl p-10 text-center">
                <Brain className="mx-auto mb-4 text-white/20" size={40} />
                <h3 className="text-white/60 font-medium mb-2">Weekly Strategic Report</h3>
                <p className="text-white/35 text-sm max-w-md mx-auto leading-relaxed">
                  Get a personalized intelligence report with competitor insights, growth opportunities, and weekly recommendations.
                </p>
                <p className="text-white/25 text-xs mt-3">Requires a completed Business Profile.</p>
              </div>
            )}

            {report && (
              <>
                {(() => {
                  const ageH = (Date.now() - new Date(report.generatedAt).getTime()) / 3600000;
                  const ageStr = ageH >= 48 ? `${Math.round(ageH / 24)}d` : `${Math.round(ageH)}h`;
                  return ageH > 12 ? (
                    <div className="liquid-glass rounded-xl p-3 flex items-center gap-2 border border-yellow-500/20">
                      <Clock size={13} className="text-yellow-400 flex-shrink-0" />
                      <p className="text-yellow-400/80 text-xs flex-1">
                        Report is {ageStr} old — click Regenerate for fresh insights
                      </p>
                      <button onClick={generate} disabled={generating}
                        className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-1.5">
                        {generating ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
                        Refresh
                      </button>
                    </div>
                  ) : (
                    <div className="text-white/30 text-xs flex items-center gap-1">
                      <Clock size={11} /> Generated {new Date(report.generatedAt).toLocaleString()}
                    </div>
                  );
                })()}

                <ReportSection icon={<Eye size={15} className="text-cyan-400" />} title="What Changed">
                  <p className="text-white/70 text-sm leading-relaxed">{report.content.whatChanged}</p>
                </ReportSection>

                <ReportSection icon={<Brain size={15} className="text-cyan-400" />} title="Why It Matters">
                  <p className="text-white/70 text-sm leading-relaxed">{report.content.whyItMatters}</p>
                </ReportSection>

                {report.content.topOpportunities?.length > 0 && (
                  <ReportSection icon={<TrendingUp size={15} className="text-green-400" />} title="Top Opportunities">
                    <div className="space-y-3">
                      {report.content.topOpportunities.map((o, i) => (
                        <div key={i} className="border-l-2 border-green-500/30 pl-4">
                          <div className="text-white text-sm font-medium">{o.title}</div>
                          <div className="text-green-400/70 text-xs mt-0.5">{o.impact}</div>
                          <div className="text-white/50 text-xs mt-0.5">{o.action}</div>
                        </div>
                      ))}
                    </div>
                  </ReportSection>
                )}

                {report.content.topThreats?.length > 0 && (
                  <ReportSection icon={<AlertTriangle size={15} className="text-red-400" />} title="Top Threats">
                    <div className="space-y-3">
                      {report.content.topThreats.map((t, i) => (
                        <div key={i} className="border-l-2 border-red-500/30 pl-4">
                          <div className="text-white text-sm font-medium">{t.title}</div>
                          <div className="text-red-400/70 text-xs mt-0.5">{t.risk}</div>
                          <div className="text-white/50 text-xs mt-0.5">{t.mitigation}</div>
                        </div>
                      ))}
                    </div>
                  </ReportSection>
                )}

                {report.content.recommendedActions?.length > 0 && (
                  <ReportSection icon={<CheckCircle size={15} className="text-cyan-400" />} title="Recommended Actions This Week">
                    <ol className="space-y-2">
                      {report.content.recommendedActions.map((a, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/65">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                          {a}
                        </li>
                      ))}
                    </ol>
                  </ReportSection>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="liquid-glass-card rounded-2xl p-5">
                    <div className="text-cyan-400 text-xs font-medium mb-2">7-Day Outlook</div>
                    <p className="text-white/65 text-sm leading-relaxed">{report.content.outlook7d}</p>
                  </div>
                  <div className="liquid-glass-card rounded-2xl p-5">
                    <div className="text-purple-400 text-xs font-medium mb-2">30-Day Outlook</div>
                    <p className="text-white/65 text-sm leading-relaxed">{report.content.outlook30d}</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {view === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex flex-col lg:flex-row gap-4 lg:h-[600px]">
              {/* Conversation list */}
              <div className="lg:w-56 flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto pb-1 lg:pb-0">
                <button onClick={newConversation}
                  className="flex items-center gap-2 flex-shrink-0 lg:flex-shrink lg:w-full liquid-glass hover:bg-white/5 border border-white/10 hover:border-cyan-500/30 text-white/60 hover:text-cyan-300 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap">
                  <Plus size={14} /> New Chat
                </button>
                {conversations.length === 0 ? (
                  <p className="text-white/25 text-xs px-2 py-2 whitespace-nowrap lg:whitespace-normal">No conversations yet</p>
                ) : (
                  conversations.map(c => (
                    <button key={c.id} onClick={() => loadConversation(c.id)}
                      className={`flex-shrink-0 lg:flex-shrink lg:w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group relative min-w-[140px] lg:min-w-0 ${activeConvId === c.id ? 'bg-cyan-500/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
                      <div className="truncate pr-5">{c.title ?? 'Untitled'}</div>
                      <div className="text-white/25 text-xs mt-0.5 lg:block hidden">{new Date(c.updatedAt).toLocaleDateString()}</div>
                      <button onClick={e => deleteConversation(c.id, e)}
                        className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </button>
                  ))
                )}
              </div>

              {/* Chat area */}
              <div className="flex-1 flex flex-col liquid-glass-card rounded-2xl overflow-hidden min-h-[460px] lg:min-h-0">
                {loadingConv ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-cyan-400/50" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <Brain size={32} className="text-white/20 mb-4" />
                    <h3 className="text-white/50 font-medium mb-2">Ask your Growth Advisor</h3>
                    <p className="text-white/25 text-sm max-w-xs leading-relaxed">
                      Get strategic advice on growth opportunities, competitor moves, pricing, marketing, or anything business-related.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {(report?.content ? [
                        report.content.topOpportunities?.[0]
                          ? `Tell me more about the "${report.content.topOpportunities[0].title}" opportunity`
                          : 'What\'s my best growth opportunity right now?',
                        report.content.topThreats?.[0]
                          ? `How should I respond to: ${report.content.topThreats[0].title}?`
                          : 'What competitive threats should I watch?',
                        report.content.recommendedActions?.[0]
                          ? `Help me execute: ${report.content.recommendedActions[0].slice(0, 60)}…`
                          : 'Help me prioritize this week\'s actions',
                      ] : [
                        'What\'s my best growth opportunity right now?',
                        'How should I respond to competitor moves?',
                        'Help me prioritize my growth experiments',
                      ]).map(q => (
                        <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                          className="text-xs bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 px-3 py-1.5 rounded-xl transition-all text-left max-w-xs">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-cyan-500/20 text-white ml-8'
                            : 'bg-white/5 text-white/80 mr-8'
                        }`}>
                          {m.role === 'assistant' && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Brain size={11} className="text-cyan-400" />
                              <span className="text-cyan-400/70 text-xs font-medium">Advisor</span>
                              {streaming && i === messages.length - 1 && (
                                <span className="w-1.5 h-3 bg-cyan-400/70 animate-pulse rounded-sm ml-1" />
                              )}
                            </div>
                          )}
                          {m.role === 'assistant' ? <MarkdownContent text={m.content} /> : <div className="whitespace-pre-wrap">{m.content}</div>}
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-white/10">
                  <div className="flex items-end gap-2">
                    {activeConvId && (
                      <button onClick={newConversation} className="p-2 text-white/30 hover:text-white/60 transition-all flex-shrink-0" title="New conversation">
                        <ChevronLeft size={16} />
                      </button>
                    )}
                    <textarea
                      ref={inputRef}
                      className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/25 resize-none max-h-32 min-h-[36px] leading-relaxed overflow-y-auto"
                      placeholder="Ask your advisor anything… (Enter to send, Shift+Enter for newline)"
                      value={input}
                      onChange={e => {
                        setInput(e.target.value);
                        const ta = e.target;
                        ta.style.height = 'auto';
                        ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
                      }}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      style={{ height: '36px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || streaming}
                      className="flex-shrink-0 p-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  function inlineFormat(line: string): React.ReactNode {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={idx} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={idx} className="italic">{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={idx} className="bg-white/10 text-cyan-300 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      return part;
    });
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-white font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-white font-semibold text-base mt-4 mb-1">{line.slice(3)}</h2>);
    } else if (line.match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-0.5 my-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-1.5 text-sm">
              <span className="text-cyan-400/60 mt-0.5 flex-shrink-0">•</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-0.5 my-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="text-cyan-400/70 flex-shrink-0 font-medium min-w-[16px]">{j + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-sm leading-relaxed">{inlineFormat(line)}</p>);
    }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

function ReportSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="liquid-glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-white font-medium">{title}</h3>
      </div>
      {children}
    </div>
  );
}

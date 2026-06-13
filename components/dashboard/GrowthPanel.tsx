'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, FlaskConical, Loader2, ChevronRight, Check, X, Play, Square } from 'lucide-react';

interface GrowthOpportunity {
  id: string;
  type: string;
  title: string;
  description: string;
  reason: string;
  confidenceScore: number;
  impactScore: number;
  urgencyScore: number;
  difficultyScore: number;
  potentialRevenue?: string | null;
  timeHorizon?: number | null;
  suggestedActions: string[];
  status: string;
  generatedAt: string;
}

interface GrowthExperiment {
  id: string;
  hypothesis: string;
  expectedOutcome: string;
  difficulty: 'low' | 'medium' | 'high';
  expectedRevenue?: string | null;
  successMetrics: string[];
  estimatedDays: number;
  status: string;
  priorityScore: number;
  generatedAt: string;
}

type ActiveTab = 'opportunities' | 'experiments';

const TYPE_COLORS: Record<string, string> = {
  revenue: 'bg-green-500/20 text-green-400',
  marketing: 'bg-cyan-500/20 text-cyan-400',
  pricing: 'bg-yellow-500/20 text-yellow-400',
  market_gap: 'bg-purple-500/20 text-purple-400',
  competitor_weakness: 'bg-red-500/20 text-red-400',
  trend: 'bg-blue-500/20 text-blue-400',
  partnership: 'bg-orange-500/20 text-orange-400',
  geographic: 'bg-teal-500/20 text-teal-400',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-0.5">
        <span className="text-white/30">{label}</span>
        <span className={color}>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color.includes('green') ? 'bg-green-500' : color.includes('yellow') ? 'bg-yellow-500' : color.includes('red') ? 'bg-red-500' : 'bg-cyan-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

export default function GrowthPanel() {
  const [tab, setTab] = useState<ActiveTab>('opportunities');
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>([]);
  const [experiments, setExperiments] = useState<GrowthExperiment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [oppRes, expRes] = await Promise.all([
      fetch('/api/growth/opportunities'),
      fetch('/api/growth/experiments'),
    ]);
    const [oppData, expData] = await Promise.all([oppRes.json(), expRes.json()]) as [
      { opportunities: GrowthOpportunity[] },
      { experiments: GrowthExperiment[] }
    ];
    setOpportunities(oppData.opportunities ?? []);
    setExperiments(expData.experiments ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateOpps = useCallback(async () => {
    setGenerating(true);
    const r = await fetch('/api/growth/opportunities/generate', { method: 'POST' });
    const d = await r.json() as { opportunities?: GrowthOpportunity[]; error?: string };
    if (d.opportunities) setOpportunities(prev => [...d.opportunities!, ...prev]);
    setGenerating(false);
  }, []);

  const generateExps = useCallback(async () => {
    setGenerating(true);
    const r = await fetch('/api/growth/experiments/generate', { method: 'POST' });
    const d = await r.json() as { experiments?: GrowthExperiment[]; error?: string };
    if (d.experiments) setExperiments(prev => [...d.experiments!, ...prev]);
    setGenerating(false);
  }, []);

  const updateOpportunity = useCallback(async (id: string, status: string) => {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }, []);

  const updateExperiment = useCallback(async (id: string, status: string) => {
    await fetch(`/api/growth/experiments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setExperiments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  }, []);

  const activeOpps = opportunities.filter(o => o.status !== 'dismissed');
  const highImpact = opportunities.filter(o => o.impactScore >= 0.7 && o.status !== 'dismissed').length;
  const runningExps = experiments.filter(e => e.status === 'running').length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="text-cyan-400" size={22} />
          <h2 className="text-white font-semibold text-xl">Growth Intelligence</h2>
        </div>
        <button
          onClick={tab === 'opportunities' ? generateOpps : generateExps}
          disabled={generating}
          className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {generating ? 'Generating…' : tab === 'opportunities' ? 'Find Opportunities' : 'Generate Experiments'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Opportunities', value: activeOpps.length, icon: TrendingUp, color: 'text-cyan-400' },
          { label: 'High Impact', value: highImpact, icon: Zap, color: 'text-green-400' },
          { label: 'Running Experiments', value: runningExps, icon: FlaskConical, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="liquid-glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={color} />
              <span className="text-white/50 text-xs">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 liquid-glass rounded-xl">
        {(['opportunities', 'experiments'] as ActiveTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50 hover:text-white/70'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'opportunities' && (
          <motion.div key="opps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {activeOpps.length === 0 ? (
              <div className="liquid-glass-card rounded-2xl p-8 text-center">
                <TrendingUp className="mx-auto mb-3 text-white/20" size={32} />
                <p className="text-white/40 text-sm">No opportunities yet.</p>
                <p className="text-white/25 text-xs mt-1">Complete your business profile then click &quot;Find Opportunities&quot;.</p>
              </div>
            ) : (
              activeOpps.map(opp => (
                <motion.div key={opp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="liquid-glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[opp.type] ?? 'bg-white/10 text-white/60'}`}>
                        {opp.type.replace('_', ' ')}
                      </span>
                      {opp.potentialRevenue && (
                        <span className="text-xs text-green-400/70 bg-green-500/10 px-2 py-0.5 rounded-full">{opp.potentialRevenue}</span>
                      )}
                      {opp.timeHorizon && (
                        <span className="text-xs text-white/30">{opp.timeHorizon}d</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => updateOpportunity(opp.id, 'actioned')}
                        className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all" title="Mark actioned">
                        <Check size={12} />
                      </button>
                      <button onClick={() => updateOpportunity(opp.id, 'dismissed')}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all" title="Dismiss">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-1">{opp.title}</h3>
                  <p className="text-white/50 text-sm mb-3 leading-relaxed">{opp.description}</p>
                  <p className="text-white/35 text-xs italic mb-3">{opp.reason}</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <ScoreBar label="Impact" value={opp.impactScore} color="text-green-400" />
                    <ScoreBar label="Urgency" value={opp.urgencyScore} color="text-yellow-400" />
                    <ScoreBar label="Confidence" value={opp.confidenceScore} color="text-cyan-400" />
                    <ScoreBar label="Difficulty" value={opp.difficultyScore} color="text-red-400" />
                  </div>
                  {opp.suggestedActions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-white/30 text-xs mb-1">Suggested actions</div>
                      {opp.suggestedActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-cyan-400/50" />
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {tab === 'experiments' && (
          <motion.div key="exps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {experiments.length === 0 ? (
              <div className="liquid-glass-card rounded-2xl p-8 text-center">
                <FlaskConical className="mx-auto mb-3 text-white/20" size={32} />
                <p className="text-white/40 text-sm">No experiments yet.</p>
                <p className="text-white/25 text-xs mt-1">Generate opportunities first, then click &quot;Generate Experiments&quot;.</p>
              </div>
            ) : (
              experiments.map(exp => (
                <motion.div key={exp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="liquid-glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${DIFFICULTY_COLORS[exp.difficulty]}`}>{exp.difficulty} difficulty</span>
                      {exp.estimatedDays && <span className="text-white/30 text-xs">{exp.estimatedDays} days</span>}
                      {exp.expectedRevenue && <span className="text-green-400/70 text-xs">{exp.expectedRevenue}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {exp.status === 'pending' && (
                        <button onClick={() => updateExperiment(exp.id, 'running')}
                          className="flex items-center gap-1 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-1 rounded-lg transition-all">
                          <Play size={10} /> Start
                        </button>
                      )}
                      {exp.status === 'running' && (
                        <button onClick={() => updateExperiment(exp.id, 'completed')}
                          className="flex items-center gap-1 text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg transition-all">
                          <Square size={10} /> Complete
                        </button>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        exp.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
                        exp.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        exp.status === 'abandoned' ? 'bg-red-500/20 text-red-400' :
                        'bg-white/10 text-white/40'
                      }`}>{exp.status}</span>
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium mb-1">{exp.hypothesis}</p>
                  <p className="text-white/50 text-xs mb-3 leading-relaxed">{exp.expectedOutcome}</p>
                  {exp.successMetrics.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-white/30 text-xs">Success metrics</div>
                      {exp.successMetrics.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/45">
                          <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-green-400/50" />
                          {m}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

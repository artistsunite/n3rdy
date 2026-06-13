'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, TrendingUp, AlertTriangle, CheckCircle, Eye, Clock, Send } from 'lucide-react';

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
  isRead: boolean;
}

export default function AdvisorPanel() {
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/advisor/report')
      .then(r => r.json())
      .then(d => { if (d.report) setReport(d.report as AdvisorReport); })
      .finally(() => setLoading(false));
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    const r = await fetch('/api/advisor/report', { method: 'POST' });
    const d = await r.json() as { report?: AdvisorReport; error?: string };
    if (d.error) {
      setError(d.error === 'Business profile required'
        ? 'Complete your Business Profile first to generate a strategic report.'
        : d.error);
    } else if (d.report) {
      setReport(d.report);
    }
    setGenerating(false);
  }, []);

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
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
          {generating ? 'Generating Report…' : report ? 'Regenerate Report' : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div className="liquid-glass-card rounded-2xl p-4 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!report && !generating && !error && (
        <div className="liquid-glass-card rounded-2xl p-10 text-center">
          <Brain className="mx-auto mb-4 text-white/20" size={40} />
          <h3 className="text-white/60 font-medium mb-2">Your AI Growth Advisor</h3>
          <p className="text-white/35 text-sm max-w-md mx-auto leading-relaxed">
            Get a personalized weekly strategic intelligence report with competitor insights, growth opportunities, and actionable recommendations.
          </p>
          <p className="text-white/25 text-xs mt-3">Requires a completed Business Profile.</p>
        </div>
      )}

      {report && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Clock size={12} />
            Generated {new Date(report.generatedAt).toLocaleString()}
          </div>

          <div className="liquid-glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-cyan-400" />
              <h3 className="text-white font-medium">What Changed</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{report.content.whatChanged}</p>
          </div>

          <div className="liquid-glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-cyan-400" />
              <h3 className="text-white font-medium">Why It Matters</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{report.content.whyItMatters}</p>
          </div>

          {report.content.topOpportunities?.length > 0 && (
            <div className="liquid-glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-green-400" />
                <h3 className="text-white font-medium">Top Opportunities</h3>
              </div>
              <div className="space-y-3">
                {report.content.topOpportunities.map((opp, i) => (
                  <div key={i} className="border-l-2 border-green-500/30 pl-4">
                    <div className="text-white text-sm font-medium mb-1">{opp.title}</div>
                    <div className="text-green-400/70 text-xs mb-1">{opp.impact}</div>
                    <div className="text-white/50 text-xs">{opp.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.content.topThreats?.length > 0 && (
            <div className="liquid-glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-white font-medium">Top Threats</h3>
              </div>
              <div className="space-y-3">
                {report.content.topThreats.map((threat, i) => (
                  <div key={i} className="border-l-2 border-red-500/30 pl-4">
                    <div className="text-white text-sm font-medium mb-1">{threat.title}</div>
                    <div className="text-red-400/70 text-xs mb-1">{threat.risk}</div>
                    <div className="text-white/50 text-xs">{threat.mitigation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.content.recommendedActions?.length > 0 && (
            <div className="liquid-glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-cyan-400" />
                <h3 className="text-white font-medium">Recommended Actions This Week</h3>
              </div>
              <ol className="space-y-2">
                {report.content.recommendedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/65">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
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

          <div className="liquid-glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-cyan-400/50" />
              <h3 className="text-white/50 font-medium">Chat with Advisor</h3>
              <span className="text-xs bg-white/5 text-white/30 px-2 py-0.5 rounded-full">Coming in Phase 2</span>
            </div>
            <div className="flex items-center gap-3 opacity-40 cursor-not-allowed">
              <input
                disabled
                className="flex-1 liquid-glass rounded-xl px-4 py-2.5 text-white/30 text-sm outline-none placeholder-white/20"
                placeholder="Ask your advisor anything…"
              />
              <button disabled className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400/50">
                <Send size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

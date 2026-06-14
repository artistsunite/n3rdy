'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crosshair, Zap, Brain, ChevronRight, AlertCircle } from 'lucide-react';

interface GrowthSummary {
  unreadEvents: number;
  newOpportunities: number;
  topOpportunityTitle: string | null;
  topOpportunityScore: number | null;
  advisorReportAge: number | null; // hours since last report
  advisorOutlook: string | null;
}

const REFRESH_MS = 5 * 60 * 1000;

export default function GrowthIntelligenceWidget() {
  const [data, setData] = useState<GrowthSummary | null>(null);

  async function load() {
    const [eventsRes, oppsRes, reportRes] = await Promise.allSettled([
      fetch('/api/competitors').then(r => r.json()),
      fetch('/api/growth/opportunities?status=new').then(r => r.json()),
      fetch('/api/advisor/report').then(r => r.json()),
    ]);

    let unreadEvents = 0;
    if (eventsRes.status === 'fulfilled') {
      const competitors: Array<{ id: string }> = eventsRes.value.competitors ?? [];
      const eventCounts = await Promise.allSettled(
        competitors.slice(0, 5).map((c: { id: string }) =>
          fetch(`/api/competitors/${c.id}/events`).then(r => r.json()).then((d: { events?: Array<{ isRead: boolean }> }) => (d.events ?? []).filter((e: { isRead: boolean }) => !e.isRead).length)
        )
      );
      unreadEvents = eventCounts.reduce((sum, r) => sum + (r.status === 'fulfilled' ? r.value : 0), 0);
    }

    let newOpportunities = 0;
    let topOpportunityTitle: string | null = null;
    let topOpportunityScore: number | null = null;
    if (oppsRes.status === 'fulfilled') {
      const opps: Array<{ title: string; urgencyScore: number }> = oppsRes.value.opportunities ?? [];
      newOpportunities = opps.length;
      if (opps.length > 0) {
        const top = opps.reduce((a, b) => (b.urgencyScore > a.urgencyScore ? b : a));
        topOpportunityTitle = top.title;
        topOpportunityScore = top.urgencyScore;
      }
    }

    let advisorReportAge: number | null = null;
    let advisorOutlook: string | null = null;
    if (reportRes.status === 'fulfilled' && reportRes.value.report) {
      const r = reportRes.value.report;
      advisorReportAge = Math.round((Date.now() - new Date(r.generatedAt).getTime()) / 3600000);
      advisorOutlook = r.content?.outlook7d ?? null;
    }

    setData({ unreadEvents, newOpportunities, topOpportunityTitle, topOpportunityScore, advisorReportAge, advisorOutlook });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActivity = data && (data.unreadEvents > 0 || data.newOpportunities > 0);

  return (
    <div className="liquid-glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-purple-400" />
          <span className="text-xs font-semibold text-white/80">Growth Intelligence</span>
        </div>
        {hasActivity && (
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </div>

      {!data ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Competitor Events */}
          <Link href="/dashboard/competitors" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 flex-shrink-0">
              <Crosshair size={13} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 group-hover:text-white transition-colors">
                Competitor Events
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {data.unreadEvents > 0 ? (
                <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {data.unreadEvents} new
                </span>
              ) : (
                <span className="text-[10px] text-white/30">clear</span>
              )}
              <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
          </Link>

          {/* Growth Opportunities */}
          <Link href="/dashboard/growth" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 flex-shrink-0">
              <Zap size={13} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              {data.topOpportunityTitle ? (
                <>
                  <p className="text-xs text-white/70 group-hover:text-white transition-colors truncate">
                    {data.topOpportunityTitle}
                  </p>
                  <p className="text-[10px] text-white/30">
                    urgency {((data.topOpportunityScore ?? 0) * 10).toFixed(1)}/10
                  </p>
                </>
              ) : (
                <p className="text-xs text-white/70 group-hover:text-white transition-colors">Growth Opportunities</p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {data.newOpportunities > 0 ? (
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {data.newOpportunities}
                </span>
              ) : (
                <span className="text-[10px] text-white/30">none</span>
              )}
              <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
          </Link>

          {/* Advisor Report */}
          <Link href="/dashboard/advisor" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-500/10 flex-shrink-0">
              <Brain size={13} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              {data.advisorOutlook ? (
                <>
                  <p className="text-xs text-white/70 group-hover:text-white transition-colors line-clamp-1">
                    {data.advisorOutlook}
                  </p>
                  <p className="text-[10px] text-white/30">
                    {data.advisorReportAge != null
                      ? data.advisorReportAge < 1 ? 'Just now' : `${data.advisorReportAge}h ago`
                      : 'no report yet'}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={11} className="text-yellow-400/60" />
                  <p className="text-xs text-white/50">No advisor report yet</p>
                </div>
              )}
            </div>
            <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
          </Link>
        </div>
      )}
    </div>
  );
}

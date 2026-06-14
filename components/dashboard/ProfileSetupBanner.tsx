'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, X, Sparkles } from 'lucide-react';

interface Profile {
  businessName?: string;
  businessType?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  targetAudience?: string;
  revenueGoal?: string;
  growthGoal?: string;
  products?: string[];
  services?: string[];
  marketRegions?: string[];
  priorityTopics?: string[];
  keywords?: string[];
}

function calcCompletion(p: Profile): number {
  const fields = ['businessName', 'businessType', 'industry', 'location', 'website', 'description', 'targetAudience', 'revenueGoal', 'growthGoal'] as const;
  const arrayFields = ['products', 'services', 'marketRegions', 'priorityTopics', 'keywords'] as const;
  const total = fields.length + arrayFields.length;
  const filled = fields.filter(f => (p[f] as string | undefined)?.trim()).length
    + arrayFields.filter(f => (p[f] ?? []).length > 0).length;
  return Math.round((filled / total) * 100);
}

export default function ProfileSetupBanner() {
  const [completion, setCompletion] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/business-profile')
      .then(r => r.json())
      .then(d => {
        if (d.profile) setCompletion(calcCompletion(d.profile));
        else setCompletion(0);
      })
      .catch(() => setCompletion(null));
  }, []);

  if (dismissed || completion === null || completion >= 70) return null;

  const isNew = completion < 10;

  return (
    <div className="relative liquid-glass-card rounded-2xl p-4 border border-cyan-500/15 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 pointer-events-none" />

      <div className="relative flex items-center gap-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          {isNew ? <Sparkles size={16} className="text-cyan-400" /> : <Building2 size={16} className="text-cyan-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            {isNew ? 'Set up your business profile' : 'Complete your business profile'}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {isNew
              ? 'Unlock personalized growth insights, competitor intelligence, and AI strategy reports'
              : `${completion}% complete — finish setting up to unlock fully personalized AI analysis`}
          </p>

          {!isNew && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-[10px] text-cyan-400 font-medium">{completion}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-xs font-medium transition-colors"
          >
            {isNew ? 'Get started' : 'Continue'}
            <ChevronRight size={12} />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/20 hover:text-white/50 transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save, CheckCircle, ChevronRight, X } from 'lucide-react';

interface BusinessProfile {
  id?: string;
  businessName?: string;
  businessType?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  products?: string[];
  services?: string[];
  targetAudience?: string;
  revenueGoal?: string;
  growthGoal?: string;
  marketRegions?: string[];
  priorityTopics?: string[];
  keywords?: string[];
}

type Tab = 'info' | 'products' | 'market' | 'keywords';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'products', label: 'Products & Services' },
  { id: 'market', label: 'Market & Goals' },
  { id: 'keywords', label: 'Keywords' },
];

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');

  function add() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
  }

  return (
    <div className="liquid-glass rounded-xl p-3 min-h-[60px]">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-cyan-500/20 text-cyan-300 text-xs px-2 py-1 rounded-full">
            {tag}
            <button onClick={() => onChange(value.filter(v => v !== tag))} className="hover:text-red-400">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        className="bg-transparent text-white text-sm w-full outline-none placeholder-white/30"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        placeholder={placeholder ?? 'Type and press Enter'}
      />
    </div>
  );
}

function countCompletion(p: BusinessProfile): number {
  const fields = ['businessName', 'businessType', 'industry', 'location', 'website', 'description', 'targetAudience', 'revenueGoal', 'growthGoal'] as const;
  const arrayFields = ['products', 'services', 'marketRegions', 'priorityTopics', 'keywords'] as const;
  const total = fields.length + arrayFields.length;
  const filled = fields.filter(f => p[f]?.trim()).length + arrayFields.filter(f => (p[f] ?? []).length > 0).length;
  return Math.round((filled / total) * 100);
}

export default function BusinessProfilePanel() {
  const [profile, setProfile] = useState<BusinessProfile>({});
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/business-profile')
      .then(r => r.json())
      .then(d => { if (d.profile) setProfile({ ...d.profile, products: d.profile.products ?? [], services: d.profile.services ?? [], marketRegions: d.profile.marketRegions ?? [], priorityTopics: d.profile.priorityTopics ?? [], keywords: d.profile.keywords ?? [] }); })
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await fetch('/api/business-profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [profile]);

  const completion = countCompletion(profile);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="text-cyan-400" size={22} />
          <h2 className="text-white font-semibold text-xl">Business Profile</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-white/50 mb-1">Profile completion</div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-green-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span className="text-cyan-400 text-xs font-medium">{completion}%</span>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            {saved ? <CheckCircle size={14} className="text-green-400" /> : <Save size={14} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 liquid-glass rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50 hover:text-white/70'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Business Name', key: 'businessName', placeholder: 'Acme Corp' },
            { label: 'Business Type', key: 'businessType', placeholder: 'SaaS, E-commerce, Agency…' },
            { label: 'Industry', key: 'industry', placeholder: 'Technology, Retail, Healthcare…' },
            { label: 'Location', key: 'location', placeholder: 'City, Country' },
            { label: 'Website', key: 'website', placeholder: 'https://example.com' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className={key === 'website' ? 'col-span-2' : ''}>
              <label className="text-white/50 text-xs mb-1 block">{label}</label>
              <input
                className="w-full liquid-glass rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-white/20 focus:ring-1 focus:ring-cyan-500/40"
                value={(profile[key as keyof BusinessProfile] as string) ?? ''}
                onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-white/50 text-xs mb-1 block">Description</label>
            <textarea
              className="w-full liquid-glass rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-white/20 focus:ring-1 focus:ring-cyan-500/40 resize-none h-24"
              value={profile.description ?? ''}
              onChange={e => setProfile(p => ({ ...p, description: e.target.value }))}
              placeholder="What does your business do? Who do you serve?"
            />
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-5">
          <div>
            <label className="text-white/50 text-xs mb-1 block">Products <span className="text-white/30">(press Enter to add)</span></label>
            <TagInput value={profile.products ?? []} onChange={v => setProfile(p => ({ ...p, products: v }))} placeholder="Add a product name" />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1 block">Services <span className="text-white/30">(press Enter to add)</span></label>
            <TagInput value={profile.services ?? []} onChange={v => setProfile(p => ({ ...p, services: v }))} placeholder="Add a service name" />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1 block">Target Audience</label>
            <textarea
              className="w-full liquid-glass rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-white/20 focus:ring-1 focus:ring-cyan-500/40 resize-none h-24"
              value={profile.targetAudience ?? ''}
              onChange={e => setProfile(p => ({ ...p, targetAudience: e.target.value }))}
              placeholder="Who are your ideal customers? Demographics, roles, pain points…"
            />
          </div>
        </div>
      )}

      {activeTab === 'market' && (
        <div className="space-y-5">
          {[
            { label: 'Revenue Goal', key: 'revenueGoal', placeholder: '$1M ARR, $50k/mo…' },
            { label: 'Growth Goal', key: 'growthGoal', placeholder: '10x users, expand to EU, launch B2B…' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-white/50 text-xs mb-1 block">{label}</label>
              <input
                className="w-full liquid-glass rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-white/20 focus:ring-1 focus:ring-cyan-500/40"
                value={(profile[key as keyof BusinessProfile] as string) ?? ''}
                onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label className="text-white/50 text-xs mb-1 block">Market Regions</label>
            <TagInput value={profile.marketRegions ?? []} onChange={v => setProfile(p => ({ ...p, marketRegions: v }))} placeholder="US, EU, APAC…" />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1 block">Priority Topics</label>
            <TagInput value={profile.priorityTopics ?? []} onChange={v => setProfile(p => ({ ...p, priorityTopics: v }))} placeholder="AI, SaaS pricing, developer tools…" />
          </div>
        </div>
      )}

      {activeTab === 'keywords' && (
        <div className="space-y-4">
          <p className="text-white/40 text-sm">Keywords help the AI find relevant news, trends, and opportunities for your business.</p>
          <TagInput value={profile.keywords ?? []} onChange={v => setProfile(p => ({ ...p, keywords: v }))} placeholder="Add keyword and press Enter" />
          {(profile.keywords ?? []).length === 0 && (
            <div className="liquid-glass rounded-xl p-4 text-white/30 text-sm">
              <ChevronRight size={14} className="inline mr-1" />
              Examples: &quot;machine learning&quot;, &quot;customer retention&quot;, &quot;e-commerce checkout&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { INDUSTRY_TEMPLATES, IndustryTemplate } from '@/lib/industry-templates';

interface Props {
  onClose: () => void;
  onApplied: () => void;
}

type Step = 'pick' | 'confirm' | 'done';

export default function IndustryTemplateWizard({ onClose, onApplied }: Props) {
  const [step, setStep] = useState<Step>('pick');
  const [selected, setSelected] = useState<IndustryTemplate | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [revenueGoal, setRevenueGoal] = useState('');
  const [growthGoal, setGrowthGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ watchlistAdded: number; sourcesAdded: number } | null>(null);

  function pick(template: IndustryTemplate) {
    setSelected(template);
    setStep('confirm');
  }

  async function apply() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/templates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selected.id, businessName: businessName || undefined, revenueGoal: revenueGoal || undefined, growthGoal: growthGoal || undefined }),
      });
      const data = await res.json() as { ok?: boolean; watchlistAdded?: number; sourcesAdded?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setResult({ watchlistAdded: data.watchlistAdded ?? 0, sourcesAdded: data.sourcesAdded ?? 0 });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="liquid-glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step === 'confirm' && (
              <button onClick={() => setStep('pick')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
              {step === 'pick' && 'Choose Your Industry'}
              {step === 'confirm' && `Set Up ${selected?.label}`}
              {step === 'done' && 'All Set!'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 'pick' && (
              <motion.div key="pick" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <p className="text-white/60 text-sm mb-5">Pick your industry to pre-fill your business profile, watchlist keywords, and relevant news sources.</p>
                <div className="grid grid-cols-2 gap-3">
                  {INDUSTRY_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => pick(t)}
                      className="liquid-glass rounded-xl p-4 text-left hover:ring-1 hover:ring-cyan-400/50 transition-all group"
                    >
                      <div className="text-2xl mb-2">{t.emoji}</div>
                      <div className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">{t.label}</div>
                      <div className="text-white/50 text-xs mt-0.5">{t.tagline}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'confirm' && selected && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-5 liquid-glass rounded-xl p-4">
                  <span className="text-3xl">{selected.emoji}</span>
                  <div>
                    <div className="font-semibold text-white">{selected.label}</div>
                    <div className="text-white/50 text-sm">{selected.tagline}</div>
                  </div>
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Business Name (optional)</label>
                    <input
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder={`e.g., Acme ${selected.label.split('/')[0].trim()}`}
                      className="liquid-glass rounded-xl px-4 py-2.5 w-full text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-cyan-400/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/60 mb-1 block">Revenue Goal (optional)</label>
                      <input
                        value={revenueGoal}
                        onChange={e => setRevenueGoal(e.target.value)}
                        placeholder="e.g., $1M ARR"
                        className="liquid-glass rounded-xl px-4 py-2.5 w-full text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-cyan-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/60 mb-1 block">Growth Goal (optional)</label>
                      <input
                        value={growthGoal}
                        onChange={e => setGrowthGoal(e.target.value)}
                        placeholder="e.g., 10% MoM growth"
                        className="liquid-glass rounded-xl px-4 py-2.5 w-full text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-cyan-400/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="liquid-glass rounded-xl p-4 space-y-2 text-sm text-white/70 mb-5">
                  <p className="font-medium text-white/90 text-xs uppercase tracking-wide mb-3">What will be set up</p>
                  <div className="flex gap-2"><span className="text-cyan-400">✓</span> Business profile pre-filled with {selected.profile.industry} defaults</div>
                  <div className="flex gap-2"><span className="text-cyan-400">✓</span> {selected.watchlist.length} watchlist keywords added</div>
                  <div className="flex gap-2"><span className="text-cyan-400">✓</span> {selected.sourceCategories.join(', ')} news categories activated</div>
                  <div className="flex gap-2"><span className="text-cyan-400">✓</span> {selected.extraSources.length} industry-specific news sources added</div>
                </div>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <button
                  onClick={apply}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 to-green-400 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Setting up…</> : `Apply ${selected.label} Template`}
                </button>
              </motion.div>
            )}

            {step === 'done' && result && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <CheckCircle size={48} className="text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Template Applied!</h3>
                <p className="text-white/60 text-sm mb-6">Your profile is configured and ready to generate intelligence.</p>
                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  <div className="liquid-glass rounded-xl p-3">
                    <div className="text-2xl font-bold text-cyan-400">{result.watchlistAdded}</div>
                    <div className="text-white/60 text-xs mt-1">Watchlist keywords added</div>
                  </div>
                  <div className="liquid-glass rounded-xl p-3">
                    <div className="text-2xl font-bold text-green-400">{result.sourcesAdded}</div>
                    <div className="text-white/60 text-xs mt-1">News sources activated</div>
                  </div>
                </div>
                <button
                  onClick={() => { onApplied(); onClose(); }}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 to-green-400 hover:opacity-90 transition-opacity"
                >
                  Go to Business Profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

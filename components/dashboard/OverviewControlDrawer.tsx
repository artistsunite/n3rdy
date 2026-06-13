'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RefreshCw, Mail, ChevronDown, Check } from 'lucide-react';

export interface DashboardFilters {
  category: string;
  timeWindow: string;
  minImpact: number;
  riskLevel: string;
  widgetVisibility: Record<string, boolean>;
  autoRefreshInterval: number;
}

interface Prefs {
  scanFrequency: number;
  autoRefreshInterval: number;
  minImpactFilter: number;
  riskLevelFilter: string;
  widgetVisibility: Record<string, boolean>;
  emailBriefingEnabled: boolean;
  emailBriefingFrequency: string;
  briefingStyle: string;
  alertThresholds: Record<string, unknown>;
  lastScanAt?: string | null;
  enabledCategories?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onFiltersChange: (f: DashboardFilters) => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-[#00E5FF]' : 'bg-white/20'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-3 text-left">
      <span className="text-[10px] font-bold tracking-[2px] uppercase text-white/50">{label}</span>
      <ChevronDown size={14} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

const CATEGORIES = ['markets', 'crypto', 'technology', 'macro', 'geopolitics'];
const WIDGETS = [
  { key: 'watchlist', label: 'Watchlist Activity' },
  { key: 'marketing', label: 'Marketing Calendar' },
  { key: 'trending', label: 'Trending Post' },
  { key: 'profile', label: 'User Profile' },
  { key: 'sentiment', label: 'Sentiment Pulse' },
  { key: 'stories', label: 'Top Stories' },
];

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function OverviewControlDrawer({ open, onClose, onFiltersChange }: Props) {
  const [prefs, setPrefs] = useState<Prefs>({
    scanFrequency: 6,
    autoRefreshInterval: 0,
    minImpactFilter: 0,
    riskLevelFilter: 'all',
    widgetVisibility: {},
    emailBriefingEnabled: false,
    emailBriefingFrequency: 'manual',
    briefingStyle: 'executive',
    alertThresholds: {},
    lastScanAt: null,
    enabledCategories: CATEGORIES,
  });

  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [sections, setSections] = useState({ scan: true, filters: true, alerts: false, email: false, widgets: false });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/settings/preferences')
      .then(r => r.json())
      .then(data => {
        const p = data.preferences;
        if (!p) return;
        setPrefs(prev => ({
          ...prev,
          scanFrequency: p.scanFrequency ?? 6,
          autoRefreshInterval: p.autoRefreshInterval ?? 0,
          minImpactFilter: p.minImpactFilter ?? 0,
          riskLevelFilter: p.riskLevelFilter ?? 'all',
          widgetVisibility: (p.widgetVisibility as Record<string, boolean>) ?? {},
          emailBriefingEnabled: p.emailBriefingEnabled ?? false,
          emailBriefingFrequency: p.emailBriefingFrequency ?? 'manual',
          briefingStyle: p.briefingStyle ?? 'executive',
          alertThresholds: (p.alertThresholds as Record<string, unknown>) ?? {},
          lastScanAt: p.lastScanAt ?? null,
          enabledCategories: p.enabledCategories ?? CATEGORIES,
        }));
      })
      .catch(() => {});
  }, [open]);

  const persistPrefs = useCallback((updated: Partial<Prefs>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }, 600);
  }, []);

  const updatePref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      persistPrefs({ [key]: value });

      // propagate filter changes immediately
      if (['enabledCategories', 'minImpactFilter', 'riskLevelFilter', 'widgetVisibility', 'autoRefreshInterval'].includes(key)) {
        onFiltersChange({
          category: (next.enabledCategories ?? CATEGORIES).join(','),
          timeWindow: '24h',
          minImpact: next.minImpactFilter,
          riskLevel: next.riskLevelFilter,
          widgetVisibility: next.widgetVisibility,
          autoRefreshInterval: next.autoRefreshInterval,
        });
      }

      return next;
    });
  }, [persistPrefs, onFiltersChange]);

  const [timeWindow, setTimeWindow] = useState('24h');

  const handleTimeWindow = (tw: string) => {
    setTimeWindow(tw);
    onFiltersChange({
      category: (prefs.enabledCategories ?? CATEGORIES).join(','),
      timeWindow: tw,
      minImpact: prefs.minImpactFilter,
      riskLevel: prefs.riskLevelFilter,
      widgetVisibility: prefs.widgetVisibility,
      autoRefreshInterval: prefs.autoRefreshInterval,
    });
  };

  const handleScan = async () => {
    setScanning(true);
    setScanStatus(null);
    try {
      const r = await fetch('/api/ingest/run', { method: 'POST' });
      const d = await r.json();
      const now = new Date().toISOString();
      setPrefs(p => ({ ...p, lastScanAt: now }));
      setScanStatus(`✓ ${d.articlesIngested ?? 0} new · ${d.articlesAnalyzed ?? 0} analyzed`);
    } catch {
      setScanStatus('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleEmail = async () => {
    setEmailStatus('Sending…');
    try {
      const r = await fetch('/api/briefings/email', { method: 'POST' });
      const d = await r.json();
      if (d.ok) setEmailStatus(`✓ Sent to ${d.sentTo}`);
      else setEmailStatus(`✗ ${d.error}`);
    } catch {
      setEmailStatus('Send failed');
    }
    setTimeout(() => setEmailStatus(null), 5000);
  };

  const toggleSection = (key: keyof typeof sections) =>
    setSections(p => ({ ...p, [key]: !p[key] }));

  const toggleCategory = (cat: string) => {
    const cats = prefs.enabledCategories ?? CATEGORIES;
    const next = cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat];
    updatePref('enabledCategories', next.length > 0 ? next : [cat]);
  };

  const toggleWidget = (key: string) => {
    const vis = { ...prefs.widgetVisibility };
    vis[key] = !(vis[key] !== false);
    updatePref('widgetVisibility', vis);
  };

  const alertThresholds = prefs.alertThresholds as Record<string, unknown>;

  const setAlert = (key: string, value: unknown) => {
    const next = { ...alertThresholds, [key]: value };
    updatePref('alertThresholds', next);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-80 z-50 flex flex-col"
            style={{
              background: 'rgba(10,10,26,0.97)',
              borderLeft: '1px solid rgba(0,229,255,0.12)',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="text-white font-semibold text-sm">Dashboard Controls</p>
                <p className="text-white/40 text-xs mt-0.5">Settings auto-save</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} className="text-white/60" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">

              {/* SCAN & DATA */}
              <div className="border-b border-white/8">
                <SectionHeader label="Scan & Data" open={sections.scan} onToggle={() => toggleSection('scan')} />
                {sections.scan && (
                  <div className="pb-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleScan}
                        disabled={scanning}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-sm font-medium hover:bg-[#00E5FF]/20 transition-colors disabled:opacity-50"
                      >
                        {scanning
                          ? <RefreshCw size={14} className="animate-spin" />
                          : <Play size={14} />}
                        {scanning ? 'Scanning…' : 'Start Scan'}
                      </button>
                      <span className="text-white/40 text-xs">
                        {scanStatus ?? timeAgo(prefs.lastScanAt)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-xs">Scan frequency</span>
                        <span className="text-[#00E5FF] text-xs font-medium">{prefs.scanFrequency}h</span>
                      </div>
                      <input
                        type="range" min={1} max={24} step={1}
                        value={prefs.scanFrequency}
                        onChange={e => updatePref('scanFrequency', parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-[#00E5FF]"
                      />
                      <div className="flex justify-between text-white/20 text-[10px] mt-1">
                        <span>1h</span><span>12h</span><span>24h</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-white/60 text-xs block mb-2">Auto-refresh dashboard</span>
                      <div className="flex gap-2">
                        {[{ v: 0, l: 'Off' }, { v: 5, l: '5m' }, { v: 15, l: '15m' }, { v: 30, l: '30m' }].map(opt => (
                          <button
                            key={opt.v}
                            onClick={() => updatePref('autoRefreshInterval', opt.v)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${prefs.autoRefreshInterval === opt.v ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                          >{opt.l}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CONTENT FILTERS */}
              <div className="border-b border-white/8">
                <SectionHeader label="Content Filters" open={sections.filters} onToggle={() => toggleSection('filters')} />
                {sections.filters && (
                  <div className="pb-4 space-y-4">
                    <div>
                      <span className="text-white/60 text-xs block mb-2">Categories</span>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map(cat => {
                          const active = (prefs.enabledCategories ?? CATEGORIES).includes(cat);
                          return (
                            <button
                              key={cat}
                              onClick={() => toggleCategory(cat)}
                              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${active ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
                            >
                              {active && <Check size={10} className="inline mr-1" />}
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-white/60 text-xs block mb-2">Time window</span>
                      <div className="flex gap-2">
                        {['24h', '7d', '30d'].map(tw => (
                          <button
                            key={tw}
                            onClick={() => handleTimeWindow(tw)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${timeWindow === tw ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                          >{tw}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-xs">Min. impact score</span>
                        <span className="text-[#00E5FF] text-xs font-medium">{prefs.minImpactFilter}/10</span>
                      </div>
                      <input
                        type="range" min={0} max={10} step={1}
                        value={prefs.minImpactFilter}
                        onChange={e => updatePref('minImpactFilter', parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-[#00E5FF]"
                      />
                    </div>

                    <div>
                      <span className="text-white/60 text-xs block mb-2">Risk level filter</span>
                      <div className="flex gap-2 flex-wrap">
                        {['all', 'medium', 'high', 'critical'].map(r => (
                          <button
                            key={r}
                            onClick={() => { updatePref('riskLevelFilter', r); onFiltersChange({ category: (prefs.enabledCategories ?? CATEGORIES).join(','), timeWindow, minImpact: prefs.minImpactFilter, riskLevel: r, widgetVisibility: prefs.widgetVisibility, autoRefreshInterval: prefs.autoRefreshInterval }); }}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${prefs.riskLevelFilter === r ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
                          >{r}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ALERTS */}
              <div className="border-b border-white/8">
                <SectionHeader label="Alerts" open={sections.alerts} onToggle={() => toggleSection('alerts')} />
                {sections.alerts && (
                  <div className="pb-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/60 text-xs">Sentiment drop alert</span>
                        <Toggle
                          checked={!!alertThresholds.sentimentAlert}
                          onChange={v => setAlert('sentimentAlert', v)}
                        />
                      </div>
                      {alertThresholds.sentimentAlert && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/40 text-xs">Threshold</span>
                            <span className="text-[#FF4D6D] text-xs font-medium">{alertThresholds.sentimentThreshold ?? -0.3}</span>
                          </div>
                          <input
                            type="range" min={-1} max={0} step={0.05}
                            value={(alertThresholds.sentimentThreshold as number) ?? -0.3}
                            onChange={e => setAlert('sentimentThreshold', parseFloat(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-[#FF4D6D]"
                          />
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">HIGH risk article alert</span>
                      <Toggle
                        checked={!!alertThresholds.highRiskAlert}
                        onChange={v => setAlert('highRiskAlert', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">Watchlist mention alert</span>
                      <Toggle
                        checked={!!alertThresholds.watchlistAlert}
                        onChange={v => setAlert('watchlistAlert', v)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* REPORTS & EMAIL */}
              <div className="border-b border-white/8">
                <SectionHeader label="Reports & Email" open={sections.email} onToggle={() => toggleSection('email')} />
                {sections.email && (
                  <div className="pb-4 space-y-4">
                    <button
                      onClick={handleEmail}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm hover:bg-white/10 transition-colors"
                    >
                      <Mail size={14} />
                      {emailStatus ?? 'Email me my briefing now'}
                    </button>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">Scheduled email</span>
                      <Toggle
                        checked={prefs.emailBriefingEnabled}
                        onChange={v => updatePref('emailBriefingEnabled', v)}
                      />
                    </div>

                    {prefs.emailBriefingEnabled && (
                      <div>
                        <span className="text-white/60 text-xs block mb-2">Frequency</span>
                        <div className="flex gap-2">
                          {['daily', 'weekly'].map(f => (
                            <button
                              key={f}
                              onClick={() => updatePref('emailBriefingFrequency', f)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${prefs.emailBriefingFrequency === f ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                            >{f}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-white/60 text-xs block mb-2">Briefing style</span>
                      <div className="flex gap-2">
                        {['executive', 'detailed', 'casual'].map(s => (
                          <button
                            key={s}
                            onClick={() => updatePref('briefingStyle', s)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${prefs.briefingStyle === s ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* WIDGETS */}
              <div>
                <SectionHeader label="Widgets" open={sections.widgets} onToggle={() => toggleSection('widgets')} />
                {sections.widgets && (
                  <div className="pb-4 space-y-3">
                    {WIDGETS.map(w => (
                      <div key={w.key} className="flex items-center justify-between">
                        <span className="text-white/60 text-xs">{w.label}</span>
                        <Toggle
                          checked={prefs.widgetVisibility[w.key] !== false}
                          onChange={() => toggleWidget(w.key)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

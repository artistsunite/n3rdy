'use client';
import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, LayoutDashboard, Zap, Clock, Bell, Sliders, Radio,
  LogOut, ChevronRight, RefreshCw, CheckCircle2, XCircle, Loader2,
  TrendingUp, Database, Settings, User, AlertTriangle, Play
} from 'lucide-react';
import Image from 'next/image';

interface DashboardUser {
  name: string;
  email: string;
  image: string | null;
}

type BotStatus = 'checking' | 'online' | 'offline';
type ActionStatus = { type: 'success' | 'error' | 'loading'; message: string } | null;
type View = 'overview' | 'schedule' | 'alerts' | 'weights' | 'sources';

const BOT_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:8000';

const NAV_ITEMS: { id: View; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'alerts', label: 'Alert Settings', icon: Bell },
  { id: 'weights', label: 'Topic Weights', icon: Sliders },
  { id: 'sources', label: 'Sources', icon: Radio },
];

const MOCK_SOURCES = [
  { name: 'Reuters', category: 'News', trust: 94, status: true },
  { name: 'Bloomberg', category: 'Finance', trust: 97, status: true },
  { name: 'Wall Street Journal', category: 'Finance', trust: 92, status: true },
  { name: 'Financial Times', category: 'Finance', trust: 91, status: true },
  { name: 'CNBC Markets', category: 'Finance', trust: 84, status: true },
  { name: 'CoinDesk', category: 'Crypto', trust: 82, status: true },
  { name: 'CoinTelegraph', category: 'Crypto', trust: 78, status: true },
  { name: 'MarketWatch', category: 'Finance', trust: 80, status: true },
  { name: 'Seeking Alpha', category: 'Finance', trust: 72, status: false },
  { name: 'Zero Hedge', category: 'Macro', trust: 61, status: false },
  { name: 'EIA Reports', category: 'Energy', trust: 96, status: true },
  { name: 'Federal Reserve', category: 'Macro', trust: 99, status: true },
  { name: 'BLS Data', category: 'Macro', trust: 98, status: true },
  { name: 'Politico', category: 'Geopolitical', trust: 75, status: true },
  { name: 'ABC News Australia', category: 'Australia', trust: 88, status: true },
];

function TrustBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#00FF88' : score >= 75 ? '#FFC857' : '#FF4D6D';
  return (
    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ color, background: `${color}18` }}>
      {score}
    </span>
  );
}

function SliderControl({
  label, value, onChange, min = 0, max = 100, suffix = '%'
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-n3-muted font-medium">{label}</span>
        <span className="text-sm font-mono font-bold text-n3-primary">{value}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-n3-border rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#00E5FF' }}
      />
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-n3-border bg-n3-card p-6 shadow-card ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-n3-text">{title}</h2>
      {subtitle && <p className="text-sm text-n3-muted mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const [activeView, setActiveView] = useState<View>('overview');
  const [botStatus, setBotStatus] = useState<BotStatus>('checking');
  const [actionStatus, setActionStatus] = useState<ActionStatus>(null);
  const [generating, setGenerating] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Schedule state
  const [briefInterval, setBriefInterval] = useState(60);
  const [collectInterval, setCollectInterval] = useState(15);

  // Alert state
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [relevanceThreshold, setRelevanceThreshold] = useState(70);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  // Topic weights
  const [weights, setWeights] = useState({
    crypto: 80, stocks: 75, energy: 70, gold: 65,
    fx: 60, bonds: 55, macro: 85, geopolitical: 70,
  });

  // Source toggles
  const [sources, setSources] = useState(MOCK_SOURCES);

  const checkBotStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BOT_URL}/health`, { signal: AbortSignal.timeout(5000) });
      setBotStatus(res.ok ? 'online' : 'offline');
    } catch {
      setBotStatus('offline');
    }
    setLastCheck(new Date());
  }, []);

  useEffect(() => {
    checkBotStatus();
    const interval = setInterval(checkBotStatus, 30000);
    return () => clearInterval(interval);
  }, [checkBotStatus]);

  const callBotApi = async (endpoint: string, method = 'POST') => {
    const res = await fetch(`${BOT_URL}${endpoint}`, { method, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const handleBrief = async (post: boolean) => {
    setGenerating(true);
    setActionStatus({ type: 'loading', message: post ? 'Generating and posting brief to Telegram...' : 'Generating brief (draft only)...' });
    try {
      await callBotApi(`/brief-now?post=${post}`);
      setActionStatus({ type: 'success', message: post ? 'Brief generated and posted to Telegram.' : 'Brief drafted successfully (not posted).' });
    } catch {
      setActionStatus({ type: 'error', message: 'Could not reach bot API. Is the bot running?' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCollect = async () => {
    setCollecting(true);
    setActionStatus({ type: 'loading', message: 'Triggering news collection...' });
    try {
      await callBotApi('/collect-now');
      setActionStatus({ type: 'success', message: 'Collection cycle triggered successfully.' });
    } catch {
      setActionStatus({ type: 'error', message: 'Could not reach bot API. Is the bot running?' });
    } finally {
      setCollecting(false);
    }
  };

  const toggleSource = (idx: number) => {
    setSources(prev => prev.map((s, i) => i === idx ? { ...s, status: !s.status } : s));
  };

  const INTERVAL_OPTIONS = [
    { label: '30m', value: 30 }, { label: '1h', value: 60 },
    { label: '2h', value: 120 }, { label: '4h', value: 240 },
    { label: '6h', value: 360 }, { label: '12h', value: 720 },
    { label: '24h', value: 1440 },
  ];

  const COLLECT_OPTIONS = [
    { label: '5m', value: 5 }, { label: '15m', value: 15 },
    { label: '30m', value: 30 }, { label: '1h', value: 60 },
  ];

  const statusDot = botStatus === 'online' ? '#00FF88' : botStatus === 'offline' ? '#FF4D6D' : '#FFC857';
  const statusLabel = botStatus === 'online' ? 'ONLINE' : botStatus === 'offline' ? 'OFFLINE' : 'CHECKING';

  return (
    <div className="min-h-screen bg-n3-bg flex" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        w-60 border-r border-n3-border
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ background: '#07111F' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-n3-border">
          <div className="w-7 h-7 rounded border border-n3-primary/40 flex items-center justify-center">
            <Activity size={14} className="text-n3-primary" />
          </div>
          <span className="font-mono font-semibold text-n3-text tracking-wider text-sm">N3RDY</span>
          <span className="text-[10px] font-mono text-n3-muted tracking-widest uppercase border border-n3-border px-1.5 py-0.5 rounded">Ops</span>
        </div>

        {/* Bot status indicator */}
        <div className="mx-4 my-4 px-3 py-2.5 rounded-xl border border-n3-border flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: statusDot }} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono font-bold tracking-widest" style={{ color: statusDot }}>{statusLabel}</div>
            <div className="text-[10px] text-n3-muted truncate">
              {lastCheck ? `Last check ${lastCheck.toLocaleTimeString()}` : 'Checking...'}
            </div>
          </div>
          <button onClick={checkBotStatus} className="text-n3-muted hover:text-n3-primary transition-colors">
            <RefreshCw size={12} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-n3-primary/10 text-n3-primary border border-n3-primary/20'
                    : 'text-n3-muted hover:text-n3-text hover:bg-n3-border/30'
                }`}
              >
                <Icon size={16} />
                {item.label}
                {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-n3-border">
          <div className="flex items-center gap-2.5 mb-3">
            {user.image ? (
              <Image src={user.image} alt={user.name} width={32} height={32} className="rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-n3-primary/20 border border-n3-primary/30 flex items-center justify-center">
                <User size={14} className="text-n3-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-n3-text truncate">{user.name}</div>
              <div className="text-[11px] text-n3-muted truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-n3-muted hover:text-n3-danger hover:bg-n3-danger/10 transition-all duration-150 font-medium"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-n3-bg/70 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-4 px-6 h-14 border-b border-n3-border bg-n3-bg/90 backdrop-blur-xl">
          <button className="md:hidden text-n3-muted hover:text-n3-text" onClick={() => setSidebarOpen(true)}>
            <Settings size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-n3-text">
              {NAV_ITEMS.find(n => n.id === activeView)?.label ?? 'Dashboard'}
            </h1>
          </div>
          <a href="/" className="text-xs text-n3-muted hover:text-n3-primary transition-colors font-mono">← Back to site</a>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >

              {/* ── OVERVIEW ── */}
              {activeView === 'overview' && (
                <div className="space-y-6">
                  {/* Status cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-semibold text-n3-muted uppercase tracking-widest">Bot Status</span>
                        <Activity size={14} className="text-n3-muted" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: statusDot }} />
                        <span className="text-xl font-black font-mono" style={{ color: statusDot }}>{statusLabel}</span>
                      </div>
                      <p className="text-xs text-n3-muted mt-2">{BOT_URL}</p>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-semibold text-n3-muted uppercase tracking-widest">Sources Active</span>
                        <Database size={14} className="text-n3-muted" />
                      </div>
                      <div className="text-2xl font-black font-mono text-n3-text">
                        {sources.filter(s => s.status).length}
                        <span className="text-sm text-n3-muted font-normal">/{sources.length}</span>
                      </div>
                      <p className="text-xs text-n3-muted mt-2">Monitored sources</p>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-semibold text-n3-muted uppercase tracking-widest">Brief Interval</span>
                        <Clock size={14} className="text-n3-muted" />
                      </div>
                      <div className="text-2xl font-black font-mono text-n3-primary">
                        {briefInterval < 60 ? `${briefInterval}m` : `${briefInterval / 60}h`}
                      </div>
                      <p className="text-xs text-n3-muted mt-2">Collect every {collectInterval}m</p>
                    </Card>
                  </div>

                  {/* Action status */}
                  <AnimatePresence>
                    {actionStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                          actionStatus.type === 'success' ? 'border-n3-success/30 bg-n3-success/10 text-n3-success' :
                          actionStatus.type === 'error' ? 'border-n3-danger/30 bg-n3-danger/10 text-n3-danger' :
                          'border-n3-primary/30 bg-n3-primary/10 text-n3-primary'
                        }`}
                      >
                        {actionStatus.type === 'success' && <CheckCircle2 size={16} />}
                        {actionStatus.type === 'error' && <XCircle size={16} />}
                        {actionStatus.type === 'loading' && <Loader2 size={16} className="animate-spin" />}
                        {actionStatus.message}
                        {actionStatus.type !== 'loading' && (
                          <button onClick={() => setActionStatus(null)} className="ml-auto opacity-60 hover:opacity-100">×</button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate Brief */}
                  <Card>
                    <SectionHeader
                      title="Generate Intelligence Brief"
                      subtitle="Trigger the AI analysis pipeline immediately. Briefings use Claude Fable 5 with adaptive thinking."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => handleBrief(true)}
                        disabled={generating || collecting || botStatus === 'offline'}
                        className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-n3-primary text-n3-bg font-bold rounded-xl hover:bg-n3-primary/90 transition-all shadow-glow-sm disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                      >
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        Generate &amp; Post
                      </button>

                      <button
                        onClick={() => handleBrief(false)}
                        disabled={generating || collecting || botStatus === 'offline'}
                        className="flex items-center justify-center gap-2.5 px-4 py-3.5 border border-n3-border hover:border-n3-primary/40 bg-n3-bg text-n3-text font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                      >
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        Draft Only
                      </button>

                      <button
                        onClick={handleCollect}
                        disabled={generating || collecting || botStatus === 'offline'}
                        className="flex items-center justify-center gap-2.5 px-4 py-3.5 border border-n3-border hover:border-n3-success/40 bg-n3-bg text-n3-text font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                      >
                        {collecting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        Collect Now
                      </button>
                    </div>

                    {botStatus === 'offline' && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-n3-warning font-medium">
                        <AlertTriangle size={13} />
                        Bot is offline. Start the bot at {BOT_URL} to enable controls.
                      </div>
                    )}
                  </Card>

                  {/* Quick settings summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                      <div className="flex items-center gap-2 mb-4">
                        <Bell size={14} className="text-n3-primary" />
                        <span className="text-sm font-semibold text-n3-text">Alert Thresholds</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-n3-muted">Confidence</span><span className="font-mono text-n3-primary">{confidenceThreshold}%</span></div>
                        <div className="flex justify-between"><span className="text-n3-muted">Relevance</span><span className="font-mono text-n3-primary">{relevanceThreshold}%</span></div>
                        <div className="flex justify-between"><span className="text-n3-muted">Emergency Alerts</span><span className={`font-mono font-bold ${emergencyAlerts ? 'text-n3-success' : 'text-n3-muted'}`}>{emergencyAlerts ? 'ON' : 'OFF'}</span></div>
                      </div>
                      <button onClick={() => setActiveView('alerts')} className="mt-4 text-xs text-n3-primary hover:underline font-medium">Configure →</button>
                    </Card>

                    <Card>
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={14} className="text-n3-primary" />
                        <span className="text-sm font-semibold text-n3-text">Top Topic Weights</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-n3-muted capitalize">{k}</span>
                            <span className="font-mono text-n3-primary">{v}%</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setActiveView('weights')} className="mt-4 text-xs text-n3-primary hover:underline font-medium">Configure →</button>
                    </Card>
                  </div>
                </div>
              )}

              {/* ── SCHEDULE ── */}
              {activeView === 'schedule' && (
                <div className="space-y-6 max-w-2xl">
                  <Card>
                    <SectionHeader
                      title="Brief Schedule"
                      subtitle="How often N3RDY generates and posts an intelligence brief to Telegram."
                    />
                    <div className="mb-2 text-xs font-mono text-n3-muted uppercase tracking-widest">Brief Interval</div>
                    <div className="flex flex-wrap gap-2">
                      {INTERVAL_OPTIONS.map(o => (
                        <button
                          key={o.value}
                          onClick={() => setBriefInterval(o.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-mono font-semibold border transition-all ${
                            briefInterval === o.value
                              ? 'border-n3-primary bg-n3-primary/10 text-n3-primary'
                              : 'border-n3-border bg-n3-bg text-n3-muted hover:border-n3-primary/40'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-n3-muted">
                      N3RDY will generate a briefing every {briefInterval < 60 ? `${briefInterval} minutes` : `${briefInterval / 60} hour${briefInterval > 60 ? 's' : ''}`}.
                    </p>
                  </Card>

                  <Card>
                    <SectionHeader
                      title="Collection Interval"
                      subtitle="How often N3RDY scans sources for new market events and news."
                    />
                    <div className="mb-2 text-xs font-mono text-n3-muted uppercase tracking-widest">Collection Frequency</div>
                    <div className="flex flex-wrap gap-2">
                      {COLLECT_OPTIONS.map(o => (
                        <button
                          key={o.value}
                          onClick={() => setCollectInterval(o.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-mono font-semibold border transition-all ${
                            collectInterval === o.value
                              ? 'border-n3-success bg-n3-success/10 text-n3-success'
                              : 'border-n3-border bg-n3-bg text-n3-muted hover:border-n3-success/30'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-n3-muted">
                      Sources are scanned every {collectInterval} {collectInterval === 1 ? 'minute' : 'minutes'} for breaking events.
                    </p>
                  </Card>

                  <div className="p-4 rounded-xl border border-n3-warning/25 bg-n3-warning/5 flex gap-3">
                    <AlertTriangle size={14} className="text-n3-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-n3-warning leading-relaxed">
                      Schedule changes here are stored locally and require bot API support to take effect.
                      Use Telegram commands <code className="bg-n3-warning/10 px-1 rounded">/set_brief_interval</code> and <code className="bg-n3-warning/10 px-1 rounded">/set_collect_interval</code> to apply immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* ── ALERTS ── */}
              {activeView === 'alerts' && (
                <div className="space-y-6 max-w-2xl">
                  <Card>
                    <SectionHeader
                      title="Intelligence Thresholds"
                      subtitle="Minimum confidence and relevance scores required for events to be included in briefings."
                    />
                    <div className="space-y-6">
                      <SliderControl label="Confidence Threshold" value={confidenceThreshold} onChange={setConfidenceThreshold} />
                      <SliderControl label="Market Relevance Threshold" value={relevanceThreshold} onChange={setRelevanceThreshold} />
                    </div>
                    <div className="mt-6 pt-4 border-t border-n3-border text-xs text-n3-muted">
                      Events below these thresholds are filtered from briefings but retained in the database.
                    </div>
                  </Card>

                  <Card>
                    <SectionHeader title="Emergency Alerts" subtitle="Bypass the schedule and push an immediate briefing on critical market events." />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-n3-text">Breaking Event Alerts</div>
                        <div className="text-xs text-n3-muted mt-0.5">Triggers on black swan events, circuit breakers, and emergency news</div>
                      </div>
                      <button
                        onClick={() => setEmergencyAlerts(!emergencyAlerts)}
                        className={`relative w-12 h-6 rounded-full border transition-all duration-300 ${
                          emergencyAlerts ? 'bg-n3-success/20 border-n3-success/40' : 'bg-n3-border/50 border-n3-border'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${
                          emergencyAlerts ? 'left-6 bg-n3-success' : 'left-0.5 bg-n3-muted'
                        }`} />
                      </button>
                    </div>
                  </Card>
                </div>
              )}

              {/* ── TOPIC WEIGHTS ── */}
              {activeView === 'weights' && (
                <div className="space-y-6 max-w-2xl">
                  <Card>
                    <SectionHeader
                      title="Topic Priority Weights"
                      subtitle="Controls how much weight each market category gets in briefing generation and source scoring."
                    />
                    <div className="space-y-5">
                      {(Object.keys(weights) as (keyof typeof weights)[]).map(key => (
                        <SliderControl
                          key={key}
                          label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          value={weights[key]}
                          onChange={(v) => setWeights(prev => ({ ...prev, [key]: v }))}
                        />
                      ))}
                    </div>
                  </Card>

                  <div className="p-4 rounded-xl border border-n3-warning/25 bg-n3-warning/5 flex gap-3">
                    <AlertTriangle size={14} className="text-n3-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-n3-warning leading-relaxed">
                      Topic weight changes are stored locally and require bot API support to take effect.
                      Use Telegram command <code className="bg-n3-warning/10 px-1 rounded">/set_topic_weight</code> to apply changes.
                    </p>
                  </div>
                </div>
              )}

              {/* ── SOURCES ── */}
              {activeView === 'sources' && (
                <div className="space-y-6">
                  <Card>
                    <SectionHeader
                      title="Monitored Sources"
                      subtitle={`${sources.filter(s => s.status).length} of ${sources.length} sources active — trust scores reflect historical accuracy.`}
                    />
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full min-w-[480px]">
                        <thead>
                          <tr className="text-left">
                            <th className="pb-3 px-2 text-[11px] font-mono font-semibold text-n3-muted uppercase tracking-widest">Source</th>
                            <th className="pb-3 px-2 text-[11px] font-mono font-semibold text-n3-muted uppercase tracking-widest">Category</th>
                            <th className="pb-3 px-2 text-[11px] font-mono font-semibold text-n3-muted uppercase tracking-widest text-center">Trust</th>
                            <th className="pb-3 px-2 text-[11px] font-mono font-semibold text-n3-muted uppercase tracking-widest text-right">Active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-n3-border">
                          {sources.map((source, idx) => (
                            <tr key={source.name} className="hover:bg-n3-bg/50 transition-colors">
                              <td className="py-2.5 px-2 text-sm font-medium text-n3-text">{source.name}</td>
                              <td className="py-2.5 px-2">
                                <span className="text-xs px-2 py-0.5 rounded-full border border-n3-border text-n3-muted font-mono">
                                  {source.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center"><TrustBadge score={source.trust} /></td>
                              <td className="py-2.5 px-2 text-right">
                                <button
                                  onClick={() => toggleSource(idx)}
                                  className={`relative w-10 h-5 rounded-full border transition-all duration-300 ${
                                    source.status ? 'bg-n3-success/20 border-n3-success/40' : 'bg-n3-border/50 border-n3-border'
                                  }`}
                                >
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
                                    source.status ? 'left-5 bg-n3-success' : 'left-0.5 bg-n3-muted'
                                  }`} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

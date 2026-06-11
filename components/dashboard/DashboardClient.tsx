'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import {
  Activity, Bell, BarChart2, Rss, Power, Send,
  ChevronRight, CheckCircle2, AlertCircle, Loader2, LogOut, Save,
} from 'lucide-react';

interface BotConfig {
  isActive: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  intervalMinutes: number;
  topicWeights: { crypto: number; equities: number; macro: number; geopolitics: number; commodities: number };
  enabledSources: string[];
  lastBriefingAt: string | null;
  nextBriefingAt: string | null;
}

interface BotStatus {
  botOnline: boolean;
  isActive: boolean;
  configured: boolean;
  lastBriefingAt: string | null;
  nextBriefingAt: string | null;
  intervalMinutes: number;
}

const DEFAULT_CONFIG: BotConfig = {
  isActive: false,
  telegramBotToken: '',
  telegramChatId: '',
  intervalMinutes: 60,
  topicWeights: { crypto: 1.0, equities: 1.0, macro: 1.0, geopolitics: 1.0, commodities: 1.0 },
  enabledSources: ['rss', 'newsapi', 'reddit'],
  lastBriefingAt: null,
  nextBriefingAt: null,
};

const INTERVAL_OPTIONS = [
  { label: 'Every 15 min', value: 15 },
  { label: 'Every 30 min', value: 30 },
  { label: 'Every hour', value: 60 },
  { label: 'Every 3 hours', value: 180 },
  { label: 'Every 6 hours', value: 360 },
  { label: 'Daily', value: 1440 },
];

const SOURCE_OPTIONS = [
  { id: 'rss', label: 'RSS Feeds' },
  { id: 'newsapi', label: 'News API' },
  { id: 'reddit', label: 'Reddit' },
];

const WEIGHT_LABELS: Record<string, string> = {
  crypto: 'Crypto',
  equities: 'Equities',
  macro: 'Macro',
  geopolitics: 'Geopolitics',
  commodities: 'Commodities',
};

const VIEWS = ['Overview', 'Telegram', 'Schedule', 'Topics', 'Sources'] as const;
type View = typeof VIEWS[number];

const VIEW_ICONS: Record<View, React.ReactNode> = {
  Overview: <BarChart2 size={15} />,
  Telegram: <Send size={15} />,
  Schedule: <Bell size={15} />,
  Topics: <Activity size={15} />,
  Sources: <Rss size={15} />,
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function DashboardClient() {
  const { data: session } = useSession();
  const [view, setView] = useState<View>('Overview');
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [cfgRes, statusRes] = await Promise.all([
        fetch('/api/bot/config'),
        fetch('/api/bot/status'),
      ]);
      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (statusRes.ok) setStatus(await statusRes.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const save = async (patch: Partial<BotConfig>) => {
    setSaving(true);
    const next = { ...config, ...patch };
    setConfig(next);
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (res.ok) showToast('Saved');
      else showToast('Save failed', false);
    } catch { showToast('Save failed', false); }
    finally { setSaving(false); }
  };

  const triggerBriefing = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/bot/trigger', { method: 'POST' });
      if (res.ok) { showToast('Briefing sent to Telegram!'); await loadData(); }
      else { const d = await res.json(); showToast(d.error || 'Failed', false); }
    } catch { showToast('Failed to reach bot', false); }
    finally { setTriggering(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-white/30 animate-spin" size={32} />
      </div>
    );
  }

  const isConfigured = !!(config.telegramBotToken && config.telegramChatId);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-white/5 flex flex-col py-6 px-3 gap-1">
        <div className="flex items-center gap-2 px-3 mb-6">
          <Activity size={18} className="text-white" />
          <span className="font-semibold tracking-wide text-sm">N3RDY</span>
        </div>

        {VIEWS.map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left w-full ${
              view === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {VIEW_ICONS[v]}
            {v}
          </button>
        ))}

        <div className="mt-auto pt-4 border-t border-white/5 px-3">
          {session?.user?.image && (
            <div className="flex items-center gap-2 mb-3">
              <Image src={session.user.image} alt="" width={24} height={24} className="rounded-full" />
              <span className="text-white/40 text-xs truncate">{session.user?.email}</span>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur ${
            toast.ok ? 'bg-emerald-900/90 text-emerald-300' : 'bg-red-900/90 text-red-300'
          }`}>
            {toast.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {toast.msg}
          </div>
        )}

        {/* Overview */}
        {view === 'Overview' && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold mb-1">Your Bot</h1>
            <p className="text-white/40 text-sm mb-8">Monitor and control your personal N3RDY intelligence bot.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: 'Bot Service', value: status?.botOnline ? 'Online' : 'Offline', dot: status?.botOnline ? 'bg-emerald-400' : 'bg-red-400' },
                { label: 'Your Bot', value: config.isActive && isConfigured ? 'Active' : 'Paused', dot: config.isActive && isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-white/20' },
                { label: 'Last Briefing', value: fmt(status?.lastBriefingAt ?? null), dot: null },
                { label: 'Next Briefing', value: fmt(status?.nextBriefingAt ?? null), dot: null },
              ].map(card => (
                <div key={card.label} className="border border-white/10 rounded-2xl p-5">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{card.label}</p>
                  <div className="flex items-center gap-2">
                    {card.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${card.dot}`} />}
                    <span className="text-white font-medium text-sm">{card.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {!isConfigured && (
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 mb-6 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">Telegram not connected</p>
                  <p className="text-white/50 text-xs">Add your Telegram bot token and chat ID to start receiving briefings.</p>
                  <button onClick={() => setView('Telegram')} className="mt-2 text-amber-400 text-xs flex items-center gap-1 hover:text-amber-300 transition-colors">
                    Set up Telegram <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => save({ isActive: !config.isActive })}
                disabled={!isConfigured || saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  config.isActive
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-white text-black hover:bg-white/90'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Power size={15} />
                {config.isActive ? 'Pause Bot' : 'Activate Bot'}
              </button>

              <button
                onClick={triggerBriefing}
                disabled={!isConfigured || triggering}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {triggering ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Briefing Now
              </button>
            </div>
          </div>
        )}

        {/* Telegram */}
        {view === 'Telegram' && (
          <div className="max-w-lg">
            <h1 className="text-2xl font-semibold mb-1">Telegram Setup</h1>
            <p className="text-white/40 text-sm mb-8">Connect your own Telegram bot to receive briefings.</p>

            <div className="text-sm text-white/50 bg-white/5 rounded-xl p-4 mb-8 space-y-1.5">
              <p className="text-white/80 font-medium mb-3">How to get your bot token:</p>
              <p>1. Open Telegram and message <span className="text-white font-mono">@BotFather</span></p>
              <p>2. Send <span className="text-white">/newbot</span> and follow the steps</p>
              <p>3. Copy the token (looks like <span className="text-white font-mono">123456:ABC-DEF...</span>)</p>
              <p>4. Start a chat with your new bot</p>
              <p>5. Get your chat ID via <span className="text-white font-mono">@userinfobot</span></p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Bot Token</label>
                <input
                  type="password"
                  value={config.telegramBotToken}
                  onChange={e => setConfig(c => ({ ...c, telegramBotToken: e.target.value }))}
                  placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm outline-none focus:border-white/30 font-mono"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Chat ID</label>
                <input
                  type="text"
                  value={config.telegramChatId}
                  onChange={e => setConfig(c => ({ ...c, telegramChatId: e.target.value }))}
                  placeholder="@yourchannel  or  -1001234567890"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm outline-none focus:border-white/30 font-mono"
                />
              </div>
              <button
                onClick={() => save({ telegramBotToken: config.telegramBotToken, telegramChatId: config.telegramChatId })}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save & Connect
              </button>
            </div>
          </div>
        )}

        {/* Schedule */}
        {view === 'Schedule' && (
          <div className="max-w-md">
            <h1 className="text-2xl font-semibold mb-1">Briefing Schedule</h1>
            <p className="text-white/40 text-sm mb-8">How often do you want to receive briefings?</p>

            <div className="grid grid-cols-2 gap-3">
              {INTERVAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => save({ intervalMinutes: opt.value })}
                  className={`border rounded-xl px-4 py-3.5 text-sm text-left transition-colors ${
                    config.intervalMinutes === opt.value
                      ? 'border-white bg-white/10 text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-white/25 text-xs mt-6">Briefings run on a shared schedule with ±15 min variance.</p>
          </div>
        )}

        {/* Topics */}
        {view === 'Topics' && (
          <div className="max-w-md">
            <h1 className="text-2xl font-semibold mb-1">Topic Weights</h1>
            <p className="text-white/40 text-sm mb-8">Adjust focus per market. 1.0 = default, 2.0 = double emphasis, 0.0 = ignore.</p>

            <div className="space-y-7 mb-8">
              {(Object.entries(config.topicWeights) as [string, number][]).map(([key, val]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white text-sm">{WEIGHT_LABELS[key]}</label>
                    <span className="text-white/50 text-xs font-mono w-8 text-right">{val.toFixed(1)}×</span>
                  </div>
                  <input
                    type="range" min="0" max="3" step="0.1"
                    value={val}
                    onChange={e => setConfig(c => ({
                      ...c,
                      topicWeights: { ...c.topicWeights, [key]: parseFloat(e.target.value) },
                    }))}
                    className="w-full accent-white h-1"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => save({ topicWeights: config.topicWeights })}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Weights
            </button>
          </div>
        )}

        {/* Sources */}
        {view === 'Sources' && (
          <div className="max-w-md">
            <h1 className="text-2xl font-semibold mb-1">Data Sources</h1>
            <p className="text-white/40 text-sm mb-8">Toggle which source types are included in your briefings.</p>

            <div className="space-y-3 mb-8">
              {SOURCE_OPTIONS.map(src => {
                const enabled = config.enabledSources.includes(src.id);
                return (
                  <button
                    key={src.id}
                    onClick={() => {
                      const next = enabled
                        ? config.enabledSources.filter(s => s !== src.id)
                        : [...config.enabledSources, src.id];
                      setConfig(c => ({ ...c, enabledSources: next }));
                    }}
                    className={`w-full flex items-center justify-between border rounded-xl px-5 py-4 text-sm transition-colors ${
                      enabled ? 'border-white/40 bg-white/5 text-white' : 'border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    <span>{src.label}</span>
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${enabled ? 'bg-white' : 'bg-white/10'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${enabled ? 'bg-black left-4' : 'bg-white/40 left-0.5'}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => save({ enabledSources: config.enabledSources })}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Sources
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

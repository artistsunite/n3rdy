'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import {
  Activity, Bell, BarChart2, Rss, Power, Send,
  ChevronRight, CheckCircle2, AlertCircle, Loader2, LogOut, Save,
  Newspaper, Settings, RefreshCw, Circle,
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
  telegramEnabled?: boolean;
  lastBriefingAt: string | null;
  nextBriefingAt: string | null;
  intervalMinutes: number;
}

interface Briefing {
  id: string;
  text: string;
  htmlText?: string;
  createdAt: string;
  read: boolean;
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

const MAIN_VIEWS = ['Briefings', 'Overview'] as const;
const SETTINGS_VIEWS = ['Telegram', 'Schedule', 'Topics', 'Sources'] as const;
type MainView = typeof MAIN_VIEWS[number];
type SettingsView = typeof SETTINGS_VIEWS[number];
type View = MainView | SettingsView | 'Settings';

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardClient() {
  const { data: session } = useSession();
  const [view, setView] = useState<View>('Briefings');
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [briefingsLoading, setBriefingsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [expandedBriefing, setExpandedBriefing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadBriefings = useCallback(async () => {
    setBriefingsLoading(true);
    try {
      const res = await fetch('/api/briefings?limit=20');
      if (res.ok) {
        const data = await res.json();
        setBriefings(data.briefings ?? []);
      }
    } catch { /* silent */ }
    finally { setBriefingsLoading(false); }
  }, []);

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

  useEffect(() => {
    loadData();
    loadBriefings();
  }, [loadData, loadBriefings]);

  const markRead = async (id: string) => {
    setBriefings(bs => bs.map(b => b.id === id ? { ...b, read: true } : b));
    try {
      await fetch('/api/briefings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch { /* silent */ }
  };

  const expandBriefing = (id: string) => {
    setExpandedBriefing(prev => prev === id ? null : id);
    const briefing = briefings.find(b => b.id === id);
    if (briefing && !briefing.read) markRead(id);
  };

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
      if (res.status === 202) {
        showToast('Generating — check your feed in a moment');
        setTimeout(() => loadBriefings(), 10_000);
      } else if (res.ok) {
        showToast('Briefing generated!');
        await Promise.all([loadData(), loadBriefings()]);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed', false);
      }
    } catch { showToast('Could not reach bot service', false); }
    finally { setTriggering(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-white/30 animate-spin" size={32} />
      </div>
    );
  }

  const unreadCount = briefings.filter(b => !b.read).length;
  const isSettingsView = (SETTINGS_VIEWS as readonly string[]).includes(view);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-white/5 flex flex-col py-6 px-3 gap-1">
        <div className="flex items-center gap-2 px-3 mb-6">
          <Activity size={18} className="text-white" />
          <span className="font-semibold tracking-wide text-sm">N3RDY</span>
        </div>

        {/* Main nav */}
        <NavItem icon={<Newspaper size={15} />} label="Briefings" active={view === 'Briefings'} badge={unreadCount} onClick={() => setView('Briefings')} />
        <NavItem icon={<BarChart2 size={15} />} label="Overview" active={view === 'Overview'} onClick={() => setView('Overview')} />

        {/* Settings group */}
        <div className="mt-3 mb-1 px-3">
          <p className="text-white/20 text-[10px] uppercase tracking-widest">Settings</p>
        </div>
        <NavItem icon={<Send size={15} />} label="Telegram" active={view === 'Telegram'} onClick={() => setView('Telegram')} />
        <NavItem icon={<Bell size={15} />} label="Schedule" active={view === 'Schedule'} onClick={() => setView('Schedule')} />
        <NavItem icon={<Activity size={15} />} label="Topics" active={view === 'Topics'} onClick={() => setView('Topics')} />
        <NavItem icon={<Rss size={15} />} label="Sources" active={view === 'Sources'} onClick={() => setView('Sources')} />

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

        {/* Briefings */}
        {view === 'Briefings' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-semibold">Briefings</h1>
              <button
                onClick={loadBriefings}
                disabled={briefingsLoading}
                className="text-white/30 hover:text-white/60 transition-colors p-1"
                title="Refresh"
              >
                <RefreshCw size={15} className={briefingsLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-white/40 text-sm mb-8">Your intelligence feed — updated every {config.intervalMinutes} min.</p>

            {!config.isActive && (
              <div className="border border-white/10 rounded-2xl p-5 mb-6 flex items-start gap-3 text-white/50">
                <AlertCircle size={17} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/70 text-sm mb-1">Briefings paused</p>
                  <p className="text-xs">Your bot is inactive. Activate it in Overview to start receiving briefings.</p>
                  <button onClick={() => setView('Overview')} className="mt-2 text-white/50 text-xs flex items-center gap-1 hover:text-white/80 transition-colors">
                    Go to Overview <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {briefingsLoading && briefings.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="text-white/20 animate-spin" />
              </div>
            ) : briefings.length === 0 ? (
              <div className="text-center py-16">
                <Newspaper size={32} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No briefings yet.</p>
                <p className="text-white/20 text-xs mt-1">Activate your bot and trigger one from Overview.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {briefings.map(b => (
                  <div
                    key={b.id}
                    className={`border rounded-2xl transition-colors cursor-pointer ${
                      !b.read ? 'border-white/20 bg-white/[0.03]' : 'border-white/8 hover:border-white/15'
                    }`}
                    onClick={() => expandBriefing(b.id)}
                  >
                    <div className="flex items-start gap-3 px-5 py-4">
                      <div className="mt-1.5 flex-shrink-0">
                        {!b.read
                          ? <Circle size={7} className="fill-white text-white" />
                          : <Circle size={7} className="text-white/15" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed line-clamp-2 ${!b.read ? 'text-white' : 'text-white/60'}`}>
                          {b.text}
                        </p>
                        <p className="text-white/25 text-xs mt-1.5">{relTime(b.createdAt)}</p>
                      </div>
                      <ChevronRight
                        size={15}
                        className={`text-white/20 flex-shrink-0 mt-1 transition-transform ${expandedBriefing === b.id ? 'rotate-90' : ''}`}
                      />
                    </div>

                    {expandedBriefing === b.id && (
                      <div className="px-5 pb-5 pt-1 border-t border-white/5">
                        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                          {b.text}
                        </p>
                        <p className="text-white/20 text-xs mt-3">{new Date(b.createdAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overview */}
        {view === 'Overview' && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold mb-1">Overview</h1>
            <p className="text-white/40 text-sm mb-8">Monitor and control your intelligence bot.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: 'Bot Service', value: status?.botOnline ? 'Online' : 'Offline', dot: status?.botOnline ? 'bg-emerald-400' : 'bg-red-400' },
                { label: 'Your Bot', value: config.isActive ? 'Active' : 'Paused', dot: config.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20' },
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

            {briefings.length > 0 && (
              <div className="border border-white/10 rounded-2xl p-5 mb-6">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Latest Briefing</p>
                <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{briefings[0].text}</p>
                <button onClick={() => setView('Briefings')} className="mt-3 text-white/40 text-xs flex items-center gap-1 hover:text-white/70 transition-colors">
                  View all briefings <ChevronRight size={12} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => save({ isActive: !config.isActive })}
                disabled={saving}
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
                disabled={triggering}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {triggering ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Get Briefing Now
              </button>
            </div>
          </div>
        )}

        {/* Telegram */}
        {view === 'Telegram' && (
          <div className="max-w-lg">
            <h1 className="text-2xl font-semibold mb-1">Telegram</h1>
            <p className="text-white/40 text-sm mb-2">Optional — briefings always appear in your dashboard feed.</p>
            <div className="border border-white/8 rounded-xl px-4 py-3 mb-8 flex items-center gap-2">
              {status?.telegramEnabled
                ? <><CheckCircle2 size={15} className="text-emerald-400" /><span className="text-white/60 text-sm">Connected — briefings also sent to Telegram</span></>
                : <><Circle size={15} className="text-white/20" /><span className="text-white/40 text-sm">Not connected — add token below to enable</span></>
              }
            </div>

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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => save({ telegramBotToken: config.telegramBotToken, telegramChatId: config.telegramChatId })}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save
                </button>
                {(config.telegramBotToken || config.telegramChatId) && (
                  <button
                    onClick={() => save({ telegramBotToken: '', telegramChatId: '' })}
                    disabled={saving}
                    className="text-white/30 hover:text-white/60 text-sm transition-colors disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schedule */}
        {view === 'Schedule' && (
          <div className="max-w-md">
            <h1 className="text-2xl font-semibold mb-1">Schedule</h1>
            <p className="text-white/40 text-sm mb-8">How often to generate new briefings for your feed.</p>

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

function NavItem({
  icon, label, active, badge, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left w-full ${
        active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-[10px] bg-white/20 text-white rounded-full px-1.5 py-0.5 leading-none font-medium">
          {badge}
        </span>
      )}
    </button>
  );
}

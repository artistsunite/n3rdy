'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Mail } from 'lucide-react';

interface Props {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

const COUNTRY_OPTIONS = [
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'UK', label: '🇬🇧 United Kingdom' },
  { value: 'global', label: '🌐 Global / Other' },
];

interface GoogleStatus {
  connected: boolean;
  grantedScopes?: string[];
  lastSyncAt?: string;
  connectedAt?: string;
}

export default function SettingsClient({ userName, userEmail, userImage }: Props) {
  const [country, setCountry] = useState<string>('');
  const [savedCountry, setSavedCountry] = useState<string>('');
  const [savingCountry, setSavingCountry] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<'daily' | 'weekdays'>('daily');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSavedOk, setEmailSavedOk] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/preferences').then(r => r.json()),
      fetch('/api/google/status').then(r => r.json()),
    ]).then(([prefsResp, gs]) => {
      const prefs = prefsResp.preferences ?? {};
      const c = prefs.country ?? '';
      setCountry(c);
      setSavedCountry(c);
      setEmailEnabled(prefs.emailBriefingEnabled ?? false);
      setEmailFrequency(prefs.emailBriefingFrequency === 'weekdays' ? 'weekdays' : 'daily');
      setGoogleStatus(gs as GoogleStatus);
    }).catch(() => null);
  }, []);

  async function saveCountry() {
    setSavingCountry(true);
    try {
      const res = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      });
      if (res.ok) {
        setSavedCountry(country);
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2000);
      }
    } finally {
      setSavingCountry(false);
    }
  }

  async function saveEmailPrefs() {
    setSavingEmail(true);
    try {
      const res = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailBriefingEnabled: emailEnabled, emailBriefingFrequency: emailFrequency }),
      });
      if (res.ok) { setEmailSavedOk(true); setTimeout(() => setEmailSavedOk(false), 2000); }
    } finally {
      setSavingEmail(false);
    }
  }

  async function sendTestEmail() {
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/briefings/email', { method: 'POST' });
      const data = await res.json();
      setTestEmailResult(res.ok ? `Sent to ${data.sentTo}` : (data.error ?? 'Send failed'));
    } finally {
      setTestingEmail(false);
    }
  }

  async function disconnectGoogle() {
    setDisconnecting(true);
    try {
      await fetch('/api/google/disconnect', { method: 'DELETE' });
      setGoogleStatus({ connected: false });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/50 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <div className="liquid-glass-card rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Account</p>
        <div className="flex items-center gap-3">
          {userImage && (
            <img src={userImage} alt="avatar" className="w-10 h-10 rounded-full" />
          )}
          <div>
            <div className="text-sm text-white font-medium">{userName}</div>
            <div className="text-xs text-white/50">{userEmail}</div>
          </div>
        </div>
      </div>

      {/* Region */}
      <div className="liquid-glass-card rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-white">Region</p>
        <p className="text-xs text-white/50">Used to filter marketing calendar dates to your country.</p>
        <div className="flex items-center gap-3 flex-wrap">
          {COUNTRY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCountry(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                country === opt.value
                  ? 'bg-n3-primary/20 border-n3-primary/40 text-n3-primary'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveCountry}
            disabled={savingCountry || country === savedCountry}
            className="flex items-center gap-2 px-4 py-2 bg-n3-primary text-n3-bg rounded-xl text-sm font-semibold hover:bg-n3-primary/90 disabled:opacity-50 transition-colors"
          >
            {savingCountry ? (
              <Loader2 size={13} className="animate-spin" />
            ) : savedOk ? (
              <Check size={13} />
            ) : null}
            {savedOk ? 'Saved!' : 'Save Region'}
          </button>
          {country !== savedCountry && (
            <span className="text-xs text-white/40">Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Email Briefings */}
      <div className="liquid-glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={15} className="text-n3-primary" />
          <p className="text-sm font-semibold text-white">Email Briefings</p>
        </div>
        <p className="text-xs text-white/50">Receive your daily intelligence briefing by email. We&apos;ll send it automatically each morning.</p>

        <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
          <div>
            <p className="text-sm text-white font-medium">Daily email briefing</p>
            <p className="text-xs text-white/40 mt-0.5">Includes top stories, growth signals &amp; competitor updates</p>
          </div>
          <button
            onClick={() => setEmailEnabled(e => !e)}
            className={`relative w-11 h-6 rounded-full transition-colors ${emailEnabled ? 'bg-n3-primary' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {emailEnabled && (
          <div className="space-y-2">
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Frequency</p>
            <div className="flex gap-2">
              {(['daily', 'weekdays'] as const).map(freq => (
                <button
                  key={freq}
                  onClick={() => setEmailFrequency(freq)}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${emailFrequency === freq ? 'bg-n3-primary/20 border-n3-primary/40 text-n3-primary' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                >
                  {freq === 'daily' ? 'Every day' : 'Weekdays only'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={saveEmailPrefs}
            disabled={savingEmail}
            className="flex items-center gap-2 px-4 py-2 bg-n3-primary text-n3-bg rounded-xl text-sm font-semibold hover:bg-n3-primary/90 disabled:opacity-50 transition-colors"
          >
            {savingEmail ? <Loader2 size={13} className="animate-spin" /> : emailSavedOk ? <Check size={13} /> : null}
            {emailSavedOk ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={sendTestEmail}
            disabled={testingEmail}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl text-sm transition-all disabled:opacity-50"
          >
            {testingEmail ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
            {testingEmail ? 'Sending…' : 'Send test email'}
          </button>
          {testEmailResult && (
            <span className={`text-xs ${testEmailResult.startsWith('Sent') ? 'text-n3-success' : 'text-n3-danger'}`}>
              {testEmailResult}
            </span>
          )}
        </div>
      </div>

      {/* Connections */}
      <div className="liquid-glass-card rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-white">Connections</p>

        {/* Google Calendar */}
        <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Google Calendar</p>
            {googleStatus?.connected ? (
              <p className="text-xs text-n3-success">
                Connected{googleStatus.lastSyncAt ? ` · Last sync ${new Date(googleStatus.lastSyncAt).toLocaleDateString()}` : ''}
              </p>
            ) : (
              <p className="text-xs text-white/40">Not connected</p>
            )}
          </div>
          {googleStatus?.connected ? (
            <button
              onClick={disconnectGoogle}
              disabled={disconnecting}
              className="text-xs text-n3-danger/70 hover:text-n3-danger border border-n3-danger/20 hover:border-n3-danger/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <a
              href="/api/google/authorize?scope=calendar"
              className="text-xs text-n3-primary border border-n3-primary/30 hover:border-n3-primary/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              Connect ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

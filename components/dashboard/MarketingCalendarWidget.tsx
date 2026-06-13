'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import ExpandableWidget from './ExpandableWidget';

interface MarketingDate {
  date: string;
  name: string;
  emoji: string;
  type: string;
  country: string;
  tip: string;
}

interface GoogleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location?: string;
}

const TYPE_COLOR: Record<string, string> = {
  holiday: 'bg-blue-500/20 text-blue-300',
  retail: 'bg-n3-warning/20 text-n3-warning',
  awareness: 'bg-purple-500/20 text-purple-300',
  seasonal: 'bg-n3-success/20 text-n3-success',
  business: 'bg-n3-primary/20 text-n3-primary',
};

const COUNTRY_FLAG: Record<string, string> = { AU: '🇦🇺', US: '🇺🇸', UK: '🇬🇧', global: '🌐' };

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MarketingCalendarWidget() {
  const [dates, setDates] = useState<MarketingDate[]>([]);
  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/calendar/marketing?days=60').then(r => r.json()),
      fetch('/api/google/status').then(r => r.json()),
    ]).then(([cal, gs]) => {
      setDates(cal.dates ?? []);
      setCountry(cal.country ?? null);
      if (gs.connected) {
        setGoogleConnected(true);
        fetch('/api/google/calendar/events?days=60')
          .then(r => r.json())
          .then(d => setGoogleEvents(d.events ?? []))
          .catch(() => null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const next = dates[0];
  const daysAway = next ? daysUntil(next.date) : null;

  // Build a 7-day strip
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const strip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const events = dates.filter(e => e.date === dateStr);
    return { date: d, dateStr, events };
  });

  const compactContent = (
    <div className="space-y-3">
      {loading ? (
        <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
      ) : (
        <>
          {/* 7-day dot strip */}
          <div className="flex gap-1">
            {strip.map(day => (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/30">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                </span>
                <span className="text-[10px] text-white/50">{day.date.getDate()}</span>
                <div className="flex flex-wrap gap-0.5 justify-center min-h-[6px]">
                  {day.events.slice(0, 3).map((e, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${TYPE_COLOR[e.type]?.split(' ')[0] ?? 'bg-white/30'}`}
                      title={e.name}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {next ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">{next.emoji}</span>
              <span className="text-xs text-white/70 font-medium">{next.name}</span>
              <span className="text-xs text-white/40">
                {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `in ${daysAway} days`}
              </span>
              <span className="text-xs">{COUNTRY_FLAG[next.country] ?? ''}</span>
            </div>
          ) : (
            <p className="text-xs text-white/40">No upcoming dates in the next 60 days.</p>
          )}
        </>
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
        </div>
      ) : dates.length === 0 ? (
        <p className="text-sm text-white/40 py-4 text-center">No upcoming marketing dates.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {dates.map(d => (
            <div key={`${d.date}-${d.name}`} className="flex items-start gap-3 bg-white/3 rounded-xl p-3">
              <span className="text-lg flex-shrink-0">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{d.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLOR[d.type] ?? 'bg-white/10 text-white/50'}`}>
                    {d.type}
                  </span>
                  <span className="text-xs">{COUNTRY_FLAG[d.country] ?? d.country}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/40">{formatShortDate(d.date)}</span>
                  <span className="text-xs text-white/30">·</span>
                  <span className="text-xs text-white/60">{d.tip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {googleConnected && googleEvents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/30 inline-block" /> Your Calendar
          </p>
          {googleEvents.slice(0, 8).map(ev => {
            const d = new Date(ev.start);
            return (
              <div key={ev.id} className="flex items-center gap-3 bg-white/3 rounded-xl p-2.5">
                <span className="text-sm">🗓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{ev.title}</p>
                  <p className="text-[10px] text-white/40">
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {!ev.isAllDay && ` · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    {ev.isAllDay ? ' · All day' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {country && (
        <p className="text-[11px] text-white/30">Showing global + {country} events. Change region in Settings.</p>
      )}
      {!googleConnected && (
        <a href="/api/google/authorize?scope=calendar" className="text-[11px] text-n3-primary/70 hover:text-n3-primary transition-colors">
          + Connect Google Calendar to see your events
        </a>
      )}
    </div>
  );

  return (
    <ExpandableWidget
      title="Marketing Calendar"
      icon={<CalendarDays size={14} />}
      compactContent={compactContent}
      expandedContent={expandedContent}
    />
  );
}

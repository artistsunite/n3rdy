'use client';

import { useEffect, useState } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';

interface EconomicEvent {
  id: string;
  country: string;
  eventType: string;
  title: string;
  scheduledAt: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  marketImpact: string;
  assetsAffected: string[];
}

const IMPACT_STYLES: Record<string, string> = {
  low: 'text-n3-muted bg-white/5',
  medium: 'text-n3-warning bg-n3-warning/10',
  high: 'text-n3-danger bg-n3-danger/10',
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', AU: '🇦🇺', EU: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵', CN: '🇨🇳', CA: '🇨🇦', DE: '🇩🇪',
};

export default function EconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/economic-calendar?days=7')
      .then((r) => r.json())
      .then((d) => { setEvents(d.events ?? []); setLoading(false); });
  }, []);

  const grouped = events.reduce<Record<string, EconomicEvent[]>>((acc, e) => {
    const date = new Date(e.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Economic Calendar</h1>
        <p className="text-white/50 text-sm mt-1">Upcoming market-moving events — next 7 days</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 liquid-glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="liquid-glass-card border border-dashed border-white/15 rounded-xl p-10 text-center">
          <Calendar size={32} className="text-white/30 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No upcoming events. Economic events will appear here as they are added.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{date}</div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div key={event.id} className="liquid-glass-card rounded-xl px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="text-xl flex-shrink-0">{COUNTRY_FLAGS[event.country] ?? '🌍'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{event.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${IMPACT_STYLES[event.marketImpact] ?? IMPACT_STYLES.medium}`}>
                            {event.marketImpact} impact
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                          <span>{new Date(event.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                          {event.forecast && <span>Forecast: <span className="text-white">{event.forecast}</span></span>}
                          {event.previous && <span>Previous: <span className="text-white">{event.previous}</span></span>}
                          {event.actual && <span className="text-n3-success">Actual: {event.actual}</span>}
                        </div>
                        {event.assetsAffected.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {event.assetsAffected.map((a) => (
                              <span key={a} className="text-xs bg-n3-primary/10 text-n3-primary px-1.5 py-0.5 rounded">{a}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {event.marketImpact === 'high' && (
                        <AlertTriangle size={14} className="text-n3-danger flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

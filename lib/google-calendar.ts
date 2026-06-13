import { db } from '@/lib/db';
import { refreshAccessToken } from './google-oauth';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[];
}

export async function getCalendarEvents(userId: string, daysAhead = 30): Promise<CalendarEvent[]> {
  const integration = await db.googleIntegration.findUnique({ where: { userId } });
  if (!integration) return [];

  let accessToken = integration.accessToken;

  // Refresh if expired or expiring within 5 minutes
  if (integration.tokenExpiry && integration.refreshToken) {
    const expiresAt = integration.tokenExpiry.getTime();
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      try {
        const refreshed = await refreshAccessToken(integration.refreshToken);
        accessToken = refreshed.accessToken;
        await db.googleIntegration.update({
          where: { userId },
          data: { accessToken: refreshed.accessToken, tokenExpiry: refreshed.tokenExpiry },
        });
      } catch {
        return [];
      }
    }
  }

  const now = new Date();
  const future = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) return [];

  const data = await res.json() as GoogleCalendarResponse;
  const items = data.items ?? [];

  await db.googleIntegration.update({ where: { userId }, data: { lastSyncAt: new Date() } });

  return items.map(item => ({
    id: item.id,
    title: item.summary ?? 'Untitled',
    start: item.start.dateTime ?? item.start.date ?? '',
    end: item.end.dateTime ?? item.end.date ?? '',
    isAllDay: !item.start.dateTime,
    location: item.location,
  }));
}

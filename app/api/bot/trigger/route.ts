import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = session.user.id;
  const botUrl = process.env.BOT_SERVICE_URL;

  if (!botUrl) {
    return NextResponse.json({ error: 'Bot service not configured' }, { status: 503 });
  }

  const apiKey = process.env.BOT_INTERNAL_API_KEY ?? '';

  try {
    const res = await fetch(`${botUrl}/users/${uid}/brief-now`, {
      method: 'POST',
      headers: { 'x-bot-api-key': apiKey },
      // Briefing generation can take 30–60s; stay under App Hosting's 60s route limit
      signal: AbortSignal.timeout(58_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Bot error');
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: true, briefingId: data.briefingId ?? null });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      // Bot is still generating — the briefing will appear in the feed shortly
      return NextResponse.json(
        { ok: true, generating: true },
        { status: 202 }
      );
    }
    console.error('Trigger error:', err);
    return NextResponse.json({ error: 'Failed to reach bot service' }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  const botUrl = process.env.BOT_SERVICE_URL;
  if (!botUrl) return NextResponse.json({ error: 'Bot service not configured' }, { status: 503 });

  const apiKey = process.env.BOT_INTERNAL_API_KEY || '';
  const res = await fetch(`${botUrl}/users/${uid}/brief-now`, {
    method: 'POST',
    headers: { 'x-bot-api-key': apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}

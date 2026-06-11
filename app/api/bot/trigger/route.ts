import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserBotConfig, saveUserBotConfig } from '@/lib/firestore-admin';

function cleanSecret(value: string | undefined): string {
  // Strip leading UTF-8 BOM (char code 65279 = 0xFEFF) and whitespace.
  // GCP Secret Manager can prepend a BOM when secrets are pasted from
  // BOM-encoded files, which breaks HTTP headers (bytes must be <= 255).
  let s = (value ?? '').trim();
  while (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  return s.trim();
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = session.user.id;
  const botUrl = cleanSecret(process.env.BOT_SERVICE_URL);

  if (!botUrl) {
    return NextResponse.json({ error: 'BOT_SERVICE_URL not set' }, { status: 503 });
  }

  try {
    await getUserBotConfig(uid);
    await saveUserBotConfig(uid, {});
  } catch {
    // Non-fatal
  }

  const apiKey = cleanSecret(process.env.BOT_INTERNAL_API_KEY);
  const targetUrl = `${botUrl}/users/${uid}/brief-now`;

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'x-bot-api-key': apiKey },
      signal: AbortSignal.timeout(58_000),
    });
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError');

    if (isTimeout) {
      return NextResponse.json({ ok: true, generating: true }, { status: 202 });
    }

    const detail = err instanceof Error ? err.message : String(err);
    console.error('Trigger fetch failed:', targetUrl, detail);
    return NextResponse.json(
      { error: `Cannot connect to bot: ${detail}` },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Bot returned', res.status, text);
    return NextResponse.json(
      { error: `Bot error ${res.status}: ${text}` },
      { status: res.status }
    );
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: true, briefingId: data.briefingId ?? null });
}

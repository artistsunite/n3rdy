import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Temporary debug endpoint — remove after diagnosing bot connectivity
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const botUrl = process.env.BOT_SERVICE_URL ?? '(not set)';
  const hasApiKey = !!(process.env.BOT_INTERNAL_API_KEY);

  let healthStatus: string;
  try {
    const res = await fetch(`${botUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    healthStatus = `${res.status} ${await res.text()}`;
  } catch (err) {
    healthStatus = `fetch threw: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    botUrl,
    hasApiKey,
    userId: session.user.id,
    health: healthStatus,
  });
}

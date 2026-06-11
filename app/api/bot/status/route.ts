import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserBotConfig } from '@/lib/firestore-admin';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cfg = await getUserBotConfig(session.user.id);
  const botUrl = process.env.BOT_SERVICE_URL;

  let botOnline = false;
  if (botUrl) {
    try {
      const res = await fetch(`${botUrl}/health`, { signal: AbortSignal.timeout(4000) });
      botOnline = res.ok;
    } catch {
      botOnline = false;
    }
  }

  return NextResponse.json({
    botOnline,
    isActive: cfg.isActive,
    configured: true,
    telegramEnabled: !!(cfg.telegramBotToken && cfg.telegramChatId),
    lastBriefingAt: cfg.lastBriefingAt,
    nextBriefingAt: cfg.nextBriefingAt,
    intervalMinutes: cfg.intervalMinutes,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { sendBriefingEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  // Support cron-triggered emails with x-cron-user-id header
  const cronUserId = req.headers.get('x-cron-user-id');
  const cronSecret = req.headers.get('x-cron-secret');
  const isCron = cronUserId && cronSecret === process.env.CRON_SECRET;

  let userId: string;
  let toEmail: string;
  let toName: string;

  if (isCron) {
    userId = cronUserId;
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    toEmail = user.email;
    toName = user.name ?? '';
  } else {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userId = session.user.id;
    toEmail = session.user.email ?? '';
    toName = session.user.name ?? '';
  }

  if (!toEmail) return NextResponse.json({ error: 'No email on account' }, { status: 400 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [briefing, opportunities, competitorEvents] = await Promise.all([
    db.briefing.findFirst({
      where: { userId, createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' },
    }).then(b => b ?? db.briefing.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })),
    db.growthOpportunity.findMany({
      where: { userId, status: { in: ['new', 'viewed'] } },
      orderBy: { urgencyScore: 'desc' },
      take: 3,
      select: { title: true, type: true, urgencyScore: true, potentialRevenue: true },
    }).catch(() => []),
    db.competitorEvent.findMany({
      where: { userId, detectedAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) } },
      orderBy: [{ importance: 'desc' }, { detectedAt: 'desc' }],
      take: 3,
      select: { title: true, eventType: true, importance: true },
    }).catch(() => []),
  ]);

  if (!briefing) {
    return NextResponse.json(
      { error: 'No briefing found. Generate a briefing first from the Briefings tab.' },
      { status: 404 }
    );
  }

  try {
    await sendBriefingEmail({
      toEmail,
      toName,
      briefing: briefing.content as unknown as Parameters<typeof sendBriefingEmail>[0]['briefing'],
      growth: { opportunities, competitorEvents },
    });

    // Update lastBriefingEmailSentAt in alertThresholds for cron dedup
    if (isCron) {
      const prefs = await db.userPreferences.findUnique({ where: { userId } });
      const thresholds = (prefs?.alertThresholds as Record<string, unknown> | null) ?? {};
      await db.userPreferences.upsert({
        where: { userId },
        create: { userId, alertThresholds: { ...thresholds, lastBriefingEmailSentAt: new Date().toISOString() } },
        update: { alertThresholds: { ...thresholds, lastBriefingEmailSentAt: new Date().toISOString() } },
      });
    }

    return NextResponse.json({ ok: true, sentTo: toEmail });
  } catch (err) {
    const msg = (err as Error).message ?? 'Email send failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

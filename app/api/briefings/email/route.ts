import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { sendBriefingEmail } from '@/lib/email';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const toEmail = session.user.email;
  const toName = session.user.name ?? '';

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
    return NextResponse.json({ ok: true, sentTo: toEmail });
  } catch (err) {
    const msg = (err as Error).message ?? 'Email send failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

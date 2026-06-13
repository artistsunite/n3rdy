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

  // Use today's most recent briefing or the latest one available
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let briefing = await db.briefing.findFirst({
    where: { userId, createdAt: { gte: today } },
    orderBy: { createdAt: 'desc' },
  });

  if (!briefing) {
    briefing = await db.briefing.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

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
      briefing: briefing.content as Parameters<typeof sendBriefingEmail>[0]['briefing'],
    });
    return NextResponse.json({ ok: true, sentTo: toEmail });
  } catch (err) {
    const msg = (err as Error).message ?? 'Email send failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

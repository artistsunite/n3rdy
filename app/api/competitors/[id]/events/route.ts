import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const competitor = await db.competitor.findFirst({ where: { id, userId: session.user.id } });
  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const events = await db.competitorEvent.findMany({
    where: { competitorId: id },
    orderBy: { detectedAt: 'desc' },
    take: 50,
  });

  await db.competitorEvent.updateMany({
    where: { competitorId: id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ events });
}

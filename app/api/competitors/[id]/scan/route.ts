import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCompetitorScanQueue } from '@/lib/queue';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const competitor = await db.competitor.findFirst({ where: { id, userId: session.user.id } });
  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const queue = getCompetitorScanQueue();
  await queue.add('scan', { competitorId: id, userId: session.user.id }, { jobId: `scan-${id}-${Date.now()}` });

  return NextResponse.json({ queued: true });
}

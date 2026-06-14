import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCompetitorScanQueue } from '@/lib/queue';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const competitors = await db.competitor.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { _count: { select: { events: { where: { isRead: false } } } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ competitors });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { name: string; website?: string; pricingUrl?: string; blogUrl?: string; productUrl?: string; description?: string };

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const competitor = await db.competitor.create({
    data: {
      userId: session.user.id,
      name: body.name.trim(),
      website: body.website || null,
      pricingUrl: body.pricingUrl || null,
      blogUrl: body.blogUrl || null,
      productUrl: body.productUrl || null,
      description: body.description || null,
    },
  });

  // Auto-kick off initial scan if any URLs were provided
  if (body.website || body.pricingUrl || body.blogUrl || body.productUrl) {
    try {
      const queue = getCompetitorScanQueue();
      await queue.add('scan', { competitorId: competitor.id, userId: session.user.id }, { jobId: `scan-${competitor.id}-init` });
    } catch {
      // Non-fatal — user can trigger scan manually
    }
  }

  return NextResponse.json({ competitor }, { status: 201 });
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count } = await db.competitorEvent.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true, markedRead: count });
}

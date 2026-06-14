import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// Returns recent competitor events across ALL competitors for the user — avoids N per-competitor fetches
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const take = Math.min(parseInt(searchParams.get('take') ?? '20'), 100);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const competitorIds = searchParams.get('competitorIds')?.split(',').filter(Boolean);

  const events = await db.competitorEvent.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
      ...(competitorIds?.length ? { competitorId: { in: competitorIds } } : {}),
    },
    include: { competitor: { select: { id: true, name: true } } },
    orderBy: { detectedAt: 'desc' },
    take,
  });

  return NextResponse.json({ events });
}

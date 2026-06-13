import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;

  const opportunities = await db.growthOpportunity.findMany({
    where: {
      userId: session.user.id,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { urgencyScore: 'desc' },
    take: 50,
  });

  return NextResponse.json({ opportunities });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const experiments = await db.growthExperiment.findMany({
    where: { userId: session.user.id },
    orderBy: { priorityScore: 'desc' },
    take: 50,
  });

  return NextResponse.json({ experiments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;

  const experiment = await db.growthExperiment.create({
    data: { userId: session.user.id, ...(body as Parameters<typeof db.growthExperiment.create>[0]['data']) },
  });

  return NextResponse.json({ experiment }, { status: 201 });
}

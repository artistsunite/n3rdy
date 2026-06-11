import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getBriefingQueue } from '@/lib/queue';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const briefings = await db.briefing.findMany({
    where: { userId: uid },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    select: { id: true, type: true, content: true, plainText: true, read: true, createdAt: true },
  });

  return NextResponse.json({ briefings });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const body = await req.json().catch(() => ({}));
  const type = body.type ?? 'custom';

  // Ensure user record exists
  await db.user.upsert({
    where: { id: uid },
    create: { id: uid, email: session.user.email ?? '', name: session.user.name ?? null },
    update: {},
  });

  const queue = getBriefingQueue();
  const job = await queue.add('briefing', { userId: uid, type });
  return NextResponse.json({ ok: true, jobId: job.id }, { status: 202 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await db.briefing.updateMany({ where: { id, userId: session.user.id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}

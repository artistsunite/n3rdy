import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const competitor = await db.competitor.findFirst({
    where: { id, userId: session.user.id },
    include: {
      snapshots: true,
      events: { orderBy: { detectedAt: 'desc' }, take: 20 },
    },
  });

  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ competitor });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const competitor = await db.competitor.findFirst({ where: { id, userId: session.user.id } });
  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await db.competitor.update({ where: { id }, data: body });
  return NextResponse.json({ competitor: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const competitor = await db.competitor.findFirst({ where: { id, userId: session.user.id } });
  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.competitor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

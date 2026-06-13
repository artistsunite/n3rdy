import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { status?: string };

  const opportunity = await db.growthOpportunity.findFirst({ where: { id, userId: session.user.id } });
  if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await db.growthOpportunity.update({
    where: { id },
    data: { ...(body.status !== undefined ? { status: body.status } : {}) },
  });

  return NextResponse.json({ opportunity: updated });
}

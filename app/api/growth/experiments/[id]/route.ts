import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    status?: string;
    result?: string;
    startedAt?: string;
    completedAt?: string;
  };

  const experiment = await db.growthExperiment.findFirst({ where: { id, userId: session.user.id } });
  if (!experiment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.result !== undefined) data.result = body.result;
  if (body.startedAt !== undefined) data.startedAt = new Date(body.startedAt);
  if (body.completedAt !== undefined) data.completedAt = new Date(body.completedAt);

  if (body.status === 'running' && !experiment.startedAt) data.startedAt = new Date();
  if ((body.status === 'completed' || body.status === 'abandoned') && !experiment.completedAt) data.completedAt = new Date();

  const updated = await db.growthExperiment.update({ where: { id }, data });
  return NextResponse.json({ experiment: updated });
}

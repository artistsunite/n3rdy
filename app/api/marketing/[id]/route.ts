import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = session.user.id as string;

  const brief = await db.marketingBrief.findUnique({ where: { id } });
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (brief.userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.marketingBrief.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

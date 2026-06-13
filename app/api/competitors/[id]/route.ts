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
  const body = await req.json() as {
    name?: string;
    website?: string | null;
    pricingUrl?: string | null;
    blogUrl?: string | null;
    productUrl?: string | null;
    description?: string | null;
    isActive?: boolean;
  };

  const competitor = await db.competitor.findFirst({ where: { id, userId: session.user.id } });
  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.website !== undefined ? { website: body.website } : {}),
    ...(body.pricingUrl !== undefined ? { pricingUrl: body.pricingUrl } : {}),
    ...(body.blogUrl !== undefined ? { blogUrl: body.blogUrl } : {}),
    ...(body.productUrl !== undefined ? { productUrl: body.productUrl } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
  };
  const updated = await db.competitor.update({ where: { id }, data });
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

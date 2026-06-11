import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  // Ensure user exists in PostgreSQL
  await db.user.upsert({
    where: { id: uid },
    create: { id: uid, email: session.user.email ?? '', name: session.user.name ?? null, image: session.user.image ?? null },
    update: {},
  });

  const userSources = await db.userSource.findMany({
    where: { userId: uid },
    include: { source: true },
    orderBy: [{ priority: 'desc' }, { addedAt: 'asc' }],
  });

  // If user has no sources yet, seed with defaults
  if (userSources.length === 0) {
    const defaults = await db.source.findMany({ where: { isDefault: true } });
    for (const s of defaults) {
      await db.userSource.upsert({
        where: { userId_sourceId: { userId: uid, sourceId: s.id } },
        create: { userId: uid, sourceId: s.id },
        update: {},
      });
    }
    const seeded = await db.userSource.findMany({
      where: { userId: uid },
      include: { source: true },
    });
    return NextResponse.json({ sources: seeded.map((us) => ({ ...us.source, priority: us.priority, isActive: us.isActive })) });
  }

  return NextResponse.json({
    sources: userSources.map((us) => ({ ...us.source, priority: us.priority, isActive: us.isActive, userSourceId: us.id })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const body = await req.json();
  const { name, url, rssUrl, category = 'general', region = 'global' } = body;

  if (!name || !url) return NextResponse.json({ error: 'name and url are required' }, { status: 400 });

  const source = await db.source.upsert({
    where: { url: url },
    create: { name, url, rssUrl: rssUrl ?? null, category, region },
    update: { name, rssUrl: rssUrl ?? undefined },
  });

  const userSource = await db.userSource.upsert({
    where: { userId_sourceId: { userId: uid, sourceId: source.id } },
    create: { userId: uid, sourceId: source.id },
    update: { isActive: true },
  });

  return NextResponse.json({ source, userSource }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get('sourceId');
  if (!sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 });

  await db.userSource.deleteMany({ where: { userId: uid, sourceId } });
  return NextResponse.json({ ok: true });
}

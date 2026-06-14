import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const DEFAULT_SOURCES = [
  { name: 'Reuters', url: 'https://reuters.com', rssUrl: 'https://feeds.reuters.com/reuters/businessNews', category: 'markets', region: 'global', trustScore: 0.92, biasTag: 'center' },
  { name: 'Bloomberg', url: 'https://bloomberg.com', rssUrl: 'https://feeds.bloomberg.com/markets/news.rss', category: 'markets', region: 'global', trustScore: 0.90, biasTag: 'financial' },
  { name: 'Financial Times', url: 'https://ft.com', rssUrl: 'https://www.ft.com/world?format=rss', category: 'markets', region: 'global', trustScore: 0.91, biasTag: 'financial' },
  { name: 'The Wall Street Journal', url: 'https://wsj.com', rssUrl: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'markets', region: 'us', trustScore: 0.89, biasTag: 'financial' },
  { name: 'CNBC', url: 'https://cnbc.com', rssUrl: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'markets', region: 'us', trustScore: 0.78, biasTag: 'financial' },
  { name: 'MarketWatch', url: 'https://marketwatch.com', rssUrl: 'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines', category: 'markets', region: 'us', trustScore: 0.80, biasTag: 'financial' },
  { name: 'CoinDesk', url: 'https://coindesk.com', rssUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'crypto', region: 'global', trustScore: 0.80, biasTag: 'technical' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com', rssUrl: 'https://cointelegraph.com/rss', category: 'crypto', region: 'global', trustScore: 0.75, biasTag: 'technical' },
  { name: 'The Block', url: 'https://theblock.co', rssUrl: 'https://www.theblock.co/rss.xml', category: 'crypto', region: 'global', trustScore: 0.82, biasTag: 'technical' },
  { name: 'Decrypt', url: 'https://decrypt.co', rssUrl: 'https://decrypt.co/feed', category: 'crypto', region: 'global', trustScore: 0.78, biasTag: 'technical' },
  { name: 'TechCrunch', url: 'https://techcrunch.com', rssUrl: 'https://techcrunch.com/feed/', category: 'technology', region: 'global', trustScore: 0.80, biasTag: 'technical' },
  { name: 'Ars Technica', url: 'https://arstechnica.com', rssUrl: 'https://feeds.arstechnica.com/arstechnica/index', category: 'technology', region: 'global', trustScore: 0.85, biasTag: 'technical' },
  { name: 'BBC News Business', url: 'https://bbc.com/news/business', rssUrl: 'http://feeds.bbci.co.uk/news/business/rss.xml', category: 'macro', region: 'global', trustScore: 0.87, biasTag: 'center' },
  { name: 'The Guardian Business', url: 'https://theguardian.com/business', rssUrl: 'https://www.theguardian.com/business/rss', category: 'macro', region: 'global', trustScore: 0.83, biasTag: 'left' },
  { name: 'Federal Reserve', url: 'https://federalreserve.gov', rssUrl: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'macro', region: 'us', trustScore: 0.99, biasTag: 'official' },
  { name: 'Al Jazeera', url: 'https://aljazeera.com', rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'geopolitics', region: 'global', trustScore: 0.78, biasTag: 'center' },
  { name: 'Oil Price', url: 'https://oilprice.com', rssUrl: 'https://oilprice.com/rss/main', category: 'markets', region: 'global', trustScore: 0.76, biasTag: 'technical' },
  { name: 'Seeking Alpha', url: 'https://seekingalpha.com', rssUrl: 'https://seekingalpha.com/market_currents.xml', category: 'markets', region: 'us', trustScore: 0.72, biasTag: 'financial' },
  { name: 'Australian Financial Review', url: 'https://afr.com', rssUrl: 'https://www.afr.com/rss', category: 'markets', region: 'au', trustScore: 0.84, biasTag: 'financial' },
];

async function ensureSourcesSeeded() {
  const count = await db.source.count({ where: { isDefault: true } });
  if (count > 0) return;
  for (const s of DEFAULT_SOURCES) {
    await db.source.upsert({
      where: { url: s.url },
      create: { ...s, isDefault: true },
      update: { trustScore: s.trustScore, rssUrl: s.rssUrl },
    });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  await db.user.upsert({
    where: { id: uid },
    create: { id: uid, email: session.user.email ?? '', name: session.user.name ?? null, image: session.user.image ?? null },
    update: {},
  });

  // Ensure the global source catalogue is populated
  await ensureSourcesSeeded();

  const sourceInclude = { include: { source: { include: { _count: { select: { articles: true } } } } } } as const;

  const userSources = await db.userSource.findMany({
    where: { userId: uid },
    ...sourceInclude,
    orderBy: [{ priority: 'desc' }, { addedAt: 'asc' }],
  });

  // First visit — assign all defaults to this user
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
      ...sourceInclude,
      orderBy: [{ priority: 'desc' }, { addedAt: 'asc' }],
    });
    return NextResponse.json({
      sources: seeded.map((us) => ({ ...us.source, articleCount: us.source._count.articles, priority: us.priority, isActive: us.isActive, userSourceId: us.id })),
    });
  }

  return NextResponse.json({
    sources: userSources.map((us) => ({
      ...us.source,
      articleCount: us.source._count.articles,
      priority: us.priority,
      isActive: us.isActive,
      userSourceId: us.id,
    })),
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
    where: { url },
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

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const { sourceId, isActive, priority } = await req.json();
  if (!sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 });

  const updated = await db.userSource.updateMany({
    where: { userId: uid, sourceId },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(priority !== undefined ? { priority } : {}),
    },
  });

  return NextResponse.json({ ok: true, updated: updated.count });
}

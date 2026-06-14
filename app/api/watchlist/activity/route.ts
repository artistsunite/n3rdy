import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';

type Period = '24h' | '3d' | '5d' | '7d';
const PERIOD_MS: Record<Period, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '5d': 5 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

type Entities = { companies?: string[]; assets?: string[]; people?: string[]; countries?: string[] };
type AnalysisRow = {
  articleTitle: string;
  sentiment: string;
  entities: Entities | null;
  sectorsAffected: string[];
  analyzedAt: Date;
};

type KeywordRow = { title: string; sentiment: string | null; fetchedAt: Date };

function matchEntities(entities: Entities | null, sectors: string[], term: string, type: string): boolean {
  const lower = term.toLowerCase();
  if (type === 'COMPANY') return entities?.companies?.some(c => c.toLowerCase().includes(lower)) ?? false;
  if (type === 'ASSET') return entities?.assets?.some(a => a.toLowerCase().includes(lower)) ?? false;
  if (type === 'PERSON') return entities?.people?.some(p => p.toLowerCase().includes(lower)) ?? false;
  if (type === 'COUNTRY') return entities?.countries?.some(c => c.toLowerCase().includes(lower)) ?? false;
  if (type === 'SECTOR') return sectors?.some(s => s.toLowerCase().includes(lower)) ?? false;
  return false;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') ?? '7d') as Period;
  const since = new Date(Date.now() - (PERIOD_MS[period] ?? PERIOD_MS['7d']));

  const watchlist = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { priority: 'desc' },
  });

  if (watchlist.length === 0) return NextResponse.json({ items: [], period });

  const entityTypes = new Set(['COMPANY', 'ASSET', 'PERSON', 'COUNTRY', 'SECTOR']);
  const entityItems = watchlist.filter(i => entityTypes.has(i.type));
  const keywordItems = watchlist.filter(i => !entityTypes.has(i.type));

  // One batch fetch for all entity-type items (COMPANY, ASSET, PERSON, COUNTRY, SECTOR)
  const analysisRowsPromise = entityItems.length > 0
    ? prisma.articleAnalysis.findMany({
        where: { analyzedAt: { gte: since } },
        select: {
          entities: true,
          sectorsAffected: true,
          sentiment: true,
          analyzedAt: true,
          article: { select: { title: true } },
        },
        orderBy: { analyzedAt: 'desc' },
        take: 2000,
      })
    : Promise.resolve([]);

  // Keyword-type items use DB-level text search — fan out in parallel
  const keywordSearches = keywordItems.map(item =>
    prisma.article.findMany({
      where: {
        fetchedAt: { gte: since },
        OR: [
          { title: { contains: item.value, mode: 'insensitive' } },
          { analysis: { shortSummary: { contains: item.value, mode: 'insensitive' } } },
        ],
      },
      select: { title: true, fetchedAt: true, analysis: { select: { sentiment: true } } },
      orderBy: { fetchedAt: 'desc' },
      take: 50,
    }).then(rows => ({ item, rows }))
  );

  const [analysisRows, ...keywordResults] = await Promise.all([analysisRowsPromise, ...keywordSearches]);

  const rows: AnalysisRow[] = (analysisRows as Array<{ entities: unknown; sectorsAffected: unknown; sentiment: string; analyzedAt: Date; article: { title: string } }>).map(r => ({
    articleTitle: r.article.title,
    sentiment: r.sentiment,
    entities: r.entities as Entities | null,
    sectorsAffected: (r.sectorsAffected as string[]) ?? [],
    analyzedAt: r.analyzedAt,
  }));

  const entityResults = entityItems.map(item => {
    const matches = rows.filter(r => matchEntities(r.entities, r.sectorsAffected, item.value, item.type));
    return { item, matches };
  });

  const items = [
    ...entityResults.map(({ item, matches }) => ({
      id: item.id,
      type: item.type,
      value: item.value,
      label: item.label,
      count: matches.length,
      latestHeadline: matches[0]?.articleTitle ?? null,
      latestSentiment: matches[0]?.sentiment ?? null,
    })),
    ...keywordResults.map(({ item, rows: krows }) => ({
      id: item.id,
      type: item.type,
      value: item.value,
      label: item.label,
      count: krows.length,
      latestHeadline: krows[0]?.title ?? null,
      latestSentiment: krows[0]?.analysis?.sentiment ?? null,
    })),
  ];

  // Restore original watchlist order
  const order = new Map(watchlist.map((w, i) => [w.id, i]));
  items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json({ items, period });
}

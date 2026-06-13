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

async function countMentions(
  term: string,
  type: string,
  since: Date
): Promise<{ count: number; latestHeadline: string | null; latestSentiment: string | null }> {
  const termLower = term.toLowerCase();

  if (type === 'COMPANY') {
    const rows = await prisma.articleAnalysis.findMany({
      where: { analyzedAt: { gte: since } },
      select: { entities: true, article: { select: { title: true } }, sentiment: true, analyzedAt: true },
      orderBy: { analyzedAt: 'desc' },
    });
    const matches = rows.filter(r => {
      const ents = r.entities as { companies?: string[] } | null;
      return ents?.companies?.some(c => c.toLowerCase().includes(termLower));
    });
    return {
      count: matches.length,
      latestHeadline: matches[0]?.article?.title ?? null,
      latestSentiment: matches[0]?.sentiment ?? null,
    };
  }

  if (type === 'ASSET') {
    const rows = await prisma.articleAnalysis.findMany({
      where: { analyzedAt: { gte: since } },
      select: { entities: true, article: { select: { title: true } }, sentiment: true, analyzedAt: true },
      orderBy: { analyzedAt: 'desc' },
    });
    const matches = rows.filter(r => {
      const ents = r.entities as { assets?: string[] } | null;
      return ents?.assets?.some(a => a.toLowerCase().includes(termLower));
    });
    return {
      count: matches.length,
      latestHeadline: matches[0]?.article?.title ?? null,
      latestSentiment: matches[0]?.sentiment ?? null,
    };
  }

  if (type === 'SECTOR') {
    const rows = await prisma.articleAnalysis.findMany({
      where: { analyzedAt: { gte: since } },
      select: { sectorsAffected: true, article: { select: { title: true } }, sentiment: true, analyzedAt: true },
      orderBy: { analyzedAt: 'desc' },
    });
    const matches = rows.filter(r => {
      const sectors = r.sectorsAffected as string[] | null;
      return sectors?.some(s => s.toLowerCase().includes(termLower));
    });
    return {
      count: matches.length,
      latestHeadline: matches[0]?.article?.title ?? null,
      latestSentiment: matches[0]?.sentiment ?? null,
    };
  }

  if (type === 'COUNTRY') {
    const rows = await prisma.articleAnalysis.findMany({
      where: { analyzedAt: { gte: since } },
      select: { entities: true, article: { select: { title: true } }, sentiment: true, analyzedAt: true },
      orderBy: { analyzedAt: 'desc' },
    });
    const matches = rows.filter(r => {
      const ents = r.entities as { countries?: string[] } | null;
      return ents?.countries?.some(c => c.toLowerCase().includes(termLower));
    });
    return {
      count: matches.length,
      latestHeadline: matches[0]?.article?.title ?? null,
      latestSentiment: matches[0]?.sentiment ?? null,
    };
  }

  if (type === 'PERSON') {
    const rows = await prisma.articleAnalysis.findMany({
      where: { analyzedAt: { gte: since } },
      select: { entities: true, article: { select: { title: true } }, sentiment: true, analyzedAt: true },
      orderBy: { analyzedAt: 'desc' },
    });
    const matches = rows.filter(r => {
      const ents = r.entities as { people?: string[] } | null;
      return ents?.people?.some(p => p.toLowerCase().includes(termLower));
    });
    return {
      count: matches.length,
      latestHeadline: matches[0]?.article?.title ?? null,
      latestSentiment: matches[0]?.sentiment ?? null,
    };
  }

  // KEYWORD, WEBSITE, SOCIAL_PAGE — text search in title + shortSummary
  const articles = await prisma.article.findMany({
    where: {
      fetchedAt: { gte: since },
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { analysis: { shortSummary: { contains: term, mode: 'insensitive' } } },
      ],
    },
    select: { title: true, analysis: { select: { sentiment: true } } },
    orderBy: { fetchedAt: 'desc' },
    take: 50,
  });

  return {
    count: articles.length,
    latestHeadline: articles[0]?.title ?? null,
    latestSentiment: articles[0]?.analysis?.sentiment ?? null,
  };
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

  const items = await Promise.all(
    watchlist.map(async item => {
      const { count, latestHeadline, latestSentiment } = await countMentions(item.value, item.type, since);
      return {
        id: item.id,
        type: item.type,
        value: item.value,
        label: item.label,
        count,
        latestHeadline,
        latestSentiment,
      };
    })
  );

  return NextResponse.json({ items, period });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateBriefing } from '@/lib/ai';

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

  await db.user.upsert({
    where: { id: uid },
    create: { id: uid, email: session.user.email ?? '', name: session.user.name ?? null },
    update: {},
  });

  const userSources = await db.userSource.findMany({
    where: { userId: uid, isActive: true },
    select: { sourceId: true },
  });
  const sourceIds = userSources.map((us) => us.sourceId);

  if (sourceIds.length === 0) {
    return NextResponse.json({ error: 'No active sources. Set up your sources first.' }, { status: 400 });
  }

  // Prefer analysed articles from last 24h; fall back to most recent analysed regardless of age
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const analysedWhere = {
    sourceId: { in: sourceIds },
    analysis: { isNot: null as null },
  };

  let articles = await db.article.findMany({
    where: { ...analysedWhere, publishedAt: { gte: since } },
    include: {
      source: { select: { name: true, category: true } },
      analysis: {
        select: {
          sentiment: true,
          marketImpactScore: true,
          bullishBearish: true,
          shortSummary: true,
          sectorsAffected: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: 30,
  });

  // Fall back: any analysed articles, no time limit
  if (articles.length < 5) {
    articles = await db.article.findMany({
      where: analysedWhere,
      include: {
        source: { select: { name: true, category: true } },
        analysis: {
          select: {
            sentiment: true,
            marketImpactScore: true,
            bullishBearish: true,
            shortSummary: true,
            sectorsAffected: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });
  }

  // Last resort: unanalysed articles (use raw summary as shortSummary)
  if (articles.length === 0) {
    const rawArticles = await db.article.findMany({
      where: { sourceId: { in: sourceIds } },
      include: { source: { select: { name: true, category: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });
    if (rawArticles.length === 0) {
      return NextResponse.json(
        { error: 'No articles yet. Refresh your news feed first, then generate a briefing.' },
        { status: 400 }
      );
    }
    // Synthesise analysis-shaped data from raw articles
    articles = rawArticles.map((a) => ({
      ...a,
      analysis: {
        sentiment: 'neutral',
        marketImpactScore: 0.5,
        bullishBearish: 'neutral',
        shortSummary: a.summary ?? a.title,
        sectorsAffected: [],
      },
    })) as typeof articles;
  }

  const preferences = await db.userPreferences.findUnique({ where: { userId: uid } }).catch(() => null);

  const content = await generateBriefing({
    userId: uid,
    articles: articles.map((a) => ({
      title: a.title,
      shortSummary: a.analysis!.shortSummary,
      sentiment: a.analysis!.sentiment,
      marketImpactScore: a.analysis!.marketImpactScore,
      sourceName: a.source.name,
      publishedAt: a.publishedAt.toISOString(),
      sectorsAffected: (a.analysis!.sectorsAffected as string[]) ?? [],
      bullishBearish: a.analysis!.bullishBearish,
    })),
    preferences: preferences
      ? {
          briefingStyle: preferences.briefingStyle,
          enabledCategories: preferences.enabledCategories ?? undefined,
          businessType: preferences.businessType ?? undefined,
          industry: preferences.industry ?? undefined,
        }
      : undefined,
  });

  const briefing = await db.briefing.create({
    data: {
      userId: uid,
      type,
      content: content as object,
      plainText: content.executiveSummary,
    },
    select: { id: true, type: true, content: true, plainText: true, read: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, briefing });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await db.briefing.updateMany({ where: { id, userId: session.user.id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}

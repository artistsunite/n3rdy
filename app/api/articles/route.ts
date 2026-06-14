import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const category = searchParams.get('category');
  const sentiment = searchParams.get('sentiment');
  const minImpact = parseFloat(searchParams.get('minImpact') ?? '0');
  const analysedOnly = searchParams.get('analysedOnly') === 'true';
  const search = searchParams.get('search')?.trim();
  const riskLevel = searchParams.get('riskLevel');
  const period = searchParams.get('period'); // e.g. '24h', '7d', '30d'

  const userSources = await db.userSource.findMany({
    where: { userId: uid, isActive: true },
    select: { sourceId: true },
  });
  const sourceIds = userSources.map((us) => us.sourceId);

  if (sourceIds.length === 0) {
    return NextResponse.json({ articles: [], total: 0, limit, offset });
  }

  // Build where clause — analysis is optional unless explicitly filtered
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { sourceId: { in: sourceIds } };

  if (period) {
    const periodMs: Record<string, number> = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
    const ms = periodMs[period];
    if (ms) where.publishedAt = { gte: new Date(Date.now() - ms) };
  }

  if (analysedOnly) {
    where.analysis = { isNot: null };
  }

  if (category) {
    where.source = { category };
  }

  if (sentiment && sentiment !== 'all') {
    where.analysis = { ...(where.analysis ?? {}), sentiment };
  }

  if (minImpact > 0) {
    where.analysis = { ...(where.analysis ?? {}), marketImpactScore: { gte: minImpact } };
  }

  if (riskLevel && riskLevel !== 'all') {
    where.analysis = { ...(where.analysis ?? {}), riskLevel };
  }

  if (search && search.length >= 2) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { analysis: { shortSummary: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where,
      include: {
        source: { select: { name: true, category: true, trustScore: true } },
        analysis: {
          select: {
            sentiment: true,
            sentimentScore: true,
            bullishBearish: true,
            marketImpactScore: true,
            urgencyScore: true,
            riskLevel: true,
            shortSummary: true,
            keyFacts: true,
            sectorsAffected: true,
          },
        },
      },
      orderBy: [
        { publishedAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    db.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, limit, offset });
}

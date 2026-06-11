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

  const userSources = await db.userSource.findMany({
    where: { userId: uid, isActive: true },
    select: { sourceId: true },
  });
  const sourceIds = userSources.map((us) => us.sourceId);

  const where: Record<string, unknown> = {
    sourceId: { in: sourceIds },
    analysis: { isNot: null },
  };

  if (category) {
    where.source = { category };
  }

  if (sentiment) {
    where.analysis = { sentiment };
  }

  if (minImpact > 0) {
    where.analysis = { ...(where.analysis as object), marketImpactScore: { gte: minImpact } };
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
      orderBy: [{ analysis: { marketImpactScore: 'desc' } }, { publishedAt: 'desc' }],
      take: limit,
      skip: offset,
    }),
    db.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, limit, offset });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? '24h';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50);

  const topics = await db.trendingTopic.findMany({
    where: { period },
    orderBy: [{ mentionCount: 'desc' }, { velocity: 'desc' }],
    take: limit,
  });

  // If no pre-computed topics, derive from recent entity mention counts
  if (topics.length === 0) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentArticleIds = await db.article.findMany({
      where: { publishedAt: { gte: since } },
      select: { id: true },
    });
    const articleIdSet = new Set(recentArticleIds.map((a) => a.id));

    const entityMentions = await db.articleEntity.findMany({
      where: { articleId: { in: Array.from(articleIdSet) } },
      include: { entity: true },
    });

    const counts: Record<string, { entity: typeof entityMentions[0]['entity']; count: number }> = {};
    for (const ae of entityMentions) {
      const key = ae.entityId;
      if (!counts[key]) counts[key] = { entity: ae.entity, count: 0 };
      counts[key].count += ae.mentionCount;
    }

    const derived = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ entity, count }) => ({
        id: entity.id,
        name: entity.name,
        category: entity.type.toLowerCase(),
        mentionCount: count,
        velocity: 0,
        sentimentScore: 0,
        period,
        computedAt: new Date(),
      }));

    return NextResponse.json({ topics: derived });
  }

  return NextResponse.json({ topics });
}

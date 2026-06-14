import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateOpportunities } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await auth();
  const cronUserId = req.headers.get('x-cron-user-id');
  const cronSecret = req.headers.get('x-cron-secret');

  const envSecret = process.env.CRON_SECRET;
  const rawEnvSecret = envSecret ? (envSecret.charCodeAt(0) === 0xFEFF ? envSecret.slice(1) : envSecret).trim() : '';

  let userId: string;
  if (cronUserId && cronSecret && rawEnvSecret && cronSecret === rawEnvSecret) {
    userId = cronUserId;
  } else if (session?.user?.id) {
    userId = session.user.id;
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await db.businessProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: 'Business profile required' }, { status: 400 });

  const userSources = await db.userSource.findMany({ where: { userId, isActive: true }, select: { sourceId: true } });
  const sourceIds = userSources.map(s => s.sourceId);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [articles, competitorEvents, trendingTopics, userInsights] = await Promise.all([
    sourceIds.length > 0 ? db.article.findMany({
      where: {
        sourceId: { in: sourceIds },
        analysis: { isNot: null },
        publishedAt: { gte: thirtyDaysAgo },
      },
      include: { analysis: { select: { shortSummary: true, marketImpactScore: true } } },
      orderBy: [{ analysis: { marketImpactScore: 'desc' } }, { publishedAt: 'desc' }],
      take: 15,
    }) : Promise.resolve([]),
    db.competitorEvent.findMany({
      where: { userId, detectedAt: { gte: thirtyDaysAgo } },
      orderBy: { detectedAt: 'desc' },
      take: 8,
    }),
    db.trendingTopic.findMany({
      where: { period: '24h' },
      orderBy: { mentionCount: 'desc' },
      take: 8,
    }),
    db.userInsight.findMany({
      where: { userId, answer: { not: null } },
      take: 10,
    }),
  ]);

  const opportunities = await generateOpportunities({
    businessProfile: profile,
    recentArticles: articles.map(a => ({ title: a.title, summary: a.analysis?.shortSummary })),
    competitorEvents: competitorEvents.map(e => ({ title: e.title, eventType: e.eventType, aiSummary: e.aiSummary })),
    trendingTopics: trendingTopics.map(t => ({ name: t.name, category: t.category })),
    userInsights: userInsights.map(i => ({ question: i.question, answer: i.answer })),
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const created = await db.$transaction(
    opportunities.map(o =>
      db.growthOpportunity.create({
        data: {
          userId,
          type: o.type,
          title: o.title,
          description: o.description,
          reason: o.reason,
          confidenceScore: o.confidenceScore,
          impactScore: o.impactScore,
          urgencyScore: o.urgencyScore,
          difficultyScore: o.difficultyScore,
          potentialRevenue: o.potentialRevenue ?? null,
          timeHorizon: o.timeHorizon ?? null,
          suggestedActions: o.suggestedActions,
          dataSources: o.dataSources,
          expiresAt,
        },
      })
    )
  );

  return NextResponse.json({ opportunities: created });
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateAdvisorReport } from '@/lib/ai';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const report = await db.advisorReport.findFirst({
    where: { userId: session.user.id },
    orderBy: { generatedAt: 'desc' },
  });

  if (report && !report.isRead) {
    await db.advisorReport.update({ where: { id: report.id }, data: { isRead: true } });
  }

  return NextResponse.json({ report });
}

export async function POST(req: Request) {
  // Support cron-triggered generation via x-cron-user-id header
  const cronUserId = req.headers.get('x-cron-user-id');
  const cronSecret = req.headers.get('x-cron-secret');
  const envSecret = process.env.CRON_SECRET;
  const rawEnvSecret = envSecret ? (envSecret.charCodeAt(0) === 0xFEFF ? envSecret.slice(1) : envSecret).trim() : '';

  let userId: string;
  if (cronUserId && cronSecret && rawEnvSecret && cronSecret === rawEnvSecret) {
    userId = cronUserId;
  } else {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userId = session.user.id;
  }

  const userSources = await db.userSource.findMany({ where: { userId, isActive: true }, select: { sourceId: true } });
  const sourceIds = userSources.map(s => s.sourceId);

  const [profile, briefing, opportunities, competitorEvents, trendingTopics, recentArticles] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId } }),
    db.briefing.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    db.growthOpportunity.findMany({
      where: { userId, status: { in: ['new', 'viewed'] } },
      orderBy: [{ impactScore: 'desc' }, { urgencyScore: 'desc' }],
      take: 5,
    }),
    db.competitorEvent.findMany({
      where: { userId, detectedAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      orderBy: { detectedAt: 'desc' },
      take: 5,
    }),
    db.trendingTopic.findMany({
      where: { period: '24h' },
      orderBy: { mentionCount: 'desc' },
      take: 8,
    }),
    sourceIds.length > 0 ? db.article.findMany({
      where: {
        sourceId: { in: sourceIds },
        analysis: { isNot: null },
        publishedAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) },
      },
      include: { analysis: { select: { shortSummary: true, sentiment: true, marketImpactScore: true } } },
      orderBy: [{ analysis: { marketImpactScore: 'desc' } }, { publishedAt: 'desc' }],
      take: 8,
    }) : Promise.resolve([]),
  ]);

  if (!profile) return NextResponse.json({ error: 'Business profile required' }, { status: 400 });

  type BriefingContent = { executiveSummary?: string };
  const briefingContent = briefing?.content as BriefingContent | null;
  const recentBriefingSummary = briefingContent?.executiveSummary ?? '';

  const content = await generateAdvisorReport({
    businessProfile: profile,
    recentBriefingSummary,
    opportunities: opportunities.map(o => ({
      title: o.title,
      type: o.type,
      description: o.description,
      impactScore: o.impactScore,
      urgencyScore: o.urgencyScore,
    })),
    competitorEvents: competitorEvents.map(e => ({
      title: e.title,
      eventType: e.eventType,
      aiSummary: e.aiSummary,
      importance: e.importance,
    })),
    trendingTopics: trendingTopics.map(t => ({ name: t.name, category: t.category })),
    recentArticles: recentArticles.map(a => ({
      title: a.title,
      sentiment: a.analysis?.sentiment,
      shortSummary: a.analysis?.shortSummary,
    })),
  });

  const report = await db.advisorReport.create({
    data: { userId, content: content as unknown as Parameters<typeof db.advisorReport.create>[0]['data']['content'] },
  });

  return NextResponse.json({ report });
}

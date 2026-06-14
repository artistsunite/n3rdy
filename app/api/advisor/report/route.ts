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

  const [profile, briefing, opportunities, competitorEvents, trendingTopics] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId } }),
    db.briefing.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    db.growthOpportunity.findMany({
      where: { userId, status: { in: ['new', 'viewed'] } },
      orderBy: [{ impactScore: 'desc' }, { urgencyScore: 'desc' }],
      take: 5,
    }),
    db.competitorEvent.findMany({
      where: { userId },
      orderBy: { detectedAt: 'desc' },
      take: 5,
    }),
    db.trendingTopic.findMany({
      where: { period: '24h' },
      orderBy: { mentionCount: 'desc' },
      take: 8,
    }),
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
  });

  const report = await db.advisorReport.create({
    data: { userId, content: content as unknown as Parameters<typeof db.advisorReport.create>[0]['data']['content'] },
  });

  return NextResponse.json({ report });
}

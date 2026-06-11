import { Job } from 'bullmq';
import { db } from '@/lib/db';
import { generateBriefing } from '@/lib/ai';
import { adminDb } from '@/lib/firestore-admin';
import { createWorker, type BriefingJobData } from '@/lib/queue';

async function processBriefing(job: Job<BriefingJobData>) {
  const { userId, type = 'daily' } = job.data;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      userSources: { where: { isActive: true }, include: { source: true } },
    },
  });
  if (!user) return;

  const activeSourceIds = user.userSources.map((us) => us.sourceId);

  // Fetch recent articles with analysis from user's sources
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const articles = await db.article.findMany({
    where: {
      sourceId: { in: activeSourceIds },
      publishedAt: { gte: since },
      analysis: { isNot: null },
    },
    include: { source: true, analysis: true },
    orderBy: [
      { analysis: { marketImpactScore: 'desc' } },
      { publishedAt: 'desc' },
    ],
    take: 30,
  });

  if (articles.length === 0) {
    console.log(`No recent articles found for user ${userId}, skipping briefing`);
    return;
  }

  const articleData = articles.map((a) => ({
    title: a.title,
    shortSummary: a.analysis!.shortSummary,
    sentiment: a.analysis!.sentiment,
    marketImpactScore: a.analysis!.marketImpactScore,
    sourceName: a.source.name,
    publishedAt: a.publishedAt.toISOString(),
    sectorsAffected: a.analysis!.sectorsAffected as string[],
    bullishBearish: a.analysis!.bullishBearish,
  }));

  let content;
  try {
    content = await generateBriefing({
      userId,
      articles: articleData,
      preferences: user.preferences
        ? {
            briefingStyle: user.preferences.briefingStyle ?? undefined,
            enabledCategories: user.preferences.enabledCategories ?? undefined,
            businessType: user.preferences.businessType ?? undefined,
            industry: user.preferences.industry ?? undefined,
          }
        : undefined,
    });
  } catch (err) {
    console.error(`Briefing generation failed for user ${userId}:`, err);
    return;
  }

  const plainText = [
    content.executiveSummary,
    '',
    'TOP STORIES',
    ...content.topStories.map((s) => `• ${s.headline}: ${s.summary}`),
    '',
    'MARKET OUTLOOK',
    content.marketImpactForecast,
    '',
    '7-DAY OUTLOOK',
    content.sevenDayOutlook,
  ].join('\n');

  // Save to PostgreSQL
  const briefing = await db.briefing.create({
    data: {
      userId,
      type,
      content: content as object,
      plainText,
    },
  });

  // Also write to Firestore for real-time delivery
  try {
    await adminDb()
      .collection('users')
      .doc(userId)
      .collection('briefings')
      .doc(briefing.id)
      .set({
        text: plainText,
        createdAt: new Date(),
        read: false,
      });
  } catch (err) {
    console.error(`Firestore briefing write failed for user ${userId}:`, err);
  }

  console.log(`Generated briefing ${briefing.id} for user ${userId}`);
}

export function startBriefingWorker() {
  return createWorker<BriefingJobData>('briefing', processBriefing);
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIngestQueue, getCompetitorScanQueue } from '@/lib/queue';

// Secured with a shared secret — call from Firebase Scheduled Functions or external cron
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sources = await db.source.findMany({
    where: { isActive: true, rssUrl: { not: null } },
  });

  const queue = getIngestQueue();
  let enqueued = 0;

  for (const source of sources) {
    await queue.add('ingest', { sourceId: source.id }, { jobId: `ingest-${source.id}-${Date.now()}` });
    enqueued++;
  }

  // Auto-validate expired predictions as part of every cron cycle
  let predictionsValidated = 0;
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const rawSecret = process.env.CRON_SECRET ?? '';
    const secret = (rawSecret.charCodeAt(0) === 0xFEFF ? rawSecret.slice(1) : rawSecret).trim();
    const vRes = await fetch(`${baseUrl}/api/predictions/validate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
    });
    if (vRes.ok) {
      const vData = await vRes.json();
      predictionsValidated = vData.validated ?? 0;
    }
  } catch { /* non-fatal */ }

  // Enqueue competitor scans for all active competitors
  let competitorScansEnqueued = 0;
  try {
    const competitors = await db.competitor.findMany({ where: { isActive: true } });
    const competitorQueue = getCompetitorScanQueue();
    for (const competitor of competitors) {
      await competitorQueue.add('scan', { competitorId: competitor.id, userId: competitor.userId }, { jobId: `scan-${competitor.id}-${Date.now()}` });
      competitorScansEnqueued++;
    }
  } catch { /* non-fatal */ }

  // Auto-generate growth opportunities for users with profiles who haven't had one in 20h
  let opportunitiesGenerated = 0;
  try {
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const rawSecret = process.env.CRON_SECRET ?? '';
    const secret = (rawSecret.charCodeAt(0) === 0xFEFF ? rawSecret.slice(1) : rawSecret).trim();

    const profiles = await db.businessProfile.findMany({ select: { userId: true } });
    for (const { userId } of profiles) {
      const recent = await db.growthOpportunity.findFirst({
        where: { userId, generatedAt: { gte: twentyHoursAgo } },
      });
      if (!recent) {
        const r = await fetch(`${baseUrl}/api/growth/opportunities/generate`, {
          method: 'POST',
          headers: { 'x-cron-user-id': userId, 'x-cron-secret': secret },
        });
        if (r.ok) opportunitiesGenerated++;
      }
    }
  } catch { /* non-fatal */ }

  // Auto-generate advisor reports for users with profiles who haven't had one in 24h
  let reportsGenerated = 0;
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const rawSecret = process.env.CRON_SECRET ?? '';
    const secret = (rawSecret.charCodeAt(0) === 0xFEFF ? rawSecret.slice(1) : rawSecret).trim();

    const profiles = await db.businessProfile.findMany({ select: { userId: true } });
    for (const { userId } of profiles) {
      const recentReport = await db.advisorReport.findFirst({
        where: { userId, generatedAt: { gte: twentyFourHoursAgo } },
      });
      if (!recentReport) {
        const r = await fetch(`${baseUrl}/api/advisor/report`, {
          method: 'POST',
          headers: { 'x-cron-user-id': userId, 'x-cron-secret': secret },
        });
        if (r.ok) reportsGenerated++;
      }
    }
  } catch { /* non-fatal */ }

  // Auto-send email briefings for users who have enabled scheduled delivery
  let briefingEmailsSent = 0;
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const rawSecret = process.env.CRON_SECRET ?? '';
    const secret = (rawSecret.charCodeAt(0) === 0xFEFF ? rawSecret.slice(1) : rawSecret).trim();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const usersWithEmail = await db.userPreferences.findMany({
      where: { emailBriefingEnabled: true },
      select: { userId: true, emailBriefingFrequency: true, alertThresholds: true },
    });
    for (const pref of usersWithEmail) {
      // Skip weekends if frequency is weekdays
      const dayOfWeek = new Date().getDay();
      if (pref.emailBriefingFrequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
      // Check if already sent today
      const thresholds = (pref.alertThresholds as Record<string, unknown> | null) ?? {};
      const lastSent = thresholds.lastBriefingEmailSentAt as string | undefined;
      if (lastSent && new Date(lastSent) >= todayStart) continue;
      const r = await fetch(`${baseUrl}/api/briefings/email`, {
        method: 'POST',
        headers: { 'x-cron-user-id': pref.userId, 'x-cron-secret': secret },
      });
      if (r.ok) briefingEmailsSent++;
    }
  } catch { /* non-fatal */ }

  // Detect competitor news mentions in recently ingested articles
  let newsMentionsCreated = 0;
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allCompetitors = await db.competitor.findMany({
      where: { isActive: true },
      select: { id: true, userId: true, name: true },
    });
    const recentArticles = await db.article.findMany({
      where: { publishedAt: { gte: oneDayAgo } },
      include: { analysis: { select: { shortSummary: true, marketImpactScore: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    });

    if (allCompetitors.length > 0 && recentArticles.length > 0) {
      // Batch-fetch all existing news_mention events for these competitors to avoid N×M queries
      const articleUrls = recentArticles.map(a => a.url);
      const existingEvents = await db.competitorEvent.findMany({
        where: {
          competitorId: { in: allCompetitors.map(c => c.id) },
          eventType: 'news_mention',
          sourceUrl: { in: articleUrls },
        },
        select: { competitorId: true, sourceUrl: true },
      });
      const existingSet = new Set(existingEvents.map(e => `${e.competitorId}:${e.sourceUrl}`));

      for (const competitor of allCompetitors) {
        const nameLower = competitor.name.toLowerCase();
        for (const article of recentArticles) {
          const titleLower = article.title.toLowerCase();
          const summaryLower = (article.analysis?.shortSummary ?? '').toLowerCase();
          if (!titleLower.includes(nameLower) && !summaryLower.includes(nameLower)) continue;
          if (existingSet.has(`${competitor.id}:${article.url}`)) continue;

          const impact = article.analysis?.marketImpactScore ?? 0;
          await db.competitorEvent.create({
            data: {
              competitorId: competitor.id,
              userId: competitor.userId,
              eventType: 'news_mention',
              title: `News mention: ${article.title.slice(0, 100)}`,
              description: article.analysis?.shortSummary ?? article.title,
              sourceUrl: article.url,
              aiSummary: article.analysis?.shortSummary ?? 'Article mentions this competitor.',
              importance: impact > 0.7 ? 'high' : impact > 0.4 ? 'medium' : 'low',
            },
          });
          existingSet.add(`${competitor.id}:${article.url}`);
          newsMentionsCreated++;
        }
      }
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, enqueued, sourceCount: sources.length, predictionsValidated, competitorScansEnqueued, opportunitiesGenerated, reportsGenerated, briefingEmailsSent, newsMentionsCreated });
}

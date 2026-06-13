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

  return NextResponse.json({ ok: true, enqueued, sourceCount: sources.length, predictionsValidated, competitorScansEnqueued, opportunitiesGenerated });
}

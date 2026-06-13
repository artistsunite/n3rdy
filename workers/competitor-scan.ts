import { Job } from 'bullmq';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { createWorker, type CompetitorScanJobData } from '@/lib/queue';
import { scanCompetitorPage } from '@/lib/ai';

type PageType = 'home' | 'pricing' | 'blog' | 'product';

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'N3RDY Intelligence Bot/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, noscript, iframe').remove();
    return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);
  } finally {
    clearTimeout(timeout);
  }
}

async function processCompetitorScan(job: Job<CompetitorScanJobData>) {
  const { competitorId, userId } = job.data;

  const competitor = await db.competitor.findUnique({
    where: { id: competitorId },
    include: { snapshots: true },
  });
  if (!competitor || !competitor.isActive) return;

  const pages: Array<{ pageType: PageType; url: string | null }> = [
    { pageType: 'home', url: competitor.website },
    { pageType: 'pricing', url: competitor.pricingUrl },
    { pageType: 'blog', url: competitor.blogUrl },
    { pageType: 'product', url: competitor.productUrl },
  ];

  for (const { pageType, url } of pages) {
    if (!url) continue;

    let currentText: string;
    try {
      currentText = await fetchPageText(url);
    } catch (err) {
      console.warn(`[competitor-scan] Failed to fetch ${url}: ${(err as Error).message}`);
      continue;
    }

    const currentHash = createHash('sha256').update(currentText).digest('hex');
    const existing = competitor.snapshots.find(s => s.pageType === pageType);

    if (existing && existing.contentHash !== currentHash) {
      try {
        const result = await scanCompetitorPage({
          competitorName: competitor.name,
          pageType,
          url,
          previousText: existing.contentText,
          currentText,
        });

        await db.competitorEvent.create({
          data: {
            competitorId,
            userId,
            eventType: result.eventType,
            title: `${competitor.name} — ${pageType} page change`,
            description: result.summary,
            sourceUrl: url,
            aiSummary: result.summary,
            importance: result.importance,
          },
        });
      } catch (err) {
        console.error(`[competitor-scan] AI scan failed for ${competitor.name}:`, err);
      }
    }

    await db.competitorSnapshot.upsert({
      where: { competitorId_pageType: { competitorId, pageType } },
      create: { competitorId, pageType, url, contentHash: currentHash, contentText: currentText, changeDetected: !!existing && existing.contentHash !== currentHash },
      update: { url, contentHash: currentHash, contentText: currentText, capturedAt: new Date(), changeDetected: !!existing && existing.contentHash !== currentHash },
    });
  }

  await db.competitor.update({
    where: { id: competitorId },
    data: { lastCheckedAt: new Date() },
  });
}

export const competitorScanWorker = createWorker<CompetitorScanJobData>('competitor-scan', processCompetitorScan);

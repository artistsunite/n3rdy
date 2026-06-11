import { Job } from 'bullmq';
import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { createWorker, getAnalyzeQueue, type IngestJobData } from '@/lib/queue';

const rssParser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'N3RDY Intelligence Bot/1.0' },
});

async function processIngest(job: Job<IngestJobData>) {
  const { sourceId } = job.data;

  const source = await db.source.findUnique({ where: { id: sourceId } });
  if (!source?.rssUrl) return;

  let feed;
  try {
    feed = await rssParser.parseURL(source.rssUrl);
  } catch (err) {
    console.error(`RSS fetch failed for ${source.name}:`, err);
    return;
  }

  const analyzeQueue = getAnalyzeQueue();
  let newCount = 0;

  for (const item of feed.items.slice(0, 30)) {
    const url = item.link;
    if (!url) continue;

    const dedupeHash = createHash('sha256').update(url).digest('hex');
    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

    try {
      const article = await db.article.upsert({
        where: { dedupeHash },
        create: {
          title: item.title ?? 'Untitled',
          url,
          author: item.creator ?? item.author ?? null,
          publishedAt,
          summary: item.contentSnippet ?? item.summary ?? null,
          fullText: item.content ?? null,
          imageUrl: item.enclosure?.url ?? null,
          sourceId,
          dedupeHash,
        },
        update: {},
      });

      // Only enqueue analysis for newly created articles
      if (article.fetchedAt.getTime() > Date.now() - 5000) {
        await analyzeQueue.add('analyze', { articleId: article.id });
        newCount++;
      }
    } catch {
      // Duplicate URL — skip silently
    }
  }

  await db.source.update({
    where: { id: sourceId },
    data: { lastFetchedAt: new Date() },
  });

  console.log(`Ingested ${newCount} new articles from ${source.name}`);
}

export function startIngestWorker() {
  return createWorker<IngestJobData>('ingest', processIngest);
}

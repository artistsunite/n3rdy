import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { analyzeArticle } from '@/lib/ai';
import RSSParser from 'rss-parser';
import crypto from 'crypto';

const parser = new RSSParser({ requestOptions: { timeout: 10000 } });

interface RawSource {
  id: string;
  name: string;
  rssUrl: string;
}

async function ingestSource(source: RawSource): Promise<number> {
  let saved = 0;
  try {
    const feed = await parser.parseURL(source.rssUrl);
    const items = (feed.items ?? []).slice(0, 10);

    for (const item of items) {
      if (!item.title || !item.link) continue;
      const dedupeHash = crypto.createHash('sha256').update(item.link).digest('hex');
      try {
        await db.article.upsert({
          where: { dedupeHash },
          create: {
            title: item.title.trim(),
            url: item.link,
            summary: item.contentSnippet ?? null,
            fullText: item.content ?? item.contentSnippet ?? null,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            author: item.creator ?? null,
            sourceId: source.id,
            dedupeHash,
          },
          update: {},
        });
        saved++;
      } catch {
        // Unique constraint — article already exists
      }
    }
  } catch (err) {
    console.warn(`[ingest] ${source.name}: ${(err as Error).message}`);
  }
  return saved;
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  const userSources = await db.userSource.findMany({
    where: { userId: uid, isActive: true },
    include: { source: true },
  });

  const sources = userSources
    .map((us) => us.source)
    .filter((s): s is typeof s & { rssUrl: string } => !!s.rssUrl && s.isActive);

  if (sources.length === 0) {
    return NextResponse.json({ ok: false, message: 'No active sources with RSS feeds' });
  }

  // Phase 1: fetch all RSS feeds (parallel, batched 8 at a time)
  let articlesIngested = 0;
  for (let i = 0; i < sources.length; i += 8) {
    const batch = sources.slice(i, i + 8);
    const results = await Promise.allSettled(batch.map((s) => ingestSource(s)));
    for (const r of results) {
      if (r.status === 'fulfilled') articlesIngested += r.value;
    }
  }

  // Phase 2: AI-analyze unanalyzed articles (newest first, max 10 per run)
  const unanalyzed = await db.article.findMany({
    where: {
      sourceId: { in: sources.map((s) => s.id) },
      analysis: null,
    },
    include: { source: { select: { name: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  });

  let articlesAnalyzed = 0;
  for (let i = 0; i < unanalyzed.length; i += 5) {
    const batch = unanalyzed.slice(i, i + 5);
    await Promise.allSettled(
      batch.map(async (a) => {
        try {
          const result = await analyzeArticle({
            title: a.title,
            summary: a.summary,
            fullText: a.fullText,
            sourceName: a.source.name,
          });
          await db.articleAnalysis.create({
            data: {
              articleId: a.id,
              sentiment: result.sentiment,
              sentimentScore: result.sentimentScore,
              bullishBearish: result.bullishBearish,
              marketImpactScore: result.marketImpactScore,
              relevanceScore: result.relevanceScore,
              urgencyScore: result.urgencyScore,
              riskLevel: result.riskLevel,
              shortSummary: result.shortSummary,
              keyFacts: result.keyFacts,
              entities: result.entities,
              sectorsAffected: result.sectorsAffected,
              secondOrderEffects: result.secondOrderEffects,
            },
          });
          articlesAnalyzed++;
        } catch (err) {
          console.warn(`[analyze] article ${a.id}: ${(err as Error).message}`);
        }
      })
    );
  }

  // Update lastFetchedAt for processed sources + lastScanAt for user
  await Promise.all([
    db.source.updateMany({
      where: { id: { in: sources.map((s) => s.id) } },
      data: { lastFetchedAt: new Date() },
    }),
    db.userPreferences.upsert({
      where: { userId: uid },
      create: { userId, lastScanAt: new Date() },
      update: { lastScanAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    sourcesProcessed: sources.length,
    articlesIngested,
    articlesAnalyzed,
  });
}

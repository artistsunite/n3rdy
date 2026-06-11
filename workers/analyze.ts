import { Job } from 'bullmq';
import { db } from '@/lib/db';
import { analyzeArticle } from '@/lib/ai';
import { createWorker, type AnalyzeJobData } from '@/lib/queue';

async function processAnalyze(job: Job<AnalyzeJobData>) {
  const { articleId } = job.data;

  const article = await db.article.findUnique({
    where: { id: articleId },
    include: { source: true, analysis: true },
  });

  if (!article || article.analysis) return; // already analyzed

  let result;
  try {
    result = await analyzeArticle({
      title: article.title,
      summary: article.summary,
      fullText: article.fullText,
      sourceName: article.source.name,
    });
  } catch (err) {
    console.error(`Analysis failed for article ${articleId}:`, err);
    return;
  }

  await db.articleAnalysis.create({
    data: {
      articleId,
      sentiment: result.sentiment,
      sentimentScore: result.sentimentScore,
      bullishBearish: result.bullishBearish,
      marketImpactScore: result.marketImpactScore,
      relevanceScore: result.relevanceScore,
      urgencyScore: result.urgencyScore,
      riskLevel: result.riskLevel,
      sourceReliabilityScore: article.source.trustScore,
      shortSummary: result.shortSummary,
      keyFacts: result.keyFacts,
      entities: result.entities,
      sectorsAffected: result.sectorsAffected,
      secondOrderEffects: result.secondOrderEffects,
    },
  });

  // Upsert entities for trending tracking
  for (const [type, names] of Object.entries(result.entities)) {
    const entityType = type.toUpperCase().replace(/S$/, ''); // companies -> COMPANY
    for (const name of names as string[]) {
      if (!name) continue;
      const entity = await db.entity.upsert({
        where: { name_type: { name, type: entityType } },
        create: { name, type: entityType },
        update: {},
      });
      await db.articleEntity.upsert({
        where: { articleId_entityId: { articleId, entityId: entity.id } },
        create: { articleId, entityId: entity.id, mentionCount: 1 },
        update: { mentionCount: { increment: 1 } },
      });
    }
  }
}

export function startAnalyzeWorker() {
  return createWorker<AnalyzeJobData>('analyze', processAnalyze);
}

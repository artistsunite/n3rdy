import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateFeedbackQuestion } from '@/lib/ai';

// Auto-validates expired predictions using existing sentiment/article data.
// Called by the cron ingest route and optionally by admin/debug.
export async function POST(req: NextRequest) {
  const rawSecret = process.env.CRON_SECRET ?? '';
  const cronSecret = (rawSecret.charCodeAt(0) === 0xFEFF ? rawSecret.slice(1) : rawSecret).trim();
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find all PENDING predictions past their expiry
  const expired = await db.prediction.findMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    include: { outcome: true },
  });

  if (expired.length === 0) return NextResponse.json({ ok: true, validated: 0 });

  let validated = 0;

  for (const prediction of expired) {
    if (prediction.outcome) continue; // already has outcome

    // Gather articles mentioning this target published after the prediction was made
    const targetLower = prediction.target.toLowerCase();
    const relevantArticles = await db.article.findMany({
      where: {
        publishedAt: { gte: prediction.generatedAt, lte: now },
        OR: [
          { title: { contains: prediction.target, mode: 'insensitive' } },
          { summary: { contains: prediction.target, mode: 'insensitive' } },
        ],
        analysis: { isNot: null },
      },
      include: { analysis: { select: { bullishBearish: true, sentimentScore: true } } },
      take: 20,
    });

    let outcome: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | null = null;
    let actualDirection: string | null = null;

    if (relevantArticles.length >= 3) {
      const bullish = relevantArticles.filter(a => a.analysis?.bullishBearish === 'bullish').length;
      const bearish = relevantArticles.filter(a => a.analysis?.bullishBearish === 'bearish').length;
      const total = bullish + bearish;
      const bullishRatio = total > 0 ? bullish / total : 0.5;

      if (bullishRatio >= 0.65) actualDirection = 'BULLISH';
      else if (bullishRatio <= 0.35) actualDirection = 'BEARISH';
      else actualDirection = 'NEUTRAL';

      if (prediction.direction === actualDirection) outcome = 'CORRECT';
      else if (actualDirection === 'NEUTRAL' && prediction.direction !== 'NEUTRAL') outcome = 'PARTIAL';
      else outcome = 'INCORRECT';
    }

    if (outcome) {
      await db.predictionOutcome.create({
        data: { predictionId: prediction.id, outcome, actualDirection, validatedBy: 'AUTO' },
      });
      await db.prediction.update({ where: { id: prediction.id }, data: { status: outcome } });

      // Update calibration accuracy buckets
      const bucket = String(Math.round(prediction.confidence * 10) / 10);
      const isCorrect = outcome === 'CORRECT';
      await db.predictionAccuracy.upsert({
        where: { userId_targetType_confidenceBucket: { userId: prediction.userId, targetType: prediction.targetType, confidenceBucket: bucket } },
        create: { userId: prediction.userId, targetType: prediction.targetType, confidenceBucket: bucket, totalPredictions: 1, correct: isCorrect ? 1 : 0, hitRate: isCorrect ? 1.0 : 0.0 },
        update: { totalPredictions: { increment: 1 }, correct: { increment: isCorrect ? 1 : 0 } },
      });
      const acc = await db.predictionAccuracy.findUnique({
        where: { userId_targetType_confidenceBucket: { userId: prediction.userId, targetType: prediction.targetType, confidenceBucket: bucket } },
      });
      if (acc) {
        await db.predictionAccuracy.update({ where: { id: acc.id }, data: { hitRate: acc.correct / acc.totalPredictions } });
      }

      // Generate a feedback question for the user
      try {
        const question = await generateFeedbackQuestion({
          target: prediction.target,
          targetType: prediction.targetType,
          direction: prediction.direction,
          reasoning: prediction.reasoning,
          outcome,
          actualDirection,
        });
        await db.predictionFeedback.create({ data: { predictionId: prediction.id, question } });
      } catch { /* non-fatal */ }

      validated++;
    } else {
      // Insufficient data — generate a feedback question asking the user directly
      try {
        const question = await generateFeedbackQuestion({
          target: prediction.target,
          targetType: prediction.targetType,
          direction: prediction.direction,
          reasoning: prediction.reasoning,
          outcome: 'UNKNOWN',
          actualDirection: null,
        });
        await db.predictionFeedback.create({ data: { predictionId: prediction.id, question } });
        await db.prediction.update({ where: { id: prediction.id }, data: { status: 'PARTIAL' } });
      } catch { /* non-fatal */ }
    }
  }

  return NextResponse.json({ ok: true, validated, total: expired.length });
}

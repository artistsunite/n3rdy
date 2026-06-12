import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generatePredictions } from '@/lib/ai';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const targetType = searchParams.get('targetType') ?? undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

  const predictions = await db.prediction.findMany({
    where: {
      userId: uid,
      ...(status ? { status } : {}),
      ...(targetType ? { targetType } : {}),
    },
    include: { outcome: true, feedback: true },
    orderBy: { generatedAt: 'desc' },
    take: limit,
  });

  // Accuracy stats for the scoreboard
  const accuracy = await db.predictionAccuracy.findMany({ where: { userId: uid } });

  return NextResponse.json({ predictions, accuracy });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  // Ensure user row exists
  await db.user.upsert({
    where: { id: uid },
    create: { id: uid, email: session.user.email ?? '', name: session.user.name ?? null },
    update: {},
  });

  // Fetch watchlist
  const watchlist = await db.watchlistItem.findMany({ where: { userId: uid } });

  // Fetch recent articles with analysis
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const userSources = await db.userSource.findMany({ where: { userId: uid, isActive: true }, select: { sourceId: true } });
  const sourceIds = userSources.map(s => s.sourceId);

  const articles = await db.article.findMany({
    where: { sourceId: { in: sourceIds }, analysis: { isNot: null }, publishedAt: { gte: since } },
    include: {
      source: { select: { name: true, trustScore: true } },
      analysis: { select: { sentiment: true, sentimentScore: true, bullishBearish: true, marketImpactScore: true, shortSummary: true, sectorsAffected: true, sourceReliabilityScore: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 30,
  });

  if (articles.length === 0 && watchlist.length === 0) {
    return NextResponse.json({ error: 'No articles or watchlist items found. Refresh your news feed first.' }, { status: 400 });
  }

  // User profile
  const prefs = await db.userPreferences.findUnique({ where: { userId: uid } }).catch(() => null);

  // Build accuracy context string for the prompt (self-learning)
  const accuracyRows = await db.predictionAccuracy.findMany({ where: { userId: uid } });
  const recentOutcomes = await db.predictionOutcome.findMany({
    where: { prediction: { userId: uid } },
    include: { prediction: { select: { target: true, targetType: true, direction: true, timeframe: true } } },
    orderBy: { validatedAt: 'desc' },
    take: 5,
  });
  const insights = await db.predictionFeedback.findMany({
    where: { prediction: { userId: uid }, insight: { not: null } },
    orderBy: { answeredAt: 'desc' },
    take: 5,
    select: { insight: true },
  });

  let accuracyContext = '';
  if (accuracyRows.length > 0) {
    const byType: Record<string, { total: number; correct: number }> = {};
    for (const row of accuracyRows) {
      if (!byType[row.targetType]) byType[row.targetType] = { total: 0, correct: 0 };
      byType[row.targetType].total += row.totalPredictions;
      byType[row.targetType].correct += row.correct;
    }
    const lines = Object.entries(byType).map(([t, s]) => {
      const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
      return `- ${t}: ${s.correct}/${s.total} correct (${pct}%)`;
    });

    // Calibration: if 80%-bucket hit rate differs from 80%, flag overconfidence
    const highBucket = accuracyRows.find(r => r.confidenceBucket === '0.8');
    const calibNote = highBucket && highBucket.hitRate !== null && highBucket.totalPredictions >= 3
      ? `CALIBRATION: When you gave 80% confidence, actual hit rate was ${Math.round(highBucket.hitRate * 100)}% — ${highBucket.hitRate < 0.75 ? 'you are overconfident at high scores, reduce all scores above 0.75 by 10%' : 'well calibrated at this level'}.`
      : '';

    const missLines = recentOutcomes.filter(o => o.outcome === 'INCORRECT').map(o =>
      `- "${o.prediction.target} ${o.prediction.direction} ${o.prediction.timeframe}" INCORRECT`
    ).join('\n');

    const insightLines = insights.map(i => `- ${i.insight}`).join('\n');

    accuracyContext = `
ACCURACY HISTORY (time-decay weighted):
${lines.join('\n')}
${calibNote}
${missLines ? `\nRECENT MISSES:\n${missLines}` : ''}
${insightLines ? `\nUSER INSIGHTS:\n${insightLines}` : ''}`.trim();
  }

  // Overall sentiment for contrarian check
  const sentimentSum = articles.reduce((s, a) => s + (a.analysis?.sentimentScore ?? 0), 0);
  const overallSentimentScore = articles.length > 0 ? sentimentSum / articles.length : 0;

  let predictions;
  try {
    predictions = await generatePredictions({
      watchlistItems: watchlist.map(w => ({ type: w.type, value: w.value, label: w.label })),
      articles: articles.map(a => ({
        title: a.title,
        shortSummary: a.analysis!.shortSummary,
        sentiment: a.analysis!.sentiment,
        sentimentScore: a.analysis!.sentimentScore,
        bullishBearish: a.analysis!.bullishBearish,
        marketImpactScore: a.analysis!.marketImpactScore,
        sourceName: a.source.name,
        sourceReliabilityScore: a.analysis!.sourceReliabilityScore,
        publishedAt: a.publishedAt.toISOString(),
        sectorsAffected: (a.analysis!.sectorsAffected as string[]) ?? [],
      })),
      userProfile: prefs ? { businessType: prefs.businessType, industry: prefs.industry } : undefined,
      accuracyContext,
      overallSentimentScore,
    });
  } catch (err) {
    const msg = (err as Error).message ?? '';
    return NextResponse.json({ error: `AI generation failed: ${msg.slice(0, 200)}` }, { status: 502 });
  }

  // Save predictions to DB
  const now = Date.now();
  const saved = await Promise.all(predictions.map(p => {
    const ms = p.timeframe === '24h' ? 86400000 : p.timeframe === '30d' ? 30 * 86400000 : 7 * 86400000;
    return db.prediction.create({
      data: {
        userId: uid,
        target: p.target,
        targetType: p.targetType,
        direction: p.direction,
        confidence: p.confidence,
        calibratedConfidence: p.confidence, // starts equal; adjusted over time
        baseRate: p.baseRate,
        contrarianFlag: p.contrarianFlag,
        reasoning: p.reasoning,
        bullCase: p.bullCase,
        bearCase: p.bearCase,
        signals: p.signals as object,
        subQuestions: p.subQuestions as object,
        timeframe: p.timeframe,
        expiresAt: new Date(now + ms),
        aiProvider: 'claude',
      },
      include: { outcome: true, feedback: true },
    });
  }));

  return NextResponse.json({ ok: true, predictions: saved });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const PERIOD_HOURS: Record<string, number> = { '24h': 24, '7d': 168, '30d': 720 };

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const period = new URL(req.url).searchParams.get('period') ?? '24h';
  const hours = PERIOD_HOURS[period] ?? 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const userSources = await db.userSource.findMany({
    where: { userId: uid, isActive: true },
    select: { sourceId: true, source: { select: { category: true } } },
  });

  const sourceIds = userSources.map((us) => us.sourceId);

  const analyses = await db.articleAnalysis.findMany({
    where: {
      article: {
        sourceId: { in: sourceIds },
        publishedAt: { gte: since },
      },
    },
    include: {
      article: { select: { source: { select: { category: true } }, publishedAt: true } },
    },
  });

  // Aggregate sentiment by category
  const byCategory: Record<string, { scores: number[]; bullish: number; bearish: number; neutral: number }> = {};

  for (const analysis of analyses) {
    const category = analysis.article.source.category;
    if (!byCategory[category]) {
      byCategory[category] = { scores: [], bullish: 0, bearish: 0, neutral: 0 };
    }
    byCategory[category].scores.push(analysis.sentimentScore);
    if (analysis.bullishBearish === 'bullish') byCategory[category].bullish++;
    else if (analysis.bullishBearish === 'bearish') byCategory[category].bearish++;
    else byCategory[category].neutral++;
  }

  const categoryResults = Object.entries(byCategory).map(([category, data]) => ({
    category,
    avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length || 0,
    articleCount: data.scores.length,
    bullish: data.bullish,
    bearish: data.bearish,
    neutral: data.neutral,
    dominant: data.bullish > data.bearish ? 'bullish' : data.bearish > data.bullish ? 'bearish' : 'neutral',
  }));

  // Time-series: hourly for 24h, daily for 7d/30d
  const buckets: Record<string, number[]> = {};
  for (const analysis of analyses) {
    const dt = new Date(analysis.article.publishedAt);
    if (hours <= 24) {
      dt.setMinutes(0, 0, 0);
    } else {
      dt.setHours(0, 0, 0, 0);
    }
    const key = dt.toISOString();
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(analysis.sentimentScore);
  }

  const timeSeries = Object.entries(buckets)
    .map(([time, scores]) => ({
      time,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  const allScores = analyses.map((a) => a.sentimentScore);
  const overall = allScores.reduce((a, b) => a + b, 0) / allScores.length || 0;

  return NextResponse.json({ overall, byCategory: categoryResults, timeSeries });
}

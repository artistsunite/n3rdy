import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ articles: [], opportunities: [], competitors: [], experiments: [] });

  const [articles, opportunities, competitors, experiments] = await Promise.all([
    db.article.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { analysis: { shortSummary: { contains: q, mode: 'insensitive' } } },
        ],
        source: { userSources: { some: { userId } } },
      },
      include: {
        source: { select: { name: true } },
        analysis: { select: { sentiment: true, marketImpactScore: true, shortSummary: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 8,
    }),
    db.growthOpportunity.findMany({
      where: {
        userId,
        status: { not: 'dismissed' },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { urgencyScore: 'desc' },
      take: 5,
    }),
    db.competitor.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { _count: { select: { events: { where: { isRead: false } } } } },
      take: 5,
    }),
    db.growthExperiment.findMany({
      where: {
        userId,
        status: { not: 'abandoned' },
        OR: [
          { hypothesis: { contains: q, mode: 'insensitive' } },
          { expectedOutcome: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { generatedAt: 'desc' },
      take: 4,
    }),
  ]);

  return NextResponse.json({ articles, opportunities, competitors, experiments });
}

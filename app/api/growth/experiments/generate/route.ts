import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateExperiments, type GrowthOpportunityResult } from '@/lib/ai';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const [profile, opportunities, userInsights] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId } }),
    db.growthOpportunity.findMany({
      where: { userId, status: { not: 'dismissed' } },
      orderBy: [{ impactScore: 'desc' }, { urgencyScore: 'desc' }],
      take: 5,
    }),
    db.userInsight.findMany({ where: { userId, answer: { not: null } }, take: 10 }),
  ]);

  if (!profile) return NextResponse.json({ error: 'Business profile required' }, { status: 400 });

  const topOpps: GrowthOpportunityResult[] = opportunities.map(o => ({
    type: o.type,
    title: o.title,
    description: o.description,
    reason: o.reason,
    confidenceScore: o.confidenceScore,
    impactScore: o.impactScore,
    urgencyScore: o.urgencyScore,
    difficultyScore: o.difficultyScore,
    potentialRevenue: o.potentialRevenue ?? undefined,
    timeHorizon: o.timeHorizon ?? undefined,
    suggestedActions: o.suggestedActions as string[],
    dataSources: o.dataSources as string[],
  }));

  const experiments = await generateExperiments({
    businessProfile: profile,
    topOpportunities: topOpps,
    userInsights: userInsights.map(i => ({ question: i.question, answer: i.answer })),
  });

  const created = await db.$transaction(
    experiments.map(e =>
      db.growthExperiment.create({
        data: {
          userId,
          hypothesis: e.hypothesis,
          expectedOutcome: e.expectedOutcome,
          difficulty: e.difficulty,
          expectedRevenue: e.expectedRevenue ?? null,
          successMetrics: e.successMetrics,
          estimatedDays: e.estimatedDays,
          requiredActions: e.requiredActions,
          priorityScore: e.priorityScore,
        },
      })
    )
  );

  return NextResponse.json({ experiments: created });
}

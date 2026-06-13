import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const experiments = await db.growthExperiment.findMany({
    where: { userId: session.user.id },
    orderBy: { priorityScore: 'desc' },
    take: 50,
  });

  return NextResponse.json({ experiments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    hypothesis: string;
    expectedOutcome: string;
    difficulty?: string;
    expectedRevenue?: string;
    successMetrics?: string[];
    estimatedDays?: number;
    requiredActions?: string[];
    priorityScore?: number;
  };

  const experiment = await db.growthExperiment.create({
    data: {
      userId: session.user.id,
      hypothesis: body.hypothesis,
      expectedOutcome: body.expectedOutcome,
      difficulty: body.difficulty ?? 'medium',
      expectedRevenue: body.expectedRevenue ?? null,
      successMetrics: body.successMetrics ?? [],
      estimatedDays: body.estimatedDays ?? 30,
      requiredActions: body.requiredActions ?? [],
      priorityScore: body.priorityScore ?? 0.5,
    },
  });

  return NextResponse.json({ experiment }, { status: 201 });
}

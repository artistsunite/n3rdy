import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';
import { AGENT_PROFILE_QUESTIONS } from '@/lib/profile-questions';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  const context = `marketing:${agentId}`;
  let questions = await prisma.userInsight.findMany({
    where: { userId, context },
    orderBy: { createdAt: 'asc' },
  });

  // Seed agent-specific questions if none exist yet
  if (questions.length === 0) {
    const seeds = AGENT_PROFILE_QUESTIONS[agentId];
    if (!seeds || seeds.length === 0) {
      return NextResponse.json({ questions: [], complete: false });
    }
    await prisma.userInsight.createMany({
      data: seeds.map(q => ({ userId, question: q.question, category: q.category, context })),
    });
    questions = await prisma.userInsight.findMany({
      where: { userId, context },
      orderBy: { createdAt: 'asc' },
    });
  }

  const complete = questions.every(q => q.answeredAt !== null);
  return NextResponse.json({ questions, complete });
}

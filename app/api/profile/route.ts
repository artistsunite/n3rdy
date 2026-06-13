import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';
import { SEED_QUESTIONS } from '@/lib/profile-questions';
import { generateProfileQuestions } from '@/lib/ai';

const CATEGORIES = ['foundation', 'marketing', 'market', 'goals', 'lifestyle'];
const QUESTIONS_PER_BATCH = 3;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const [profile, allInsights] = await Promise.all([
    prisma.userAIProfile.findUnique({ where: { userId } }),
    prisma.userInsight.findMany({ where: { userId, context: null }, orderBy: { createdAt: 'asc' } }),
  ]);

  const unanswered = allInsights.filter(i => !i.answeredAt);

  if (unanswered.length >= QUESTIONS_PER_BATCH) {
    return NextResponse.json({ profile, questions: unanswered.slice(0, QUESTIONS_PER_BATCH) });
  }

  // Need more questions — seed from static list first, then AI-generate
  const answered = allInsights.filter(i => !!i.answeredAt);
  const existingQuestions = new Set(allInsights.map(i => i.question));

  // Try to pick from seed questions that haven't been used yet
  const seedCandidates = SEED_QUESTIONS.filter(q => !existingQuestions.has(q.question));
  const toCreate: Array<{ question: string; category: string }> = [];

  // Pick by cycling categories
  const categoryCount = answered.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + 1;
    return acc;
  }, {});

  const sortedCategories = [...CATEGORIES].sort(
    (a, b) => (categoryCount[a] ?? 0) - (categoryCount[b] ?? 0)
  );

  for (const cat of sortedCategories) {
    if (toCreate.length >= QUESTIONS_PER_BATCH) break;
    const catSeeds = seedCandidates.filter(q => q.category === cat);
    if (catSeeds.length > 0) toCreate.push(catSeeds[0]);
  }

  // If still short, try AI generation for the least-covered category
  if (toCreate.length < QUESTIONS_PER_BATCH && answered.length > 0) {
    const neededCategory = sortedCategories[0];
    try {
      const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
      const aiQuestions = await generateProfileQuestions({
        existingAnswers: answered.map(a => ({ question: a.question, answer: a.answer ?? '', category: a.category })),
        businessType: prefs?.businessType,
        industry: prefs?.industry,
        neededCategory,
      });
      for (const q of aiQuestions) {
        if (toCreate.length >= QUESTIONS_PER_BATCH) break;
        if (!existingQuestions.has(q.question)) toCreate.push(q);
      }
    } catch { /* fallback: no AI questions */ }
  }

  // Fill remainder from any seed category
  if (toCreate.length < QUESTIONS_PER_BATCH) {
    const remaining = seedCandidates.filter(q => !toCreate.some(t => t.question === q.question));
    for (const q of remaining) {
      if (toCreate.length >= QUESTIONS_PER_BATCH) break;
      toCreate.push(q);
    }
  }

  if (toCreate.length > 0) {
    await prisma.userInsight.createMany({
      data: toCreate.map(q => ({ userId, question: q.question, category: q.category, context: null })),
    });
  }

  const freshUnanswered = await prisma.userInsight.findMany({
    where: { userId, context: null, answeredAt: null },
    orderBy: { createdAt: 'asc' },
    take: QUESTIONS_PER_BATCH,
  });

  return NextResponse.json({ profile, questions: freshUnanswered });
}

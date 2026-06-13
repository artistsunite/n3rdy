import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';
import { updateUserProfile } from '@/lib/ai';

interface AnswerItem {
  insightId: string;
  answer: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json() as { answers: AnswerItem[] };
  const { answers } = body;
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'answers array required' }, { status: 400 });
  }

  const now = new Date();
  await Promise.all(
    answers.map(a =>
      prisma.userInsight.updateMany({
        where: { id: a.insightId, userId },
        data: { answer: a.answer, answeredAt: now },
      })
    )
  );

  // Regenerate profile from all answered general insights
  const allAnswered = await prisma.userInsight.findMany({
    where: { userId, context: null, answeredAt: { not: null } },
  });

  if (allAnswered.length === 0) {
    return NextResponse.json({ profile: null });
  }

  try {
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
    const result = await updateUserProfile({
      allAnswers: allAnswered.map(a => ({ question: a.question, answer: a.answer ?? '', category: a.category })),
      businessType: prefs?.businessType,
      industry: prefs?.industry,
      country: prefs?.country,
    });

    const dbData = {
      summary: result.summary,
      interests: JSON.stringify(result.interests),
      businessFocus: JSON.stringify(result.businessFocus),
      profileScore: result.profileScore,
    };
    const profile = await prisma.userAIProfile.upsert({
      where: { userId },
      create: { userId, ...dbData },
      update: { ...dbData },
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: null });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';
import { generateTrendingPost } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json() as { topic: string; topicSentiment?: string };
  const { topic, topicSentiment } = body;
  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 });

  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });

  const result = await generateTrendingPost({
    topic,
    topicSentiment,
    businessType: prefs?.businessType,
    industry: prefs?.industry,
  });

  return NextResponse.json(result);
}

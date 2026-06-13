import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { runMarketingAgent } from '@/lib/ai';
import { MARKETING_AGENTS } from '@/lib/marketing-agents';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = session.user.id as string;

  const briefs = await db.marketingBrief.findMany({
    where: { userId: uid },
    include: { output: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ briefs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = session.user.id as string;

  const body = await req.json().catch(() => ({})) as { agentId?: string; brief?: string };
  const { agentId, brief } = body;

  if (!agentId || !brief?.trim()) {
    return NextResponse.json({ error: 'agentId and brief are required' }, { status: 400 });
  }

  const agent = MARKETING_AGENTS.find(a => a.id === agentId);
  if (!agent) {
    return NextResponse.json({ error: 'Unknown agent ID' }, { status: 400 });
  }

  // Fetch user context and agent profile for personalisation
  const [prefs, agentInsights] = await Promise.all([
    db.userPreferences.findUnique({ where: { userId: uid } }),
    db.userInsight.findMany({
      where: { userId: uid, context: `marketing:${agentId}`, answeredAt: { not: null } },
    }),
  ]);

  const agentProfile = agentInsights.map(i => ({ question: i.question, answer: i.answer ?? '' }));

  let result: { content: string; aiProvider: string };
  try {
    result = await runMarketingAgent({
      agentId,
      agentSystemPrompt: agent.systemPrompt,
      brief: brief.trim(),
      userContext: { businessType: prefs?.businessType, industry: prefs?.industry },
      agentProfile: agentProfile.length > 0 ? agentProfile : undefined,
    });
  } catch (err) {
    console.error('[marketing] AI error:', err);
    return NextResponse.json(
      { error: `AI generation failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  const savedBrief = await db.marketingBrief.create({
    data: {
      userId: uid,
      agentId,
      brief: brief.trim(),
      output: {
        create: {
          content: result.content,
          aiProvider: result.aiProvider,
        },
      },
    },
    include: { output: true },
  });

  return NextResponse.json({ ok: true, brief: savedBrief });
}

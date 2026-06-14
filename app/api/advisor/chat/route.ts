import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function buildSystemPrompt(userId: string): Promise<string> {
  const userSources = await db.userSource.findMany({ where: { userId, isActive: true }, select: { sourceId: true } });
  const sourceIds = userSources.map(s => s.sourceId);

  const [profile, opportunities, competitorEvents, latestReport, recentArticles] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId } }),
    db.growthOpportunity.findMany({
      where: { userId, status: { in: ['new', 'viewed'] } },
      orderBy: [{ impactScore: 'desc' }, { urgencyScore: 'desc' }],
      take: 5,
    }),
    db.competitorEvent.findMany({
      where: { userId, detectedAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
      orderBy: { detectedAt: 'desc' },
      take: 5,
    }),
    db.advisorReport.findFirst({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    }),
    sourceIds.length > 0 ? db.article.findMany({
      where: {
        sourceId: { in: sourceIds },
        analysis: { isNot: null },
        publishedAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) },
      },
      include: { analysis: { select: { shortSummary: true, sentiment: true, marketImpactScore: true } } },
      orderBy: [{ analysis: { marketImpactScore: 'desc' } }, { publishedAt: 'desc' }],
      take: 8,
    }) : Promise.resolve([]),
  ]);

  const articlesText = recentArticles.length
    ? recentArticles.map(a => `- [${a.analysis?.sentiment ?? 'neutral'}] ${a.title}${a.analysis?.shortSummary ? `: ${a.analysis.shortSummary}` : ''}`).join('\n')
    : 'No recent articles (ingest and analyse articles first).';

  const oppsText = opportunities.length
    ? opportunities.map(o => `- [${o.type}] ${o.title} (impact ${(o.impactScore * 100).toFixed(0)}%, urgency ${(o.urgencyScore * 100).toFixed(0)}%)`).join('\n')
    : 'None identified yet.';

  const eventsText = competitorEvents.length
    ? competitorEvents.map(e => `- [${e.importance}] ${e.title}: ${e.aiSummary}`).join('\n')
    : 'No recent competitor activity.';

  type ReportContent = { whatChanged?: string; whyItMatters?: string; outlook7d?: string };
  const report = latestReport?.content as ReportContent | null;
  const reportContext = report
    ? `Latest report (${new Date(latestReport!.generatedAt).toLocaleDateString()}):\n- What changed: ${report.whatChanged ?? ''}\n- Why it matters: ${report.whyItMatters ?? ''}\n- 7-day outlook: ${report.outlook7d ?? ''}`
    : 'No weekly report generated yet.';

  return `You are an elite AI growth advisor for ${profile?.businessName ?? 'this business'}.

BUSINESS CONTEXT:
- Type: ${profile?.businessType ?? 'Unknown'}
- Industry: ${profile?.industry ?? 'Unknown'}
- Description: ${profile?.description ?? 'N/A'}
- Revenue Goal: ${profile?.revenueGoal ?? 'N/A'}
- Growth Goal: ${profile?.growthGoal ?? 'N/A'}
- Products: ${JSON.stringify(profile?.products ?? [])}
- Services: ${JSON.stringify(profile?.services ?? [])}
- Target Audience: ${profile?.targetAudience ?? 'N/A'}

RECENT NEWS (last 48h, highest impact first):
${articlesText}

TOP GROWTH OPPORTUNITIES:
${oppsText}

RECENT COMPETITOR INTELLIGENCE:
${eventsText}

${reportContext}

You are a strategic advisor who gives direct, actionable advice. Be concise but insightful. Reference specific news items or data from the context above when relevant. Ask clarifying questions when needed. Never be vague — always give concrete next steps.`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json() as {
    message: string;
    conversationId?: string;
  };

  if (!body.message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  // Get or create conversation
  let conversation = body.conversationId
    ? await db.advisorConversation.findFirst({ where: { id: body.conversationId, userId }, include: { messages: { orderBy: { createdAt: 'asc' } } } })
    : null;

  if (!conversation) {
    conversation = await db.advisorConversation.create({
      data: {
        userId,
        title: body.message.slice(0, 60),
        messages: { create: [] },
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  // Save user message
  await db.advisorMessage.create({
    data: { conversationId: conversation.id, role: 'user', content: body.message },
  });

  // Build message history for Claude
  const history = conversation.messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  history.push({ role: 'user', content: body.message });

  const systemPrompt = await buildSystemPrompt(userId);

  // Stream response
  const stream = client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    system: systemPrompt,
    messages: history,
  });

  const conversationId = conversation.id;
  let fullText = '';

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ conversationId })}\n\n`));

      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            fullText += text;
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
      } finally {
        // Save assistant message after streaming completes
        if (fullText) {
          await db.advisorMessage.create({
            data: { conversationId, role: 'assistant', content: fullText },
          });
          await db.advisorConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
        }
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

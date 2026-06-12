import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { extractFeedbackInsight } from '@/lib/ai';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  // Verify ownership
  const prediction = await db.prediction.findFirst({ where: { id, userId: uid } });
  if (!prediction) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Handle outcome submission (user marks correct/incorrect)
  if (body.outcome) {
    const outcome = await db.predictionOutcome.upsert({
      where: { predictionId: id },
      create: {
        predictionId: id,
        outcome: body.outcome as string,
        actualDirection: (body.actualDirection as string) ?? null,
        validatedBy: 'USER',
        userNotes: (body.userNotes as string) ?? null,
      },
      update: {
        outcome: body.outcome as string,
        actualDirection: (body.actualDirection as string) ?? null,
        validatedBy: 'USER',
        userNotes: (body.userNotes as string) ?? null,
        validatedAt: new Date(),
      },
    });

    await db.prediction.update({ where: { id }, data: { status: body.outcome as string } });

    // Update PredictionAccuracy calibration buckets
    const bucket = String(Math.round(prediction.confidence * 10) / 10); // e.g. 0.73 → "0.7"
    const isCorrect = body.outcome === 'CORRECT';
    await db.predictionAccuracy.upsert({
      where: { userId_targetType_confidenceBucket: { userId: uid, targetType: prediction.targetType, confidenceBucket: bucket } },
      create: { userId: uid, targetType: prediction.targetType, confidenceBucket: bucket, totalPredictions: 1, correct: isCorrect ? 1 : 0, hitRate: isCorrect ? 1.0 : 0.0 },
      update: {
        totalPredictions: { increment: 1 },
        correct: { increment: isCorrect ? 1 : 0 },
      },
    });
    // Recompute hitRate
    const updated = await db.predictionAccuracy.findUnique({
      where: { userId_targetType_confidenceBucket: { userId: uid, targetType: prediction.targetType, confidenceBucket: bucket } },
    });
    if (updated) {
      await db.predictionAccuracy.update({
        where: { id: updated.id },
        data: { hitRate: updated.totalPredictions > 0 ? updated.correct / updated.totalPredictions : null },
      });
    }

    return NextResponse.json({ ok: true, outcome });
  }

  // Handle feedback question answer
  if (body.feedbackId && body.answer) {
    const feedback = await db.predictionFeedback.findFirst({
      where: { id: body.feedbackId as string, predictionId: id },
    });
    if (!feedback) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });

    let insight: string | null = null;
    try {
      insight = await extractFeedbackInsight({
        question: feedback.question,
        answer: body.answer as string,
        target: prediction.target,
        targetType: prediction.targetType,
      });
    } catch { /* non-fatal */ }

    await db.predictionFeedback.update({
      where: { id: feedback.id },
      data: { answer: body.answer as string, insight, answeredAt: new Date() },
    });

    return NextResponse.json({ ok: true, insight });
  }

  return NextResponse.json({ error: 'No valid action in body' }, { status: 400 });
}

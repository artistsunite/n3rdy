import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get('days') ?? '7'), 30);
  const country = searchParams.get('country');

  const from = new Date();
  const to = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    scheduledAt: { gte: from, lte: to },
  };
  if (country) where.country = country;

  const events = await db.economicEvent.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { country, eventType, title, scheduledAt, forecast, previous, marketImpact, assetsAffected } = body;

  if (!country || !eventType || !title || !scheduledAt) {
    return NextResponse.json({ error: 'country, eventType, title, scheduledAt required' }, { status: 400 });
  }

  const event = await db.economicEvent.create({
    data: { country, eventType, title, scheduledAt: new Date(scheduledAt), forecast, previous, marketImpact, assetsAffected: assetsAffected ?? [] },
  });

  return NextResponse.json({ event }, { status: 201 });
}

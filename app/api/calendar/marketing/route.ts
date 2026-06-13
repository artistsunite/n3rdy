import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';
import { getUpcomingDates } from '@/lib/marketing-calendar';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '30', 10);

  let country: string | null = null;
  const session = await auth();
  if (session?.user?.id) {
    const prefs = await prisma.userPreferences.findUnique({ where: { userId: session.user.id } });
    country = prefs?.country ?? null;
  }

  const dates = getUpcomingDates(days, country);
  return NextResponse.json({ dates, country });
}

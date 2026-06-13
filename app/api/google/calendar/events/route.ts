import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCalendarEvents } from '@/lib/google-calendar';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10);
  const events = await getCalendarEvents(session.user.id, days);
  return NextResponse.json({ events });
}

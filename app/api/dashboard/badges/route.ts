import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// Returns unread counts for sidebar badge display — kept lightweight with a single aggregation query
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const [unreadEvents, newOpportunities] = await Promise.all([
    db.competitorEvent.count({ where: { userId, isRead: false } }),
    db.growthOpportunity.count({ where: { userId, status: 'new' } }),
  ]);

  return NextResponse.json({ unreadEvents, newOpportunities });
}

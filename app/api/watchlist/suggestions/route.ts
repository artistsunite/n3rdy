import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { suggestWatchlistKeywords } from '@/lib/ai';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  const [profile, watchlist, trending] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId: uid } }),
    db.watchlistItem.findMany({ where: { userId: uid }, select: { value: true, type: true } }),
    db.trendingTopic.findMany({
      orderBy: { mentionCount: 'desc' },
      take: 20,
      select: { name: true, category: true },
    }),
  ]);

  if (!profile) {
    return NextResponse.json({ suggestions: [], reason: 'no_profile' });
  }

  const suggestions = await suggestWatchlistKeywords({
    businessProfile: {
      businessName: profile.businessName,
      businessType: profile.businessType,
      industry: profile.industry,
      description: profile.description,
      keywords: profile.keywords,
      priorityTopics: profile.priorityTopics,
    },
    existingWatchlist: watchlist,
    trendingTopics: trending,
  });

  return NextResponse.json({ suggestions });
}

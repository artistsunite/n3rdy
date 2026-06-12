import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// Auth-protected diagnostic endpoint — visit /api/debug/status when logged in
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  try {
    const [
      totalSources,
      defaultSources,
      userSourceCount,
      totalArticles,
      analysedArticles,
      userArticles,
      recentArticle,
    ] = await Promise.all([
      db.source.count(),
      db.source.count({ where: { isDefault: true } }),
      db.userSource.count({ where: { userId: uid } }),
      db.article.count(),
      db.articleAnalysis.count(),
      db.article.count({
        where: {
          sourceId: {
            in: (await db.userSource.findMany({ where: { userId: uid }, select: { sourceId: true } }))
              .map((us) => us.sourceId),
          },
        },
      }),
      db.article.findFirst({ orderBy: { fetchedAt: 'desc' }, select: { title: true, fetchedAt: true, publishedAt: true } }),
    ]);

    return NextResponse.json({
      ok: true,
      userId: uid,
      db: {
        totalSources,
        defaultSources,
        userSourceCount,
        totalArticles,
        analysedArticles,
        userArticles,
        recentArticle,
      },
      env: {
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasRedisUrl: !!process.env.REDIS_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: (err as Error).message,
      hint: 'DB tables may not exist — prisma migrate deploy has not run yet',
    }, { status: 500 });
  }
}

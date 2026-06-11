import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIngestQueue } from '@/lib/queue';

// Secured with a shared secret — call from Firebase Scheduled Functions or external cron
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sources = await db.source.findMany({
    where: { isActive: true, rssUrl: { not: null } },
  });

  const queue = getIngestQueue();
  let enqueued = 0;

  for (const source of sources) {
    await queue.add('ingest', { sourceId: source.id }, { jobId: `ingest-${source.id}-${Date.now()}` });
    enqueued++;
  }

  return NextResponse.json({ ok: true, enqueued, sourceCount: sources.length });
}

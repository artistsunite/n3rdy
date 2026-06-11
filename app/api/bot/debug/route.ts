import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firestore-admin';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = session.user.id;
  const botUrl = process.env.BOT_SERVICE_URL ?? '(not set)';

  // Test 1: bot health
  let botHealth: string;
  try {
    const res = await fetch(`${botUrl}/health`, { signal: AbortSignal.timeout(5000) });
    botHealth = `${res.status} ${await res.text()}`;
  } catch (err) {
    botHealth = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Test 2: Firestore write
  let firestoreWrite: string;
  try {
    await adminDb().collection('_debug').doc('ping').set({ ts: new Date().toISOString() });
    firestoreWrite = 'ok';
  } catch (err) {
    firestoreWrite = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Test 3: read briefings subcollection
  let briefingsRead: string;
  let briefingCount = 0;
  try {
    const snap = await adminDb()
      .collection('users').doc(uid)
      .collection('briefings')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    briefingCount = snap.size;
    briefingsRead = `ok — ${snap.size} docs`;
  } catch (err) {
    briefingsRead = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Test 4: raw briefings count without orderBy (bypasses index issues)
  let briefingsRaw: string;
  try {
    const snap = await adminDb()
      .collection('users').doc(uid)
      .collection('briefings')
      .get();
    briefingsRaw = `ok — ${snap.size} docs (no orderBy)`;
  } catch (err) {
    briefingsRaw = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    userId: uid,
    botUrl,
    botHealth,
    firestoreWrite,
    briefingsRead,
    briefingsRaw,
    briefingCount,
  });
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firestore-admin';

export interface Briefing {
  id: string;
  text: string;
  htmlText?: string;
  createdAt: string;
  read: boolean;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = session.user.id;
  const { searchParams } = new URL(request.url);
  const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);
  const limit = Math.min(Math.max(limitParam, 1), 100);

  try {
    const snapshot = await adminDb()
      .collection('users')
      .doc(uid)
      .collection('briefings')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const briefings: Briefing[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text ?? '',
        htmlText: data.htmlText ?? undefined,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        read: data.read ?? false,
      };
    });

    return NextResponse.json({ briefings });
  } catch (err) {
    console.error('Failed to fetch briefings:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = session.user.id;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await adminDb()
      .collection('users')
      .doc(uid)
      .collection('briefings')
      .doc(id)
      .update({ read: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to mark briefing read:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

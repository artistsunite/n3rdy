import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserBotConfig, saveUserBotConfig } from '@/lib/firestore-admin';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const config = await getUserBotConfig(session.user.id);
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await saveUserBotConfig(session.user.id, body);
  return NextResponse.json({ ok: true });
}

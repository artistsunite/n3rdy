import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildAuthUrl } from '@/lib/google-oauth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const returnUrl = req.nextUrl.searchParams.get('returnUrl') ?? '/dashboard';
  const url = buildAuthUrl(session.user.id, returnUrl);
  return NextResponse.redirect(url);
}

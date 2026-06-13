import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revokeToken } from '@/lib/google-oauth';

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const integration = await db.googleIntegration.findUnique({
    where: { userId: session.user.id },
  });

  if (integration) {
    await revokeToken(integration.accessToken).catch(() => null);
    await db.googleIntegration.delete({ where: { userId: session.user.id } });
  }

  return NextResponse.json({ ok: true });
}

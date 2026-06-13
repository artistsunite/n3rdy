import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ connected: false });
  }

  const integration = await db.googleIntegration.findUnique({
    where: { userId: session.user.id },
    select: { grantedScopes: true, lastSyncAt: true, connectedAt: true },
  });

  if (!integration) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    grantedScopes: integration.grantedScopes,
    lastSyncAt: integration.lastSyncAt,
    connectedAt: integration.connectedAt,
  });
}

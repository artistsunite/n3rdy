import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await db.businessProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const userId = session.user.id;

  const profile = await db.businessProfile.upsert({
    where: { userId },
    create: { userId, ...body },
    update: { ...body, updatedAt: new Date() },
  });

  if (body.businessType || body.industry) {
    await db.userPreferences.upsert({
      where: { userId },
      create: { userId, businessType: body.businessType as string | undefined, industry: body.industry as string | undefined },
      update: {
        ...(body.businessType ? { businessType: body.businessType as string } : {}),
        ...(body.industry ? { industry: body.industry as string } : {}),
      },
    });
  }

  return NextResponse.json({ profile });
}

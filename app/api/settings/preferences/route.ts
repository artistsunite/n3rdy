import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const prefs = await prisma.userPreferences.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ preferences: prefs });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json() as Partial<{
    country: string;
    businessType: string;
    industry: string;
    timezone: string;
    briefingStyle: string;
    briefingFrequency: number;
    enabledCategories: string[];
  }>;

  const allowed: Record<string, unknown> = {};
  if ('country' in body) allowed.country = body.country ?? null;
  if ('businessType' in body) allowed.businessType = body.businessType ?? null;
  if ('industry' in body) allowed.industry = body.industry ?? null;
  if ('timezone' in body) allowed.timezone = body.timezone;
  if ('briefingStyle' in body) allowed.briefingStyle = body.briefingStyle;
  if ('briefingFrequency' in body) allowed.briefingFrequency = body.briefingFrequency;
  if ('enabledCategories' in body) allowed.enabledCategories = body.enabledCategories;

  const prefs = await prisma.userPreferences.upsert({
    where: { userId },
    create: { userId, ...allowed },
    update: allowed,
  });

  return NextResponse.json({ preferences: prefs });
}

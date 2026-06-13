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

  const body = await req.json() as {
    businessName?: string;
    businessType?: string;
    industry?: string;
    location?: string;
    website?: string;
    description?: string;
    products?: string[];
    services?: string[];
    targetAudience?: string;
    revenueGoal?: string;
    growthGoal?: string;
    marketRegions?: string[];
    priorityTopics?: string[];
    keywords?: string[];
  };
  const userId = session.user.id;

  const data = {
    ...(body.businessName !== undefined ? { businessName: body.businessName } : {}),
    ...(body.businessType !== undefined ? { businessType: body.businessType } : {}),
    ...(body.industry !== undefined ? { industry: body.industry } : {}),
    ...(body.location !== undefined ? { location: body.location } : {}),
    ...(body.website !== undefined ? { website: body.website } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.products !== undefined ? { products: body.products } : {}),
    ...(body.services !== undefined ? { services: body.services } : {}),
    ...(body.targetAudience !== undefined ? { targetAudience: body.targetAudience } : {}),
    ...(body.revenueGoal !== undefined ? { revenueGoal: body.revenueGoal } : {}),
    ...(body.growthGoal !== undefined ? { growthGoal: body.growthGoal } : {}),
    ...(body.marketRegions !== undefined ? { marketRegions: body.marketRegions } : {}),
    ...(body.priorityTopics !== undefined ? { priorityTopics: body.priorityTopics } : {}),
    ...(body.keywords !== undefined ? { keywords: body.keywords } : {}),
  };

  const profile = await db.businessProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data, updatedAt: new Date() },
  });

  if (body.businessType || body.industry) {
    await db.userPreferences.upsert({
      where: { userId },
      create: { userId, businessType: body.businessType, industry: body.industry },
      update: {
        ...(body.businessType ? { businessType: body.businessType } : {}),
        ...(body.industry ? { industry: body.industry } : {}),
      },
    });
  }

  return NextResponse.json({ profile });
}

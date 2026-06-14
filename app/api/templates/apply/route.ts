import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { INDUSTRY_TEMPLATES } from '@/lib/industry-templates';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json() as { templateId: string; businessName?: string; revenueGoal?: string; growthGoal?: string };

  const template = INDUSTRY_TEMPLATES.find(t => t.id === body.templateId);
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const results = { profile: false, watchlistAdded: 0, sourcesAdded: 0 };

  // 1. Upsert business profile
  await db.businessProfile.upsert({
    where: { userId },
    create: {
      userId,
      businessName: body.businessName ?? null,
      businessType: template.profile.businessType,
      industry: template.profile.industry,
      priorityTopics: template.profile.priorityTopics,
      keywords: template.profile.keywords,
      marketRegions: template.profile.marketRegions,
      revenueGoal: body.revenueGoal ?? null,
      growthGoal: body.growthGoal ?? null,
    },
    update: {
      ...(body.businessName ? { businessName: body.businessName } : {}),
      businessType: template.profile.businessType,
      industry: template.profile.industry,
      priorityTopics: template.profile.priorityTopics,
      keywords: template.profile.keywords,
      marketRegions: template.profile.marketRegions,
      ...(body.revenueGoal ? { revenueGoal: body.revenueGoal } : {}),
      ...(body.growthGoal ? { growthGoal: body.growthGoal } : {}),
      updatedAt: new Date(),
    },
  });
  results.profile = true;

  // Also sync businessType/industry to UserPreferences
  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, businessType: template.profile.businessType, industry: template.profile.industry },
    update: { businessType: template.profile.businessType, industry: template.profile.industry },
  });

  // 2. Add watchlist items (skip duplicates by value)
  const existingWatchlist = await db.watchlistItem.findMany({ where: { userId }, select: { value: true } });
  const existingValues = new Set(existingWatchlist.map(w => w.value));

  for (const item of template.watchlist) {
    if (!existingValues.has(item.value)) {
      await db.watchlistItem.create({
        data: { userId, type: item.type, value: item.value, label: item.label, priority: item.priority },
      });
      results.watchlistAdded++;
    }
  }

  // 3. Activate existing default sources by category
  const defaultSources = await db.source.findMany({
    where: { isDefault: true, category: { in: template.sourceCategories } },
  });
  for (const source of defaultSources) {
    const existing = await db.userSource.findUnique({
      where: { userId_sourceId: { userId, sourceId: source.id } },
    });
    if (!existing) {
      await db.userSource.create({ data: { userId, sourceId: source.id } });
      results.sourcesAdded++;
    } else if (!existing.isActive) {
      await db.userSource.update({ where: { userId_sourceId: { userId, sourceId: source.id } }, data: { isActive: true } });
      results.sourcesAdded++;
    }
  }

  // 4. Add extra industry-specific sources
  for (const src of template.extraSources) {
    const source = await db.source.upsert({
      where: { url: src.url },
      create: { name: src.name, url: src.url, rssUrl: src.rssUrl, category: src.category, region: src.region, isDefault: false },
      update: { name: src.name, rssUrl: src.rssUrl },
    });
    const existing = await db.userSource.findUnique({
      where: { userId_sourceId: { userId, sourceId: source.id } },
    });
    if (!existing) {
      await db.userSource.create({ data: { userId, sourceId: source.id } });
      results.sourcesAdded++;
    }
  }

  return NextResponse.json({ ok: true, template: template.id, ...results });
}

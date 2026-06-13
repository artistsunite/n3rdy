-- CreateTable
CREATE TABLE IF NOT EXISTS "BusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "businessType" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "website" TEXT,
    "description" TEXT,
    "products" JSONB NOT NULL DEFAULT '[]',
    "services" JSONB NOT NULL DEFAULT '[]',
    "targetAudience" TEXT,
    "revenueGoal" TEXT,
    "growthGoal" TEXT,
    "marketRegions" JSONB NOT NULL DEFAULT '[]',
    "priorityTopics" JSONB NOT NULL DEFAULT '[]',
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Competitor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "pricingUrl" TEXT,
    "blogUrl" TEXT,
    "productUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompetitorSnapshot" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeDetected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CompetitorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompetitorEvent" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "aiSummary" TEXT NOT NULL,
    "importance" TEXT NOT NULL DEFAULT 'medium',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GrowthOpportunity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "urgencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "difficultyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "potentialRevenue" TEXT,
    "timeHorizon" INTEGER,
    "suggestedActions" JSONB NOT NULL DEFAULT '[]',
    "dataSources" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'new',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "GrowthOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GrowthExperiment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "expectedRevenue" TEXT,
    "successMetrics" JSONB NOT NULL DEFAULT '[]',
    "estimatedDays" INTEGER NOT NULL DEFAULT 30,
    "requiredActions" JSONB NOT NULL DEFAULT '[]',
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GrowthExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AdvisorReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdvisorReport_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessProfile_userId_key" ON "BusinessProfile"("userId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CompetitorSnapshot_competitorId_pageType_key" ON "CompetitorSnapshot"("competitorId", "pageType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Competitor_userId_idx" ON "Competitor"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Competitor_userId_isActive_idx" ON "Competitor"("userId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetitorSnapshot_competitorId_idx" ON "CompetitorSnapshot"("competitorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetitorEvent_competitorId_detectedAt_idx" ON "CompetitorEvent"("competitorId", "detectedAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetitorEvent_userId_isRead_idx" ON "CompetitorEvent"("userId", "isRead");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GrowthOpportunity_userId_status_idx" ON "GrowthOpportunity"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GrowthOpportunity_userId_generatedAt_idx" ON "GrowthOpportunity"("userId", "generatedAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GrowthExperiment_userId_status_idx" ON "GrowthExperiment"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdvisorReport_userId_generatedAt_idx" ON "AdvisorReport"("userId", "generatedAt" DESC);

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorSnapshot" ADD CONSTRAINT "CompetitorSnapshot_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorEvent" ADD CONSTRAINT "CompetitorEvent_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorEvent" ADD CONSTRAINT "CompetitorEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthOpportunity" ADD CONSTRAINT "GrowthOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthExperiment" ADD CONSTRAINT "GrowthExperiment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorReport" ADD CONSTRAINT "AdvisorReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

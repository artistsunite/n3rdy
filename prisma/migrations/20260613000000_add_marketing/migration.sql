-- CreateTable
CREATE TABLE "MarketingBrief" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingOutput" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'claude',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingOutput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingBrief_userId_idx" ON "MarketingBrief"("userId");

-- CreateIndex
CREATE INDEX "MarketingBrief_userId_agentId_idx" ON "MarketingBrief"("userId", "agentId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingOutput_briefId_key" ON "MarketingOutput"("briefId");

-- AddForeignKey
ALTER TABLE "MarketingBrief" ADD CONSTRAINT "MarketingBrief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingOutput" ADD CONSTRAINT "MarketingOutput_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "MarketingBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

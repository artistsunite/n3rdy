-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "calibratedConfidence" DOUBLE PRECISION,
    "baseRate" DOUBLE PRECISION,
    "contrarianFlag" BOOLEAN NOT NULL DEFAULT false,
    "reasoning" TEXT NOT NULL,
    "bullCase" TEXT,
    "bearCase" TEXT,
    "signals" JSONB,
    "subQuestions" JSONB,
    "timeframe" TEXT NOT NULL DEFAULT '7d',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "aiProvider" TEXT NOT NULL DEFAULT 'claude',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionOutcome" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "actualDirection" TEXT,
    "validatedBy" TEXT NOT NULL,
    "userNotes" TEXT,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionFeedback" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "insight" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "PredictionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionAccuracy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "confidenceBucket" TEXT NOT NULL,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "hitRate" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionAccuracy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prediction_userId_status_idx" ON "Prediction"("userId", "status");

-- CreateIndex
CREATE INDEX "Prediction_expiresAt_idx" ON "Prediction"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionOutcome_predictionId_key" ON "PredictionOutcome"("predictionId");

-- CreateIndex
CREATE INDEX "PredictionFeedback_predictionId_idx" ON "PredictionFeedback"("predictionId");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionAccuracy_userId_targetType_confidenceBucket_key" ON "PredictionAccuracy"("userId", "targetType", "confidenceBucket");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionOutcome" ADD CONSTRAINT "PredictionOutcome_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionFeedback" ADD CONSTRAINT "PredictionFeedback_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAccuracy" ADD CONSTRAINT "PredictionAccuracy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


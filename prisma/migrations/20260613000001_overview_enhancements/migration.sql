-- Add country to UserPreferences
ALTER TABLE "UserPreferences" ADD COLUMN "country" TEXT;

-- UserInsight table
CREATE TABLE "UserInsight" (
  "id"         TEXT        NOT NULL,
  "userId"     TEXT        NOT NULL,
  "question"   TEXT        NOT NULL,
  "category"   TEXT        NOT NULL,
  "context"    TEXT,
  "answer"     TEXT,
  "answeredAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserInsight_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "UserInsight_userId_idx" ON "UserInsight"("userId");
CREATE INDEX "UserInsight_userId_category_idx" ON "UserInsight"("userId", "category");
CREATE INDEX "UserInsight_userId_context_idx" ON "UserInsight"("userId", "context");

-- UserAIProfile table
CREATE TABLE "UserAIProfile" (
  "id"            TEXT        NOT NULL,
  "userId"        TEXT        NOT NULL,
  "summary"       TEXT        NOT NULL DEFAULT '',
  "interests"     TEXT        NOT NULL DEFAULT '[]',
  "businessFocus" TEXT        NOT NULL DEFAULT '[]',
  "profileScore"  INTEGER     NOT NULL DEFAULT 0,
  "lastUpdated"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserAIProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserAIProfile_userId_key" UNIQUE ("userId"),
  CONSTRAINT "UserAIProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- GoogleIntegration table
CREATE TABLE "GoogleIntegration" (
  "id"            TEXT        NOT NULL,
  "userId"        TEXT        NOT NULL,
  "accessToken"   TEXT        NOT NULL,
  "refreshToken"  TEXT,
  "tokenExpiry"   TIMESTAMP(3),
  "grantedScopes" TEXT[]      NOT NULL DEFAULT '{}',
  "connectedAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "lastSyncAt"    TIMESTAMP(3),
  CONSTRAINT "GoogleIntegration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GoogleIntegration_userId_key" UNIQUE ("userId"),
  CONSTRAINT "GoogleIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "UserPreferences"
  ADD COLUMN "scanFrequency"           INTEGER   NOT NULL DEFAULT 6,
  ADD COLUMN "autoRefreshInterval"     INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN "minImpactFilter"         INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN "riskLevelFilter"         TEXT      NOT NULL DEFAULT 'all',
  ADD COLUMN "widgetVisibility"        JSONB     NOT NULL DEFAULT '{}',
  ADD COLUMN "emailBriefingEnabled"    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN "emailBriefingFrequency"  TEXT      NOT NULL DEFAULT 'manual',
  ADD COLUMN "alertThresholds"         JSONB     NOT NULL DEFAULT '{}',
  ADD COLUMN "lastScanAt"              TIMESTAMP(3);

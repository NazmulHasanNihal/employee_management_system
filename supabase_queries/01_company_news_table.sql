-- ============================================
-- CompanyNews Table
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS "CompanyNews" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title"       TEXT NOT NULL,
    "content"     TEXT NOT NULL,
    "priority"    TEXT NOT NULL DEFAULT 'Medium',       -- Low, Medium, High, Emergency
    "category"    TEXT NOT NULL DEFAULT 'Universal',    -- Universal, Team, Calls, Other
    "targetTeam"  TEXT,                                  -- Department name for team-specific news (nullable)
    "authorId"    TEXT NOT NULL,
    "authorName"  TEXT NOT NULL DEFAULT 'System',
    "isEdited"    BOOLEAN NOT NULL DEFAULT false,
    "isPinned"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyNews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS "CompanyNews_category_idx" ON "CompanyNews"("category");
CREATE INDEX IF NOT EXISTS "CompanyNews_priority_idx" ON "CompanyNews"("priority");
CREATE INDEX IF NOT EXISTS "CompanyNews_authorId_idx" ON "CompanyNews"("authorId");
CREATE INDEX IF NOT EXISTS "CompanyNews_createdAt_idx" ON "CompanyNews"("createdAt" DESC);

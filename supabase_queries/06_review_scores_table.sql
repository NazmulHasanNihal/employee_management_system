-- ============================================
-- 06 — ReviewScore table
-- Run in Supabase SQL Editor. Idempotent (IF NOT EXISTS).
-- Deterministic per-dimension review ratings that replace the previous
-- Math.random radar synthesis in reviews.getMine.
-- ============================================

CREATE TABLE IF NOT EXISTS "ReviewScore" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "reviewId"    TEXT NOT NULL,
    "dimension"   TEXT NOT NULL,                       -- e.g. Communication, Leadership, Execution
    "rating"      DOUBLE PRECISION NOT NULL,           -- 1.0 - 5.0
    "reviewerId"  TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewScore_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewScore_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "ReviewScore_reviewId_dimension_key" UNIQUE ("reviewId", "dimension")
);

CREATE INDEX IF NOT EXISTS "ReviewScore_userId_idx" ON "ReviewScore"("userId");
CREATE INDEX IF NOT EXISTS "ReviewScore_reviewId_idx" ON "ReviewScore"("reviewId");

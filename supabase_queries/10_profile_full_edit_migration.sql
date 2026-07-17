-- ============================================
-- 10 — Make the entire profile editable (P11)
-- Run in Supabase SQL Editor. Idempotent (IF NOT EXISTS / DO blocks).
-- Mirrors the new columns/models in prisma/schema.prisma after the profile
-- was made fully self-service (name, employment, manager, branch, joinDate,
-- delegation expiry) and adds the ProfilePhotoHistory table.
-- ============================================

-- ── New "User" columns ──
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "proxyValidUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "joinDate" TIMESTAMP(3);

-- FK: User.branchId -> Branch.id (skip if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'User_branchId_fkey' AND table_name = 'User'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── ProfilePhotoHistory table ──
CREATE TABLE IF NOT EXISTS "ProfilePhotoHistory" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfilePhotoHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProfilePhotoHistory_userId_idx" ON "ProfilePhotoHistory"("userId");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ProfilePhotoHistory_userId_fkey' AND table_name = 'ProfilePhotoHistory'
  ) THEN
    ALTER TABLE "ProfilePhotoHistory" ADD CONSTRAINT "ProfilePhotoHistory_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── Seed a few common Branches if the table is empty (safe; adjust names) ──
INSERT INTO "Branch" ("id", "name", "city", "timezone", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Head Office', 'Dhaka', 'Asia/Dhaka', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Branch");

-- ── Optional: a curated list of countries for the profile dropdown ──
-- (UI sends the country name as free text; this table is just a reference
--  list you can join against. Not required for the feature to work.)
CREATE TABLE IF NOT EXISTS "Country" (
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);
INSERT INTO "Country" ("code", "name") VALUES
  ('BD', 'Bangladesh'), ('IN', 'India'), ('PK', 'Pakistan'),
  ('US', 'United States'), ('GB', 'United Kingdom'), ('AE', 'United Arab Emirates'),
  ('SA', 'Saudi Arabia'), ('CA', 'Canada'), ('AU', 'Australia'), ('SG', 'Singapore')
ON CONFLICT ("code") DO NOTHING;

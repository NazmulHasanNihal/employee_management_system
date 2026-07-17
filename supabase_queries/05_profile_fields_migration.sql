-- ============================================
-- 05 — User profile fields migration
-- Run in Supabase SQL Editor. Idempotent (IF NOT EXISTS).
-- Mirrors the profile columns already declared in prisma/schema.prisma
-- so the live DB matches the schema even if `prisma db push` was skipped.
-- ============================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "employmentType" TEXT NOT NULL DEFAULT 'Full-Time';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "joinDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedin" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "github" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitter" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "website" TEXT;

-- ── Bangladesh localization fields (Phase A5 / B) ──
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nid" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bloodGroup" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "religion" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

-- Branch + Holiday tables (mirror prisma/schema.prisma). Create only if missing.
CREATE TABLE IF NOT EXISTS "Branch" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Holiday" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "name" TEXT NOT NULL,
  "nameBn" TEXT,
  "type" TEXT NOT NULL DEFAULT 'Public',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_date_key" ON "Holiday"("date");

-- FK from User.branchId -> Branch.id (skip if it already exists)
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

-- Payroll.currency default BDT
ALTER TABLE "Payroll" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'BDT';


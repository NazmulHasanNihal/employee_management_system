-- ============================================
-- 08 — Storage RLS policies for bucket ems-uploads
-- Run in Supabase SQL Editor. Idempotent (DROP IF EXISTS first).
-- Users manage ONLY their own files. Admins can read all.
-- Avatars (avatars/<uid>/...) are effectively public via the bucket's
-- public flag; documents (documents/<uid>/...) are private and protected here.
-- ============================================

-- Helper: extract the owning user id from the object path prefix.
-- Paths look like: avatars/<uuid>/... or documents/<uuid>/...
create or replace function public.storage_owner(path text)
returns uuid language sql immutable as $$
  select nullif(split_part(path, '/', 2), '')::uuid
$$;

-- Public read of avatars. CRITICAL: must be granted to the `anon` role as well
-- as `authenticated`, otherwise unauthenticated browsers (and image fetches
-- that don't carry a session) get 403 and uploaded profile pictures stop
-- loading. This is the policy that fixes "avatars showed before, now 403".
drop policy if exists "Avatars are public readable" on storage.objects;
create policy "Avatars are public readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'ems-uploads' and split_part(name, '/', 1) = 'avatars');

-- Authenticated users can read any document they own.
drop policy if exists "Users read own documents" on storage.objects;
create policy "Users read own documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'ems-uploads' and split_part(name, '/', 1) = 'documents'
         and storage_owner(name) = auth.uid());

-- Users can insert only into their own folder.
drop policy if exists "Users upload to own folder" on storage.objects;
create policy "Users upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ems-uploads'
              and storage_owner(name) = auth.uid());

-- Users can update/delete only their own objects.
drop policy if exists "Users manage own objects" on storage.objects;
create policy "Users manage own objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'ems-uploads' and storage_owner(name) = auth.uid())
  with check (bucket_id = 'ems-uploads' and storage_owner(name) = auth.uid());

drop policy if exists "Users delete own objects" on storage.objects;
create policy "Users delete own objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ems-uploads' and storage_owner(name) = auth.uid());

-- Admins can read all objects (for support / audits).
drop policy if exists "Admins read all uploads" on storage.objects;
create policy "Admins read all uploads"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ems-uploads'
    and exists (
      select 1 from "User" u
      where u.id = auth.uid()::text and u."role" in ('Admin', 'HR Manager')
    )
  );

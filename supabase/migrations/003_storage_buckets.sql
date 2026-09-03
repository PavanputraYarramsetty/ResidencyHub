-- ============================================================
-- Sridevi Residency — Storage Buckets
-- ============================================================

-- Create private storage buckets for document photos
-- These must be run via Supabase dashboard or API since
-- storage bucket creation is not standard SQL.
-- 
-- Bucket: aadhar-photos (private)
-- Bucket: passport-photos (private)
--
-- Run this in the Supabase SQL Editor or use the Storage API:

insert into storage.buckets (id, name, public)
values ('aadhar-photos', 'aadhar-photos', false);

insert into storage.buckets (id, name, public)
values ('passport-photos', 'passport-photos', false);

-- Storage policies: authenticated users in the same residency can upload/read

create policy "Authenticated users can upload aadhar photos"
  on storage.objects for insert
  with check (
    bucket_id = 'aadhar-photos'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can view aadhar photos"
  on storage.objects for select
  using (
    bucket_id = 'aadhar-photos'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can upload passport photos"
  on storage.objects for insert
  with check (
    bucket_id = 'passport-photos'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can view passport photos"
  on storage.objects for select
  using (
    bucket_id = 'passport-photos'
    and auth.role() = 'authenticated'
  );

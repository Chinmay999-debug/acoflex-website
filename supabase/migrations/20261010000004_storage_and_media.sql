-- ==============================================================================
-- Acoflex CMS Phase 2.1: Website Media Storage and Assets Catalog
-- Migration: 20261010000004_storage_and_media.sql
-- ==============================================================================

-- 1. Media Assets Catalog Table
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL DEFAULT 'website-media',
  file_path text NOT NULL UNIQUE,
  filename text NOT NULL,
  mime_type text NOT NULL,
  file_size int NOT NULL,
  public_url text NOT NULL,
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_file_path 
ON public.media_assets(file_path);

DROP TRIGGER IF EXISTS set_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER set_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 2. Media Assets RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read media assets" ON public.media_assets;
CREATE POLICY "Public read media assets"
ON public.media_assets
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Admins full access to media assets" ON public.media_assets;
CREATE POLICY "Admins full access to media assets"
ON public.media_assets
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Storage Bucket Configuration
-- Creates or updates the public website-media bucket with 5MB limit and image-only MIME constraints.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-media',
  'website-media',
  true,
  5242880, -- 5 MB
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Storage Objects Row Level Security Policies
-- Ensures public can view media, but only verified administrators can upload, update, or remove.

-- Read policy (Public CDN access)
DROP POLICY IF EXISTS "Public read website media bucket" ON storage.objects;
CREATE POLICY "Public read website media bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'website-media');

-- Admin Upload policy
DROP POLICY IF EXISTS "Admins upload website media" ON storage.objects;
CREATE POLICY "Admins upload website media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'website-media'
  AND public.is_admin()
);

-- Admin Update policy
DROP POLICY IF EXISTS "Admins update website media" ON storage.objects;
CREATE POLICY "Admins update website media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'website-media'
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'website-media'
  AND public.is_admin()
);

-- Admin Delete policy
DROP POLICY IF EXISTS "Admins delete website media" ON storage.objects;
CREATE POLICY "Admins delete website media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'website-media'
  AND public.is_admin()
);

-- ==============================================================================
-- Acoflex CMS Phase 2.1: Site Settings and Pages with Draft/Publish Support
-- Migration: 20261010000002_site_settings_and_pages.sql
-- ==============================================================================

-- 1. Site Settings Table (Global Contact, Hours, Header & Footer)
-- Holds dual records ('published' vs 'draft') for setting_key = 'global'.
CREATE TABLE IF NOT EXISTS public.site_settings (
  setting_key text NOT NULL DEFAULT 'global',
  version text NOT NULL CHECK (version IN ('published', 'draft')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (setting_key, version)
);

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 2. Pages Registry Table
CREATE TABLE IF NOT EXISTS public.pages (
  slug text PRIMARY KEY,
  title text NOT NULL,
  has_unpublished_changes boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_pages_updated_at ON public.pages;
CREATE TRIGGER set_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 3. Page Content Versions Table
-- Strictly isolates 'published' version from 'draft' version.
CREATE TABLE IF NOT EXISTS public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL REFERENCES public.pages(slug) ON DELETE CASCADE,
  version text NOT NULL CHECK (version IN ('published', 'draft')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_page_slug_version UNIQUE (page_slug, version)
);

CREATE INDEX IF NOT EXISTS idx_page_content_lookup 
ON public.page_content(page_slug, version);

DROP TRIGGER IF EXISTS set_page_content_updated_at ON public.page_content;
CREATE TRIGGER set_page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4. Publish Page Function (Atomic Transition from Draft to Published)
CREATE OR REPLACE FUNCTION public.publish_page(target_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  draft_record record;
BEGIN
  -- Strict server-side admin check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only authorized administrators can publish content.';
  END IF;

  -- Verify draft exists
  SELECT * INTO draft_record
  FROM public.page_content
  WHERE page_slug = target_slug AND version = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No draft found for page %', target_slug;
  END IF;

  -- Upsert published record with draft content
  INSERT INTO public.page_content (page_slug, version, content, updated_at)
  VALUES (target_slug, 'published', draft_record.content, now())
  ON CONFLICT (page_slug, version)
  DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now();

  -- Update page metadata
  UPDATE public.pages
  SET
    has_unpublished_changes = false,
    published_at = now(),
    updated_at = now()
  WHERE slug = target_slug;
END;
$$;

-- Revoke unintended execution from public/anon, grant only to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.publish_page(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_page(text) TO authenticated, service_role;

-- 5. Publish Site Settings Function
CREATE OR REPLACE FUNCTION public.publish_site_settings(target_key text DEFAULT 'global')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  draft_record record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only authorized administrators can publish settings.';
  END IF;

  SELECT * INTO draft_record
  FROM public.site_settings
  WHERE setting_key = target_key AND version = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No draft settings found for key %', target_key;
  END IF;

  INSERT INTO public.site_settings (setting_key, version, data, published_at, updated_at)
  VALUES (target_key, 'published', draft_record.data, now(), now())
  ON CONFLICT (setting_key, version)
  DO UPDATE SET
    data = EXCLUDED.data,
    published_at = now(),
    updated_at = now();
END;
$$;

-- Revoke unintended execution from public/anon, grant only to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.publish_site_settings(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_site_settings(text) TO authenticated, service_role;

-- 6. Row Level Security Policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- site_settings RLS
-- Public can ONLY view the published version
DROP POLICY IF EXISTS "Public read published site settings" ON public.site_settings;
CREATE POLICY "Public read published site settings"
ON public.site_settings
FOR SELECT
TO public
USING (version = 'published');

-- Admins can read both draft and published, and perform updates
DROP POLICY IF EXISTS "Admins full access to site settings" ON public.site_settings;
CREATE POLICY "Admins full access to site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- pages RLS
-- Public can view page slugs and published_at metadata
DROP POLICY IF EXISTS "Public read pages registry" ON public.pages;
CREATE POLICY "Public read pages registry"
ON public.pages
FOR SELECT
TO public
USING (true);

-- Admins have full access to pages registry
DROP POLICY IF EXISTS "Admins full access to pages registry" ON public.pages;
CREATE POLICY "Admins full access to pages registry"
ON public.pages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- page_content RLS
-- Public can ONLY view published version
DROP POLICY IF EXISTS "Public read published page content" ON public.page_content;
CREATE POLICY "Public read published page content"
ON public.page_content
FOR SELECT
TO public
USING (version = 'published');

-- Admins have full access to page content versions
DROP POLICY IF EXISTS "Admins full access to page content" ON public.page_content;
CREATE POLICY "Admins full access to page content"
ON public.page_content
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

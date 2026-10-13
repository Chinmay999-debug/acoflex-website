-- ==============================================================================
-- Acoflex CMS Phase 2.1: Admin Authorisation and Utilities
-- Migration: 20261010000001_admin_auth.sql
-- ==============================================================================

-- 1. Shared trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger functions must not be exposed as public RPC endpoints
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Explicit Admin Users Table
-- Only users listed in this table with role = 'admin' are granted CMS access.
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS set_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER set_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 3. Security Definer Helper Function to Verify Admin Status
-- Runs with search_path = '' and fully qualified object references to prevent search-path injection.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
  );
$$;

-- Explicitly revoke execution from public/anon, grant only to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 4. Strict Row Level Security on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can read the admin list
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only verified administrators can insert, update, or remove admin users
DROP POLICY IF EXISTS "Admins can insert admin_users" ON public.admin_users;
CREATE POLICY "Admins can insert admin_users"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update admin_users" ON public.admin_users;
CREATE POLICY "Admins can update admin_users"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete admin_users" ON public.admin_users;
CREATE POLICY "Admins can delete admin_users"
ON public.admin_users
FOR DELETE
TO authenticated
USING (public.is_admin());
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
-- ==============================================================================
-- Acoflex CMS Phase 2.1: Product Catalogue (Categories and Confirmed Products)
-- Migration: 20261010000003_catalogue.sql
-- ==============================================================================

-- 1. Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  summary text NOT NULL,
  description text NOT NULL,
  banner_url text NOT NULL,
  image_url text,
  image_alt text,
  coming_soon boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_slug 
ON public.product_categories(slug);

CREATE INDEX IF NOT EXISTS idx_product_categories_order 
ON public.product_categories(sort_order);

DROP TRIGGER IF EXISTS set_product_categories_updated_at ON public.product_categories;
CREATE TRIGGER set_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL,
  system text NOT NULL,
  summary text NOT NULL,
  overview text NOT NULL,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  highlights text[] NOT NULL DEFAULT '{}',
  applications text[] NOT NULL DEFAULT '{}',
  range_groups jsonb DEFAULT '[]'::jsonb,
  image_url text NOT NULL,
  image_alt text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('representative', 'manufacturing')),
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_slug 
ON public.products(slug);

CREATE INDEX IF NOT EXISTS idx_products_order 
ON public.products(sort_order);

CREATE INDEX IF NOT EXISTS idx_products_published 
ON public.products(is_published);

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 3. Staged Edits / Drafts for Products
-- Holds staging drafts when an admin edits a product before publishing.
CREATE TABLE IF NOT EXISTS public.product_drafts (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  draft_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_product_drafts_updated_at ON public.product_drafts;
CREATE TRIGGER set_product_drafts_updated_at
BEFORE UPDATE ON public.product_drafts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4. Publish Product Function
-- Securely verifies caller, checks product existence, safely casts JSON arrays, and removes draft.
CREATE OR REPLACE FUNCTION public.publish_product(target_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  draft_record record;
  d jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only authorized administrators can publish products.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = target_product_id) THEN
    RAISE EXCEPTION 'Product % not found.', target_product_id;
  END IF;

  SELECT * INTO draft_record
  FROM public.product_drafts
  WHERE product_id = target_product_id;

  IF NOT FOUND THEN
    -- If no pending draft object, ensure is_published is true
    UPDATE public.products
    SET is_published = true, updated_at = now()
    WHERE id = target_product_id;
    RETURN;
  END IF;

  d := draft_record.draft_data;

  UPDATE public.products
  SET
    name = COALESCE(d->>'name', name),
    full_name = COALESCE(d->>'full_name', full_name),
    system = COALESCE(d->>'system', system),
    summary = COALESCE(d->>'summary', summary),
    overview = COALESCE(d->>'overview', overview),
    facts = CASE 
      WHEN jsonb_typeof(d->'facts') = 'array' THEN d->'facts' 
      ELSE facts 
    END,
    highlights = CASE 
      WHEN jsonb_typeof(d->'highlights') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(d->'highlights')) 
      ELSE highlights 
    END,
    applications = CASE 
      WHEN jsonb_typeof(d->'applications') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(d->'applications')) 
      ELSE applications 
    END,
    range_groups = CASE 
      WHEN jsonb_typeof(d->'range_groups') = 'array' THEN d->'range_groups' 
      ELSE range_groups 
    END,
    image_url = COALESCE(d->>'image_url', image_url),
    image_alt = COALESCE(d->>'image_alt', image_alt),
    image_type = COALESCE(d->>'image_type', image_type),
    is_published = true,
    updated_at = now()
  WHERE id = target_product_id;

  -- Remove staged draft after successful publication
  DELETE FROM public.product_drafts WHERE product_id = target_product_id;
END;
$$;

-- Revoke unintended execution from public/anon, grant only to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.publish_product(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_product(uuid) TO authenticated, service_role;

-- 5. Row Level Security Policies
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_drafts ENABLE ROW LEVEL SECURITY;

-- product_categories RLS
DROP POLICY IF EXISTS "Public read published categories" ON public.product_categories;
CREATE POLICY "Public read published categories"
ON public.product_categories
FOR SELECT
TO public
USING (is_published = true);

DROP POLICY IF EXISTS "Admins full access to categories" ON public.product_categories;
CREATE POLICY "Admins full access to categories"
ON public.product_categories
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- products RLS
DROP POLICY IF EXISTS "Public read published products" ON public.products;
CREATE POLICY "Public read published products"
ON public.products
FOR SELECT
TO public
USING (is_published = true);

DROP POLICY IF EXISTS "Admins full access to products" ON public.products;
CREATE POLICY "Admins full access to products"
ON public.products
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- product_drafts RLS (Strictly isolated: Public has NO access)
DROP POLICY IF EXISTS "Admins full access to product drafts" ON public.product_drafts;
CREATE POLICY "Admins full access to product drafts"
ON public.product_drafts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
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
-- ==============================================================================
-- Acoflex CMS Phase 2.1: Initial Seed Data
-- Migration: 20261010000005_seed_data.sql
-- Sources all content strictly from src/lib/site-data.ts with zero unconfirmed specs.
-- ==============================================================================

-- 1. Seed Site Settings (Global Contact & Footer Information)
INSERT INTO public.site_settings (setting_key, version, data, published_at)
VALUES
(
  'global',
  'published',
  '{
    "company": "Saiyanm Industries Pvt. Ltd.",
    "address": "Vill Simbla (Behind Hanuman Mandir), P.O., Teh. Barara, Distt. Ambala, Haryana 133201, India",
    "emails": ["contact@acoflexpvc.com", "info@acoflexpvc.com"],
    "hours": "Monday–Saturday, 8:00–17:30",
    "notice_bar": {
      "location": "Barara, Ambala, Haryana",
      "hours": "Monday–Saturday, 8:00–17:30",
      "email": "contact@acoflexpvc.com"
    },
    "footer": {
      "tagline": "Plumbing, drainage and agriculture pipe systems manufactured in Ambala, Haryana.",
      "copyright": "Acoflex",
      "origin": "Made in India"
    }
  }'::jsonb,
  now()
),
(
  'global',
  'draft',
  '{
    "company": "Saiyanm Industries Pvt. Ltd.",
    "address": "Vill Simbla (Behind Hanuman Mandir), P.O., Teh. Barara, Distt. Ambala, Haryana 133201, India",
    "emails": ["contact@acoflexpvc.com", "info@acoflexpvc.com"],
    "hours": "Monday–Saturday, 8:00–17:30",
    "notice_bar": {
      "location": "Barara, Ambala, Haryana",
      "hours": "Monday–Saturday, 8:00–17:30",
      "email": "contact@acoflexpvc.com"
    },
    "footer": {
      "tagline": "Plumbing, drainage and agriculture pipe systems manufactured in Ambala, Haryana.",
      "copyright": "Acoflex",
      "origin": "Made in India"
    }
  }'::jsonb,
  now()
)
ON CONFLICT (setting_key, version) DO UPDATE SET data = EXCLUDED.data;

-- 2. Seed Pages Registry
INSERT INTO public.pages (slug, title, has_unpublished_changes, published_at)
VALUES
  ('home', 'Home', false, now()),
  ('about', 'About', false, now()),
  ('manufacturing', 'Manufacturing', false, now()),
  ('quality', 'Quality', false, now()),
  ('infrastructure', 'Infrastructure', false, now()),
  ('dealers', 'Dealers and distributors', false, now()),
  ('products', 'Our products', false, now()),
  ('faq', 'Frequently asked questions', false, now()),
  ('resources', 'Resources', false, now()),
  ('contact', 'Contact us', false, now())
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

-- 3. Seed Page Content (Draft and Published identical baselines)

-- Home Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'home',
  'published',
  '{
    "hero": {
      "kicker": "Pipe manufacturer · Ambala, Haryana",
      "title": "Pipe systems for plumbing, drainage and agriculture",
      "lede": "Acoflex manufactures CPVC, UPVC, PPR-C, SWR, drainage and agricultural pipes at its plant in Ambala, Haryana.",
      "cta_primary": { "label": "Explore products", "to": "/products" },
      "cta_secondary": { "label": "Contact sales", "to": "/contact" }
    },
    "strengths": [
      { "title": "Automated extrusion", "copy": "Pipe extrusion lines at the Ambala plant." },
      { "title": "In-house testing lab", "copy": "Quality checks carried out at the plant." },
      { "title": "Factory inventory", "copy": "Finished goods stored at the factory." },
      { "title": "Technical information", "copy": "Product and technical details shared on request." }
    ],
    "products_section": {
      "kicker": "Our products",
      "title": "Four product categories, one dependable supplier",
      "copy": "Browse by category to find the right pipe system for your application."
    },
    "about_teaser": {
      "kicker": "About Acoflex",
      "title": "A pipe manufacturer based in Ambala, Haryana",
      "copy": "Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in Barara, Ambala, with extrusion, testing and storage facilities on site."
    },
    "manufacturing_teaser": {
      "kicker": "Manufacturing",
      "title": "From raw material to finished pipe",
      "copy": "Production, testing and storage stages at the Ambala plant."
    },
    "quality_teaser": {
      "kicker": "Quality",
      "title": "An in-house testing lab at the plant",
      "copy": "Acoflex carries out quality checks at its own testing lab. Testing details and quality documentation for each product are available on request."
    },
    "dealers_teaser": {
      "kicker": "Dealers and distributors",
      "title": "Partner with Acoflex",
      "copy": "Acoflex welcomes enquiries from wholesalers, distributors and project buyers."
    }
  }'::jsonb
),
(
  'home',
  'draft',
  '{
    "hero": {
      "kicker": "Pipe manufacturer · Ambala, Haryana",
      "title": "Pipe systems for plumbing, drainage and agriculture",
      "lede": "Acoflex manufactures CPVC, UPVC, PPR-C, SWR, drainage and agricultural pipes at its plant in Ambala, Haryana.",
      "cta_primary": { "label": "Explore products", "to": "/products" },
      "cta_secondary": { "label": "Contact sales", "to": "/contact" }
    },
    "strengths": [
      { "title": "Automated extrusion", "copy": "Pipe extrusion lines at the Ambala plant." },
      { "title": "In-house testing lab", "copy": "Quality checks carried out at the plant." },
      { "title": "Factory inventory", "copy": "Finished goods stored at the factory." },
      { "title": "Technical information", "copy": "Product and technical details shared on request." }
    ],
    "products_section": {
      "kicker": "Our products",
      "title": "Four product categories, one dependable supplier",
      "copy": "Browse by category to find the right pipe system for your application."
    },
    "about_teaser": {
      "kicker": "About Acoflex",
      "title": "A pipe manufacturer based in Ambala, Haryana",
      "copy": "Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in Barara, Ambala, with extrusion, testing and storage facilities on site."
    },
    "manufacturing_teaser": {
      "kicker": "Manufacturing",
      "title": "From raw material to finished pipe",
      "copy": "Production, testing and storage stages at the Ambala plant."
    },
    "quality_teaser": {
      "kicker": "Quality",
      "title": "An in-house testing lab at the plant",
      "copy": "Acoflex carries out quality checks at its own testing lab. Testing details and quality documentation for each product are available on request."
    },
    "dealers_teaser": {
      "kicker": "Dealers and distributors",
      "title": "Partner with Acoflex",
      "copy": "Acoflex welcomes enquiries from wholesalers, distributors and project buyers."
    }
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- About Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'about',
  'published',
  '{
    "hero": {
      "title": "About Acoflex",
      "intro": "Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in Barara, Ambala, Haryana."
    },
    "markets": [
      {
        "title": "Residential and commercial",
        "copy": "Water supply and drainage pipe systems for homes, housing projects and commercial buildings."
      },
      {
        "title": "Agriculture",
        "copy": "Column and pressure pipes for borewells, irrigation and rural water supply."
      },
      {
        "title": "Projects and infrastructure",
        "copy": "Pipe systems for institutional projects and underground drainage works."
      }
    ],
    "services": [
      "Bulk wholesale supply",
      "Institutional project supply",
      "Dealer and distributor supply"
    ]
  }'::jsonb
),
(
  'about',
  'draft',
  '{
    "hero": {
      "title": "About Acoflex",
      "intro": "Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in Barara, Ambala, Haryana."
    },
    "markets": [
      {
        "title": "Residential and commercial",
        "copy": "Water supply and drainage pipe systems for homes, housing projects and commercial buildings."
      },
      {
        "title": "Agriculture",
        "copy": "Column and pressure pipes for borewells, irrigation and rural water supply."
      },
      {
        "title": "Projects and infrastructure",
        "copy": "Pipe systems for institutional projects and underground drainage works."
      }
    ],
    "services": [
      "Bulk wholesale supply",
      "Institutional project supply",
      "Dealer and distributor supply"
    ]
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- Manufacturing Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'manufacturing',
  'published',
  '{
    "hero": {
      "title": "Manufacturing",
      "intro": "Production at the Acoflex plant — from raw material storage through extrusion, calibration, marking and testing to finished goods storage."
    },
    "process_steps": [
      { "name": "Extrusion", "note": "Automated extrusion lines" },
      { "name": "Calibration and cooling", "note": "Sizing the pipe as it is formed", "diagram": "calibration" },
      { "name": "Pipe marking", "note": "In-line product marking", "diagram": "marking" },
      { "name": "Socketing", "note": "Forming the pipe ends" },
      { "name": "Quality testing", "note": "Checks at the in-house lab" },
      { "name": "Raw material storage", "note": "Silo storage at the plant" },
      { "name": "Finished goods storage", "note": "Stock held at the factory" }
    ],
    "plant_areas": [
      { "title": "Raw material storage" },
      { "title": "Extrusion lines" },
      { "title": "Testing lab" },
      { "title": "Finished goods storage" }
    ]
  }'::jsonb
),
(
  'manufacturing',
  'draft',
  '{
    "hero": {
      "title": "Manufacturing",
      "intro": "Production at the Acoflex plant — from raw material storage through extrusion, calibration, marking and testing to finished goods storage."
    },
    "process_steps": [
      { "name": "Extrusion", "note": "Automated extrusion lines" },
      { "name": "Calibration and cooling", "note": "Sizing the pipe as it is formed", "diagram": "calibration" },
      { "name": "Pipe marking", "note": "In-line product marking", "diagram": "marking" },
      { "name": "Socketing", "note": "Forming the pipe ends" },
      { "name": "Quality testing", "note": "Checks at the in-house lab" },
      { "name": "Raw material storage", "note": "Silo storage at the plant" },
      { "name": "Finished goods storage", "note": "Stock held at the factory" }
    ],
    "plant_areas": [
      { "title": "Raw material storage" },
      { "title": "Extrusion lines" },
      { "title": "Testing lab" },
      { "title": "Finished goods storage" }
    ]
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- Quality Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'quality',
  'published',
  '{
    "hero": {
      "title": "Quality",
      "intro": "Quality checks run alongside production at the Acoflex plant, supported by an in-house testing lab."
    },
    "stages": [
      { "title": "Raw material", "copy": "Raw material is stored in silos at the plant before processing." },
      { "title": "Production", "copy": "Pipes are formed on extrusion lines with calibration and cooling stages." },
      { "title": "Testing", "copy": "Products are checked at the in-house testing lab. Testing details are available on request." }
    ],
    "lab_section": {
      "kicker": "Testing lab",
      "title": "Quality checks at the plant",
      "copy": "Acoflex has an in-house testing lab at its Ambala plant. Details of the tests carried out for each product, and any applicable standards, are available on request."
    }
  }'::jsonb
),
(
  'quality',
  'draft',
  '{
    "hero": {
      "title": "Quality",
      "intro": "Quality checks run alongside production at the Acoflex plant, supported by an in-house testing lab."
    },
    "stages": [
      { "title": "Raw material", "copy": "Raw material is stored in silos at the plant before processing." },
      { "title": "Production", "copy": "Pipes are formed on extrusion lines with calibration and cooling stages." },
      { "title": "Testing", "copy": "Products are checked at the in-house testing lab. Testing details are available on request." }
    ],
    "lab_section": {
      "kicker": "Testing lab",
      "title": "Quality checks at the plant",
      "copy": "Acoflex has an in-house testing lab at its Ambala plant. Details of the tests carried out for each product, and any applicable standards, are available on request."
    }
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- Infrastructure Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'infrastructure',
  'published',
  '{
    "hero": {
      "title": "Infrastructure",
      "intro": "The Acoflex plant brings extrusion, testing and storage facilities together at one site in Ambala, Haryana."
    },
    "facilities": [
      {
        "title": "Extrusion plant",
        "copy": "Automated extrusion lines producing the Acoflex pipe range.",
        "alt": "Automated extrusion lines"
      },
      {
        "title": "Quality testing lab",
        "copy": "An in-house lab for product quality checks. Testing details are available on request.",
        "alt": "Technician inspecting pipes in the testing lab"
      },
      {
        "title": "Storage and logistics",
        "copy": "Raw material silos and finished goods storage at the plant.",
        "alt": "Pipe stock on racks at the plant"
      }
    ]
  }'::jsonb
),
(
  'infrastructure',
  'draft',
  '{
    "hero": {
      "title": "Infrastructure",
      "intro": "The Acoflex plant brings extrusion, testing and storage facilities together at one site in Ambala, Haryana."
    },
    "facilities": [
      {
        "title": "Extrusion plant",
        "copy": "Automated extrusion lines producing the Acoflex pipe range.",
        "alt": "Automated extrusion lines"
      },
      {
        "title": "Quality testing lab",
        "copy": "An in-house lab for product quality checks. Testing details are available on request.",
        "alt": "Technician inspecting pipes in the testing lab"
      },
      {
        "title": "Storage and logistics",
        "copy": "Raw material silos and finished goods storage at the plant.",
        "alt": "Pipe stock on racks at the plant"
      }
    ]
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- Dealers Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'dealers',
  'published',
  '{
    "hero": {
      "title": "Dealers and distributors",
      "intro": "Acoflex welcomes enquiries from wholesalers, distributors and project buyers interested in supplying its pipe systems."
    },
    "benefits": [
      { "title": "Direct factory pricing", "copy": "Buy directly from the manufacturer." },
      { "title": "Ready inventory", "copy": "Finished goods held at the factory." },
      { "title": "Logistics support", "copy": "Support with dispatch for dealer orders." },
      { "title": "Marketing collateral", "copy": "Branding material for your outlet." }
    ]
  }'::jsonb
),
(
  'dealers',
  'draft',
  '{
    "hero": {
      "title": "Dealers and distributors",
      "intro": "Acoflex welcomes enquiries from wholesalers, distributors and project buyers interested in supplying its pipe systems."
    },
    "benefits": [
      { "title": "Direct factory pricing", "copy": "Buy directly from the manufacturer." },
      { "title": "Ready inventory", "copy": "Finished goods held at the factory." },
      { "title": "Logistics support", "copy": "Support with dispatch for dealer orders." },
      { "title": "Marketing collateral", "copy": "Branding material for your outlet." }
    ]
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- Products Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'products',
  'published',
  '{
    "hero": {
      "title": "Our products",
      "intro": "Pipe systems for plumbing, drainage and agriculture, organised by application. Choose a category to see the full range."
    },
    "enquiry_band": {
      "title": "Not sure which pipe you need?",
      "copy": "Share your application and the team will recommend the right product and specification."
    }
  }'::jsonb
),
(
  'products',
  'draft',
  '{
    "hero": {
      "title": "Our products",
      "intro": "Pipe systems for plumbing, drainage and agriculture, organised by application. Choose a category to see the full range."
    },
    "enquiry_band": {
      "title": "Not sure which pipe you need?",
      "copy": "Share your application and the team will recommend the right product and specification."
    }
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- FAQ Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'faq',
  'published',
  '{
    "hero": {
      "title": "Frequently asked questions",
      "intro": "Answers to common questions about our products, testing and supply."
    },
    "faqs": [
      {
        "question": "Where can I find sizes and pressure ratings?",
        "answer": "Detailed technical data for each product is being prepared for publication. In the meantime, contact the team with your application and they will share the correct specification."
      },
      {
        "question": "How are products tested?",
        "answer": "Acoflex has an in-house testing lab at its plant. Details of testing and quality documentation for a specific product are available on request."
      },
      {
        "question": "What is the delivery time for bulk orders?",
        "answer": "Delivery depends on the product and order requirements. Contact the team to confirm availability and timing."
      },
      {
        "question": "When will storage water tanks be available?",
        "answer": "The storage water tank range is coming soon. Get in touch to register interest and you will be informed when it launches."
      }
    ]
  }'::jsonb
),
(
  'faq',
  'draft',
  '{
    "hero": {
      "title": "Frequently asked questions",
      "intro": "Answers to common questions about our products, testing and supply."
    },
    "faqs": [
      {
        "question": "Where can I find sizes and pressure ratings?",
        "answer": "Detailed technical data for each product is being prepared for publication. In the meantime, contact the team with your application and they will share the correct specification."
      },
      {
        "question": "How are products tested?",
        "answer": "Acoflex has an in-house testing lab at its plant. Details of testing and quality documentation for a specific product are available on request."
      },
      {
        "question": "What is the delivery time for bulk orders?",
        "answer": "Delivery depends on the product and order requirements. Contact the team to confirm availability and timing."
      },
      {
        "question": "When will storage water tanks be available?",
        "answer": "The storage water tank range is coming soon. Get in touch to register interest and you will be informed when it launches."
      }
    ]
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- Resources Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'resources',
  'published',
  '{
    "hero": {
      "title": "Resources",
      "intro": "Product information and the right way to request technical documents for your project."
    },
    "items": [
      {
        "title": "Product catalogue",
        "copy": "Browse every Acoflex product by category.",
        "link_label": "Browse products",
        "link_to": "/products"
      },
      {
        "title": "Frequently asked questions",
        "copy": "Technical data, testing, delivery and upcoming products.",
        "link_label": "Read the FAQ",
        "link_to": "/faq"
      },
      {
        "title": "Technical data sheets",
        "copy": "Data sheets and brochures are being prepared. Request current specifications from the team.",
        "link_label": "Request documents",
        "link_to": "/contact"
      }
    ]
  }'::jsonb
),
(
  'resources',
  'draft',
  '{
    "hero": {
      "title": "Resources",
      "intro": "Product information and the right way to request technical documents for your project."
    },
    "items": [
      {
        "title": "Product catalogue",
        "copy": "Browse every Acoflex product by category.",
        "link_label": "Browse products",
        "link_to": "/products"
      },
      {
        "title": "Frequently asked questions",
        "copy": "Technical data, testing, delivery and upcoming products.",
        "link_label": "Read the FAQ",
        "link_to": "/faq"
      },
      {
        "title": "Technical data sheets",
        "copy": "Data sheets and brochures are being prepared. Request current specifications from the team.",
        "link_label": "Request documents",
        "link_to": "/contact"
      }
    ]
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- Contact Page Content
INSERT INTO public.page_content (page_slug, version, content)
VALUES
(
  'contact',
  'published',
  '{
    "hero": {
      "title": "Contact us",
      "intro": "For product information, bulk or project supply and dealership enquiries, send us a short brief and the team will respond."
    },
    "map_embed_url": "https://www.google.com/maps?q=Simbla,+Barara,+Ambala,+Haryana+133201&output=embed"
  }'::jsonb
),
(
  'contact',
  'draft',
  '{
    "hero": {
      "title": "Contact us",
      "intro": "For product information, bulk or project supply and dealership enquiries, send us a short brief and the team will respond."
    },
    "map_embed_url": "https://www.google.com/maps?q=Simbla,+Barara,+Ambala,+Haryana+133201&output=embed"
  }'::jsonb
)
ON CONFLICT (page_slug, version) DO UPDATE SET content = EXCLUDED.content;

-- 4. Seed Product Categories (4 Confirmed Categories)
INSERT INTO public.product_categories (slug, name, summary, description, banner_url, image_url, image_alt, coming_soon, sort_order)
VALUES
(
  'plumbing',
  'Plumbing Solutions',
  'Pipe systems for hot and cold water supply in homes, buildings and commercial projects.',
  'Acoflex plumbing solutions cover the main pipe systems used for water supply inside buildings — from cold water lines to hot water distribution and flexible composite runs.',
  '/assets/bakcground-image-factory.webp',
  '/assets/c5.webp',
  'CPVC plumbing pipes laid into a brick wall chase',
  false,
  10
),
(
  'drainage',
  'Drainage Solutions',
  'Soil, waste, rainwater and underground drainage systems.',
  'Drainage solutions for buildings, sewerage and storm water — designed to carry waste and rainwater away.',
  '/assets/pipe-stock.webp',
  '/assets/c2.webp',
  'Grey SWR drainage pipes and fittings fixed to a concrete wall',
  false,
  20
),
(
  'agriculture',
  'Agriculture Pipes',
  'Column and pressure pipes for borewells, irrigation and farm water supply.',
  'Pipes for drawing water from borewells and moving it across fields — built for the everyday demands of agricultural water supply.',
  '/assets/pipe-testing.webp',
  '/assets/c4.webp',
  'Black irrigation pipeline running through a green crop field',
  false,
  30
),
(
  'storage-water-tanks',
  'Storage Water Tanks',
  'A new range of water storage tanks is on the way.',
  'Acoflex is preparing a range of storage water tanks. Contact the team to register interest and be informed when the range launches.',
  '/assets/bakcground-image-factory.webp',
  NULL,
  NULL,
  true,
  40
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  banner_url = EXCLUDED.banner_url,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  coming_soon = EXCLUDED.coming_soon,
  sort_order = EXCLUDED.sort_order;

-- 5. Seed Products (9 Confirmed Products)
-- Plumbing Products
INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'cpvc',
  'CPVC',
  'CPVC Pipes',
  'CPVC plumbing system for hot and cold water',
  'Chlorinated PVC pipes for hot and cold water distribution.',
  'CPVC pipes are used for hot and cold potable water lines in residential and commercial buildings. They are joined with solvent cement, which keeps installation simple and quick on site.',
  '[{"label": "Service", "value": "Hot and cold water"}, {"label": "Jointing", "value": "Solvent cement"}]'::jsonb,
  ARRAY['For hot and cold water lines', 'Solvent-cement jointing', 'Suited to concealed and exposed runs'],
  ARRAY['Residential plumbing', 'Apartments and housing projects', 'Hotels and hospitals', 'Commercial buildings'],
  '/assets/c5.webp',
  'Bundle of cream CPVC pipes in a wall chase',
  'representative',
  10
FROM public.product_categories c WHERE c.slug = 'plumbing'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'upvc',
  'UPVC',
  'UPVC Plumbing Pipes',
  'UPVC plumbing system for cold water supply',
  'Unplasticised PVC pipes for cold water supply and distribution.',
  'UPVC pipes are a dependable choice for cold water supply inside and around buildings. They are lightweight to handle.',
  '[{"label": "Service", "value": "Cold water supply"}]'::jsonb,
  ARRAY['For cold water supply', 'Lightweight and easy to handle'],
  ARRAY['Cold water lines in buildings', 'Overhead tank connections', 'Outdoor water supply', 'Commercial and institutional projects'],
  '/assets/pipe-testing.webp',
  'Pipes on an inspection line at the plant',
  'manufacturing',
  20
FROM public.product_categories c WHERE c.slug = 'plumbing'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'ppr-c',
  'PPR-C',
  'PPR-C Pipes',
  'PPR-C plumbing system for hot and cold water',
  'Polypropylene random copolymer pipes for hot and cold water.',
  'PPR-C pipes are joined by heat fusion, creating a continuous, homogeneous joint between pipe and fitting. They are used for hot and cold water distribution in buildings.',
  '[{"label": "Service", "value": "Hot and cold water"}, {"label": "Jointing", "value": "Heat fusion"}]'::jsonb,
  ARRAY['Heat-fusion jointing', 'For hot and cold water', 'Homogeneous joints'],
  ARRAY['Residential plumbing', 'Commercial buildings', 'Hot water distribution', 'Building services'],
  '/assets/c6.webp',
  'Pipe sections measured with vernier calipers',
  'representative',
  30
FROM public.product_categories c WHERE c.slug = 'plumbing'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'multilayer-composite-pipe',
  'Multilayer Composite Pipe',
  'Multilayer Composite Pipe',
  'Multilayer composite piping for hot and cold water',
  'Polymer pipes with a bonded metal layer, flexible yet able to hold their shape.',
  'Multilayer composite pipes combine inner and outer polymer layers with a bonded metal layer between them. The pipe bends by hand and holds its shape, which reduces the number of fittings needed on a run.',
  '[{"label": "Service", "value": "Hot and cold water"}]'::jsonb,
  ARRAY['Bends and holds its shape', 'Fewer fittings per run'],
  ARRAY['Hot and cold water supply', 'Renovation and retrofit work', 'Residential plumbing', 'Building services'],
  '/assets/b6.webp',
  'Pipe processing equipment at the plant',
  'manufacturing',
  40
FROM public.product_categories c WHERE c.slug = 'plumbing'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

-- Drainage Products
INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'swr-piping-system',
  'SWR Piping System',
  'SWR Piping System',
  'SWR drainage system for soil, waste and rainwater',
  'Soil, waste and rainwater pipes and fittings for buildings.',
  'The SWR piping system carries soil, waste and rainwater from buildings. Pipes and fittings are designed to work together as one drainage system in residential and commercial construction.',
  '[{"label": "Service", "value": "Soil, waste and rainwater"}]'::jsonb,
  ARRAY['Soil, waste and rainwater', 'Complete pipe and fitting system'],
  ARRAY['Residential buildings', 'Commercial complexes', 'Rainwater down-takes', 'Institutional buildings'],
  '/assets/c2.webp',
  'Drainage pipes and bends installed on a wall',
  'representative',
  10
FROM public.product_categories c WHERE c.slug = 'drainage'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'foamcore-pipes',
  'Foamcore Pipes',
  'Foamcore Pipes',
  'Foamcore pipes for non-pressure drainage',
  'Lightweight PVC pipes with a foamed core for non-pressure drainage.',
  'Foamcore pipes have a foamed core layer between solid inner and outer layers. The construction makes the pipe lighter to handle while serving non-pressure drainage and sewerage lines.',
  '[{"label": "Service", "value": "Non-pressure drainage and sewerage"}]'::jsonb,
  ARRAY['Foamed core construction', 'Lighter to handle and install', 'For non-pressure applications'],
  ARRAY['Building drainage', 'Sewerage lines', 'Storm water drainage', 'Ventilation lines'],
  '/assets/pipe-testing-2.webp',
  'Pipes on a roller line at the plant',
  'manufacturing',
  20
FROM public.product_categories c WHERE c.slug = 'drainage'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'dwc-pipes',
  'DWC Pipes',
  'DWC Pipes',
  'Double-wall corrugated pipes for underground drainage',
  'Double-wall corrugated pipes for underground drainage and ducting.',
  'DWC pipes have a corrugated outer wall for stiffness and a smooth inner wall for flow. They are used underground for sewerage, storm water drainage and cable ducting.',
  '[{"label": "Service", "value": "Sewerage, storm water and cable ducting"}, {"label": "Installation", "value": "Underground"}]'::jsonb,
  ARRAY['Corrugated outer wall', 'Smooth inner wall', 'For underground installation'],
  ARRAY['Sewerage networks', 'Storm water drainage', 'Cable ducting', 'Road and infrastructure projects'],
  '/assets/bakcground-image-factory.webp',
  'Pipe extrusion lines at the plant',
  'manufacturing',
  30
FROM public.product_categories c WHERE c.slug = 'drainage'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

-- Agriculture Products
INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'upvc-column-pipes',
  'UPVC Column Pipes',
  'UPVC Column Pipes',
  'UPVC column pipes for submersible pump installations',
  'Threaded column pipes for submersible pumps in borewells.',
  'UPVC column pipes connect submersible pumps to the surface in borewells. They are threaded for straightforward assembly and are much lighter to lower and lift than metal pipes.',
  '[{"label": "Service", "value": "Borewell submersible pumps"}, {"label": "Jointing", "value": "Threaded"}]'::jsonb,
  ARRAY['For submersible pump installations', 'Threaded joints', 'Lighter than metal column pipes'],
  ARRAY['Agricultural borewells', 'Domestic borewells', 'Drinking water schemes', 'Industrial water supply'],
  '/assets/b5.webp',
  'Pipe on a socketing machine at the plant',
  'manufacturing',
  10
FROM public.product_categories c WHERE c.slug = 'agriculture'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (
  category_id, slug, name, full_name, system, summary, overview,
  facts, highlights, applications, image_url, image_alt, image_type, sort_order
)
SELECT
  c.id,
  'pvc-pressure-pipes',
  'PVC Pressure Pipes',
  'PVC Pressure Pipes',
  'PVC pressure pipes for irrigation and water supply',
  'PVC pipes for irrigation and water supply under pressure.',
  'PVC pressure pipes carry water from source to field and are used in irrigation networks and rural water supply. They are supplied with socketed ends for jointing on site.',
  '[{"label": "Service", "value": "Irrigation and water supply"}, {"label": "Jointing", "value": "Socketed ends"}]'::jsonb,
  ARRAY['For irrigation and water supply', 'Socketed ends', 'Lightweight to transport and lay'],
  ARRAY['Farm irrigation', 'Rural water supply', 'Sprinkler mains', 'Water distribution lines'],
  '/assets/c4.webp',
  'Irrigation pipeline with sprinklers in a crop field',
  'representative',
  20
FROM public.product_categories c WHERE c.slug = 'agriculture'
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  system = EXCLUDED.system,
  summary = EXCLUDED.summary,
  overview = EXCLUDED.overview,
  facts = EXCLUDED.facts,
  highlights = EXCLUDED.highlights,
  applications = EXCLUDED.applications,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  image_type = EXCLUDED.image_type,
  sort_order = EXCLUDED.sort_order;

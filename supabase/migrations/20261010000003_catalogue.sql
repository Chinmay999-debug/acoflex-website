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

-- =============================================================
-- READ-ONLY schema fingerprint for CMS migrations 0001-0005
-- -------------------------------------------------------------
-- Single SELECT statement: creates nothing, changes nothing.
-- Safe to run in the hosted Supabase SQL Editor or against a local database.
--
-- Output: one 'summary' row per category (object count + md5 of the sorted
-- definitions), followed by 'detail' rows. Compare the summary hashes with the
-- values produced from a fresh local database built from the migration files.
-- If a category hash differs, compare its detail rows to find the difference.
-- 'server_version' and 'table_privileges' are informational and can
-- legitimately differ between platforms.
-- Each detail value is built by one single-line format() call so that the
-- query survives copy/paste without broken string concatenation.
-- =============================================================
WITH
tbl(t) AS (
  VALUES ('admin_users'), ('site_settings'), ('pages'), ('page_content'),
         ('product_categories'), ('products'), ('product_drafts'), ('media_assets')
),
rels AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c JOIN tbl ON tbl.t = c.relname
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
),
items(category, item, detail) AS (
  SELECT 'server_version', 'server_version', current_setting('server_version')
  UNION ALL
  SELECT 'tables', t, CASE WHEN to_regclass('public.' || t) IS NULL THEN 'MISSING' ELSE 'present' END
  FROM tbl
  UNION ALL
  SELECT 'columns', r.relname || '.' || a.attname,
         format('%s notnull=%s default=%s', format_type(a.atttypid, a.atttypmod), a.attnotnull::text, coalesce(pg_get_expr(d.adbin, d.adrelid), ''))
  FROM rels r
  JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef d ON d.adrelid = r.oid AND d.adnum = a.attnum
  UNION ALL
  SELECT 'constraints', r.relname || '.' || con.conname, pg_get_constraintdef(con.oid)
  FROM rels r JOIN pg_constraint con ON con.conrelid = r.oid
  UNION ALL
  SELECT 'indexes', r.relname || '.' || i.relname, pg_get_indexdef(i.oid)
  FROM rels r JOIN pg_index x ON x.indrelid = r.oid JOIN pg_class i ON i.oid = x.indexrelid
  UNION ALL
  SELECT 'rls', r.relname,
         format('enabled=%s forced=%s', r.relrowsecurity::text, r.relforcerowsecurity::text)
  FROM rels r
  UNION ALL
  SELECT 'triggers', r.relname || '.' || tg.tgname, pg_get_triggerdef(tg.oid)
  FROM rels r JOIN pg_trigger tg ON tg.tgrelid = r.oid AND NOT tg.tgisinternal
  UNION ALL
  SELECT 'policies', p.schemaname || '.' || p.tablename || '.' || p.policyname,
         format('%s permissive=%s roles=%s using=%s check=%s', p.cmd, p.permissive, array_to_string(p.roles, ','), coalesce(p.qual, ''), coalesce(p.with_check, ''))
  FROM pg_policies p
  WHERE (p.schemaname = 'public' AND p.tablename IN (SELECT t FROM tbl))
     OR (p.schemaname = 'storage' AND p.tablename = 'objects' AND p.policyname IN (
          'Public read website media bucket', 'Admins upload website media',
          'Admins update website media', 'Admins delete website media'))
  UNION ALL
  SELECT 'functions', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         format('returns=%s lang=%s secdef=%s volatility=%s config=%s body_md5=%s', pg_get_function_result(p.oid), l.lanname, p.prosecdef::text, p.provolatile::text, coalesce(array_to_string(p.proconfig, ','), ''), md5(p.prosrc))
  FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname IN ('handle_updated_at', 'is_admin', 'publish_page', 'publish_site_settings', 'publish_product')
  UNION ALL
  SELECT 'function_execute', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         format('anon=%s authenticated=%s', has_function_privilege('anon', p.oid, 'EXECUTE')::text, has_function_privilege('authenticated', p.oid, 'EXECUTE')::text)
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname IN ('handle_updated_at', 'is_admin', 'publish_page', 'publish_site_settings', 'publish_product')
  UNION ALL
  SELECT 'table_privileges', r.relname || '.' || ro.rolname,
         format('select=%s insert=%s update=%s delete=%s', has_table_privilege(ro.rolname, r.oid, 'SELECT')::text, has_table_privilege(ro.rolname, r.oid, 'INSERT')::text, has_table_privilege(ro.rolname, r.oid, 'UPDATE')::text, has_table_privilege(ro.rolname, r.oid, 'DELETE')::text)
  FROM rels r CROSS JOIN (VALUES ('anon'), ('authenticated')) AS ro(rolname)
  UNION ALL
  SELECT 'bucket', b.id,
         format('public=%s file_size_limit=%s mime=%s', b.public::text, coalesce(b.file_size_limit::text, 'null'), coalesce(array_to_string(b.allowed_mime_types, ','), 'null'))
  FROM storage.buckets b WHERE b.id = 'website-media'
)
SELECT 'summary' AS kind, category, count(*)::text AS item,
       md5(string_agg(item || '|' || detail, E'\n' ORDER BY item)) AS detail
FROM items GROUP BY category
UNION ALL
SELECT 'detail', category, item, detail FROM items
ORDER BY 1 DESC, 2, 3;

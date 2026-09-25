-- V3 performer label affiliations. Additive only: catalogue brands remain the
-- canonical public label records and affiliations are normalized N:M rows.
CREATE TABLE IF NOT EXISTS v3_performer_brand_affiliations (
  performer_legacy_id text NOT NULL REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  brand_legacy_id text NOT NULL REFERENCES catalog_brands(legacy_id) ON DELETE RESTRICT,
  affiliation_status text NOT NULL DEFAULT 'active' CHECK (affiliation_status IN ('active','inactive')),
  contract_instance_id uuid REFERENCES v3_contract_instances(id) ON DELETE RESTRICT,
  source text NOT NULL DEFAULT 'admin_confirmed',
  effective_from date,
  effective_to date,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (performer_legacy_id, brand_legacy_id),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS v3_performer_brand_affiliations_brand_idx
  ON v3_performer_brand_affiliations(brand_legacy_id, affiliation_status, performer_legacy_id);

-- Preserve the confirmed public names on the already-canonical performer rows.
-- Slugs and legacy IDs remain unchanged, so existing URLs and relationships are
-- not replaced by a second performer record.
WITH confirmed_names(slug, display_name) AS (VALUES
  ('benvao','Benvao'),
  ('cubanuevo','Cubanuevo'),
  ('dondaddy','Dondaddy'),
  ('emjey','Emjey'),
  ('feli','Feli'),
  ('jameson','Jameson'),
  ('josh','Joshh'),
  ('julian','Julian'),
  ('kenji-fox','Kenji Fox'),
  ('kraken','Kraken'),
  ('lollipop','Lollipop'),
  ('luxe-ryn','Luxe Ryn'),
  ('the-fitmaster','The Fitmaster'),
  ('tooclose','TooClose'),
  ('yero','Yero'),
  ('zed','ZE[D]')
)
UPDATE catalog_performers p
SET display_name=n.display_name,
    source_payload=COALESCE(p.source_payload,'{}'::jsonb) || jsonb_build_object('v3_confirmed_public_name', n.display_name)
FROM confirmed_names n
WHERE p.slug=n.slug AND p.display_name IS DISTINCT FROM n.display_name;

-- FLESHLAB ASIA already exists in the imported catalogue under this slug in
-- Production. Preserve that canonical row and normalize only its public label
-- spelling. The fallback insert is for environments without the imported row.
UPDATE catalog_brands
SET name='FLESHLAB ASIA', status='active', v3_lifecycle='active'
WHERE slug='fleshlabasia' OR lower(name)='fleshlab asia';

INSERT INTO catalog_brands(legacy_id,name,slug,description,legacy_logo_url,legacy_cover_image_url,status,source_payload,v3_lifecycle)
SELECT 'label-fleshlab-asia','FLESHLAB ASIA','fleshlabasia','Confirmed FLESHLAB performer label',NULL,NULL,'active',
  jsonb_build_object('origin','v3_confirmed_performer_label_assignments'),'active'
WHERE NOT EXISTS (SELECT 1 FROM catalog_brands WHERE slug='fleshlabasia' OR lower(name)='fleshlab asia');

INSERT INTO catalog_brands(legacy_id,name,slug,description,legacy_logo_url,legacy_cover_image_url,status,source_payload,v3_lifecycle)
SELECT * FROM (VALUES
  ('label-fleshlab-twinks-global','FLESHLAB TWINKS GLOBAL','fleshlab-twinks-global','Confirmed FLESHLAB performer label',NULL::text,NULL::text,'active',jsonb_build_object('origin','v3_confirmed_performer_label_assignments'),'active'),
  ('label-fleshlab-bareback-twinks','FLESHLAB BAREBACK TWINKS','fleshlab-bareback-twinks','Confirmed FLESHLAB performer label',NULL::text,NULL::text,'active',jsonb_build_object('origin','v3_confirmed_performer_label_assignments'),'active')
) AS labels(legacy_id,name,slug,description,legacy_logo_url,legacy_cover_image_url,status,source_payload,v3_lifecycle)
WHERE NOT EXISTS (SELECT 1 FROM catalog_brands existing WHERE existing.slug=labels.slug OR lower(existing.name)=lower(labels.name));

DO $$
DECLARE missing_count integer;
BEGIN
  SELECT count(*) INTO missing_count
  FROM (VALUES
    ('benvao'),('cubanuevo'),('dondaddy'),('emjey'),('feli'),('jameson'),('josh'),('julian'),
    ('kenji-fox'),('kraken'),('lollipop'),('luxe-ryn'),('the-fitmaster'),('tooclose'),('yero'),('zed')
  ) AS expected(slug)
  LEFT JOIN catalog_performers p ON p.slug=expected.slug
  WHERE p.legacy_id IS NULL;
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Cannot seed performer labels: % canonical performer records are missing', missing_count;
  END IF;
END $$;

WITH assignments(performer_slug, label_slug) AS (VALUES
  ('benvao','fleshlabasia'),
  ('cubanuevo','fleshlab-twinks-global'),
  ('dondaddy','fleshlab-twinks-global'),
  ('emjey','fleshlabasia'),
  ('emjey','fleshlab-bareback-twinks'),
  ('feli','fleshlab-twinks-global'),
  ('feli','fleshlab-bareback-twinks'),
  ('jameson','fleshlabasia'),
  ('jameson','fleshlab-bareback-twinks'),
  ('josh','fleshlabasia'),
  ('josh','fleshlab-bareback-twinks'),
  ('julian','fleshlab-bareback-twinks'),
  ('kenji-fox','fleshlabasia'),
  ('kenji-fox','fleshlab-bareback-twinks'),
  ('kraken','fleshlabasia'),
  ('lollipop','fleshlab-twinks-global'),
  ('luxe-ryn','fleshlab-twinks-global'),
  ('the-fitmaster','fleshlabasia'),
  ('tooclose','fleshlab-twinks-global'),
  ('yero','fleshlabasia'),
  ('yero','fleshlab-bareback-twinks'),
  ('zed','fleshlabasia'),
  ('zed','fleshlab-bareback-twinks')
)
INSERT INTO v3_performer_brand_affiliations(performer_legacy_id,brand_legacy_id,affiliation_status,source)
SELECT p.legacy_id,b.legacy_id,'active','admin_confirmed'
FROM assignments a
JOIN catalog_performers p ON p.slug=a.performer_slug
JOIN catalog_brands b ON b.slug=a.label_slug
ON CONFLICT (performer_legacy_id,brand_legacy_id) DO UPDATE
SET affiliation_status='active', source='admin_confirmed', updated_at=now();

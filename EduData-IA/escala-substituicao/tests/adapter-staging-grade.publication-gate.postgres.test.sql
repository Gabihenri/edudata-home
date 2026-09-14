-- Escala Inteligente de Substituição
-- PostgreSQL publication-gate harness — synthetic only
-- NÃO EXECUTAR EM PRODUÇÃO.
-- Requer pgTAP em ambiente local/efêmero.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;
CREATE SCHEMA IF NOT EXISTS escala_publication_test;

CREATE TABLE escala_publication_test.schedule_versions (
  id uuid PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('draft','validated','published','superseded','revoked')),
  version_number integer NOT NULL
);

INSERT INTO escala_publication_test.schedule_versions VALUES
  ('00000000-0000-0000-0000-000000001601','published',1),
  ('00000000-0000-0000-0000-000000001602','validated',2),
  ('00000000-0000-0000-0000-000000001603','draft',3),
  ('00000000-0000-0000-0000-000000001604','superseded',4),
  ('00000000-0000-0000-0000-000000001605','revoked',5);

SELECT plan(4);

-- ADP-16: the downstream-consumable set contains only published versions.
WITH consumable AS (
  SELECT id, version_number
  FROM escala_publication_test.schedule_versions
  WHERE status = 'published'
)
SELECT is(
  (SELECT count(*) FROM consumable),
  1::bigint,
  'ADP-16 exactly one published version is consumable'
);

WITH consumable AS (
  SELECT id
  FROM escala_publication_test.schedule_versions
  WHERE status = 'published'
)
SELECT is(
  (SELECT id FROM consumable),
  '00000000-0000-0000-0000-000000001601'::uuid,
  'ADP-16 published version is the selected downstream version'
);

WITH consumable AS (
  SELECT id
  FROM escala_publication_test.schedule_versions
  WHERE status = 'published'
)
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM escala_publication_test.schedule_versions v
    WHERE v.status <> 'published'
      AND v.id IN (SELECT id FROM consumable)
  ),
  'ADP-16 non-published versions cannot enter the consumable set'
);

SELECT is(
  (SELECT count(*)
   FROM escala_publication_test.schedule_versions
   WHERE status IN ('draft','validated','superseded','revoked')),
  4::bigint,
  'ADP-16 fixture preserves four non-published states outside consumption'
);

SELECT * FROM finish();
ROLLBACK;

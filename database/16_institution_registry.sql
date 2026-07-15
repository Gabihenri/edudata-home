BEGIN;

-- =====================================================
-- EDUDATA IA PLATFORM
-- EIOS — INSTITUTION CORE
-- MIGRATION 16
--
-- 1. Cria o cadastro nacional de escolas do INEP.
-- 2. Mantém public.schools como cadastro operacional.
-- 3. Permite escolas, institutos, empresas, faculdades,
--    universidades e outras unidades institucionais.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- =====================================================
-- 1. CADASTRO NACIONAL DE ESCOLAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.school_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  inep_code text NOT NULL,
  name text NOT NULL,

  state text,
  city text,

  service_restriction text,
  location text,
  differentiated_location text,
  administrative_category text,

  address text,
  phone text,

  administrative_dependency text,
  private_school_category text,
  public_authority_partner text,
  education_council_regulation text,

  school_size text,
  education_stages text,
  other_educational_offerings text,

  latitude double precision,
  longitude double precision,

  source_file text,
  imported_at timestamptz NOT NULL DEFAULT now(),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- =====================================================
-- 2. EVOLUÇÃO SEGURA, CASO A TABELA JÁ EXISTA
-- =====================================================

ALTER TABLE public.school_registry
  ADD COLUMN IF NOT EXISTS inep_code text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS service_restriction text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS differentiated_location text,
  ADD COLUMN IF NOT EXISTS administrative_category text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS administrative_dependency text,
  ADD COLUMN IF NOT EXISTS private_school_category text,
  ADD COLUMN IF NOT EXISTS public_authority_partner text,
  ADD COLUMN IF NOT EXISTS education_council_regulation text,
  ADD COLUMN IF NOT EXISTS school_size text,
  ADD COLUMN IF NOT EXISTS education_stages text,
  ADD COLUMN IF NOT EXISTS other_educational_offerings text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS source_file text,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;


UPDATE public.school_registry
SET
  imported_at = COALESCE(
    imported_at,
    now()
  ),
  created_at = COALESCE(
    created_at,
    now()
  ),
  updated_at = COALESCE(
    updated_at,
    created_at,
    now()
  );


ALTER TABLE public.school_registry
  ALTER COLUMN inep_code SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,

  ALTER COLUMN imported_at SET DEFAULT now(),
  ALTER COLUMN imported_at SET NOT NULL,

  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,

  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;


-- =====================================================
-- 3. VALIDAÇÕES DO CADASTRO INEP
-- =====================================================

ALTER TABLE public.school_registry
  DROP CONSTRAINT IF EXISTS school_registry_inep_code_check;

ALTER TABLE public.school_registry
  ADD CONSTRAINT school_registry_inep_code_check
  CHECK (
    inep_code ~ '^[0-9]{8}$'
  );


ALTER TABLE public.school_registry
  DROP CONSTRAINT IF EXISTS school_registry_state_check;

ALTER TABLE public.school_registry
  ADD CONSTRAINT school_registry_state_check
  CHECK (
    state IS NULL
    OR state = ''
    OR state ~ '^[A-Z]{2}$'
  );


ALTER TABLE public.school_registry
  DROP CONSTRAINT IF EXISTS school_registry_latitude_check;

ALTER TABLE public.school_registry
  ADD CONSTRAINT school_registry_latitude_check
  CHECK (
    latitude IS NULL
    OR latitude BETWEEN -90 AND 90
  );


ALTER TABLE public.school_registry
  DROP CONSTRAINT IF EXISTS school_registry_longitude_check;

ALTER TABLE public.school_registry
  ADD CONSTRAINT school_registry_longitude_check
  CHECK (
    longitude IS NULL
    OR longitude BETWEEN -180 AND 180
  );


-- =====================================================
-- 4. ÍNDICES DE BUSCA
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_school_registry_inep_code_unique
ON public.school_registry(inep_code);


CREATE INDEX IF NOT EXISTS
  idx_school_registry_name_trgm
ON public.school_registry
USING gin (name gin_trgm_ops);


CREATE INDEX IF NOT EXISTS
  idx_school_registry_city_trgm
ON public.school_registry
USING gin (city gin_trgm_ops);


CREATE INDEX IF NOT EXISTS
  idx_school_registry_state
ON public.school_registry(state);


CREATE INDEX IF NOT EXISTS
  idx_school_registry_city_state
ON public.school_registry(city, state);


CREATE INDEX IF NOT EXISTS
  idx_school_registry_administrative_dependency
ON public.school_registry(administrative_dependency);


-- =====================================================
-- 5. UPDATED_AT AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION
public.set_school_registry_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_school_registry_updated_at
ON public.school_registry;


CREATE TRIGGER
  trg_school_registry_updated_at
BEFORE UPDATE
ON public.school_registry
FOR EACH ROW
EXECUTE FUNCTION
  public.set_school_registry_updated_at();


-- =====================================================
-- 6. EVOLUIR O CADASTRO OPERACIONAL
-- =====================================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS institution_type text,
  ADD COLUMN IF NOT EXISTS registration_origin text,
  ADD COLUMN IF NOT EXISTS registry_id uuid;


UPDATE public.schools
SET
  institution_type = COALESCE(
    NULLIF(TRIM(institution_type), ''),
    'school'
  ),
  registration_origin = COALESCE(
    NULLIF(TRIM(registration_origin), ''),
    'manual'
  );


ALTER TABLE public.schools
  ALTER COLUMN institution_type
    SET DEFAULT 'school',
  ALTER COLUMN institution_type
    SET NOT NULL,

  ALTER COLUMN registration_origin
    SET DEFAULT 'manual',
  ALTER COLUMN registration_origin
    SET NOT NULL;


-- =====================================================
-- 7. TIPOS INSTITUCIONAIS
-- =====================================================

ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS
    schools_institution_type_check;


ALTER TABLE public.schools
  ADD CONSTRAINT
    schools_institution_type_check
  CHECK (
    institution_type IN (
      'school',
      'institute',
      'college',
      'university',
      'company',
      'training_center',
      'ngo',
      'government_agency',
      'education_department',
      'research_center',
      'other'
    )
  );


-- =====================================================
-- 8. ORIGEM DO CADASTRO
-- =====================================================

ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS
    schools_registration_origin_check;


ALTER TABLE public.schools
  ADD CONSTRAINT
    schools_registration_origin_check
  CHECK (
    registration_origin IN (
      'inep',
      'manual'
    )
  );


ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS
    schools_registration_origin_registry_check;


ALTER TABLE public.schools
  ADD CONSTRAINT
    schools_registration_origin_registry_check
  CHECK (
    (
      registration_origin = 'manual'
      AND registry_id IS NULL
    )
    OR
    (
      registration_origin = 'inep'
      AND registry_id IS NOT NULL
    )
  );


-- =====================================================
-- 9. VÍNCULO COM O CADASTRO NACIONAL
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'schools_registry_id_fkey'
      AND conrelid =
        'public.schools'::regclass
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT
        schools_registry_id_fkey
      FOREIGN KEY (registry_id)
      REFERENCES public.school_registry(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END;
$$;


CREATE INDEX IF NOT EXISTS
  idx_schools_institution_type
ON public.schools(institution_type);


CREATE INDEX IF NOT EXISTS
  idx_schools_registration_origin
ON public.schools(registration_origin);


CREATE INDEX IF NOT EXISTS
  idx_schools_registry_id
ON public.schools(registry_id);


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_schools_organization_registry_unique
ON public.schools(
  organization_id,
  registry_id
)
WHERE registry_id IS NOT NULL;


-- =====================================================
-- 10. SEGURANÇA DO CADASTRO NACIONAL
--
-- Sem política direta para usuários.
-- A consulta será feita pela API autenticada.
-- =====================================================

ALTER TABLE public.school_registry
  ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 11. DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.school_registry IS
  'Cadastro nacional de escolas do INEP utilizado como referência de pesquisa e preenchimento automático.';


COMMENT ON TABLE public.schools IS
  'Instituições e unidades operacionais vinculadas às organizações da EduData IA.';


COMMENT ON COLUMN
  public.schools.institution_type IS
  'Tipo da unidade: escola, instituto, faculdade, universidade, empresa, centro de formação, ONG, órgão público ou outra instituição.';


COMMENT ON COLUMN
  public.schools.registration_origin IS
  'Origem do cadastro operacional: catálogo INEP ou cadastro manual.';


COMMENT ON COLUMN
  public.schools.registry_id IS
  'Referência ao registro nacional do INEP quando a instituição foi selecionada no catálogo.';


COMMIT;
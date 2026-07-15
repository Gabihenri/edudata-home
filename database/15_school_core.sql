BEGIN;

-- =====================================================
-- EDUDATA IA PLATFORM
-- EIOS — SCHOOL CORE
-- MIGRATION 15
--
-- Evolui public.schools sem apagar dados ou campos antigos.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =====================================================
-- 1. GARANTIR EXISTÊNCIA DA TABELA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);


-- =====================================================
-- 2. ADICIONAR CAMPOS DO SCHOOL CORE
-- =====================================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS short_name text,
  ADD COLUMN IF NOT EXISTS education_network text,
  ADD COLUMN IF NOT EXISTS administrative_type text,
  ADD COLUMN IF NOT EXISTS principal_name text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS number text,
  ADD COLUMN IF NOT EXISTS complement text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;


-- =====================================================
-- 3. APROVEITAR DADOS DOS CAMPOS ANTIGOS
-- =====================================================

UPDATE public.schools
SET education_network = COALESCE(
  NULLIF(TRIM(education_network), ''),
  NULLIF(TRIM(network), ''),
  'other'
);

UPDATE public.schools
SET principal_name = COALESCE(
  NULLIF(TRIM(principal_name), ''),
  NULLIF(TRIM(director), '')
);

UPDATE public.schools
SET administrative_type = COALESCE(
  NULLIF(TRIM(administrative_type), ''),
  CASE
    WHEN LOWER(COALESCE(network, '')) IN (
      'municipal',
      'state',
      'estadual',
      'federal'
    ) THEN 'public'

    WHEN LOWER(COALESCE(network, '')) IN (
      'private',
      'privada',
      'particular'
    ) THEN 'private'

    WHEN LOWER(COALESCE(network, '')) IN (
      'community',
      'comunitária',
      'comunitaria'
    ) THEN 'community'

    ELSE 'other'
  END
);

UPDATE public.schools
SET
  country = COALESCE(
    NULLIF(TRIM(country), ''),
    'Brasil'
  ),
  status = COALESCE(
    NULLIF(TRIM(status), ''),
    'active'
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


-- =====================================================
-- 4. NORMALIZAR REDES DE ENSINO
-- =====================================================

UPDATE public.schools
SET education_network =
  CASE LOWER(TRIM(education_network))
    WHEN 'municipal' THEN 'municipal'
    WHEN 'municipal pública' THEN 'municipal'

    WHEN 'state' THEN 'state'
    WHEN 'estadual' THEN 'state'
    WHEN 'estadual pública' THEN 'state'

    WHEN 'federal' THEN 'federal'

    WHEN 'private' THEN 'private'
    WHEN 'privada' THEN 'private'
    WHEN 'particular' THEN 'private'

    WHEN 'community' THEN 'community'
    WHEN 'comunitária' THEN 'community'
    WHEN 'comunitaria' THEN 'community'

    ELSE 'other'
  END;


-- =====================================================
-- 5. NORMALIZAR TIPOS ADMINISTRATIVOS
-- =====================================================

UPDATE public.schools
SET administrative_type =
  CASE LOWER(TRIM(administrative_type))
    WHEN 'public' THEN 'public'
    WHEN 'pública' THEN 'public'
    WHEN 'publica' THEN 'public'

    WHEN 'private' THEN 'private'
    WHEN 'privada' THEN 'private'

    WHEN 'philanthropic' THEN 'philanthropic'
    WHEN 'filantrópica' THEN 'philanthropic'
    WHEN 'filantropica' THEN 'philanthropic'

    WHEN 'community' THEN 'community'
    WHEN 'comunitária' THEN 'community'
    WHEN 'comunitaria' THEN 'community'

    ELSE 'other'
  END;


-- =====================================================
-- 6. NORMALIZAR STATUS
-- =====================================================

UPDATE public.schools
SET status =
  CASE LOWER(TRIM(status))
    WHEN 'active' THEN 'active'
    WHEN 'ativa' THEN 'active'
    WHEN 'ativo' THEN 'active'

    WHEN 'inactive' THEN 'inactive'
    WHEN 'inativa' THEN 'inactive'
    WHEN 'inativo' THEN 'inactive'

    WHEN 'pending' THEN 'pending'
    WHEN 'pendente' THEN 'pending'

    WHEN 'suspended' THEN 'suspended'
    WHEN 'suspensa' THEN 'suspended'
    WHEN 'suspenso' THEN 'suspended'

    WHEN 'archived' THEN 'archived'
    WHEN 'arquivada' THEN 'archived'
    WHEN 'arquivado' THEN 'archived'

    ELSE 'active'
  END;


-- =====================================================
-- 7. DEFAULTS E CAMPOS OBRIGATÓRIOS
-- =====================================================

ALTER TABLE public.schools
  ALTER COLUMN education_network
    SET DEFAULT 'other',
  ALTER COLUMN education_network
    SET NOT NULL,

  ALTER COLUMN administrative_type
    SET DEFAULT 'other',
  ALTER COLUMN administrative_type
    SET NOT NULL,

  ALTER COLUMN country
    SET DEFAULT 'Brasil',
  ALTER COLUMN country
    SET NOT NULL,

  ALTER COLUMN status
    SET DEFAULT 'active',
  ALTER COLUMN status
    SET NOT NULL,

  ALTER COLUMN created_at
    SET DEFAULT now(),
  ALTER COLUMN created_at
    SET NOT NULL,

  ALTER COLUMN updated_at
    SET DEFAULT now(),
  ALTER COLUMN updated_at
    SET NOT NULL;


-- =====================================================
-- 8. ORGANIZAÇÃO OBRIGATÓRIA
--
-- Só aplica NOT NULL quando não houver registros antigos
-- sem organização, evitando perda ou quebra de dados.
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.schools
    WHERE organization_id IS NULL
  ) THEN
    ALTER TABLE public.schools
      ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END;
$$;


-- =====================================================
-- 9. CHAVE ESTRANGEIRA
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'schools_organization_id_fkey'
      AND conrelid = 'public.schools'::regclass
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_organization_id_fkey
      FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END;
$$;


-- =====================================================
-- 10. CONSTRAINTS
-- =====================================================

ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_status_check;

ALTER TABLE public.schools
  ADD CONSTRAINT schools_status_check
  CHECK (
    status IN (
      'active',
      'inactive',
      'pending',
      'suspended',
      'archived'
    )
  );


ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_education_network_check;

ALTER TABLE public.schools
  ADD CONSTRAINT schools_education_network_check
  CHECK (
    education_network IN (
      'municipal',
      'state',
      'federal',
      'private',
      'community',
      'other'
    )
  );


ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_administrative_type_check;

ALTER TABLE public.schools
  ADD CONSTRAINT schools_administrative_type_check
  CHECK (
    administrative_type IN (
      'public',
      'private',
      'philanthropic',
      'community',
      'other'
    )
  );


ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_inep_code_check;

ALTER TABLE public.schools
  ADD CONSTRAINT schools_inep_code_check
  CHECK (
    inep_code IS NULL
    OR TRIM(inep_code) = ''
    OR inep_code ~ '^[0-9]{8}$'
  );


-- =====================================================
-- 11. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_schools_organization_id
  ON public.schools(organization_id);

CREATE INDEX IF NOT EXISTS idx_schools_name
  ON public.schools(name);

CREATE INDEX IF NOT EXISTS idx_schools_status
  ON public.schools(status);

CREATE INDEX IF NOT EXISTS idx_schools_city
  ON public.schools(city);

CREATE INDEX IF NOT EXISTS idx_schools_state
  ON public.schools(state);

CREATE INDEX IF NOT EXISTS idx_schools_education_network
  ON public.schools(education_network);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_inep_code_unique
  ON public.schools(inep_code)
  WHERE inep_code IS NOT NULL
    AND TRIM(inep_code) <> '';


-- =====================================================
-- 12. UPDATED_AT AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_school_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_schools_updated_at
  ON public.schools;

CREATE TRIGGER trg_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.set_school_updated_at();


-- =====================================================
-- 13. DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.schools IS
  'Escolas e unidades educacionais vinculadas às organizações do EIOS.';

COMMENT ON COLUMN public.schools.organization_id IS
  'Organização responsável pela escola.';

COMMENT ON COLUMN public.schools.education_network IS
  'Rede de ensino normalizada da escola.';

COMMENT ON COLUMN public.schools.administrative_type IS
  'Natureza administrativa da escola.';

COMMENT ON COLUMN public.schools.inep_code IS
  'Código INEP de oito dígitos, quando disponível.';


COMMIT;
BEGIN;

-- =====================================================
-- EDUDATA IA PLATFORM
-- EIOS — ORGANIZATION CORE
-- MIGRATION 14
--
-- Evolui a tabela organizations existente sem recriá-la
-- e sem duplicar a arquitetura.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =====================================================
-- 1. GARANTIR EXISTÊNCIA DA TABELA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- =====================================================
-- 2. EVOLUIR A ESTRUTURA EXISTENTE
-- =====================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS short_name text,
  ADD COLUMN IF NOT EXISTS organization_type text,
  ADD COLUMN IF NOT EXISTS document text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;


-- =====================================================
-- 3. MIGRAR CAMPOS ANTIGOS, CASO EXISTAM
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'type'
  ) THEN
    EXECUTE '
      UPDATE public.organizations
      SET organization_type = COALESCE(
        NULLIF(TRIM(organization_type), ''''),
        NULLIF(TRIM(type), ''''),
        ''other''
      )
    ';
  ELSE
    UPDATE public.organizations
    SET organization_type = COALESCE(
      NULLIF(TRIM(organization_type), ''),
      'other'
    );
  END IF;
END;
$$;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'active'
  ) THEN
    EXECUTE '
      UPDATE public.organizations
      SET status = COALESCE(
        NULLIF(TRIM(status), ''''),
        CASE
          WHEN active = true THEN ''active''
          ELSE ''inactive''
        END
      )
    ';
  ELSE
    UPDATE public.organizations
    SET status = COALESCE(
      NULLIF(TRIM(status), ''),
      'active'
    );
  END IF;
END;
$$;


-- =====================================================
-- 4. NORMALIZAR VALORES EXISTENTES
-- =====================================================

UPDATE public.organizations
SET
  country = COALESCE(
    NULLIF(TRIM(country), ''),
    'Brasil'
  ),
  created_at = COALESCE(
    created_at,
    now()
  ),
  updated_at = COALESCE(
    updated_at,
    created_at,
    now()
  ),
  organization_type = COALESCE(
    NULLIF(TRIM(organization_type), ''),
    'other'
  ),
  status = COALESCE(
    NULLIF(TRIM(status), ''),
    'active'
  );


-- =====================================================
-- 5. DEFAULTS E CAMPOS OBRIGATÓRIOS
-- =====================================================

ALTER TABLE public.organizations
  ALTER COLUMN organization_type
    SET DEFAULT 'other',
  ALTER COLUMN organization_type
    SET NOT NULL,

  ALTER COLUMN country
    SET DEFAULT 'Brasil',

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
-- 6. REGRAS DE VALIDAÇÃO
-- =====================================================

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_status_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_status_check
  CHECK (
    status IN (
      'active',
      'inactive',
      'pending',
      'suspended',
      'archived'
    )
  );


-- =====================================================
-- 7. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_organizations_name
  ON public.organizations(name);

CREATE INDEX IF NOT EXISTS idx_organizations_status
  ON public.organizations(status);

CREATE INDEX IF NOT EXISTS idx_organizations_type
  ON public.organizations(organization_type);

CREATE INDEX IF NOT EXISTS idx_organizations_city
  ON public.organizations(city);

CREATE INDEX IF NOT EXISTS idx_organizations_state
  ON public.organizations(state);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_document_unique
  ON public.organizations(document)
  WHERE document IS NOT NULL
    AND TRIM(document) <> '';


-- =====================================================
-- 8. UPDATED_AT AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_organization_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_organizations_updated_at
  ON public.organizations;

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.set_organization_updated_at();


-- =====================================================
-- 9. DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.organizations IS
  'Organizações institucionais compartilhadas por todos os produtos da EduData IA.';

COMMENT ON COLUMN public.organizations.organization_type IS
  'Tipo da organização, como plataforma, secretaria, diretoria, rede, escola mantenedora, universidade ou empresa.';

COMMENT ON COLUMN public.organizations.status IS
  'Situação operacional da organização na plataforma.';


COMMIT;
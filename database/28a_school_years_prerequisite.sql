BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 28A — SCHOOL YEARS PREREQUISITE
-- =========================================================
--
-- Objetivos:
-- 1. Criar somente a entidade oficial public.school_years
--    quando ela ainda não estiver instalada no Supabase.
-- 2. Preservar o modelo definido na estrutura acadêmica.
-- 3. Preparar a execução da migration 28.
-- 4. Não criar arquitetura paralela.
--
-- A evolução institucional completa será realizada por:
-- database/28_institutional_academic_calendar.sql
-- =========================================================


CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- 1. VALIDAR A ENTIDADE SCHOOL
-- =========================================================

DO $$
BEGIN
  IF to_regclass(
       'public.schools'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.schools.';
  END IF;
END;
$$;


-- =========================================================
-- 2. CRIAR A ENTIDADE OFICIAL SCHOOL_YEARS
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.school_years (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    school_id uuid NOT NULL,

    year integer NOT NULL,

    start_date date,

    end_date date,

    active boolean NOT NULL
      DEFAULT true,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now()
  );


-- =========================================================
-- 3. GARANTIR A CHAVE ESTRANGEIRA
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'school_years_school_id_fkey'

      AND conrelid =
        'public.school_years'::regclass
  )
  THEN
    ALTER TABLE public.school_years
      ADD CONSTRAINT
        school_years_school_id_fkey

      FOREIGN KEY (
        school_id
      )

      REFERENCES public.schools(id)

      ON UPDATE CASCADE
      ON DELETE CASCADE;
  END IF;
END;
$$;


-- =========================================================
-- 4. REGRAS BÁSICAS DE CONSISTÊNCIA
-- =========================================================

ALTER TABLE public.school_years
  DROP CONSTRAINT IF EXISTS
    school_years_bootstrap_year_check;

ALTER TABLE public.school_years
  ADD CONSTRAINT
    school_years_bootstrap_year_check

  CHECK (
    year >= 2000
    AND year <= 2100
  );


ALTER TABLE public.school_years
  DROP CONSTRAINT IF EXISTS
    school_years_bootstrap_date_check;

ALTER TABLE public.school_years
  ADD CONSTRAINT
    school_years_bootstrap_date_check

  CHECK (
    end_date IS NULL
    OR start_date IS NULL
    OR end_date >= start_date
  );


-- =========================================================
-- 5. ÍNDICES COMPATÍVEIS COM A ESTRUTURA ACADÊMICA
-- =========================================================

CREATE INDEX IF NOT EXISTS
  idx_school_year_school
ON public.school_years(
  school_id
);


CREATE INDEX IF NOT EXISTS
  idx_school_year
ON public.school_years(
  year
);


-- =========================================================
-- 6. SEGURANÇA TEMPORÁRIA
-- =========================================================
--
-- A RLS é ativada imediatamente.
-- As políticas institucionais completas serão instaladas
-- pela migration 28.
-- =========================================================

ALTER TABLE public.school_years
  ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- 7. DOCUMENTAÇÃO
-- =========================================================

COMMENT ON TABLE
  public.school_years
IS
  'Entidade oficial de anos letivos por escola, pertencente à estrutura acadêmica compartilhada do EIOS.';


COMMENT ON COLUMN
  public.school_years.school_id
IS
  'Escola à qual o ano letivo pertence.';


COMMENT ON COLUMN
  public.school_years.year
IS
  'Ano civil de referência do período letivo.';


COMMENT ON COLUMN
  public.school_years.active
IS
  'Campo legado preservado para compatibilidade com funcionalidades existentes.';


COMMIT;
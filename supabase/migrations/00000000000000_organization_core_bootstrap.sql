BEGIN;

-- =========================================================
-- EDUDATA IA — CORE COMPARTILHADO
-- BOOTSTRAP LOCAL DE ORGANIZAÇÃO
--
-- Compatibilidade do ambiente Supabase local:
-- algumas partes do Core histórico ficam em database/*.sql,
-- enquanto o runner local aplica apenas supabase/migrations/*.
-- Esta estrutura mínima permite que migrations posteriores
-- referenciem organizations sem duplicar a entidade.
-- A evolução completa permanece em database/14_organizations.sql.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;

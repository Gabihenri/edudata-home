BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 007 — PRIVATE AGENDA EVIDENCE STORAGE
-- =========================================================
--
-- Objetivos:
-- 1. Garantir que o bucket agenda-evidences seja privado.
-- 2. Restringir tamanho e formatos permitidos.
-- 3. Bloquear acesso direto pelos clientes anon/authenticated.
-- 4. Manter upload e URLs assinadas exclusivamente no servidor.
--
-- Arquitetura:
-- Cliente autenticado
--   ↓
-- API Next.js
--   ↓
-- Service Role
--   ↓
-- Supabase Storage privado
--
-- O navegador nunca acessa storage.objects diretamente.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DA INFRAESTRUTURA STORAGE
-- =========================================================

DO $$
BEGIN
  IF to_regnamespace('storage') IS NULL THEN
    RAISE EXCEPTION
      'O schema storage não existe. Migração interrompida.';
  END IF;

  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE EXCEPTION
      'A tabela storage.buckets não existe. Migração interrompida.';
  END IF;

  IF to_regclass('storage.objects') IS NULL THEN
    RAISE EXCEPTION
      'A tabela storage.objects não existe. Migração interrompida.';
  END IF;
END;
$$;


-- =========================================================
-- 2. BUCKET PRIVADO DE EVIDÊNCIAS
-- =========================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'agenda-evidences',
  'agenda-evidences',
  false,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]::text[]
)
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- =========================================================
-- 3. BLOQUEIO DE ACESSO DIRETO PELO NAVEGADOR
-- =========================================================
--
-- Políticas PostgreSQL são combinadas.
-- Uma política RESTRICTIVE falsa impede o acesso mesmo que
-- exista alguma política permissiva mais ampla no projeto.
--
-- A service_role não é afetada, pois ignora RLS.
-- =========================================================

DROP POLICY IF EXISTS
  "agenda_evidences_server_only_guard"
ON storage.objects;

CREATE POLICY
  "agenda_evidences_server_only_guard"
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (
  bucket_id <> 'agenda-evidences'
)
WITH CHECK (
  bucket_id <> 'agenda-evidences'
);


-- =========================================================
-- 4. DOCUMENTAÇÃO DA POLÍTICA
-- =========================================================

COMMENT ON POLICY
  "agenda_evidences_server_only_guard"
ON storage.objects
IS
  'Bloqueia acesso direto de anon e authenticated ao bucket agenda-evidences. Upload, leitura e assinatura devem ocorrer exclusivamente pelas APIs protegidas da EduData IA usando service_role.';


-- =========================================================
-- 5. VALIDAÇÃO FINAL
-- =========================================================

DO $$
DECLARE
  bucket_is_public boolean;
  configured_limit bigint;
  configured_mime_types text[];
BEGIN
  SELECT
    public,
    file_size_limit,
    allowed_mime_types
  INTO
    bucket_is_public,
    configured_limit,
    configured_mime_types
  FROM storage.buckets
  WHERE id = 'agenda-evidences';

  IF bucket_is_public IS DISTINCT FROM false THEN
    RAISE EXCEPTION
      'Falha de segurança: o bucket agenda-evidences continua público.';
  END IF;

  IF configured_limit IS DISTINCT FROM 10485760 THEN
    RAISE EXCEPTION
      'Falha de configuração: limite do bucket diferente de 10 MB.';
  END IF;

  IF configured_mime_types IS NULL THEN
    RAISE EXCEPTION
      'Falha de configuração: formatos permitidos não foram definidos.';
  END IF;
END;
$$;

COMMIT;
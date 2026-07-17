BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / AGENDA INTELIGENTE EDI
-- MIGRATION 006 — GOVERNANÇA, EXCLUSÃO LÓGICA E AUDITORIA
-- =========================================================
--
-- Objetivos:
-- 1. Impedir exclusões físicas dos registros centrais da Agenda.
-- 2. Permitir exclusão lógica e restauração conforme o perfil.
-- 3. Registrar CREATE, UPDATE, DELETE e RESTORE na auditoria central.
-- 4. Preservar snapshots anterior e posterior de cada alteração.
-- 5. Preparar a visão institucional dos gestores por escopo.
-- 6. Manter o acesso de usuários pares restrito aos próprios registros.
--
-- Pré-requisito obrigatório:
-- database/13_identity_governance.sql
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DE PRÉ-REQUISITOS
-- =========================================================

DO $$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'agenda_events',
    'agenda_tasks',
    'agenda_planning',
    'agenda_evidences',
    'agenda_classes',
    'organization_members',
    'identity_product_permissions',
    'identity_responsibility_scopes',
    'identity_audit_logs'
  ]
  LOOP
    IF to_regclass(format('public.%I', required_table)) IS NULL THEN
      RAISE EXCEPTION
        'A tabela public.% não existe. A migration foi interrompida para evitar arquitetura paralela.',
        required_table;
    END IF;
  END LOOP;

  IF to_regprocedure(
    'public.can_view_identity_user(uuid,uuid,uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função public.can_view_identity_user(uuid,uuid,uuid) não existe. Execute primeiro database/13_identity_governance.sql.';
  END IF;
END;
$$;


-- =========================================================
-- 2. COLUNAS DE GOVERNANÇA E EXCLUSÃO LÓGICA
-- =========================================================

ALTER TABLE public.agenda_events
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS restored_by uuid,
  ADD COLUMN IF NOT EXISTS restore_reason text;

ALTER TABLE public.agenda_tasks
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS restored_by uuid,
  ADD COLUMN IF NOT EXISTS restore_reason text;

ALTER TABLE public.agenda_planning
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS restored_by uuid,
  ADD COLUMN IF NOT EXISTS restore_reason text;

ALTER TABLE public.agenda_evidences
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS restored_by uuid,
  ADD COLUMN IF NOT EXISTS restore_reason text;

ALTER TABLE public.agenda_classes
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS restored_by uuid,
  ADD COLUMN IF NOT EXISTS restore_reason text;


-- =========================================================
-- 3. CONSTRAINTS DE CONSISTÊNCIA
-- =========================================================

DO $$
DECLARE
  target_table text;
  constraint_name text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'agenda_events',
    'agenda_tasks',
    'agenda_planning',
    'agenda_evidences',
    'agenda_classes'
  ]
  LOOP
    constraint_name := format('%s_soft_delete_check', target_table);

    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      target_table,
      constraint_name
    );

    EXECUTE format(
      'ALTER TABLE public.%I
         ADD CONSTRAINT %I
         CHECK (
           deleted_at IS NULL
           OR (
             deleted_by IS NOT NULL
             AND nullif(btrim(deletion_reason), '''') IS NOT NULL
           )
         )',
      target_table,
      constraint_name
    );

    constraint_name := format('%s_restore_check', target_table);

    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      target_table,
      constraint_name
    );

    EXECUTE format(
      'ALTER TABLE public.%I
         ADD CONSTRAINT %I
         CHECK (
           restored_at IS NULL
           OR (
             restored_by IS NOT NULL
             AND nullif(btrim(restore_reason), '''') IS NOT NULL
           )
         )',
      target_table,
      constraint_name
    );
  END LOOP;
END;
$$;


-- =========================================================
-- 4. BACKFILL DE ORGANIZAÇÃO
-- =========================================================

UPDATE public.agenda_events record
SET organization_id = (
  SELECT membership.organization_id
  FROM public.organization_members membership
  WHERE membership.user_id = record.user_id
    AND lower(coalesce(membership.status, '')) = 'active'
    AND (
      record.school_id IS NULL
      OR membership.school_id = record.school_id
      OR membership.school_id IS NULL
    )
  ORDER BY
    CASE
      WHEN membership.school_id = record.school_id THEN 0
      ELSE 1
    END,
    membership.hierarchy_level DESC,
    membership.created_at ASC
  LIMIT 1
)
WHERE record.organization_id IS NULL
  AND record.user_id IS NOT NULL;

UPDATE public.agenda_tasks record
SET organization_id = (
  SELECT membership.organization_id
  FROM public.organization_members membership
  WHERE membership.user_id = record.user_id
    AND lower(coalesce(membership.status, '')) = 'active'
    AND (
      record.school_id IS NULL
      OR membership.school_id = record.school_id
      OR membership.school_id IS NULL
    )
  ORDER BY
    CASE
      WHEN membership.school_id = record.school_id THEN 0
      ELSE 1
    END,
    membership.hierarchy_level DESC,
    membership.created_at ASC
  LIMIT 1
)
WHERE record.organization_id IS NULL
  AND record.user_id IS NOT NULL;

UPDATE public.agenda_planning record
SET organization_id = (
  SELECT membership.organization_id
  FROM public.organization_members membership
  WHERE membership.user_id = record.user_id
    AND lower(coalesce(membership.status, '')) = 'active'
    AND (
      record.school_id IS NULL
      OR membership.school_id = record.school_id
      OR membership.school_id IS NULL
    )
  ORDER BY
    CASE
      WHEN membership.school_id = record.school_id THEN 0
      ELSE 1
    END,
    membership.hierarchy_level DESC,
    membership.created_at ASC
  LIMIT 1
)
WHERE record.organization_id IS NULL
  AND record.user_id IS NOT NULL;

UPDATE public.agenda_evidences record
SET organization_id = (
  SELECT membership.organization_id
  FROM public.organization_members membership
  WHERE membership.user_id = record.user_id
    AND lower(coalesce(membership.status, '')) = 'active'
    AND (
      record.school_id IS NULL
      OR membership.school_id = record.school_id
      OR membership.school_id IS NULL
    )
  ORDER BY
    CASE
      WHEN membership.school_id = record.school_id THEN 0
      ELSE 1
    END,
    membership.hierarchy_level DESC,
    membership.created_at ASC
  LIMIT 1
)
WHERE record.organization_id IS NULL
  AND record.user_id IS NOT NULL;

UPDATE public.agenda_classes record
SET organization_id = (
  SELECT membership.organization_id
  FROM public.organization_members membership
  WHERE membership.user_id = record.teacher_id
    AND lower(coalesce(membership.status, '')) = 'active'
    AND (
      record.school_id IS NULL
      OR membership.school_id = record.school_id
      OR membership.school_id IS NULL
    )
  ORDER BY
    CASE
      WHEN membership.school_id = record.school_id THEN 0
      ELSE 1
    END,
    membership.hierarchy_level DESC,
    membership.created_at ASC
  LIMIT 1
)
WHERE record.organization_id IS NULL
  AND record.teacher_id IS NOT NULL;


-- =========================================================
-- 5. ÍNDICES DE GOVERNANÇA E AUDITORIA
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_agenda_events_organization
  ON public.agenda_events(organization_id);

CREATE INDEX IF NOT EXISTS idx_agenda_events_deleted
  ON public.agenda_events(deleted_at);

CREATE INDEX IF NOT EXISTS idx_agenda_events_active_scope
  ON public.agenda_events(organization_id, school_id, user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_tasks_organization
  ON public.agenda_tasks(organization_id);

CREATE INDEX IF NOT EXISTS idx_agenda_tasks_deleted
  ON public.agenda_tasks(deleted_at);

CREATE INDEX IF NOT EXISTS idx_agenda_tasks_active_scope
  ON public.agenda_tasks(organization_id, school_id, user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_planning_organization
  ON public.agenda_planning(organization_id);

CREATE INDEX IF NOT EXISTS idx_agenda_planning_deleted
  ON public.agenda_planning(deleted_at);

CREATE INDEX IF NOT EXISTS idx_agenda_planning_active_scope
  ON public.agenda_planning(organization_id, school_id, user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_evidences_organization
  ON public.agenda_evidences(organization_id);

CREATE INDEX IF NOT EXISTS idx_agenda_evidences_deleted
  ON public.agenda_evidences(deleted_at);

CREATE INDEX IF NOT EXISTS idx_agenda_evidences_active_scope
  ON public.agenda_evidences(organization_id, school_id, user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_classes_organization
  ON public.agenda_classes(organization_id);

CREATE INDEX IF NOT EXISTS idx_agenda_classes_deleted
  ON public.agenda_classes(deleted_at);

CREATE INDEX IF NOT EXISTS idx_agenda_classes_active_scope
  ON public.agenda_classes(organization_id, school_id, teacher_id)
  WHERE deleted_at IS NULL;


-- =========================================================
-- 6. PERMISSÕES DA VISÃO INSTITUCIONAL
-- =========================================================

INSERT INTO public.identity_product_permissions (
  role_code,
  product_code,
  can_access,
  can_create,
  can_view_own,
  can_view_team,
  can_view_school,
  can_view_organization,
  can_update_own,
  can_update_others,
  can_delete_own,
  can_delete_others,
  can_export,
  can_audit
)
VALUES
  (
    'supervisor',
    'agenda_edi',
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    false,
    true,
    true
  ),
  (
    'regional_manager',
    'agenda_edi',
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    false,
    true,
    true
  ),
  (
    'institution_admin',
    'agenda_edi',
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    false,
    true,
    true
  )
ON CONFLICT (role_code, product_code)
DO UPDATE SET
  can_access = EXCLUDED.can_access,
  can_create = EXCLUDED.can_create,
  can_view_own = EXCLUDED.can_view_own,
  can_view_team = EXCLUDED.can_view_team,
  can_view_school = EXCLUDED.can_view_school,
  can_view_organization = EXCLUDED.can_view_organization,
  can_update_own = EXCLUDED.can_update_own,
  can_update_others = EXCLUDED.can_update_others,
  can_delete_own = EXCLUDED.can_delete_own,
  can_delete_others = EXCLUDED.can_delete_others,
  can_export = EXCLUDED.can_export,
  can_audit = EXCLUDED.can_audit,
  updated_at = now();


-- =========================================================
-- 7. FUNÇÕES AUXILIARES DE RECURSO
-- =========================================================

CREATE OR REPLACE FUNCTION public.agenda_resource_table_name(
  requested_resource_type text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_resource_type text;
BEGIN
  normalized_resource_type := lower(btrim(requested_resource_type));

  RETURN CASE normalized_resource_type
    WHEN 'event' THEN 'agenda_events'
    WHEN 'events' THEN 'agenda_events'
    WHEN 'agenda_event' THEN 'agenda_events'
    WHEN 'agenda_events' THEN 'agenda_events'

    WHEN 'task' THEN 'agenda_tasks'
    WHEN 'tasks' THEN 'agenda_tasks'
    WHEN 'agenda_task' THEN 'agenda_tasks'
    WHEN 'agenda_tasks' THEN 'agenda_tasks'

    WHEN 'planning' THEN 'agenda_planning'
    WHEN 'agenda_planning' THEN 'agenda_planning'

    WHEN 'evidence' THEN 'agenda_evidences'
    WHEN 'evidences' THEN 'agenda_evidences'
    WHEN 'agenda_evidence' THEN 'agenda_evidences'
    WHEN 'agenda_evidences' THEN 'agenda_evidences'

    WHEN 'class' THEN 'agenda_classes'
    WHEN 'classes' THEN 'agenda_classes'
    WHEN 'agenda_class' THEN 'agenda_classes'
    WHEN 'agenda_classes' THEN 'agenda_classes'

    ELSE NULL
  END;
END;
$$;


CREATE OR REPLACE FUNCTION public.agenda_resource_owner_column(
  requested_table_name text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE requested_table_name
    WHEN 'agenda_classes' THEN 'teacher_id'
    WHEN 'agenda_events' THEN 'user_id'
    WHEN 'agenda_tasks' THEN 'user_id'
    WHEN 'agenda_planning' THEN 'user_id'
    WHEN 'agenda_evidences' THEN 'user_id'
    ELSE NULL
  END;
$$;


-- =========================================================
-- 8. AUTORIZAÇÃO POR ESCOPO INSTITUCIONAL
-- =========================================================

CREATE OR REPLACE FUNCTION public.can_view_agenda_record_as(
  actor_user_id uuid,
  target_user_id uuid,
  target_organization_id uuid DEFAULT NULL,
  target_school_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_organization_id uuid;
  actor_school_id uuid;
  actor_scope_type text;
  can_view_team_value boolean;
  can_view_school_value boolean;
  can_view_organization_value boolean;
  can_audit_value boolean;
BEGIN
  IF actor_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF target_user_id IS NOT NULL
     AND actor_user_id = target_user_id THEN
    RETURN true;
  END IF;

  SELECT
    membership.organization_id,
    membership.school_id,
    membership.scope_type,
    permission.can_view_team,
    permission.can_view_school,
    permission.can_view_organization,
    permission.can_audit
  INTO
    actor_organization_id,
    actor_school_id,
    actor_scope_type,
    can_view_team_value,
    can_view_school_value,
    can_view_organization_value,
    can_audit_value
  FROM public.organization_members membership
  JOIN public.identity_product_permissions permission
    ON permission.role_code = membership.role
   AND permission.product_code = 'agenda_edi'
   AND permission.can_access = true
  WHERE membership.user_id = actor_user_id
    AND lower(coalesce(membership.status, '')) = 'active'
    AND (
      membership.access_starts_at IS NULL
      OR membership.access_starts_at <= now()
    )
    AND (
      membership.access_ends_at IS NULL
      OR membership.access_ends_at >= now()
    )
  ORDER BY
    membership.hierarchy_level DESC,
    membership.created_at ASC
  LIMIT 1;

  IF actor_organization_id IS NULL THEN
    RETURN false;
  END IF;

  IF target_organization_id IS NULL
     OR actor_organization_id <> target_organization_id THEN
    RETURN false;
  END IF;

  IF coalesce(can_view_organization_value, false) = true
     AND actor_scope_type IN ('organization', 'network') THEN
    RETURN true;
  END IF;

  IF coalesce(can_view_school_value, false) = true
     AND actor_school_id IS NOT NULL
     AND target_school_id = actor_school_id THEN
    RETURN true;
  END IF;

  IF target_user_id IS NOT NULL
     AND (
       coalesce(can_view_team_value, false) = true
       OR coalesce(can_audit_value, false) = true
     )
     AND public.can_view_identity_user(
       target_user_id,
       target_organization_id,
       target_school_id
     ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;


CREATE OR REPLACE FUNCTION public.can_view_agenda_record(
  target_user_id uuid,
  target_organization_id uuid DEFAULT NULL,
  target_school_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_view_agenda_record_as(
    auth.uid(),
    target_user_id,
    target_organization_id,
    target_school_id
  );
$$;


CREATE OR REPLACE FUNCTION public.can_manage_agenda_record_as(
  actor_user_id uuid,
  target_user_id uuid,
  target_organization_id uuid,
  target_school_id uuid,
  requested_operation text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_active_membership boolean;
  can_update_own_value boolean;
  can_update_others_value boolean;
  can_delete_own_value boolean;
  can_delete_others_value boolean;
  normalized_operation text;
BEGIN
  IF actor_user_id IS NULL
     OR target_user_id IS NULL THEN
    RETURN false;
  END IF;

  normalized_operation := lower(btrim(requested_operation));

  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members membership
    WHERE membership.user_id = actor_user_id
      AND lower(coalesce(membership.status, '')) = 'active'
      AND (
        membership.access_starts_at IS NULL
        OR membership.access_starts_at <= now()
      )
      AND (
        membership.access_ends_at IS NULL
        OR membership.access_ends_at >= now()
      )
  )
  INTO has_active_membership;

  IF actor_user_id = target_user_id
     AND has_active_membership = false THEN
    RETURN normalized_operation IN ('update', 'delete', 'restore');
  END IF;

  SELECT
    permission.can_update_own,
    permission.can_update_others,
    permission.can_delete_own,
    permission.can_delete_others
  INTO
    can_update_own_value,
    can_update_others_value,
    can_delete_own_value,
    can_delete_others_value
  FROM public.organization_members membership
  JOIN public.identity_product_permissions permission
    ON permission.role_code = membership.role
   AND permission.product_code = 'agenda_edi'
   AND permission.can_access = true
  WHERE membership.user_id = actor_user_id
    AND lower(coalesce(membership.status, '')) = 'active'
    AND (
      membership.access_starts_at IS NULL
      OR membership.access_starts_at <= now()
    )
    AND (
      membership.access_ends_at IS NULL
      OR membership.access_ends_at >= now()
    )
  ORDER BY
    membership.hierarchy_level DESC,
    membership.created_at ASC
  LIMIT 1;

  IF actor_user_id = target_user_id THEN
    RETURN CASE normalized_operation
      WHEN 'update' THEN coalesce(can_update_own_value, false)
      WHEN 'delete' THEN coalesce(can_delete_own_value, false)
      WHEN 'restore' THEN coalesce(can_update_own_value, false)
      ELSE false
    END;
  END IF;

  IF public.can_view_agenda_record_as(
    actor_user_id,
    target_user_id,
    target_organization_id,
    target_school_id
  ) = false THEN
    RETURN false;
  END IF;

  RETURN CASE normalized_operation
    WHEN 'update' THEN coalesce(can_update_others_value, false)
    WHEN 'delete' THEN coalesce(can_delete_others_value, false)
    WHEN 'restore' THEN coalesce(can_update_others_value, false)
    ELSE false
  END;
END;
$$;


CREATE OR REPLACE FUNCTION public.can_update_agenda_record(
  target_user_id uuid,
  target_organization_id uuid DEFAULT NULL,
  target_school_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_agenda_record_as(
    auth.uid(),
    target_user_id,
    target_organization_id,
    target_school_id,
    'update'
  );
$$;


CREATE OR REPLACE FUNCTION public.resolve_agenda_actor(
  requested_actor_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  authenticated_user_id uuid;
  jwt_role text;
BEGIN
  authenticated_user_id := auth.uid();
  jwt_role := coalesce(
    auth.role(),
    nullif(
      current_setting('request.jwt.claim.role', true),
      ''
    )
  );

  IF authenticated_user_id IS NOT NULL THEN
    IF requested_actor_user_id IS NOT NULL
       AND requested_actor_user_id <> authenticated_user_id THEN
      RAISE EXCEPTION
        'O ator informado não corresponde ao usuário autenticado.'
        USING ERRCODE = '42501';
    END IF;

    RETURN authenticated_user_id;
  END IF;

  IF jwt_role = 'service_role' THEN
    IF requested_actor_user_id IS NULL THEN
      RAISE EXCEPTION
        'O backend deve informar o usuário responsável pela operação.'
        USING ERRCODE = '22023';
    END IF;

    RETURN requested_actor_user_id;
  END IF;

  RAISE EXCEPTION
    'Não foi possível identificar o usuário responsável pela operação.'
    USING ERRCODE = '42501';
END;
$$;


-- =========================================================
-- 9. TRIGGER DE GOVERNANÇA DAS TABELAS
-- =========================================================

CREATE OR REPLACE FUNCTION public.apply_agenda_record_governance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_column text;
  owner_user_id uuid;
  previous_owner_user_id uuid;
  actor_user_id uuid;
  resolved_organization_id uuid;
  resolved_school_id uuid;
BEGIN
  owner_column := public.agenda_resource_owner_column(
    TG_TABLE_NAME
  );

  owner_user_id := nullif(
    to_jsonb(NEW) ->> owner_column,
    ''
  )::uuid;

  IF TG_OP = 'UPDATE' THEN
    previous_owner_user_id := nullif(
      to_jsonb(OLD) ->> owner_column,
      ''
    )::uuid;

    IF auth.uid() IS NOT NULL
       AND previous_owner_user_id IS DISTINCT FROM owner_user_id THEN
      RAISE EXCEPTION
        'O proprietário do registro não pode ser alterado por esta operação.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.organization_id IS NULL
     AND owner_user_id IS NOT NULL THEN
    SELECT
      membership.organization_id,
      coalesce(NEW.school_id, membership.school_id)
    INTO
      resolved_organization_id,
      resolved_school_id
    FROM public.organization_members membership
    WHERE membership.user_id = owner_user_id
      AND lower(coalesce(membership.status, '')) = 'active'
      AND (
        NEW.school_id IS NULL
        OR membership.school_id = NEW.school_id
        OR membership.school_id IS NULL
      )
    ORDER BY
      CASE
        WHEN membership.school_id = NEW.school_id THEN 0
        ELSE 1
      END,
      membership.hierarchy_level DESC,
      membership.created_at ASC
    LIMIT 1;

    NEW.organization_id := resolved_organization_id;

    IF NEW.school_id IS NULL THEN
      NEW.school_id := resolved_school_id;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION
        'Um novo registro não pode ser criado como excluído.'
        USING ERRCODE = '22023';
    END IF;

    NEW.created_by := coalesce(
      NEW.created_by,
      auth.uid(),
      owner_user_id
    );

    NEW.updated_by := coalesce(
      NEW.updated_by,
      NEW.created_by
    );

    NEW.updated_at := coalesce(
      NEW.updated_at,
      now()
    );

    RETURN NEW;
  END IF;

  NEW.updated_at := now();

  IF OLD.deleted_at IS NULL
     AND NEW.deleted_at IS NOT NULL THEN
    actor_user_id := coalesce(
      auth.uid(),
      NEW.deleted_by,
      NEW.updated_by
    );

    IF nullif(btrim(NEW.deletion_reason), '') IS NULL THEN
      RAISE EXCEPTION
        'O motivo da exclusão é obrigatório.'
        USING ERRCODE = '22023';
    END IF;

    IF public.can_manage_agenda_record_as(
      actor_user_id,
      owner_user_id,
      NEW.organization_id,
      NEW.school_id,
      'delete'
    ) = false THEN
      RAISE EXCEPTION
        'O usuário não possui permissão para excluir este registro.'
        USING ERRCODE = '42501';
    END IF;

    NEW.deleted_by := actor_user_id;
    NEW.updated_by := actor_user_id;
    NEW.restored_at := NULL;
    NEW.restored_by := NULL;
    NEW.restore_reason := NULL;

    RETURN NEW;
  END IF;

  IF OLD.deleted_at IS NOT NULL
     AND NEW.deleted_at IS NULL THEN
    actor_user_id := coalesce(
      auth.uid(),
      NEW.restored_by,
      NEW.updated_by
    );

    IF nullif(btrim(NEW.restore_reason), '') IS NULL THEN
      RAISE EXCEPTION
        'O motivo da restauração é obrigatório.'
        USING ERRCODE = '22023';
    END IF;

    IF public.can_manage_agenda_record_as(
      actor_user_id,
      owner_user_id,
      NEW.organization_id,
      NEW.school_id,
      'restore'
    ) = false THEN
      RAISE EXCEPTION
        'O usuário não possui permissão para restaurar este registro.'
        USING ERRCODE = '42501';
    END IF;

    NEW.restored_at := coalesce(
      NEW.restored_at,
      now()
    );

    NEW.restored_by := actor_user_id;
    NEW.updated_by := actor_user_id;

    RETURN NEW;
  END IF;

  actor_user_id := coalesce(
    auth.uid(),
    NEW.updated_by
  );

  IF actor_user_id IS NULL
     AND auth.role() = 'service_role' THEN
    -- Compatibilidade temporária com operações legadas do backend.
    -- A próxima etapa da implementação passará updated_by explicitamente.
    RETURN NEW;
  END IF;

  IF public.can_manage_agenda_record_as(
    actor_user_id,
    owner_user_id,
    NEW.organization_id,
    NEW.school_id,
    'update'
  ) = false THEN
    RAISE EXCEPTION
      'O usuário não possui permissão para alterar este registro.'
      USING ERRCODE = '42501';
  END IF;

  NEW.updated_by := actor_user_id;

  RETURN NEW;
END;
$$;


-- =========================================================
-- 10. TRIGGER CENTRAL DE AUDITORIA
-- =========================================================

CREATE OR REPLACE FUNCTION public.audit_agenda_record_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_before jsonb;
  record_after jsonb;
  source_record jsonb;
  owner_column text;
  owner_user_id uuid;
  actor_user_id uuid;
  actor_role text;
  actor_scope text;
  organization_id_value uuid;
  school_id_value uuid;
  action_value text;
BEGIN
  record_before := CASE
    WHEN TG_OP = 'INSERT' THEN NULL
    ELSE to_jsonb(OLD)
  END;

  record_after := CASE
    WHEN TG_OP = 'DELETE' THEN NULL
    ELSE to_jsonb(NEW)
  END;

  source_record := coalesce(
    record_after,
    record_before
  );

  owner_column := public.agenda_resource_owner_column(
    TG_TABLE_NAME
  );

  owner_user_id := nullif(
    source_record ->> owner_column,
    ''
  )::uuid;

  organization_id_value := nullif(
    source_record ->> 'organization_id',
    ''
  )::uuid;

  school_id_value := nullif(
    source_record ->> 'school_id',
    ''
  )::uuid;

  IF TG_OP = 'INSERT' THEN
    action_value := 'create';

    actor_user_id := coalesce(
      nullif(source_record ->> 'created_by', '')::uuid,
      auth.uid(),
      owner_user_id
    );
  ELSIF TG_OP = 'UPDATE'
        AND OLD.deleted_at IS NULL
        AND NEW.deleted_at IS NOT NULL THEN
    action_value := 'delete';

    actor_user_id := coalesce(
      NEW.deleted_by,
      NEW.updated_by,
      auth.uid()
    );
  ELSIF TG_OP = 'UPDATE'
        AND OLD.deleted_at IS NOT NULL
        AND NEW.deleted_at IS NULL THEN
    action_value := 'restore';

    actor_user_id := coalesce(
      NEW.restored_by,
      NEW.updated_by,
      auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_value := 'update';

    actor_user_id := coalesce(
      NEW.updated_by,
      auth.uid()
    );
  ELSE
    action_value := lower(TG_OP);
    actor_user_id := auth.uid();
  END IF;

  SELECT
    membership.role,
    membership.scope_type
  INTO
    actor_role,
    actor_scope
  FROM public.organization_members membership
  WHERE membership.user_id = actor_user_id
    AND lower(coalesce(membership.status, '')) = 'active'
    AND (
      membership.access_starts_at IS NULL
      OR membership.access_starts_at <= now()
    )
    AND (
      membership.access_ends_at IS NULL
      OR membership.access_ends_at >= now()
    )
  ORDER BY
    membership.hierarchy_level DESC,
    membership.created_at ASC
  LIMIT 1;

  INSERT INTO public.identity_audit_logs (
    actor_user_id,
    actor_role,
    organization_id,
    school_id,
    product_code,
    module_code,
    action,
    resource_type,
    resource_id,
    resource_owner_user_id,
    access_scope,
    success,
    before_data,
    after_data,
    metadata,
    occurred_at
  )
  VALUES (
    actor_user_id,
    coalesce(actor_role, 'individual'),
    organization_id_value,
    school_id_value,
    'agenda_edi',
    replace(TG_TABLE_NAME, 'agenda_', ''),
    action_value,
    TG_TABLE_NAME,
    nullif(source_record ->> 'id', '')::uuid,
    owner_user_id,
    coalesce(actor_scope, 'self'),
    true,
    record_before,
    record_after,
    jsonb_build_object(
      'source', 'database_trigger',
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'actor_resolved', actor_user_id IS NOT NULL
    ),
    now()
  );

  RETURN NEW;
END;
$$;


-- =========================================================
-- 11. BLOQUEIO DE EXCLUSÃO FÍSICA
-- =========================================================

CREATE OR REPLACE FUNCTION public.block_agenda_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF current_setting(
       'app.allow_agenda_hard_delete',
       true
     ) = 'on'
     AND auth.role() = 'service_role' THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION
    'Exclusão física bloqueada. Utilize public.soft_delete_agenda_record().' 
    USING ERRCODE = '42501';
END;
$$;


-- =========================================================
-- 12. FUNÇÃO DE EXCLUSÃO LÓGICA
-- =========================================================

CREATE OR REPLACE FUNCTION public.soft_delete_agenda_record(
  requested_resource_type text,
  requested_resource_id uuid,
  requested_reason text,
  requested_actor_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_table text;
  owner_column text;
  actor_user_id uuid;
  record_before jsonb;
  record_after jsonb;
  owner_user_id uuid;
  organization_id_value uuid;
  school_id_value uuid;
BEGIN
  IF requested_resource_id IS NULL THEN
    RAISE EXCEPTION
      'O identificador do registro é obrigatório.'
      USING ERRCODE = '22023';
  END IF;

  IF nullif(btrim(requested_reason), '') IS NULL THEN
    RAISE EXCEPTION
      'O motivo da exclusão é obrigatório.'
      USING ERRCODE = '22023';
  END IF;

  target_table := public.agenda_resource_table_name(
    requested_resource_type
  );

  IF target_table IS NULL THEN
    RAISE EXCEPTION
      'Tipo de registro da Agenda não reconhecido: %.',
      requested_resource_type
      USING ERRCODE = '22023';
  END IF;

  owner_column := public.agenda_resource_owner_column(
    target_table
  );

  actor_user_id := public.resolve_agenda_actor(
    requested_actor_user_id
  );

  EXECUTE format(
    'SELECT to_jsonb(record)
       FROM public.%I record
      WHERE record.id = $1',
    target_table
  )
  INTO record_before
  USING requested_resource_id;

  IF record_before IS NULL THEN
    RAISE EXCEPTION
      'Registro da Agenda não encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  IF nullif(record_before ->> 'deleted_at', '') IS NOT NULL THEN
    RAISE EXCEPTION
      'O registro já está excluído.'
      USING ERRCODE = '22023';
  END IF;

  owner_user_id := nullif(
    record_before ->> owner_column,
    ''
  )::uuid;

  organization_id_value := nullif(
    record_before ->> 'organization_id',
    ''
  )::uuid;

  school_id_value := nullif(
    record_before ->> 'school_id',
    ''
  )::uuid;

  IF public.can_manage_agenda_record_as(
    actor_user_id,
    owner_user_id,
    organization_id_value,
    school_id_value,
    'delete'
  ) = false THEN
    RAISE EXCEPTION
      'O usuário não possui permissão para excluir este registro.'
      USING ERRCODE = '42501';
  END IF;

  PERFORM set_config(
    'app.actor_user_id',
    actor_user_id::text,
    true
  );

  EXECUTE format(
    'UPDATE public.%I AS record
        SET deleted_at = now(),
            deleted_by = $1,
            deletion_reason = $2,
            restored_at = NULL,
            restored_by = NULL,
            restore_reason = NULL,
            updated_by = $1
      WHERE record.id = $3
      RETURNING to_jsonb(record)',
    target_table
  )
  INTO record_after
  USING
    actor_user_id,
    btrim(requested_reason),
    requested_resource_id;

  RETURN record_after;
END;
$$;


-- =========================================================
-- 13. FUNÇÃO DE RESTAURAÇÃO
-- =========================================================

CREATE OR REPLACE FUNCTION public.restore_agenda_record(
  requested_resource_type text,
  requested_resource_id uuid,
  requested_reason text,
  requested_actor_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_table text;
  owner_column text;
  actor_user_id uuid;
  record_before jsonb;
  record_after jsonb;
  owner_user_id uuid;
  organization_id_value uuid;
  school_id_value uuid;
BEGIN
  IF requested_resource_id IS NULL THEN
    RAISE EXCEPTION
      'O identificador do registro é obrigatório.'
      USING ERRCODE = '22023';
  END IF;

  IF nullif(btrim(requested_reason), '') IS NULL THEN
    RAISE EXCEPTION
      'O motivo da restauração é obrigatório.'
      USING ERRCODE = '22023';
  END IF;

  target_table := public.agenda_resource_table_name(
    requested_resource_type
  );

  IF target_table IS NULL THEN
    RAISE EXCEPTION
      'Tipo de registro da Agenda não reconhecido: %.',
      requested_resource_type
      USING ERRCODE = '22023';
  END IF;

  owner_column := public.agenda_resource_owner_column(
    target_table
  );

  actor_user_id := public.resolve_agenda_actor(
    requested_actor_user_id
  );

  EXECUTE format(
    'SELECT to_jsonb(record)
       FROM public.%I record
      WHERE record.id = $1',
    target_table
  )
  INTO record_before
  USING requested_resource_id;

  IF record_before IS NULL THEN
    RAISE EXCEPTION
      'Registro da Agenda não encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  IF nullif(record_before ->> 'deleted_at', '') IS NULL THEN
    RAISE EXCEPTION
      'O registro não está excluído.'
      USING ERRCODE = '22023';
  END IF;

  owner_user_id := nullif(
    record_before ->> owner_column,
    ''
  )::uuid;

  organization_id_value := nullif(
    record_before ->> 'organization_id',
    ''
  )::uuid;

  school_id_value := nullif(
    record_before ->> 'school_id',
    ''
  )::uuid;

  IF public.can_manage_agenda_record_as(
    actor_user_id,
    owner_user_id,
    organization_id_value,
    school_id_value,
    'restore'
  ) = false THEN
    RAISE EXCEPTION
      'O usuário não possui permissão para restaurar este registro.'
      USING ERRCODE = '42501';
  END IF;

  PERFORM set_config(
    'app.actor_user_id',
    actor_user_id::text,
    true
  );

  EXECUTE format(
    'UPDATE public.%I AS record
        SET deleted_at = NULL,
            restored_at = now(),
            restored_by = $1,
            restore_reason = $2,
            updated_by = $1
      WHERE record.id = $3
      RETURNING to_jsonb(record)',
    target_table
  )
  INTO record_after
  USING
    actor_user_id,
    btrim(requested_reason),
    requested_resource_id;

  RETURN record_after;
END;
$$;


-- =========================================================
-- 14. TRIGGERS NAS TABELAS DA AGENDA
-- =========================================================

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'agenda_events',
    'agenda_tasks',
    'agenda_planning',
    'agenda_evidences',
    'agenda_classes'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      'trg_' || target_table || '_governance',
      target_table
    );

    EXECUTE format(
      'CREATE TRIGGER %I
         BEFORE INSERT OR UPDATE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.apply_agenda_record_governance()',
      'trg_' || target_table || '_governance',
      target_table
    );

    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      'trg_' || target_table || '_audit',
      target_table
    );

    EXECUTE format(
      'CREATE TRIGGER %I
         AFTER INSERT OR UPDATE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.audit_agenda_record_change()',
      'trg_' || target_table || '_audit',
      target_table
    );

    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      'trg_' || target_table || '_block_hard_delete',
      target_table
    );

    EXECUTE format(
      'CREATE TRIGGER %I
         BEFORE DELETE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.block_agenda_hard_delete()',
      'trg_' || target_table || '_block_hard_delete',
      target_table
    );
  END LOOP;
END;
$$;


-- =========================================================
-- 15. RLS GOVERNADA DA AGENDA
-- =========================================================

DO $$
DECLARE
  target_table text;
  existing_policy record;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'agenda_events',
    'agenda_tasks',
    'agenda_planning',
    'agenda_evidences',
    'agenda_classes'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      target_table
    );

    FOR existing_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        existing_policy.policyname,
        target_table
      );
    END LOOP;
  END LOOP;
END;
$$;


CREATE POLICY agenda_events_governed_select
ON public.agenda_events
FOR SELECT
TO authenticated
USING (
  public.can_view_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);

CREATE POLICY agenda_events_owner_insert
ON public.agenda_events
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

CREATE POLICY agenda_events_governed_update
ON public.agenda_events
FOR UPDATE
TO authenticated
USING (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);


CREATE POLICY agenda_tasks_governed_select
ON public.agenda_tasks
FOR SELECT
TO authenticated
USING (
  public.can_view_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);

CREATE POLICY agenda_tasks_owner_insert
ON public.agenda_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

CREATE POLICY agenda_tasks_governed_update
ON public.agenda_tasks
FOR UPDATE
TO authenticated
USING (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);


CREATE POLICY agenda_planning_governed_select
ON public.agenda_planning
FOR SELECT
TO authenticated
USING (
  public.can_view_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);

CREATE POLICY agenda_planning_owner_insert
ON public.agenda_planning
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

CREATE POLICY agenda_planning_governed_update
ON public.agenda_planning
FOR UPDATE
TO authenticated
USING (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);


CREATE POLICY agenda_evidences_governed_select
ON public.agenda_evidences
FOR SELECT
TO authenticated
USING (
  public.can_view_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);

CREATE POLICY agenda_evidences_owner_insert
ON public.agenda_evidences
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

CREATE POLICY agenda_evidences_governed_update
ON public.agenda_evidences
FOR UPDATE
TO authenticated
USING (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);


CREATE POLICY agenda_classes_governed_select
ON public.agenda_classes
FOR SELECT
TO authenticated
USING (
  public.can_view_agenda_record(
    teacher_id,
    organization_id,
    school_id
  )
);

CREATE POLICY agenda_classes_owner_insert
ON public.agenda_classes
FOR INSERT
TO authenticated
WITH CHECK (
  teacher_id = auth.uid()
  AND deleted_at IS NULL
);

CREATE POLICY agenda_classes_governed_update
ON public.agenda_classes
FOR UPDATE
TO authenticated
USING (
  public.can_update_agenda_record(
    teacher_id,
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.can_update_agenda_record(
    teacher_id,
    organization_id,
    school_id
  )
);


-- Não existe policy de DELETE.
-- Toda exclusão deve ocorrer por soft_delete_agenda_record().


-- =========================================================
-- 16. VISÃO NORMALIZADA PARA GESTORES
-- =========================================================

DROP VIEW IF EXISTS public.agenda_institutional_records;

CREATE VIEW public.agenda_institutional_records
WITH (security_invoker = true)
AS
  SELECT
    'agenda_events'::text AS resource_type,
    record.id AS resource_id,
    record.title,
    record.status::text AS record_status,
    record.user_id AS owner_user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL AS is_deleted,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_events record

  UNION ALL

  SELECT
    'agenda_tasks'::text,
    record.id,
    record.title,
    record.status::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_tasks record

  UNION ALL

  SELECT
    'agenda_planning'::text,
    record.id,
    record.title,
    record.status::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_planning record

  UNION ALL

  SELECT
    'agenda_evidences'::text,
    record.id,
    record.title,
    record.evidence_type::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_evidences record

  UNION ALL

  SELECT
    'agenda_classes'::text,
    record.id,
    record.name,
    CASE
      WHEN record.active THEN 'active'
      ELSE 'inactive'
    END::text,
    record.teacher_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_classes record;


-- =========================================================
-- 17. PRIVILÉGIOS
-- =========================================================

REVOKE ALL ON FUNCTION public.agenda_resource_table_name(text)
  FROM PUBLIC;

REVOKE ALL ON FUNCTION public.agenda_resource_owner_column(text)
  FROM PUBLIC;

REVOKE ALL ON FUNCTION public.can_view_agenda_record_as(
  uuid,
  uuid,
  uuid,
  uuid
)
  FROM PUBLIC;

REVOKE ALL ON FUNCTION public.can_manage_agenda_record_as(
  uuid,
  uuid,
  uuid,
  uuid,
  text
)
  FROM PUBLIC;

REVOKE ALL ON FUNCTION public.resolve_agenda_actor(uuid)
  FROM PUBLIC;

REVOKE ALL ON FUNCTION public.soft_delete_agenda_record(
  text,
  uuid,
  text,
  uuid
)
  FROM PUBLIC;

REVOKE ALL ON FUNCTION public.restore_agenda_record(
  text,
  uuid,
  text,
  uuid
)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_view_agenda_record(
  uuid,
  uuid,
  uuid
)
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.can_update_agenda_record(
  uuid,
  uuid,
  uuid
)
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.soft_delete_agenda_record(
  text,
  uuid,
  text,
  uuid
)
  TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.restore_agenda_record(
  text,
  uuid,
  text,
  uuid
)
  TO authenticated, service_role;

GRANT SELECT ON public.agenda_institutional_records
  TO authenticated, service_role;


-- =========================================================
-- 18. COMENTÁRIOS INSTITUCIONAIS
-- =========================================================

COMMENT ON VIEW public.agenda_institutional_records IS
  'Visão normalizada dos registros da Agenda EDI, submetida às políticas RLS das tabelas de origem.';

COMMENT ON FUNCTION public.soft_delete_agenda_record(
  text,
  uuid,
  text,
  uuid
) IS
  'Realiza exclusão lógica de registro da Agenda e preserva a trilha de auditoria.';

COMMENT ON FUNCTION public.restore_agenda_record(
  text,
  uuid,
  text,
  uuid
) IS
  'Restaura registro excluído logicamente e registra a operação na auditoria central.';

COMMIT;
BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 29 — ACADEMIC CALENDAR SECURITY HARDENING
-- =========================================================
--
-- Objetivos:
-- 1. Bloquear exclusões físicas no calendário institucional.
-- 2. Preservar exclusivamente a exclusão lógica.
-- 3. Restringir rascunhos e registros cancelados aos gestores.
-- 4. Expor eventos globais somente quando publicados.
-- 5. Garantir coerência entre organização, escola,
--    ano letivo, período e eventos relacionados.
-- 6. Não alterar ou apagar registros existentes.
-- =========================================================


-- =========================================================
-- 1. VALIDAR PRÉ-REQUISITOS
-- =========================================================

DO $$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'organizations',
    'schools',
    'school_years',
    'academic_periods',
    'institutional_calendar_events',
    'school_operating_hours',
    'school_calendar_exceptions'
  ]
  LOOP
    IF to_regclass(
         format(
           'public.%I',
           required_table
         )
       ) IS NULL
    THEN
      RAISE EXCEPTION
        'Tabela obrigatória não encontrada: public.%.',
        required_table;
    END IF;
  END LOOP;

  IF to_regprocedure(
       'public.current_user_is_academic_calendar_platform_admin()'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Função obrigatória não encontrada: current_user_is_academic_calendar_platform_admin().';
  END IF;

  IF to_regprocedure(
       'public.current_user_can_view_academic_calendar(uuid,uuid)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Função obrigatória não encontrada: current_user_can_view_academic_calendar(uuid,uuid).';
  END IF;

  IF to_regprocedure(
       'public.current_user_can_manage_academic_calendar(uuid,uuid)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Função obrigatória não encontrada: current_user_can_manage_academic_calendar(uuid,uuid).';
  END IF;
END;
$$;


-- =========================================================
-- 2. VALIDAR ORGANIZAÇÃO DA ESCOLA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.academic_calendar_school_belongs_to_organization(
    target_organization_id uuid,
    target_school_id uuid
  )
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.schools
      AS school
    WHERE school.id =
          target_school_id
      AND school.organization_id =
          target_organization_id
  );
$$;


REVOKE ALL
ON FUNCTION
  public.academic_calendar_school_belongs_to_organization(
    uuid,
    uuid
  )
FROM PUBLIC;


-- =========================================================
-- 3. CONSISTÊNCIA DE SCHOOL_YEARS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.validate_school_year_calendar_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public
AS $$
BEGIN
  IF NEW.organization_id IS NULL
  THEN
    RAISE EXCEPTION
      'A organização do ano letivo é obrigatória.';
  END IF;

  IF NEW.school_id IS NULL
  THEN
    RAISE EXCEPTION
      'A escola do ano letivo é obrigatória.';
  END IF;

  IF NOT public
    .academic_calendar_school_belongs_to_organization(
      NEW.organization_id,
      NEW.school_id
    )
  THEN
    RAISE EXCEPTION
      'A escola informada não pertence à organização do ano letivo.';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_school_year_calendar_scope
ON public.school_years;

CREATE TRIGGER
  trg_validate_school_year_calendar_scope
BEFORE INSERT OR UPDATE
ON public.school_years
FOR EACH ROW
EXECUTE FUNCTION
  public.validate_school_year_calendar_scope();


-- =========================================================
-- 4. CONSISTÊNCIA DE ACADEMIC_PERIODS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.validate_academic_period_calendar_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public
AS $$
DECLARE
  year_organization_id uuid;
  year_school_id uuid;
  year_start_date date;
  year_end_date date;
BEGIN
  SELECT
    school_year.organization_id,
    school_year.school_id,
    school_year.start_date,
    school_year.end_date
  INTO
    year_organization_id,
    year_school_id,
    year_start_date,
    year_end_date
  FROM public.school_years
    AS school_year
  WHERE school_year.id =
        NEW.school_year_id
    AND school_year.deleted_at
        IS NULL;

  IF year_organization_id IS NULL
  THEN
    RAISE EXCEPTION
      'O ano letivo informado não existe ou foi excluído.';
  END IF;

  IF NEW.organization_id <>
     year_organization_id
  THEN
    RAISE EXCEPTION
      'A organização do período não corresponde ao ano letivo.';
  END IF;

  IF NEW.school_id <>
     year_school_id
  THEN
    RAISE EXCEPTION
      'A escola do período não corresponde ao ano letivo.';
  END IF;

  IF year_start_date IS NOT NULL
     AND NEW.start_date <
         year_start_date
  THEN
    RAISE EXCEPTION
      'O período não pode começar antes do ano letivo.';
  END IF;

  IF year_end_date IS NOT NULL
     AND NEW.end_date >
         year_end_date
  THEN
    RAISE EXCEPTION
      'O período não pode terminar depois do ano letivo.';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_academic_period_calendar_scope
ON public.academic_periods;

CREATE TRIGGER
  trg_validate_academic_period_calendar_scope
BEFORE INSERT OR UPDATE
ON public.academic_periods
FOR EACH ROW
EXECUTE FUNCTION
  public.validate_academic_period_calendar_scope();


-- =========================================================
-- 5. CONSISTÊNCIA DE EVENTOS INSTITUCIONAIS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.validate_institutional_calendar_event_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public
AS $$
DECLARE
  year_organization_id uuid;
  year_school_id uuid;

  period_organization_id uuid;
  period_school_id uuid;
  period_school_year_id uuid;
BEGIN
  -- Datas oficiais globais não pertencem a uma organização.

  IF NEW.scope_level IN (
       'national',
       'state',
       'municipal'
     )
  THEN
    IF NEW.organization_id IS NOT NULL
       OR NEW.school_id IS NOT NULL
    THEN
      RAISE EXCEPTION
        'Eventos nacionais, estaduais ou municipais não podem pertencer a uma organização ou escola.';
    END IF;
  END IF;

  -- Eventos de rede ou organização exigem organização,
  -- mas não podem ficar restritos a uma escola.

  IF NEW.scope_level IN (
       'network',
       'organization'
     )
  THEN
    IF NEW.organization_id IS NULL
    THEN
      RAISE EXCEPTION
        'A organização é obrigatória para eventos de rede ou organização.';
    END IF;

    IF NEW.school_id IS NOT NULL
    THEN
      RAISE EXCEPTION
        'Eventos de rede ou organização não podem possuir escola específica.';
    END IF;
  END IF;

  -- Eventos escolares exigem organização e escola.

  IF NEW.scope_level = 'school'
  THEN
    IF NEW.organization_id IS NULL
       OR NEW.school_id IS NULL
    THEN
      RAISE EXCEPTION
        'A organização e a escola são obrigatórias para eventos escolares.';
    END IF;
  END IF;

  IF NEW.school_id IS NOT NULL
  THEN
    IF NOT public
      .academic_calendar_school_belongs_to_organization(
        NEW.organization_id,
        NEW.school_id
      )
    THEN
      RAISE EXCEPTION
        'A escola do evento não pertence à organização informada.';
    END IF;
  END IF;

  IF NEW.school_year_id IS NOT NULL
  THEN
    SELECT
      school_year.organization_id,
      school_year.school_id
    INTO
      year_organization_id,
      year_school_id
    FROM public.school_years
      AS school_year
    WHERE school_year.id =
          NEW.school_year_id
      AND school_year.deleted_at
          IS NULL;

    IF year_organization_id IS NULL
    THEN
      RAISE EXCEPTION
        'O ano letivo do evento não existe ou foi excluído.';
    END IF;

    IF NEW.organization_id IS DISTINCT FROM
       year_organization_id
    THEN
      RAISE EXCEPTION
        'A organização do evento não corresponde ao ano letivo.';
    END IF;

    IF NEW.school_id IS DISTINCT FROM
       year_school_id
    THEN
      RAISE EXCEPTION
        'A escola do evento não corresponde ao ano letivo.';
    END IF;
  END IF;

  IF NEW.academic_period_id IS NOT NULL
  THEN
    SELECT
      academic_period.organization_id,
      academic_period.school_id,
      academic_period.school_year_id
    INTO
      period_organization_id,
      period_school_id,
      period_school_year_id
    FROM public.academic_periods
      AS academic_period
    WHERE academic_period.id =
          NEW.academic_period_id
      AND academic_period.deleted_at
          IS NULL;

    IF period_organization_id IS NULL
    THEN
      RAISE EXCEPTION
        'O período letivo do evento não existe ou foi excluído.';
    END IF;

    IF NEW.organization_id IS DISTINCT FROM
       period_organization_id
    THEN
      RAISE EXCEPTION
        'A organização do evento não corresponde ao período letivo.';
    END IF;

    IF NEW.school_id IS DISTINCT FROM
       period_school_id
    THEN
      RAISE EXCEPTION
        'A escola do evento não corresponde ao período letivo.';
    END IF;

    IF NEW.school_year_id IS NULL
    THEN
      NEW.school_year_id =
        period_school_year_id;

    ELSIF NEW.school_year_id <>
          period_school_year_id
    THEN
      RAISE EXCEPTION
        'O ano letivo do evento não corresponde ao período informado.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_institutional_calendar_event_scope
ON public.institutional_calendar_events;

CREATE TRIGGER
  trg_validate_institutional_calendar_event_scope
BEFORE INSERT OR UPDATE
ON public.institutional_calendar_events
FOR EACH ROW
EXECUTE FUNCTION
  public.validate_institutional_calendar_event_scope();


-- =========================================================
-- 6. CONSISTÊNCIA DE HORÁRIOS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.validate_school_operating_hours_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public
AS $$
DECLARE
  year_organization_id uuid;
  year_school_id uuid;
BEGIN
  SELECT
    school_year.organization_id,
    school_year.school_id
  INTO
    year_organization_id,
    year_school_id
  FROM public.school_years
    AS school_year
  WHERE school_year.id =
        NEW.school_year_id
    AND school_year.deleted_at
        IS NULL;

  IF year_organization_id IS NULL
  THEN
    RAISE EXCEPTION
      'O ano letivo do horário não existe ou foi excluído.';
  END IF;

  IF NEW.organization_id <>
     year_organization_id
  THEN
    RAISE EXCEPTION
      'A organização do horário não corresponde ao ano letivo.';
  END IF;

  IF NEW.school_id <>
     year_school_id
  THEN
    RAISE EXCEPTION
      'A escola do horário não corresponde ao ano letivo.';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_school_operating_hours_scope
ON public.school_operating_hours;

CREATE TRIGGER
  trg_validate_school_operating_hours_scope
BEFORE INSERT OR UPDATE
ON public.school_operating_hours
FOR EACH ROW
EXECUTE FUNCTION
  public.validate_school_operating_hours_scope();


-- =========================================================
-- 7. CONSISTÊNCIA DE EXCEÇÕES
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.validate_school_calendar_exception_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public
AS $$
DECLARE
  year_organization_id uuid;
  year_school_id uuid;

  source_organization_id uuid;
  source_school_id uuid;
  source_school_year_id uuid;
BEGIN
  SELECT
    school_year.organization_id,
    school_year.school_id
  INTO
    year_organization_id,
    year_school_id
  FROM public.school_years
    AS school_year
  WHERE school_year.id =
        NEW.school_year_id
    AND school_year.deleted_at
        IS NULL;

  IF year_organization_id IS NULL
  THEN
    RAISE EXCEPTION
      'O ano letivo da exceção não existe ou foi excluído.';
  END IF;

  IF NEW.organization_id <>
     year_organization_id
  THEN
    RAISE EXCEPTION
      'A organização da exceção não corresponde ao ano letivo.';
  END IF;

  IF NEW.school_id <>
     year_school_id
  THEN
    RAISE EXCEPTION
      'A escola da exceção não corresponde ao ano letivo.';
  END IF;

  IF NEW.source_event_id IS NOT NULL
  THEN
    SELECT
      calendar_event.organization_id,
      calendar_event.school_id,
      calendar_event.school_year_id
    INTO
      source_organization_id,
      source_school_id,
      source_school_year_id
    FROM public.institutional_calendar_events
      AS calendar_event
    WHERE calendar_event.id =
          NEW.source_event_id
      AND calendar_event.deleted_at
          IS NULL;

    IF NOT FOUND
    THEN
      RAISE EXCEPTION
        'O evento de origem da exceção não existe ou foi excluído.';
    END IF;

    IF source_organization_id IS NOT NULL
       AND source_organization_id <>
           NEW.organization_id
    THEN
      RAISE EXCEPTION
        'O evento de origem pertence a outra organização.';
    END IF;

    IF source_school_id IS NOT NULL
       AND source_school_id <>
           NEW.school_id
    THEN
      RAISE EXCEPTION
        'O evento de origem pertence a outra escola.';
    END IF;

    IF source_school_year_id IS NOT NULL
       AND source_school_year_id <>
           NEW.school_year_id
    THEN
      RAISE EXCEPTION
        'O evento de origem pertence a outro ano letivo.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_school_calendar_exception_scope
ON public.school_calendar_exceptions;

CREATE TRIGGER
  trg_validate_school_calendar_exception_scope
BEFORE INSERT OR UPDATE
ON public.school_calendar_exceptions
FOR EACH ROW
EXECUTE FUNCTION
  public.validate_school_calendar_exception_scope();


-- =========================================================
-- 8. BLOQUEIO DE EXCLUSÃO FÍSICA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.prevent_academic_calendar_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public
AS $$
BEGIN
  RAISE EXCEPTION
    'Exclusão física bloqueada para %. Utilize a exclusão lógica com motivo e responsável.',
    TG_TABLE_NAME;
END;
$$;


DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'school_years',
    'academic_periods',
    'institutional_calendar_events',
    'school_operating_hours',
    'school_calendar_exceptions'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_prevent_academic_calendar_hard_delete ON public.%I',
      target_table
    );

    EXECUTE format(
      'CREATE TRIGGER trg_prevent_academic_calendar_hard_delete
       BEFORE DELETE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.prevent_academic_calendar_hard_delete()',
      target_table
    );
  END LOOP;
END;
$$;


-- =========================================================
-- 9. REMOVER POLÍTICAS DE EXCLUSÃO FÍSICA
-- =========================================================

DROP POLICY IF EXISTS
  school_years_calendar_delete
ON public.school_years;

DROP POLICY IF EXISTS
  academic_periods_delete
ON public.academic_periods;

DROP POLICY IF EXISTS
  institutional_calendar_events_delete
ON public.institutional_calendar_events;

DROP POLICY IF EXISTS
  school_operating_hours_delete
ON public.school_operating_hours;

DROP POLICY IF EXISTS
  school_calendar_exceptions_delete
ON public.school_calendar_exceptions;


REVOKE DELETE
ON TABLE
  public.school_years,
  public.academic_periods,
  public.institutional_calendar_events,
  public.school_operating_hours,
  public.school_calendar_exceptions
FROM authenticated;


-- =========================================================
-- 10. LEITURA SEGURA DOS EVENTOS INSTITUCIONAIS
-- =========================================================
--
-- Regra:
-- - administradores da plataforma veem todos os eventos;
-- - gestores institucionais veem rascunhos do próprio escopo;
-- - demais usuários veem apenas eventos publicados;
-- - eventos globais em rascunho não são expostos;
-- - registros excluídos ficam restritos aos gestores.
-- =========================================================

DROP POLICY IF EXISTS
  institutional_calendar_events_select
ON public.institutional_calendar_events;


CREATE POLICY
  institutional_calendar_events_select
ON public.institutional_calendar_events
FOR SELECT
TO authenticated
USING (
  (
    organization_id IS NULL

    AND (
      public
        .current_user_is_academic_calendar_platform_admin()

      OR (
        status = 'published'
        AND deleted_at IS NULL
      )
    )
  )

  OR (
    organization_id IS NOT NULL

    AND public
      .current_user_can_view_academic_calendar(
        organization_id,
        school_id
      )

    AND (
      public
        .current_user_can_manage_academic_calendar(
          organization_id,
          school_id
        )

      OR (
        status = 'published'
        AND deleted_at IS NULL
      )
    )
  )
);


-- =========================================================
-- 11. PRIVILÉGIOS FINAIS
-- =========================================================

GRANT
  SELECT,
  INSERT,
  UPDATE
ON TABLE
  public.school_years,
  public.academic_periods,
  public.institutional_calendar_events,
  public.school_operating_hours,
  public.school_calendar_exceptions
TO authenticated;


-- =========================================================
-- 12. DOCUMENTAÇÃO
-- =========================================================

COMMENT ON FUNCTION
  public.prevent_academic_calendar_hard_delete()
IS
  'Bloqueia exclusões físicas nas tabelas do Calendário Letivo Institucional EDI.';


COMMENT ON FUNCTION
  public.academic_calendar_school_belongs_to_organization(
    uuid,
    uuid
  )
IS
  'Valida se uma escola pertence à organização informada.';


COMMENT ON FUNCTION
  public.validate_institutional_calendar_event_scope()
IS
  'Garante coerência entre escopo, organização, escola, ano letivo e período dos eventos institucionais.';


COMMIT;
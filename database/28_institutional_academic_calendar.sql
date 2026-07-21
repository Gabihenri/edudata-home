BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 28 — INSTITUTIONAL ACADEMIC CALENDAR
-- =========================================================
--
-- Objetivos:
-- 1. Evoluir public.school_years sem recriar a entidade.
-- 2. Criar períodos letivos institucionais.
-- 3. Estruturar feriados, recessos, datas oficiais,
--    eventos operacionais e dias letivos especiais.
-- 4. Registrar horários regulares de funcionamento.
-- 5. Registrar exceções e reposições.
-- 6. Aplicar governança, RLS e auditoria.
-- 7. Preservar compatibilidade com a Agenda existente.
--
-- Arquitetura:
-- Framework EDI
--   → EIOS / Core Compartilhado
--     → Calendário Letivo Institucional
--       → Agenda Inteligente EDI
--       → Professor Digital
--       → Analytics
--       → SGPA
-- =========================================================


CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- 1. VALIDAÇÃO DOS PRÉ-REQUISITOS
-- =========================================================

DO $$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'organizations',
    'schools',
    'school_years',
    'organization_members',
    'user_profiles',
    'identity_audit_logs'
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
        'Tabela obrigatória não encontrada: public.%. A migration foi interrompida para evitar arquitetura paralela.',
        required_table;
    END IF;
  END LOOP;
END;
$$;


-- =========================================================
-- 2. EVOLUÇÃO DA ENTIDADE SCHOOL_YEARS
-- =========================================================

ALTER TABLE public.school_years
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS minimum_school_days integer NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS minimum_instructional_hours integer,
  ADD COLUMN IF NOT EXISTS calendar_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_by uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS restored_by uuid,
  ADD COLUMN IF NOT EXISTS restore_reason text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;


UPDATE public.school_years AS school_year
SET organization_id =
  school.organization_id
FROM public.schools AS school
WHERE school.id =
      school_year.school_id
  AND school_year.organization_id
      IS NULL;


UPDATE public.school_years
SET
  name = COALESCE(
    NULLIF(
      trim(name),
      ''
    ),
    year::text || ' — Ano letivo'
  ),

  status =
    CASE
      WHEN active = false
        THEN 'archived'

      WHEN status IS NULL
        OR trim(status) = ''
        OR status = 'active'
        THEN 'draft'

      ELSE status
    END,

  timezone = COALESCE(
    NULLIF(
      trim(timezone),
      ''
    ),
    'America/Sao_Paulo'
  ),

  minimum_school_days =
    COALESCE(
      minimum_school_days,
      200
    ),

  calendar_version =
    GREATEST(
      COALESCE(
        calendar_version,
        1
      ),
      1
    ),

  metadata =
    COALESCE(
      metadata,
      '{}'::jsonb
    );


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'school_years_organization_id_fkey'
      AND conrelid =
        'public.school_years'::regclass
  )
  THEN
    ALTER TABLE public.school_years
      ADD CONSTRAINT
        school_years_organization_id_fkey
      FOREIGN KEY (
        organization_id
      )
      REFERENCES public.organizations(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END;
$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.school_years
    WHERE organization_id IS NULL
  )
  THEN
    ALTER TABLE public.school_years
      ALTER COLUMN organization_id
      SET NOT NULL;
  END IF;
END;
$$;


ALTER TABLE public.school_years
  DROP CONSTRAINT IF EXISTS
    school_years_status_check;

ALTER TABLE public.school_years
  ADD CONSTRAINT
    school_years_status_check
  CHECK (
    status IN (
      'draft',
      'published',
      'closed',
      'archived'
    )
  )
  NOT VALID;


ALTER TABLE public.school_years
  DROP CONSTRAINT IF EXISTS
    school_years_date_range_check;

ALTER TABLE public.school_years
  ADD CONSTRAINT
    school_years_date_range_check
  CHECK (
    end_date IS NULL
    OR start_date IS NULL
    OR end_date >= start_date
  )
  NOT VALID;


ALTER TABLE public.school_years
  DROP CONSTRAINT IF EXISTS
    school_years_minimum_days_check;

ALTER TABLE public.school_years
  ADD CONSTRAINT
    school_years_minimum_days_check
  CHECK (
    minimum_school_days >= 0
    AND minimum_school_days <= 366
  )
  NOT VALID;


ALTER TABLE public.school_years
  DROP CONSTRAINT IF EXISTS
    school_years_minimum_hours_check;

ALTER TABLE public.school_years
  ADD CONSTRAINT
    school_years_minimum_hours_check
  CHECK (
    minimum_instructional_hours
      IS NULL
    OR minimum_instructional_hours >= 0
  )
  NOT VALID;


ALTER TABLE public.school_years
  DROP CONSTRAINT IF EXISTS
    school_years_soft_delete_check;

ALTER TABLE public.school_years
  ADD CONSTRAINT
    school_years_soft_delete_check
  CHECK (
    deleted_at IS NULL
    OR (
      deleted_by IS NOT NULL
      AND NULLIF(
        trim(deletion_reason),
        ''
      ) IS NOT NULL
    )
  )
  NOT VALID;


ALTER TABLE public.school_years
  DROP CONSTRAINT IF EXISTS
    school_years_restore_check;

ALTER TABLE public.school_years
  ADD CONSTRAINT
    school_years_restore_check
  CHECK (
    restored_at IS NULL
    OR (
      restored_by IS NOT NULL
      AND NULLIF(
        trim(restore_reason),
        ''
      ) IS NOT NULL
    )
  )
  NOT VALID;


CREATE INDEX IF NOT EXISTS
  idx_school_years_organization
ON public.school_years(
  organization_id
);


CREATE INDEX IF NOT EXISTS
  idx_school_years_school_status
ON public.school_years(
  school_id,
  status
);


CREATE INDEX IF NOT EXISTS
  idx_school_years_active_period
ON public.school_years(
  organization_id,
  school_id,
  start_date,
  end_date
)
WHERE deleted_at IS NULL;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT
      school_id,
      year
    FROM public.school_years
    GROUP BY
      school_id,
      year
    HAVING count(*) > 1
  )
  THEN
    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS
        idx_school_years_school_year_unique
      ON public.school_years(
        school_id,
        year
      )
      WHERE deleted_at IS NULL
    ';
  END IF;
END;
$$;


-- =========================================================
-- 3. PERÍODOS LETIVOS
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.academic_periods (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL,

    school_id uuid NOT NULL,

    school_year_id uuid NOT NULL,

    name text NOT NULL,

    code text,

    period_type text NOT NULL
      DEFAULT 'custom',

    sequence integer NOT NULL,

    start_date date NOT NULL,

    end_date date NOT NULL,

    instructional_days_target integer,

    status text NOT NULL
      DEFAULT 'draft',

    created_by uuid,

    updated_by uuid,

    published_at timestamptz,

    published_by uuid,

    deleted_at timestamptz,

    deleted_by uuid,

    deletion_reason text,

    restored_at timestamptz,

    restored_by uuid,

    restore_reason text,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT academic_periods_organization_fkey
      FOREIGN KEY (
        organization_id
      )
      REFERENCES public.organizations(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT academic_periods_school_fkey
      FOREIGN KEY (
        school_id
      )
      REFERENCES public.schools(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT academic_periods_school_year_fkey
      FOREIGN KEY (
        school_year_id
      )
      REFERENCES public.school_years(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,

    CONSTRAINT academic_periods_type_check
      CHECK (
        period_type IN (
          'bimester',
          'trimester',
          'semester',
          'quarter',
          'term',
          'stage',
          'custom'
        )
      ),

    CONSTRAINT academic_periods_sequence_check
      CHECK (
        sequence >= 1
        AND sequence <= 20
      ),

    CONSTRAINT academic_periods_date_range_check
      CHECK (
        end_date >= start_date
      ),

    CONSTRAINT academic_periods_days_target_check
      CHECK (
        instructional_days_target
          IS NULL
        OR instructional_days_target >= 0
      ),

    CONSTRAINT academic_periods_status_check
      CHECK (
        status IN (
          'draft',
          'published',
          'closed',
          'archived'
        )
      ),

    CONSTRAINT academic_periods_soft_delete_check
      CHECK (
        deleted_at IS NULL
        OR (
          deleted_by IS NOT NULL
          AND NULLIF(
            trim(deletion_reason),
            ''
          ) IS NOT NULL
        )
      ),

    CONSTRAINT academic_periods_restore_check
      CHECK (
        restored_at IS NULL
        OR (
          restored_by IS NOT NULL
          AND NULLIF(
            trim(restore_reason),
            ''
          ) IS NOT NULL
        )
      )
  );


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_academic_periods_year_sequence_unique
ON public.academic_periods(
  school_year_id,
  sequence
)
WHERE deleted_at IS NULL;


CREATE INDEX IF NOT EXISTS
  idx_academic_periods_organization
ON public.academic_periods(
  organization_id
);


CREATE INDEX IF NOT EXISTS
  idx_academic_periods_school
ON public.academic_periods(
  school_id
);


CREATE INDEX IF NOT EXISTS
  idx_academic_periods_dates
ON public.academic_periods(
  start_date,
  end_date
)
WHERE deleted_at IS NULL;


-- =========================================================
-- 4. EVENTOS DO CALENDÁRIO INSTITUCIONAL
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.institutional_calendar_events (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    organization_id uuid,

    school_id uuid,

    school_year_id uuid,

    academic_period_id uuid,

    calendar_year integer NOT NULL,

    title text NOT NULL,

    description text,

    event_type text NOT NULL,

    scope_level text NOT NULL
      DEFAULT 'school',

    date_rule text NOT NULL
      DEFAULT 'year_specific',

    source_type text NOT NULL
      DEFAULT 'manual',

    source_reference text,

    jurisdiction_country text
      DEFAULT 'Brasil',

    jurisdiction_state text,

    jurisdiction_city text,

    start_date date NOT NULL,

    end_date date NOT NULL,

    all_day boolean NOT NULL
      DEFAULT true,

    start_time time,

    end_time time,

    fixed_month integer,

    fixed_day integer,

    calculation_rule jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    is_instructional_day boolean NOT NULL
      DEFAULT false,

    counts_as_school_day boolean NOT NULL
      DEFAULT false,

    suspends_classes boolean NOT NULL
      DEFAULT false,

    is_mandatory boolean NOT NULL
      DEFAULT false,

    priority text NOT NULL
      DEFAULT 'normal',

    status text NOT NULL
      DEFAULT 'draft',

    created_by uuid,

    updated_by uuid,

    published_at timestamptz,

    published_by uuid,

    cancelled_at timestamptz,

    cancelled_by uuid,

    cancellation_reason text,

    deleted_at timestamptz,

    deleted_by uuid,

    deletion_reason text,

    restored_at timestamptz,

    restored_by uuid,

    restore_reason text,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT institutional_calendar_events_organization_fkey
      FOREIGN KEY (
        organization_id
      )
      REFERENCES public.organizations(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT institutional_calendar_events_school_fkey
      FOREIGN KEY (
        school_id
      )
      REFERENCES public.schools(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT institutional_calendar_events_school_year_fkey
      FOREIGN KEY (
        school_year_id
      )
      REFERENCES public.school_years(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,

    CONSTRAINT institutional_calendar_events_period_fkey
      FOREIGN KEY (
        academic_period_id
      )
      REFERENCES public.academic_periods(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL,

    CONSTRAINT institutional_calendar_events_year_check
      CHECK (
        calendar_year >= 2000
        AND calendar_year <= 2100
      ),

    CONSTRAINT institutional_calendar_events_type_check
      CHECK (
        event_type IN (
          'holiday',
          'optional_holiday',
          'recess',
          'planning',
          'teacher_training',
          'school_council',
          'assessment',
          'recovery',
          'school_saturday',
          'closure',
          'commemorative',
          'operational',
          'enrollment',
          'deadline',
          'other'
        )
      ),

    CONSTRAINT institutional_calendar_events_scope_check
      CHECK (
        scope_level IN (
          'national',
          'state',
          'municipal',
          'network',
          'organization',
          'school'
        )
      ),

    CONSTRAINT institutional_calendar_events_rule_check
      CHECK (
        date_rule IN (
          'fixed_annual',
          'year_specific',
          'movable',
          'conditional'
        )
      ),

    CONSTRAINT institutional_calendar_events_source_check
      CHECK (
        source_type IN (
          'legal',
          'official',
          'institutional',
          'imported',
          'manual'
        )
      ),

    CONSTRAINT institutional_calendar_events_date_range_check
      CHECK (
        end_date >= start_date
      ),

    CONSTRAINT institutional_calendar_events_time_range_check
      CHECK (
        end_time IS NULL
        OR start_time IS NULL
        OR end_time > start_time
      ),

    CONSTRAINT institutional_calendar_events_fixed_month_check
      CHECK (
        fixed_month IS NULL
        OR (
          fixed_month >= 1
          AND fixed_month <= 12
        )
      ),

    CONSTRAINT institutional_calendar_events_fixed_day_check
      CHECK (
        fixed_day IS NULL
        OR (
          fixed_day >= 1
          AND fixed_day <= 31
        )
      ),

    CONSTRAINT institutional_calendar_events_fixed_rule_check
      CHECK (
        date_rule <> 'fixed_annual'
        OR (
          fixed_month IS NOT NULL
          AND fixed_day IS NOT NULL
        )
      ),

    CONSTRAINT institutional_calendar_events_school_scope_check
      CHECK (
        scope_level <> 'school'
        OR school_id IS NOT NULL
      ),

    CONSTRAINT institutional_calendar_events_school_organization_check
      CHECK (
        school_id IS NULL
        OR organization_id IS NOT NULL
      ),

    CONSTRAINT institutional_calendar_events_priority_check
      CHECK (
        priority IN (
          'normal',
          'high',
          'critical'
        )
      ),

    CONSTRAINT institutional_calendar_events_status_check
      CHECK (
        status IN (
          'draft',
          'published',
          'cancelled',
          'archived'
        )
      ),

    CONSTRAINT institutional_calendar_events_cancellation_check
      CHECK (
        cancelled_at IS NULL
        OR (
          cancelled_by IS NOT NULL
          AND NULLIF(
            trim(cancellation_reason),
            ''
          ) IS NOT NULL
        )
      ),

    CONSTRAINT institutional_calendar_events_soft_delete_check
      CHECK (
        deleted_at IS NULL
        OR (
          deleted_by IS NOT NULL
          AND NULLIF(
            trim(deletion_reason),
            ''
          ) IS NOT NULL
        )
      ),

    CONSTRAINT institutional_calendar_events_restore_check
      CHECK (
        restored_at IS NULL
        OR (
          restored_by IS NOT NULL
          AND NULLIF(
            trim(restore_reason),
            ''
          ) IS NOT NULL
        )
      )
  );


CREATE INDEX IF NOT EXISTS
  idx_institutional_calendar_events_year
ON public.institutional_calendar_events(
  calendar_year
);


CREATE INDEX IF NOT EXISTS
  idx_institutional_calendar_events_scope
ON public.institutional_calendar_events(
  scope_level,
  organization_id,
  school_id
);


CREATE INDEX IF NOT EXISTS
  idx_institutional_calendar_events_school_year
ON public.institutional_calendar_events(
  school_year_id
);


CREATE INDEX IF NOT EXISTS
  idx_institutional_calendar_events_period
ON public.institutional_calendar_events(
  academic_period_id
);


CREATE INDEX IF NOT EXISTS
  idx_institutional_calendar_events_dates
ON public.institutional_calendar_events(
  start_date,
  end_date
)
WHERE deleted_at IS NULL;


CREATE INDEX IF NOT EXISTS
  idx_institutional_calendar_events_published
ON public.institutional_calendar_events(
  organization_id,
  school_id,
  status,
  start_date
)
WHERE deleted_at IS NULL;


CREATE INDEX IF NOT EXISTS
  idx_institutional_calendar_events_jurisdiction
ON public.institutional_calendar_events(
  jurisdiction_state,
  jurisdiction_city,
  calendar_year
)
WHERE organization_id IS NULL
  AND deleted_at IS NULL;


-- =========================================================
-- 5. HORÁRIOS REGULARES DE FUNCIONAMENTO
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.school_operating_hours (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL,

    school_id uuid NOT NULL,

    school_year_id uuid NOT NULL,

    weekday integer NOT NULL,

    shift_code text NOT NULL
      DEFAULT 'general',

    shift_name text,

    start_time time NOT NULL,

    end_time time NOT NULL,

    break_start_time time,

    break_end_time time,

    lesson_duration_minutes integer,

    is_operating_day boolean NOT NULL
      DEFAULT true,

    status text NOT NULL
      DEFAULT 'active',

    created_by uuid,

    updated_by uuid,

    deleted_at timestamptz,

    deleted_by uuid,

    deletion_reason text,

    restored_at timestamptz,

    restored_by uuid,

    restore_reason text,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT school_operating_hours_organization_fkey
      FOREIGN KEY (
        organization_id
      )
      REFERENCES public.organizations(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT school_operating_hours_school_fkey
      FOREIGN KEY (
        school_id
      )
      REFERENCES public.schools(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT school_operating_hours_school_year_fkey
      FOREIGN KEY (
        school_year_id
      )
      REFERENCES public.school_years(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,

    CONSTRAINT school_operating_hours_weekday_check
      CHECK (
        weekday >= 1
        AND weekday <= 7
      ),

    CONSTRAINT school_operating_hours_time_range_check
      CHECK (
        end_time > start_time
      ),

    CONSTRAINT school_operating_hours_break_check
      CHECK (
        (
          break_start_time IS NULL
          AND break_end_time IS NULL
        )
        OR (
          break_start_time IS NOT NULL
          AND break_end_time IS NOT NULL
          AND break_start_time >= start_time
          AND break_end_time <= end_time
          AND break_end_time > break_start_time
        )
      ),

    CONSTRAINT school_operating_hours_lesson_duration_check
      CHECK (
        lesson_duration_minutes
          IS NULL
        OR (
          lesson_duration_minutes >= 1
          AND lesson_duration_minutes <= 600
        )
      ),

    CONSTRAINT school_operating_hours_status_check
      CHECK (
        status IN (
          'active',
          'inactive',
          'archived'
        )
      ),

    CONSTRAINT school_operating_hours_soft_delete_check
      CHECK (
        deleted_at IS NULL
        OR (
          deleted_by IS NOT NULL
          AND NULLIF(
            trim(deletion_reason),
            ''
          ) IS NOT NULL
        )
      ),

    CONSTRAINT school_operating_hours_restore_check
      CHECK (
        restored_at IS NULL
        OR (
          restored_by IS NOT NULL
          AND NULLIF(
            trim(restore_reason),
            ''
          ) IS NOT NULL
        )
      )
  );


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_school_operating_hours_unique
ON public.school_operating_hours(
  school_year_id,
  weekday,
  shift_code
)
WHERE deleted_at IS NULL;


CREATE INDEX IF NOT EXISTS
  idx_school_operating_hours_school
ON public.school_operating_hours(
  school_id,
  school_year_id
);


-- =========================================================
-- 6. EXCEÇÕES, FECHAMENTOS E REPOSIÇÕES
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.school_calendar_exceptions (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL,

    school_id uuid NOT NULL,

    school_year_id uuid NOT NULL,

    source_event_id uuid,

    exception_date date NOT NULL,

    operation_mode text NOT NULL,

    shift_code text,

    start_time time,

    end_time time,

    replacement_date date,

    reason text NOT NULL,

    affects_classes boolean NOT NULL
      DEFAULT true,

    counts_as_school_day boolean NOT NULL
      DEFAULT false,

    status text NOT NULL
      DEFAULT 'active',

    created_by uuid,

    updated_by uuid,

    deleted_at timestamptz,

    deleted_by uuid,

    deletion_reason text,

    restored_at timestamptz,

    restored_by uuid,

    restore_reason text,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT school_calendar_exceptions_organization_fkey
      FOREIGN KEY (
        organization_id
      )
      REFERENCES public.organizations(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT school_calendar_exceptions_school_fkey
      FOREIGN KEY (
        school_id
      )
      REFERENCES public.schools(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT school_calendar_exceptions_school_year_fkey
      FOREIGN KEY (
        school_year_id
      )
      REFERENCES public.school_years(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,

    CONSTRAINT school_calendar_exceptions_source_event_fkey
      FOREIGN KEY (
        source_event_id
      )
      REFERENCES public.institutional_calendar_events(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL,

    CONSTRAINT school_calendar_exceptions_mode_check
      CHECK (
        operation_mode IN (
          'open',
          'closed',
          'partial',
          'remote',
          'replacement'
        )
      ),

    CONSTRAINT school_calendar_exceptions_time_check
      CHECK (
        end_time IS NULL
        OR start_time IS NULL
        OR end_time > start_time
      ),

    CONSTRAINT school_calendar_exceptions_replacement_check
      CHECK (
        operation_mode <> 'replacement'
        OR replacement_date IS NOT NULL
      ),

    CONSTRAINT school_calendar_exceptions_status_check
      CHECK (
        status IN (
          'active',
          'cancelled',
          'archived'
        )
      ),

    CONSTRAINT school_calendar_exceptions_soft_delete_check
      CHECK (
        deleted_at IS NULL
        OR (
          deleted_by IS NOT NULL
          AND NULLIF(
            trim(deletion_reason),
            ''
          ) IS NOT NULL
        )
      ),

    CONSTRAINT school_calendar_exceptions_restore_check
      CHECK (
        restored_at IS NULL
        OR (
          restored_by IS NOT NULL
          AND NULLIF(
            trim(restore_reason),
            ''
          ) IS NOT NULL
        )
      )
  );


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_school_calendar_exceptions_unique
ON public.school_calendar_exceptions(
  school_year_id,
  exception_date,
  COALESCE(
    shift_code,
    'general'
  )
)
WHERE deleted_at IS NULL;


CREATE INDEX IF NOT EXISTS
  idx_school_calendar_exceptions_school
ON public.school_calendar_exceptions(
  school_id,
  exception_date
)
WHERE deleted_at IS NULL;


CREATE INDEX IF NOT EXISTS
  idx_school_calendar_exceptions_replacement
ON public.school_calendar_exceptions(
  replacement_date
)
WHERE replacement_date IS NOT NULL
  AND deleted_at IS NULL;


-- =========================================================
-- 7. FUNÇÃO CENTRAL DE UPDATED_AT E AUTORIA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.set_academic_calendar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public,
  auth
AS $$
BEGIN
  IF TG_OP = 'INSERT'
  THEN
    NEW.created_at =
      COALESCE(
        NEW.created_at,
        now()
      );

    NEW.created_by =
      COALESCE(
        NEW.created_by,
        auth.uid()
      );
  END IF;

  NEW.updated_at =
    now();

  NEW.updated_by =
    COALESCE(
      auth.uid(),
      NEW.updated_by
    );

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_school_years_academic_calendar_updated_at
ON public.school_years;

CREATE TRIGGER
  trg_school_years_academic_calendar_updated_at
BEFORE INSERT OR UPDATE
ON public.school_years
FOR EACH ROW
EXECUTE FUNCTION
  public.set_academic_calendar_updated_at();


DROP TRIGGER IF EXISTS
  trg_academic_periods_updated_at
ON public.academic_periods;

CREATE TRIGGER
  trg_academic_periods_updated_at
BEFORE INSERT OR UPDATE
ON public.academic_periods
FOR EACH ROW
EXECUTE FUNCTION
  public.set_academic_calendar_updated_at();


DROP TRIGGER IF EXISTS
  trg_institutional_calendar_events_updated_at
ON public.institutional_calendar_events;

CREATE TRIGGER
  trg_institutional_calendar_events_updated_at
BEFORE INSERT OR UPDATE
ON public.institutional_calendar_events
FOR EACH ROW
EXECUTE FUNCTION
  public.set_academic_calendar_updated_at();


DROP TRIGGER IF EXISTS
  trg_school_operating_hours_updated_at
ON public.school_operating_hours;

CREATE TRIGGER
  trg_school_operating_hours_updated_at
BEFORE INSERT OR UPDATE
ON public.school_operating_hours
FOR EACH ROW
EXECUTE FUNCTION
  public.set_academic_calendar_updated_at();


DROP TRIGGER IF EXISTS
  trg_school_calendar_exceptions_updated_at
ON public.school_calendar_exceptions;

CREATE TRIGGER
  trg_school_calendar_exceptions_updated_at
BEFORE INSERT OR UPDATE
ON public.school_calendar_exceptions
FOR EACH ROW
EXECUTE FUNCTION
  public.set_academic_calendar_updated_at();


-- =========================================================
-- 8. FUNÇÕES DE AUTORIZAÇÃO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.current_user_is_academic_calendar_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public,
  auth
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.user_profiles
          AS profile
        WHERE profile.user_id =
              auth.uid()
          AND lower(
                coalesce(
                  profile.status,
                  ''
                )
              ) = 'active'
          AND lower(
                coalesce(
                  profile.role,
                  ''
                )
              ) IN (
                'platform_admin',
                'super_admin',
                'superadmin',
                'superadministrador'
              )
      )
      OR EXISTS (
        SELECT 1
        FROM public.organization_members
          AS membership
        WHERE membership.user_id =
              auth.uid()
          AND lower(
                coalesce(
                  membership.status,
                  ''
                )
              ) = 'active'
          AND lower(
                coalesce(
                  membership.role,
                  ''
                )
              ) IN (
                'platform_admin',
                'super_admin',
                'superadmin',
                'superadministrador'
              )
          AND (
            membership.access_starts_at
              IS NULL
            OR membership.access_starts_at
               <= now()
          )
          AND (
            membership.access_ends_at
              IS NULL
            OR membership.access_ends_at
               >= now()
          )
      )
    );
$$;


CREATE OR REPLACE FUNCTION
  public.current_user_can_view_academic_calendar(
    target_organization_id uuid,
    target_school_id uuid
  )
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public,
  auth
AS $$
BEGIN
  IF auth.uid() IS NULL
  THEN
    RETURN false;
  END IF;

  IF public
    .current_user_is_academic_calendar_platform_admin()
  THEN
    RETURN true;
  END IF;

  -- Datas oficiais globais podem ser consultadas
  -- por qualquer usuário autenticado.
  IF target_organization_id IS NULL
  THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members
      AS membership
    WHERE membership.user_id =
          auth.uid()

      AND membership.organization_id =
          target_organization_id

      AND lower(
            coalesce(
              membership.status,
              ''
            )
          ) = 'active'

      AND (
        membership.access_starts_at
          IS NULL
        OR membership.access_starts_at
           <= now()
      )

      AND (
        membership.access_ends_at
          IS NULL
        OR membership.access_ends_at
           >= now()
      )

      AND (
        target_school_id IS NULL
        OR membership.school_id IS NULL
        OR membership.school_id =
           target_school_id
      )
  );
END;
$$;


CREATE OR REPLACE FUNCTION
  public.current_user_can_manage_academic_calendar(
    target_organization_id uuid,
    target_school_id uuid
  )
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public,
  auth
AS $$
BEGIN
  IF auth.uid() IS NULL
  THEN
    RETURN false;
  END IF;

  IF public
    .current_user_is_academic_calendar_platform_admin()
  THEN
    RETURN true;
  END IF;

  IF target_organization_id IS NULL
  THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members
      AS membership
    WHERE membership.user_id =
          auth.uid()

      AND membership.organization_id =
          target_organization_id

      AND lower(
            coalesce(
              membership.status,
              ''
            )
          ) = 'active'

      AND (
        membership.access_starts_at
          IS NULL
        OR membership.access_starts_at
           <= now()
      )

      AND (
        membership.access_ends_at
          IS NULL
        OR membership.access_ends_at
           >= now()
      )

      AND (
        (
          lower(
            coalesce(
              membership.role,
              ''
            )
          ) IN (
            'institution_admin',
            'institutional_admin',
            'regional_manager',
            'supervisor'
          )

          AND (
            target_school_id IS NULL
            OR membership.school_id IS NULL
            OR membership.school_id =
               target_school_id
          )
        )

        OR (
          lower(
            coalesce(
              membership.role,
              ''
            )
          ) IN (
            'principal',
            'director',
            'diretor',
            'vice_principal',
            'vice_director',
            'vice_diretor'
          )

          AND target_school_id
              IS NOT NULL

          AND membership.school_id =
              target_school_id
        )
      )
  );
END;
$$;


REVOKE ALL
ON FUNCTION
  public.current_user_is_academic_calendar_platform_admin()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION
  public.current_user_can_view_academic_calendar(
    uuid,
    uuid
  )
FROM PUBLIC;

REVOKE ALL
ON FUNCTION
  public.current_user_can_manage_academic_calendar(
    uuid,
    uuid
  )
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION
  public.current_user_is_academic_calendar_platform_admin()
TO authenticated;

GRANT EXECUTE
ON FUNCTION
  public.current_user_can_view_academic_calendar(
    uuid,
    uuid
  )
TO authenticated;

GRANT EXECUTE
ON FUNCTION
  public.current_user_can_manage_academic_calendar(
    uuid,
    uuid
  )
TO authenticated;


-- =========================================================
-- 9. ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.school_years
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.academic_periods
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.institutional_calendar_events
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.school_operating_hours
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.school_calendar_exceptions
  ENABLE ROW LEVEL SECURITY;


-- SCHOOL YEARS

DROP POLICY IF EXISTS
  school_years_calendar_select
ON public.school_years;

CREATE POLICY
  school_years_calendar_select
ON public.school_years
FOR SELECT
TO authenticated
USING (
  public.current_user_can_view_academic_calendar(
    organization_id,
    school_id
  )
  AND (
    deleted_at IS NULL
    OR public.current_user_can_manage_academic_calendar(
      organization_id,
      school_id
    )
  )
);


DROP POLICY IF EXISTS
  school_years_calendar_insert
ON public.school_years;

CREATE POLICY
  school_years_calendar_insert
ON public.school_years
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  school_years_calendar_update
ON public.school_years;

CREATE POLICY
  school_years_calendar_update
ON public.school_years
FOR UPDATE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  school_years_calendar_delete
ON public.school_years;

CREATE POLICY
  school_years_calendar_delete
ON public.school_years
FOR DELETE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


-- ACADEMIC PERIODS

DROP POLICY IF EXISTS
  academic_periods_select
ON public.academic_periods;

CREATE POLICY
  academic_periods_select
ON public.academic_periods
FOR SELECT
TO authenticated
USING (
  public.current_user_can_view_academic_calendar(
    organization_id,
    school_id
  )
  AND (
    deleted_at IS NULL
    OR public.current_user_can_manage_academic_calendar(
      organization_id,
      school_id
    )
  )
);


DROP POLICY IF EXISTS
  academic_periods_insert
ON public.academic_periods;

CREATE POLICY
  academic_periods_insert
ON public.academic_periods
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  academic_periods_update
ON public.academic_periods;

CREATE POLICY
  academic_periods_update
ON public.academic_periods
FOR UPDATE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  academic_periods_delete
ON public.academic_periods;

CREATE POLICY
  academic_periods_delete
ON public.academic_periods
FOR DELETE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


-- INSTITUTIONAL CALENDAR EVENTS

DROP POLICY IF EXISTS
  institutional_calendar_events_select
ON public.institutional_calendar_events;

CREATE POLICY
  institutional_calendar_events_select
ON public.institutional_calendar_events
FOR SELECT
TO authenticated
USING (
  public.current_user_can_view_academic_calendar(
    organization_id,
    school_id
  )
  AND (
    deleted_at IS NULL
    OR public.current_user_can_manage_academic_calendar(
      organization_id,
      school_id
    )
  )
);


DROP POLICY IF EXISTS
  institutional_calendar_events_insert
ON public.institutional_calendar_events;

CREATE POLICY
  institutional_calendar_events_insert
ON public.institutional_calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  institutional_calendar_events_update
ON public.institutional_calendar_events;

CREATE POLICY
  institutional_calendar_events_update
ON public.institutional_calendar_events
FOR UPDATE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  institutional_calendar_events_delete
ON public.institutional_calendar_events;

CREATE POLICY
  institutional_calendar_events_delete
ON public.institutional_calendar_events
FOR DELETE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


-- SCHOOL OPERATING HOURS

DROP POLICY IF EXISTS
  school_operating_hours_select
ON public.school_operating_hours;

CREATE POLICY
  school_operating_hours_select
ON public.school_operating_hours
FOR SELECT
TO authenticated
USING (
  public.current_user_can_view_academic_calendar(
    organization_id,
    school_id
  )
  AND (
    deleted_at IS NULL
    OR public.current_user_can_manage_academic_calendar(
      organization_id,
      school_id
    )
  )
);


DROP POLICY IF EXISTS
  school_operating_hours_insert
ON public.school_operating_hours;

CREATE POLICY
  school_operating_hours_insert
ON public.school_operating_hours
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  school_operating_hours_update
ON public.school_operating_hours;

CREATE POLICY
  school_operating_hours_update
ON public.school_operating_hours
FOR UPDATE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  school_operating_hours_delete
ON public.school_operating_hours;

CREATE POLICY
  school_operating_hours_delete
ON public.school_operating_hours
FOR DELETE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


-- SCHOOL CALENDAR EXCEPTIONS

DROP POLICY IF EXISTS
  school_calendar_exceptions_select
ON public.school_calendar_exceptions;

CREATE POLICY
  school_calendar_exceptions_select
ON public.school_calendar_exceptions
FOR SELECT
TO authenticated
USING (
  public.current_user_can_view_academic_calendar(
    organization_id,
    school_id
  )
  AND (
    deleted_at IS NULL
    OR public.current_user_can_manage_academic_calendar(
      organization_id,
      school_id
    )
  )
);


DROP POLICY IF EXISTS
  school_calendar_exceptions_insert
ON public.school_calendar_exceptions;

CREATE POLICY
  school_calendar_exceptions_insert
ON public.school_calendar_exceptions
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  school_calendar_exceptions_update
ON public.school_calendar_exceptions;

CREATE POLICY
  school_calendar_exceptions_update
ON public.school_calendar_exceptions
FOR UPDATE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  school_calendar_exceptions_delete
ON public.school_calendar_exceptions;

CREATE POLICY
  school_calendar_exceptions_delete
ON public.school_calendar_exceptions
FOR DELETE
TO authenticated
USING (
  public.current_user_can_manage_academic_calendar(
    organization_id,
    school_id
  )
);


-- =========================================================
-- 10. AUDITORIA CENTRAL
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.audit_academic_calendar_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path =
  pg_catalog,
  public,
  auth
AS $$
DECLARE
  record_data jsonb;

  actor_role_value text;

  record_id_value uuid;

  organization_id_value uuid;

  school_id_value uuid;
BEGIN
  record_data =
    CASE
      WHEN TG_OP = 'DELETE'
        THEN to_jsonb(OLD)

      ELSE to_jsonb(NEW)
    END;

  record_id_value =
    NULLIF(
      record_data ->> 'id',
      ''
    )::uuid;

  organization_id_value =
    NULLIF(
      record_data ->> 'organization_id',
      ''
    )::uuid;

  school_id_value =
    NULLIF(
      record_data ->> 'school_id',
      ''
    )::uuid;

  SELECT
    COALESCE(
      (
        SELECT membership.role
        FROM public.organization_members
          AS membership
        WHERE membership.user_id =
              auth.uid()

          AND lower(
                coalesce(
                  membership.status,
                  ''
                )
              ) = 'active'

          AND (
            membership.access_starts_at
              IS NULL
            OR membership.access_starts_at
               <= now()
          )

          AND (
            membership.access_ends_at
              IS NULL
            OR membership.access_ends_at
               >= now()
          )

        ORDER BY
          membership.hierarchy_level
            DESC,

          membership.created_at
            ASC

        LIMIT 1
      ),

      (
        SELECT profile.role
        FROM public.user_profiles
          AS profile
        WHERE profile.user_id =
              auth.uid()
        LIMIT 1
      ),

      'system'
    )
  INTO actor_role_value;

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
    access_scope,
    before_data,
    after_data,
    metadata,
    occurred_at
  )
  VALUES (
    auth.uid(),
    actor_role_value,
    organization_id_value,
    school_id_value,
    'agenda_edi',
    'institutional_academic_calendar',
    lower(TG_OP),
    TG_TABLE_NAME,
    record_id_value,

    CASE
      WHEN school_id_value IS NOT NULL
        THEN 'school'

      WHEN organization_id_value IS NOT NULL
        THEN 'organization'

      ELSE 'platform'
    END,

    CASE
      WHEN TG_OP IN (
        'UPDATE',
        'DELETE'
      )
        THEN to_jsonb(OLD)

      ELSE NULL
    END,

    CASE
      WHEN TG_OP IN (
        'INSERT',
        'UPDATE'
      )
        THEN to_jsonb(NEW)

      ELSE NULL
    END,

    jsonb_build_object(
      'calendar_core_version',
      'edi-academic-calendar-v1',

      'trigger_operation',
      TG_OP,

      'table_schema',
      TG_TABLE_SCHEMA
    ),

    now()
  );

  IF TG_OP = 'DELETE'
  THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_school_years_academic_calendar_audit
ON public.school_years;

CREATE TRIGGER
  trg_school_years_academic_calendar_audit
AFTER INSERT OR UPDATE OR DELETE
ON public.school_years
FOR EACH ROW
EXECUTE FUNCTION
  public.audit_academic_calendar_change();


DROP TRIGGER IF EXISTS
  trg_academic_periods_audit
ON public.academic_periods;

CREATE TRIGGER
  trg_academic_periods_audit
AFTER INSERT OR UPDATE OR DELETE
ON public.academic_periods
FOR EACH ROW
EXECUTE FUNCTION
  public.audit_academic_calendar_change();


DROP TRIGGER IF EXISTS
  trg_institutional_calendar_events_audit
ON public.institutional_calendar_events;

CREATE TRIGGER
  trg_institutional_calendar_events_audit
AFTER INSERT OR UPDATE OR DELETE
ON public.institutional_calendar_events
FOR EACH ROW
EXECUTE FUNCTION
  public.audit_academic_calendar_change();


DROP TRIGGER IF EXISTS
  trg_school_operating_hours_audit
ON public.school_operating_hours;

CREATE TRIGGER
  trg_school_operating_hours_audit
AFTER INSERT OR UPDATE OR DELETE
ON public.school_operating_hours
FOR EACH ROW
EXECUTE FUNCTION
  public.audit_academic_calendar_change();


DROP TRIGGER IF EXISTS
  trg_school_calendar_exceptions_audit
ON public.school_calendar_exceptions;

CREATE TRIGGER
  trg_school_calendar_exceptions_audit
AFTER INSERT OR UPDATE OR DELETE
ON public.school_calendar_exceptions
FOR EACH ROW
EXECUTE FUNCTION
  public.audit_academic_calendar_change();


-- =========================================================
-- 11. PRIVILÉGIOS
-- =========================================================

GRANT
  SELECT,
  INSERT,
  UPDATE,
  DELETE
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

COMMENT ON TABLE
  public.school_years
IS
  'Anos letivos oficiais por escola, evoluídos para o Calendário Letivo Institucional do EIOS.';


COMMENT ON TABLE
  public.academic_periods
IS
  'Períodos, bimestres, trimestres, semestres ou etapas pertencentes a um ano letivo.';


COMMENT ON TABLE
  public.institutional_calendar_events
IS
  'Datas oficiais, feriados, recessos, formações, avaliações e eventos operacionais distribuídos por escopo institucional.';


COMMENT ON TABLE
  public.school_operating_hours
IS
  'Dias, turnos e horários regulares de funcionamento de cada escola durante um ano letivo.';


COMMENT ON TABLE
  public.school_calendar_exceptions
IS
  'Exceções de funcionamento, fechamentos, operações parciais, atividades remotas e reposições.';


COMMENT ON COLUMN
  public.institutional_calendar_events.scope_level
IS
  'Hierarquia da data: national, state, municipal, network, organization ou school.';


COMMENT ON COLUMN
  public.institutional_calendar_events.date_rule
IS
  'Regra temporal: fixed_annual, year_specific, movable ou conditional.';


COMMENT ON COLUMN
  public.institutional_calendar_events.counts_as_school_day
IS
  'Indica se a data deve ser contabilizada como dia escolar no calendário institucional.';


COMMENT ON COLUMN
  public.institutional_calendar_events.suspends_classes
IS
  'Indica se o evento suspende aulas no período informado.';


COMMENT ON COLUMN
  public.school_operating_hours.weekday
IS
  'Dia da semana no padrão ISO: 1 para segunda-feira e 7 para domingo.';


COMMENT ON FUNCTION
  public.current_user_can_manage_academic_calendar(
    uuid,
    uuid
  )
IS
  'Verifica se o usuário autenticado pode administrar o calendário da organização ou escola informada.';


COMMENT ON FUNCTION
  public.current_user_can_view_academic_calendar(
    uuid,
    uuid
  )
IS
  'Verifica se o usuário autenticado pode consultar o calendário da organização ou escola informada.';


COMMIT;
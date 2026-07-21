BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 26 — SUPPORT REQUESTER CONTEXT FIX
-- =========================================================
--
-- Objetivos:
-- 1. Corrigir a resolução do perfil do solicitante.
-- 2. Impedir que a ausência de vínculo institucional apague
--    o perfil registrado em user_profiles.
-- 3. Preservar corretamente platform_admin e super_admin.
-- 4. Recalcular contexto, prioridade, política e SLA dos
--    chamados existentes.
-- 5. Reavaliar estouros de primeira resposta e solução.
--
-- Esta migração:
-- - não altera perfis de usuários;
-- - não cria vínculos institucionais;
-- - não concede acesso adicional;
-- - não remove chamados ou históricos;
-- - não altera as regras de isolamento da Central de Suporte.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÕES
-- =========================================================

DO $$
BEGIN
  IF to_regclass(
       'public.support_tickets'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.support_tickets.';
  END IF;

  IF to_regclass(
       'public.user_profiles'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.user_profiles.';
  END IF;

  IF to_regclass(
       'public.organization_members'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.organization_members.';
  END IF;

  IF to_regclass(
       'public.plans'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.plans.';
  END IF;

  IF to_regclass(
       'public.subscriptions'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.subscriptions.';
  END IF;

  IF to_regprocedure(
       'public.initialize_support_ticket_management(uuid)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Função obrigatória não encontrada: initialize_support_ticket_management(uuid).';
  END IF;
END;
$$;


-- =========================================================
-- 2. CORREÇÃO DO CONTEXTO DO SOLICITANTE
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.resolve_support_requester_context(
    p_user_id uuid
  )
RETURNS TABLE (
  account_type text,
  requester_role text,
  hierarchy_level integer,
  organization_id uuid,
  school_id uuid,
  plan_code text,
  service_tier text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  profile_role text;

  membership_role text;

  selected_account_type text;

  selected_role text;

  selected_hierarchy integer;

  selected_organization_id uuid;

  selected_school_id uuid;

  selected_plan_code text;

  selected_plan_audience text;

  selected_service_tier text;
BEGIN
  -- -------------------------------------------------------
  -- Perfil funcional principal
  -- -------------------------------------------------------

  SELECT
    lower(
      COALESCE(
        NULLIF(
          trim(
            to_jsonb(profile)
            ->> 'role'
          ),
          ''
        ),
        'teacher'
      )
    )

  INTO profile_role

  FROM public.user_profiles
    AS profile

  WHERE profile.user_id =
        p_user_id

  ORDER BY
    CASE
      WHEN lower(
        COALESCE(
          to_jsonb(profile)
          ->> 'status',
          ''
        )
      ) = 'active'
      THEN 0

      ELSE 1
    END,

    COALESCE(
      (
        to_jsonb(profile)
        ->> 'updated_at'
      )::timestamptz,
      '-infinity'::timestamptz
    ) DESC

  LIMIT 1;


  profile_role :=
    COALESCE(
      profile_role,
      'teacher'
    );


  -- -------------------------------------------------------
  -- Vínculo institucional ativo
  --
  -- membership_role é separado de profile_role para que
  -- uma consulta sem resultados não apague o perfil base.
  -- -------------------------------------------------------

  SELECT
    member.organization_id,

    member.school_id,

    lower(
      NULLIF(
        trim(member.role),
        ''
      )
    ),

    member.hierarchy_level

  INTO
    selected_organization_id,
    selected_school_id,
    membership_role,
    selected_hierarchy

  FROM public.organization_members
    AS member

  WHERE member.user_id =
        p_user_id

    AND lower(
      COALESCE(
        member.status,
        ''
      )
    ) = 'active'

    AND (
      member.access_starts_at
      IS NULL

      OR member.access_starts_at <=
         now()
    )

    AND (
      member.access_ends_at
      IS NULL

      OR member.access_ends_at >=
         now()
    )

  ORDER BY
    member.hierarchy_level DESC,

    member.updated_at DESC

  LIMIT 1;


  -- -------------------------------------------------------
  -- Classificação da conta
  --
  -- Perfis da plataforma prevalecem sobre plano individual
  -- ou ausência de vínculo institucional.
  -- -------------------------------------------------------

  IF profile_role IN (
    'platform_admin',
    'super_admin'
  )
  THEN
    selected_account_type :=
      'platform';

    selected_role :=
      profile_role;

    selected_hierarchy :=
      CASE
        WHEN profile_role =
             'super_admin'
        THEN 100

        ELSE 90
      END;

    selected_organization_id :=
      NULL;

    selected_school_id :=
      NULL;


  ELSIF selected_organization_id
        IS NOT NULL
  THEN
    selected_account_type :=
      'corporate';

    selected_role :=
      COALESCE(
        membership_role,
        profile_role,
        'teacher'
      );

    selected_hierarchy :=
      COALESCE(
        selected_hierarchy,
        10
      );


  ELSE
    selected_account_type :=
      'individual';

    selected_role :=
      profile_role;

    selected_hierarchy :=
      CASE
        WHEN selected_role =
             'student'
        THEN 5

        ELSE 10
      END;
  END IF;


  -- -------------------------------------------------------
  -- Plano institucional
  -- -------------------------------------------------------

  IF selected_account_type =
     'corporate'
  THEN
    SELECT
      plan.code,

      plan.audience_type

    INTO
      selected_plan_code,
      selected_plan_audience

    FROM public.subscriptions
      AS subscription

    INNER JOIN public.plans
      AS plan

      ON plan.id =
         subscription.plan_id

    WHERE subscription.organization_id =
          selected_organization_id

      AND subscription.status IN (
        'trialing',
        'active',
        'past_due'
      )

      AND plan.is_active =
          true

    ORDER BY
      subscription
        .current_period_ends_at
        DESC NULLS LAST,

      subscription.created_at
        DESC

    LIMIT 1;


  -- -------------------------------------------------------
  -- Plano individual
  -- -------------------------------------------------------

  ELSIF selected_account_type =
        'individual'
  THEN
    SELECT
      plan.code,

      plan.audience_type

    INTO
      selected_plan_code,
      selected_plan_audience

    FROM public.subscriptions
      AS subscription

    INNER JOIN public.plans
      AS plan

      ON plan.id =
         subscription.plan_id

    WHERE subscription.user_id =
          p_user_id

      AND subscription.status IN (
        'trialing',
        'active',
        'past_due'
      )

      AND plan.is_active =
          true

    ORDER BY
      subscription
        .current_period_ends_at
        DESC NULLS LAST,

      subscription.created_at
        DESC

    LIMIT 1;


  ELSE
    selected_plan_code :=
      NULL;

    selected_plan_audience :=
      'platform';
  END IF;


  -- -------------------------------------------------------
  -- Nível de serviço
  -- -------------------------------------------------------

  selected_service_tier :=
    CASE
      WHEN selected_account_type =
           'platform'
      THEN
        'platform'

      WHEN selected_account_type =
           'corporate'
           AND (
             selected_plan_audience =
             'network'

             OR selected_role =
                'regional_manager'
           )
      THEN
        'network'

      WHEN selected_account_type =
           'corporate'
      THEN
        'institutional'

      WHEN lower(
        COALESCE(
          selected_plan_code,
          ''
        )
      ) LIKE '%pro%'
      THEN
        'individual_pro'

      ELSE
        'individual_free'
    END;


  RETURN QUERY
  SELECT
    selected_account_type,

    selected_role,

    selected_hierarchy,

    selected_organization_id,

    selected_school_id,

    selected_plan_code,

    selected_service_tier;
END;
$$;


COMMENT ON FUNCTION
  public.resolve_support_requester_context(uuid)
IS
  'Resolve o contexto do solicitante sem perder o perfil base quando não existe vínculo institucional ativo.';


-- =========================================================
-- 3. PROTEÇÃO DAS PERMISSÕES
-- =========================================================

REVOKE ALL
ON FUNCTION
  public.resolve_support_requester_context(uuid)
FROM PUBLIC;


-- Uso interno pelo Core de Suporte.
-- Não é necessário liberar execução direta ao navegador.


-- =========================================================
-- 4. RECÁLCULO DOS CHAMADOS EXISTENTES
-- =========================================================

DO $$
DECLARE
  selected_ticket record;
BEGIN
  FOR selected_ticket IN
    SELECT ticket.id

    FROM public.support_tickets
      AS ticket

    ORDER BY
      ticket.created_at ASC
  LOOP
    PERFORM
      public.initialize_support_ticket_management(
        selected_ticket.id
      );
  END LOOP;
END;
$$;


-- =========================================================
-- 5. REAVALIAÇÃO DOS PRAZOS
-- =========================================================

UPDATE public.support_tickets
SET
  first_response_breached_at =
    CASE
      WHEN first_response_at
           IS NOT NULL

           AND first_response_due_at
               IS NOT NULL

           AND first_response_at >
               first_response_due_at
      THEN
        first_response_due_at

      ELSE
        NULL
    END,

  resolution_breached_at =
    CASE
      WHEN resolution_due_at
           IS NULL
      THEN
        NULL

      WHEN status IN (
        'resolved',
        'closed'
      )
           AND COALESCE(
                 resolved_at,
                 closed_at,
                 updated_at
               )
               >
               resolution_due_at
      THEN
        resolution_due_at

      WHEN status NOT IN (
        'resolved',
        'closed'
      )
           AND sla_clock_status =
               'running'

           AND now() >
               resolution_due_at
      THEN
        resolution_due_at

      ELSE
        NULL
    END,

  last_sla_evaluated_at =
    now();


-- =========================================================
-- 6. VALIDAÇÃO INTERNA DA MIGRAÇÃO
-- =========================================================

DO $$
DECLARE
  invalid_platform_contexts integer;
BEGIN
  SELECT count(*)::integer
  INTO invalid_platform_contexts

  FROM public.support_tickets
    AS ticket

  INNER JOIN public.user_profiles
    AS profile

    ON profile.user_id =
       ticket.requester_user_id

  WHERE lower(
    COALESCE(
      to_jsonb(profile)
      ->> 'role',
      ''
    )
  ) IN (
    'platform_admin',
    'super_admin'
  )

    AND (
      ticket.requester_account_type
      IS DISTINCT FROM
      'platform'

      OR ticket.requester_service_tier
         IS DISTINCT FROM
         'platform'
    );


  IF invalid_platform_contexts > 0
  THEN
    RAISE EXCEPTION
      'A correção terminou com % chamado(s) de administrador ainda fora do contexto platform.',
      invalid_platform_contexts;
  END IF;
END;
$$;


COMMIT;
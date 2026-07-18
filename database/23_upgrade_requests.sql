BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 23 — UPGRADE REQUESTS
-- =========================================================
--
-- Objetivos:
-- 1. Registrar solicitações de upgrade geradas nos produtos.
-- 2. Transformar bloqueios comerciais em oportunidades reais.
-- 3. Preservar o contexto do recurso solicitado.
-- 4. Evitar solicitações abertas duplicadas.
-- 5. Preparar integração futura com checkout e BackOffice.
--
-- Fluxo inicial:
--
-- Recurso bloqueado
--        ↓
-- Página /upgrade
--        ↓
-- Solicitação autenticada
--        ↓
-- Registro em upgrade_requests
--        ↓
-- Atendimento comercial / checkout futuro
--
-- Esta migração:
-- - não altera assinaturas;
-- - não concede acesso a recursos;
-- - não realiza cobrança;
-- - não altera planos;
-- - não expõe dados de outros usuários.
-- =========================================================


-- =========================================================
-- 1. EXTENSÃO
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- 2. VALIDAÇÃO DO NÚCLEO COMERCIAL
-- =========================================================

DO $$
BEGIN
  IF to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: auth.users.';
  END IF;


  IF to_regclass('public.user_profiles') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.user_profiles.';
  END IF;


  IF to_regclass('public.plans') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.plans.';
  END IF;


  IF to_regclass('public.features') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.features.';
  END IF;


  IF to_regclass('public.subscriptions') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.subscriptions.';
  END IF;


  IF NOT EXISTS (
    SELECT 1

    FROM public.plans

    WHERE lower(code) =
          'edi_professor_pro'

      AND is_active = true

      AND is_free = false
  ) THEN
    RAISE EXCEPTION
      'O plano ativo edi_professor_pro não foi encontrado.';
  END IF;
END;
$$;


-- =========================================================
-- 3. TABELA DE SOLICITAÇÕES DE UPGRADE
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.upgrade_requests (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    organization_id uuid,

    school_id uuid,

    current_plan_id uuid
      REFERENCES public.plans(id)
      ON DELETE SET NULL,

    current_plan_code text,

    current_plan_name text,

    requested_plan_id uuid NOT NULL
      REFERENCES public.plans(id)
      ON DELETE RESTRICT,

    requested_plan_code text NOT NULL,

    requested_plan_name text NOT NULL,

    feature_id uuid
      REFERENCES public.features(id)
      ON DELETE SET NULL,

    feature_code text,

    feature_name text,

    source_product text NOT NULL
      DEFAULT 'agenda_edi',

    source_module text,

    source_path text,

    source_context jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    contact_name text,

    contact_email text,

    contact_phone text,

    contact_preference text NOT NULL
      DEFAULT 'email',

    commercial_contact_consent boolean NOT NULL
      DEFAULT false,

    consented_at timestamptz,

    consent_version text NOT NULL
      DEFAULT 'v1.0',

    privacy_notice_version text NOT NULL
      DEFAULT 'v1.0',

    status text NOT NULL
      DEFAULT 'requested',

    request_count integer NOT NULL
      DEFAULT 1,

    first_requested_at timestamptz NOT NULL
      DEFAULT now(),

    last_requested_at timestamptz NOT NULL
      DEFAULT now(),

    status_changed_at timestamptz NOT NULL
      DEFAULT now(),

    contacted_at timestamptz,

    qualified_at timestamptz,

    proposal_sent_at timestamptz,

    approved_at timestamptz,

    resolved_at timestamptz,

    converted_at timestamptz,

    converted_subscription_id uuid
      REFERENCES public.subscriptions(id)
      ON DELETE SET NULL,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      upgrade_requests_status_check
    CHECK (
      status IN (
        'requested',
        'contact_pending',
        'contacted',
        'qualified',
        'proposal_sent',
        'approved',
        'converted',
        'rejected',
        'canceled'
      )
    ),

    CONSTRAINT
      upgrade_requests_contact_preference_check
    CHECK (
      contact_preference IN (
        'email',
        'phone',
        'whatsapp',
        'no_preference'
      )
    ),

    CONSTRAINT
      upgrade_requests_request_count_check
    CHECK (
      request_count >= 1
    ),

    CONSTRAINT
      upgrade_requests_source_product_check
    CHECK (
      length(
        trim(source_product)
      ) > 0
    ),

    CONSTRAINT
      upgrade_requests_requested_plan_code_check
    CHECK (
      length(
        trim(requested_plan_code)
      ) > 0
    ),

    CONSTRAINT
      upgrade_requests_contact_check
    CHECK (
      contact_email IS NOT NULL
      OR contact_phone IS NOT NULL
    ),

    CONSTRAINT
      upgrade_requests_consent_check
    CHECK (
      commercial_contact_consent = true
      AND consented_at IS NOT NULL
    ),

    CONSTRAINT
      upgrade_requests_source_context_check
    CHECK (
      jsonb_typeof(source_context) =
      'object'
    ),

    CONSTRAINT
      upgrade_requests_metadata_check
    CHECK (
      jsonb_typeof(metadata) =
      'object'
    ),

    CONSTRAINT
      upgrade_requests_dates_check
    CHECK (
      last_requested_at >=
      first_requested_at
    )
  );


COMMENT ON TABLE
  public.upgrade_requests
IS
  'Solicitações comerciais de upgrade originadas por recursos bloqueados ou páginas comerciais da Plataforma EduData IA.';


COMMENT ON COLUMN
  public.upgrade_requests.current_plan_code
IS
  'Código do plano atual no momento da solicitação.';


COMMENT ON COLUMN
  public.upgrade_requests.requested_plan_code
IS
  'Código do plano recomendado ou solicitado pelo usuário.';


COMMENT ON COLUMN
  public.upgrade_requests.feature_code
IS
  'Código do recurso que originou a oportunidade comercial.';


COMMENT ON COLUMN
  public.upgrade_requests.source_product
IS
  'Produto da plataforma em que a solicitação foi iniciada.';


COMMENT ON COLUMN
  public.upgrade_requests.source_context
IS
  'Contexto técnico e comercial não sensível da origem da solicitação.';


COMMENT ON COLUMN
  public.upgrade_requests.request_count
IS
  'Quantidade de vezes que o usuário demonstrou interesse na mesma oportunidade aberta.';


-- =========================================================
-- 4. ÍNDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS
  idx_upgrade_requests_user

ON public.upgrade_requests(
  user_id,
  created_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_upgrade_requests_status

ON public.upgrade_requests(
  status,
  last_requested_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_upgrade_requests_requested_plan

ON public.upgrade_requests(
  requested_plan_id,
  status
);


CREATE INDEX IF NOT EXISTS
  idx_upgrade_requests_feature

ON public.upgrade_requests(
  feature_id,
  status
);


CREATE INDEX IF NOT EXISTS
  idx_upgrade_requests_source

ON public.upgrade_requests(
  source_product,
  source_module,
  created_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_upgrade_requests_contact_email

ON public.upgrade_requests(
  lower(contact_email)
)

WHERE contact_email IS NOT NULL;


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_upgrade_requests_open_unique

ON public.upgrade_requests(
  user_id,
  requested_plan_id,

  COALESCE(
    feature_id,
    '00000000-0000-0000-0000-000000000000'
      ::uuid
  ),

  source_product
)

WHERE user_id IS NOT NULL

  AND status IN (
    'requested',
    'contact_pending',
    'contacted',
    'qualified',
    'proposal_sent',
    'approved'
  );


-- =========================================================
-- 5. INTEGRIDADE AUTOMÁTICA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.enforce_upgrade_request_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  requested_code text;
  requested_name text;
  requested_is_active boolean;
  requested_is_free boolean;

  current_code text;
  current_name text;

  selected_feature_code text;
  selected_feature_name text;
BEGIN
  SELECT
    lower(code),
    name,
    is_active,
    is_free

  INTO
    requested_code,
    requested_name,
    requested_is_active,
    requested_is_free

  FROM public.plans

  WHERE id =
        NEW.requested_plan_id;


  IF NOT FOUND THEN
    RAISE EXCEPTION
      'O plano solicitado não foi encontrado.';
  END IF;


  IF requested_is_active
     IS DISTINCT FROM true
  THEN
    RAISE EXCEPTION
      'O plano solicitado não está ativo.';
  END IF;


  IF requested_is_free
     IS DISTINCT FROM false
  THEN
    RAISE EXCEPTION
      'Uma solicitação de upgrade precisa apontar para um plano pago.';
  END IF;


  NEW.requested_plan_code :=
    requested_code;

  NEW.requested_plan_name :=
    requested_name;


  IF NEW.current_plan_id IS NOT NULL THEN
    SELECT
      lower(code),
      name

    INTO
      current_code,
      current_name

    FROM public.plans

    WHERE id =
          NEW.current_plan_id;


    IF NOT FOUND THEN
      RAISE EXCEPTION
        'O plano atual informado não foi encontrado.';
    END IF;


    NEW.current_plan_code :=
      current_code;

    NEW.current_plan_name :=
      current_name;

  ELSE
    NEW.current_plan_code :=
      NULL;

    NEW.current_plan_name :=
      NULL;
  END IF;


  IF NEW.feature_id IS NOT NULL THEN
    SELECT
      lower(code),
      name

    INTO
      selected_feature_code,
      selected_feature_name

    FROM public.features

    WHERE id =
          NEW.feature_id;


    IF NOT FOUND THEN
      RAISE EXCEPTION
        'O recurso solicitado não foi encontrado.';
    END IF;


    NEW.feature_code :=
      selected_feature_code;

    NEW.feature_name :=
      selected_feature_name;

  ELSE
    NEW.feature_code :=
      NULL;

    NEW.feature_name :=
      NULL;
  END IF;


  IF NEW.commercial_contact_consent
     IS DISTINCT FROM true
  THEN
    RAISE EXCEPTION
      'O consentimento para contato comercial é obrigatório.';
  END IF;


  NEW.consented_at :=
    COALESCE(
      NEW.consented_at,
      now()
    );


  IF TG_OP = 'INSERT' THEN
    NEW.first_requested_at :=
      COALESCE(
        NEW.first_requested_at,
        now()
      );

    NEW.last_requested_at :=
      COALESCE(
        NEW.last_requested_at,
        NEW.first_requested_at,
        now()
      );

    NEW.status_changed_at :=
      COALESCE(
        NEW.status_changed_at,
        now()
      );

  ELSE
    IF NEW.status IS DISTINCT
       FROM OLD.status
    THEN
      NEW.status_changed_at :=
        now();


      IF NEW.status IN (
        'converted',
        'rejected',
        'canceled'
      ) THEN
        NEW.resolved_at :=
          COALESCE(
            NEW.resolved_at,
            now()
          );
      END IF;


      IF NEW.status = 'contacted' THEN
        NEW.contacted_at :=
          COALESCE(
            NEW.contacted_at,
            now()
          );
      END IF;


      IF NEW.status = 'qualified' THEN
        NEW.qualified_at :=
          COALESCE(
            NEW.qualified_at,
            now()
          );
      END IF;


      IF NEW.status =
         'proposal_sent'
      THEN
        NEW.proposal_sent_at :=
          COALESCE(
            NEW.proposal_sent_at,
            now()
          );
      END IF;


      IF NEW.status = 'approved' THEN
        NEW.approved_at :=
          COALESCE(
            NEW.approved_at,
            now()
          );
      END IF;


      IF NEW.status = 'converted' THEN
        NEW.converted_at :=
          COALESCE(
            NEW.converted_at,
            now()
          );
      END IF;
    END IF;
  END IF;


  NEW.source_context :=
    COALESCE(
      NEW.source_context,
      '{}'::jsonb
    );


  NEW.metadata :=
    COALESCE(
      NEW.metadata,
      '{}'::jsonb
    );


  NEW.updated_at :=
    now();


  RETURN NEW;
END;
$$;


COMMENT ON FUNCTION
  public.enforce_upgrade_request_integrity()
IS
  'Normaliza planos, recursos, consentimento, estados e datas das solicitações de upgrade.';


REVOKE ALL
ON FUNCTION
  public.enforce_upgrade_request_integrity()
FROM PUBLIC;


DROP TRIGGER IF EXISTS
  trg_enforce_upgrade_request_integrity

ON public.upgrade_requests;


CREATE TRIGGER
  trg_enforce_upgrade_request_integrity

BEFORE INSERT OR UPDATE
ON public.upgrade_requests

FOR EACH ROW

EXECUTE FUNCTION
  public.enforce_upgrade_request_integrity();


-- =========================================================
-- 6. FUNÇÃO AUTENTICADA DE REGISTRO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.register_upgrade_request(
    p_requested_plan_code text,

    p_feature_code text
      DEFAULT NULL,

    p_source_product text
      DEFAULT 'agenda_edi',

    p_source_module text
      DEFAULT NULL,

    p_source_path text
      DEFAULT NULL,

    p_contact_preference text
      DEFAULT 'email',

    p_contact_email text
      DEFAULT NULL,

    p_contact_phone text
      DEFAULT NULL,

    p_commercial_contact_consent boolean
      DEFAULT false,

    p_source_context jsonb
      DEFAULT '{}'::jsonb
  )
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  acting_user_id uuid;

  auth_email text;

  profile_display_name text;
  profile_phone text;

  normalized_requested_plan_code text;
  normalized_feature_code text;

  normalized_source_product text;
  normalized_source_module text;
  normalized_source_path text;

  normalized_contact_preference text;
  normalized_contact_email text;
  normalized_contact_phone text;

  normalized_source_context jsonb;

  requested_plan_id_value uuid;
  requested_plan_code_value text;
  requested_plan_name_value text;

  feature_id_value uuid;
  feature_code_value text;
  feature_name_value text;

  current_plan_id_value uuid;
  current_plan_code_value text;
  current_plan_name_value text;

  existing_request_id uuid;
  created_request_id uuid;
BEGIN
  acting_user_id :=
    auth.uid();


  IF acting_user_id IS NULL THEN
    RAISE EXCEPTION
      'Usuário não autenticado.';
  END IF;


  IF p_commercial_contact_consent
     IS DISTINCT FROM true
  THEN
    RAISE EXCEPTION
      'Confirme a autorização para contato sobre o upgrade.';
  END IF;


  normalized_requested_plan_code :=
    lower(
      trim(
        COALESCE(
          p_requested_plan_code,
          ''
        )
      )
    );


  IF normalized_requested_plan_code = '' THEN
    RAISE EXCEPTION
      'Informe o plano solicitado.';
  END IF;


  normalized_feature_code :=
    NULLIF(
      lower(
        trim(
          COALESCE(
            p_feature_code,
            ''
          )
        )
      ),
      ''
    );


  normalized_source_product :=
    COALESCE(
      NULLIF(
        lower(
          trim(
            COALESCE(
              p_source_product,
              ''
            )
          )
        ),
        ''
      ),
      'agenda_edi'
    );


  normalized_source_module :=
    NULLIF(
      lower(
        trim(
          COALESCE(
            p_source_module,
            ''
          )
        )
      ),
      ''
    );


  normalized_source_path :=
    NULLIF(
      trim(
        COALESCE(
          p_source_path,
          ''
        )
      ),
      ''
    );


  normalized_contact_preference :=
    lower(
      trim(
        COALESCE(
          p_contact_preference,
          'email'
        )
      )
    );


  IF normalized_contact_preference
     NOT IN (
       'email',
       'phone',
       'whatsapp',
       'no_preference'
     )
  THEN
    RAISE EXCEPTION
      'Preferência de contato inválida.';
  END IF;


  normalized_source_context :=
    COALESCE(
      p_source_context,
      '{}'::jsonb
    );


  IF jsonb_typeof(
    normalized_source_context
  ) <> 'object'
  THEN
    RAISE EXCEPTION
      'O contexto da solicitação precisa ser um objeto JSON.';
  END IF;


  SELECT email
  INTO auth_email

  FROM auth.users

  WHERE id =
        acting_user_id;


  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Usuário autenticado não encontrado.';
  END IF;


  SELECT
    display_name,
    phone

  INTO
    profile_display_name,
    profile_phone

  FROM public.user_profiles

  WHERE user_id =
        acting_user_id

  LIMIT 1;


  normalized_contact_email :=
    COALESCE(
      NULLIF(
        lower(
          trim(
            COALESCE(
              p_contact_email,
              ''
            )
          )
        ),
        ''
      ),

      NULLIF(
        lower(
          trim(
            COALESCE(
              auth_email,
              ''
            )
          )
        ),
        ''
      )
    );


  normalized_contact_phone :=
    COALESCE(
      NULLIF(
        trim(
          COALESCE(
            p_contact_phone,
            ''
          )
        ),
        ''
      ),

      NULLIF(
        trim(
          COALESCE(
            profile_phone,
            ''
          )
        ),
        ''
      )
    );


  IF normalized_contact_email IS NULL
     AND normalized_contact_phone IS NULL
  THEN
    RAISE EXCEPTION
      'Não foi encontrado e-mail ou telefone para contato.';
  END IF;


  IF normalized_contact_preference =
     'email'

     AND normalized_contact_email
         IS NULL
  THEN
    RAISE EXCEPTION
      'Informe um e-mail para contato.';
  END IF;


  IF normalized_contact_preference IN (
    'phone',
    'whatsapp'
  )

  AND normalized_contact_phone IS NULL
  THEN
    RAISE EXCEPTION
      'Informe um telefone para contato.';
  END IF;


  SELECT
    id,
    lower(code),
    name

  INTO
    requested_plan_id_value,
    requested_plan_code_value,
    requested_plan_name_value

  FROM public.plans

  WHERE lower(code) =
        normalized_requested_plan_code

    AND is_active = true

    AND is_free = false

  ORDER BY
    sort_order ASC,
    created_at ASC

  LIMIT 1;


  IF requested_plan_id_value IS NULL THEN
    RAISE EXCEPTION
      'O plano solicitado não está disponível para upgrade.';
  END IF;


  IF normalized_feature_code
     IS NOT NULL
  THEN
    SELECT
      id,
      lower(code),
      name

    INTO
      feature_id_value,
      feature_code_value,
      feature_name_value

    FROM public.features

    WHERE lower(code) =
          normalized_feature_code

      AND is_active = true

    ORDER BY
      created_at ASC

    LIMIT 1;


    IF feature_id_value IS NULL THEN
      RAISE EXCEPTION
        'O recurso solicitado não foi encontrado.';
    END IF;
  END IF;


  SELECT
    plan_record.id,
    lower(plan_record.code),
    plan_record.name

  INTO
    current_plan_id_value,
    current_plan_code_value,
    current_plan_name_value

  FROM public.subscriptions
    AS subscription

  INNER JOIN public.plans
    AS plan_record
    ON plan_record.id =
       subscription.plan_id

  WHERE subscription.user_id =
        acting_user_id

    AND subscription.organization_id
        IS NULL

    AND subscription.status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'incomplete'
    )

    AND plan_record.is_active = true

  ORDER BY
    plan_record.sort_order DESC,
    subscription.created_at DESC

  LIMIT 1;


  IF current_plan_id_value =
     requested_plan_id_value
  THEN
    RAISE EXCEPTION
      'O usuário já possui o plano solicitado.';
  END IF;


  UPDATE public.upgrade_requests
    AS upgrade_request

  SET
    current_plan_id =
      current_plan_id_value,

    current_plan_code =
      current_plan_code_value,

    current_plan_name =
      current_plan_name_value,

    requested_plan_code =
      requested_plan_code_value,

    requested_plan_name =
      requested_plan_name_value,

    feature_code =
      feature_code_value,

    feature_name =
      feature_name_value,

    source_module =
      normalized_source_module,

    source_path =
      normalized_source_path,

    source_context =
      COALESCE(
        upgrade_request.source_context,
        '{}'::jsonb
      ) || normalized_source_context,

    contact_name =
      COALESCE(
        NULLIF(
          trim(
            profile_display_name
          ),
          ''
        ),

        upgrade_request.contact_name
      ),

    contact_email =
      normalized_contact_email,

    contact_phone =
      normalized_contact_phone,

    contact_preference =
      normalized_contact_preference,

    commercial_contact_consent =
      true,

    consented_at =
      now(),

    request_count =
      upgrade_request.request_count + 1,

    last_requested_at =
      now(),

    metadata =
      COALESCE(
        upgrade_request.metadata,
        '{}'::jsonb
      ) || jsonb_build_object(
        'last_registration',
        'authenticated_rpc',

        'last_feature_code',
        feature_code_value,

        'last_source_path',
        normalized_source_path
      ),

    updated_at =
      now()

  WHERE upgrade_request.user_id =
        acting_user_id

    AND upgrade_request.requested_plan_id =
        requested_plan_id_value

    AND upgrade_request.feature_id
        IS NOT DISTINCT FROM
        feature_id_value

    AND upgrade_request.source_product =
        normalized_source_product

    AND upgrade_request.status IN (
      'requested',
      'contact_pending',
      'contacted',
      'qualified',
      'proposal_sent',
      'approved'
    )

  RETURNING id
  INTO existing_request_id;


  IF existing_request_id IS NOT NULL THEN
    RETURN existing_request_id;
  END IF;


  INSERT INTO public.upgrade_requests (
    user_id,

    current_plan_id,
    current_plan_code,
    current_plan_name,

    requested_plan_id,
    requested_plan_code,
    requested_plan_name,

    feature_id,
    feature_code,
    feature_name,

    source_product,
    source_module,
    source_path,
    source_context,

    contact_name,
    contact_email,
    contact_phone,
    contact_preference,

    commercial_contact_consent,
    consented_at,
    consent_version,
    privacy_notice_version,

    status,
    request_count,

    first_requested_at,
    last_requested_at,
    status_changed_at,

    metadata,

    created_at,
    updated_at
  )
  VALUES (
    acting_user_id,

    current_plan_id_value,
    current_plan_code_value,
    current_plan_name_value,

    requested_plan_id_value,
    requested_plan_code_value,
    requested_plan_name_value,

    feature_id_value,
    feature_code_value,
    feature_name_value,

    normalized_source_product,
    normalized_source_module,
    normalized_source_path,
    normalized_source_context,

    profile_display_name,
    normalized_contact_email,
    normalized_contact_phone,
    normalized_contact_preference,

    true,
    now(),
    'v1.0',
    'v1.0',

    'requested',
    1,

    now(),
    now(),
    now(),

    jsonb_build_object(
      'registration',
      'authenticated_rpc',

      'recommended_plan',
      requested_plan_code_value,

      'origin_feature',
      feature_code_value
    ),

    now(),
    now()
  )

  ON CONFLICT DO NOTHING

  RETURNING id
  INTO created_request_id;


  IF created_request_id IS NOT NULL THEN
    RETURN created_request_id;
  END IF;


  UPDATE public.upgrade_requests
    AS upgrade_request

  SET
    request_count =
      upgrade_request.request_count + 1,

    last_requested_at =
      now(),

    contact_email =
      normalized_contact_email,

    contact_phone =
      normalized_contact_phone,

    contact_preference =
      normalized_contact_preference,

    source_module =
      normalized_source_module,

    source_path =
      normalized_source_path,

    source_context =
      COALESCE(
        upgrade_request.source_context,
        '{}'::jsonb
      ) || normalized_source_context,

    commercial_contact_consent =
      true,

    consented_at =
      now(),

    updated_at =
      now()

  WHERE upgrade_request.user_id =
        acting_user_id

    AND upgrade_request.requested_plan_id =
        requested_plan_id_value

    AND upgrade_request.feature_id
        IS NOT DISTINCT FROM
        feature_id_value

    AND upgrade_request.source_product =
        normalized_source_product

    AND upgrade_request.status IN (
      'requested',
      'contact_pending',
      'contacted',
      'qualified',
      'proposal_sent',
      'approved'
    )

  RETURNING id
  INTO existing_request_id;


  IF existing_request_id IS NULL THEN
    RAISE EXCEPTION
      'Não foi possível registrar a solicitação de upgrade.';
  END IF;


  RETURN existing_request_id;
END;
$$;


COMMENT ON FUNCTION
  public.register_upgrade_request(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    boolean,
    jsonb
  )
IS
  'Registra ou atualiza uma solicitação autenticada de upgrade, preservando plano, recurso, origem e consentimento comercial.';


-- =========================================================
-- 7. SEGURANÇA DA FUNÇÃO
-- =========================================================

REVOKE ALL
ON FUNCTION
  public.register_upgrade_request(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    boolean,
    jsonb
  )
FROM PUBLIC;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1

    FROM pg_roles

    WHERE rolname =
      'authenticated'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.register_upgrade_request(text, text, text, text, text, text, text, text, boolean, jsonb) TO authenticated';
  END IF;


  IF EXISTS (
    SELECT 1

    FROM pg_roles

    WHERE rolname =
      'service_role'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.register_upgrade_request(text, text, text, text, text, text, text, text, boolean, jsonb) TO service_role';
  END IF;


  IF EXISTS (
    SELECT 1

    FROM pg_roles

    WHERE rolname =
      'postgres'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.register_upgrade_request(text, text, text, text, text, text, text, text, boolean, jsonb) TO postgres';
  END IF;
END;
$$;


-- =========================================================
-- 8. ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.upgrade_requests
  ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  upgrade_requests_select_own

ON public.upgrade_requests;


CREATE POLICY
  upgrade_requests_select_own

ON public.upgrade_requests

FOR SELECT

TO authenticated

USING (
  user_id = auth.uid()
);


-- O usuário não insere diretamente na tabela.
-- Toda solicitação passa pela função autenticada,
-- que valida plano, recurso, contexto e consentimento.

REVOKE ALL
ON TABLE public.upgrade_requests
FROM anon;


REVOKE ALL
ON TABLE public.upgrade_requests
FROM authenticated;


GRANT SELECT
ON TABLE public.upgrade_requests
TO authenticated;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1

    FROM pg_roles

    WHERE rolname =
      'service_role'
  ) THEN
    EXECUTE
      'GRANT ALL ON TABLE public.upgrade_requests TO service_role';
  END IF;


  IF EXISTS (
    SELECT 1

    FROM pg_roles

    WHERE rolname =
      'postgres'
  ) THEN
    EXECUTE
      'GRANT ALL ON TABLE public.upgrade_requests TO postgres';
  END IF;
END;
$$;


-- =========================================================
-- 9. VALIDAÇÃO FINAL
-- =========================================================

DO $$
DECLARE
  rls_enabled boolean;
  open_duplicates integer;
BEGIN
  IF to_regclass(
    'public.upgrade_requests'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A tabela upgrade_requests não foi criada.';
  END IF;


  IF to_regprocedure(
    'public.register_upgrade_request(text,text,text,text,text,text,text,text,boolean,jsonb)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função register_upgrade_request não foi criada.';
  END IF;


  IF to_regprocedure(
    'public.enforce_upgrade_request_integrity()'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função de integridade das solicitações não foi criada.';
  END IF;


  IF to_regclass(
    'public.idx_upgrade_requests_open_unique'
  ) IS NULL THEN
    RAISE EXCEPTION
      'O índice de oportunidades abertas não foi criado.';
  END IF;


  IF NOT EXISTS (
    SELECT 1

    FROM pg_trigger

    WHERE tgname =
      'trg_enforce_upgrade_request_integrity'

      AND tgisinternal = false
  ) THEN
    RAISE EXCEPTION
      'O trigger de integridade das solicitações não foi criado.';
  END IF;


  SELECT relrowsecurity
  INTO rls_enabled

  FROM pg_class

  WHERE oid =
    'public.upgrade_requests'
      ::regclass;


  IF rls_enabled
     IS DISTINCT FROM true
  THEN
    RAISE EXCEPTION
      'RLS não foi habilitado em upgrade_requests.';
  END IF;


  IF NOT EXISTS (
    SELECT 1

    FROM pg_policies

    WHERE schemaname =
      'public'

      AND tablename =
      'upgrade_requests'

      AND policyname =
      'upgrade_requests_select_own'
  ) THEN
    RAISE EXCEPTION
      'A política de leitura do próprio usuário não foi criada.';
  END IF;


  SELECT count(*)
  INTO open_duplicates

  FROM (
    SELECT
      user_id,
      requested_plan_id,

      COALESCE(
        feature_id,
        '00000000-0000-0000-0000-000000000000'
          ::uuid
      ) AS normalized_feature_id,

      source_product

    FROM public.upgrade_requests

    WHERE user_id IS NOT NULL

      AND status IN (
        'requested',
        'contact_pending',
        'contacted',
        'qualified',
        'proposal_sent',
        'approved'
      )

    GROUP BY
      user_id,
      requested_plan_id,

      COALESCE(
        feature_id,
        '00000000-0000-0000-0000-000000000000'
          ::uuid
      ),

      source_product

    HAVING count(*) > 1
  ) AS duplicates;


  IF open_duplicates <> 0 THEN
    RAISE EXCEPTION
      'Existem oportunidades comerciais abertas duplicadas.';
  END IF;
END;
$$;


COMMIT;
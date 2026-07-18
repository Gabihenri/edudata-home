BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 17 — COMMERCIAL CORE
-- =========================================================
--
-- Objetivos:
-- 1. Criar o núcleo comercial compartilhado da plataforma.
-- 2. Separar perfil funcional de plano comercial.
-- 3. Suportar assinaturas individuais e institucionais.
-- 4. Preparar controle de recursos, cotas e licenças.
-- 5. Preparar integração futura com provedores de pagamento.
-- 6. Manter compatibilidade com auth.users e organizations.
--
-- Esta migração NÃO:
-- - define preços oficiais;
-- - cria checkout;
-- - processa pagamentos;
-- - cria políticas RLS definitivas;
-- - concede acesso automaticamente.
--
-- Esses itens serão tratados nas próximas migrações.
-- =========================================================


-- =========================================================
-- 1. EXTENSÕES E VALIDAÇÕES INICIAIS
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE EXCEPTION
      'A tabela public.organizations não existe. Execute primeiro as migrações institucionais da EduData IA.';
  END IF;
END;
$$;


-- =========================================================
-- 2. PLANOS COMERCIAIS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL,
  name text NOT NULL,
  description text,

  audience_type text NOT NULL DEFAULT 'individual',
  billing_model text NOT NULL DEFAULT 'subscription',

  currency text NOT NULL DEFAULT 'BRL',

  monthly_price_cents integer,
  annual_price_cents integer,
  setup_price_cents integer,

  trial_days integer NOT NULL DEFAULT 0,

  minimum_seats integer,
  maximum_seats integer,

  is_public boolean NOT NULL DEFAULT true,
  is_free boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,

  sort_order integer NOT NULL DEFAULT 0,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT plans_code_not_empty_check
  CHECK (
    length(trim(code)) > 0
  ),

  CONSTRAINT plans_name_not_empty_check
  CHECK (
    length(trim(name)) > 0
  ),

  CONSTRAINT plans_audience_type_check
  CHECK (
    audience_type IN (
      'individual',
      'institutional',
      'network',
      'platform'
    )
  ),

  CONSTRAINT plans_billing_model_check
  CHECK (
    billing_model IN (
      'free',
      'subscription',
      'license',
      'contract',
      'custom'
    )
  ),

  CONSTRAINT plans_currency_check
  CHECK (
    currency ~ '^[A-Z]{3}$'
  ),

  CONSTRAINT plans_monthly_price_check
  CHECK (
    monthly_price_cents IS NULL
    OR monthly_price_cents >= 0
  ),

  CONSTRAINT plans_annual_price_check
  CHECK (
    annual_price_cents IS NULL
    OR annual_price_cents >= 0
  ),

  CONSTRAINT plans_setup_price_check
  CHECK (
    setup_price_cents IS NULL
    OR setup_price_cents >= 0
  ),

  CONSTRAINT plans_trial_days_check
  CHECK (
    trial_days >= 0
  ),

  CONSTRAINT plans_minimum_seats_check
  CHECK (
    minimum_seats IS NULL
    OR minimum_seats >= 1
  ),

  CONSTRAINT plans_maximum_seats_check
  CHECK (
    maximum_seats IS NULL
    OR maximum_seats >= 1
  ),

  CONSTRAINT plans_seat_range_check
  CHECK (
    maximum_seats IS NULL
    OR minimum_seats IS NULL
    OR maximum_seats >= minimum_seats
  )
);


CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_code_unique
  ON public.plans(lower(code));


CREATE INDEX IF NOT EXISTS idx_plans_audience_type
  ON public.plans(audience_type);


CREATE INDEX IF NOT EXISTS idx_plans_active
  ON public.plans(is_active);


CREATE INDEX IF NOT EXISTS idx_plans_public
  ON public.plans(is_public);


CREATE INDEX IF NOT EXISTS idx_plans_sort_order
  ON public.plans(sort_order);


-- =========================================================
-- 3. RECURSOS COMERCIAIS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL,
  name text NOT NULL,
  description text,

  product_code text NOT NULL DEFAULT 'core',
  category text NOT NULL DEFAULT 'general',

  value_type text NOT NULL DEFAULT 'boolean',
  unit_name text,

  is_security_feature boolean NOT NULL DEFAULT false,
  is_privacy_feature boolean NOT NULL DEFAULT false,
  is_accessibility_feature boolean NOT NULL DEFAULT false,

  is_active boolean NOT NULL DEFAULT true,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT features_code_not_empty_check
  CHECK (
    length(trim(code)) > 0
  ),

  CONSTRAINT features_name_not_empty_check
  CHECK (
    length(trim(name)) > 0
  ),

  CONSTRAINT features_product_code_not_empty_check
  CHECK (
    length(trim(product_code)) > 0
  ),

  CONSTRAINT features_value_type_check
  CHECK (
    value_type IN (
      'boolean',
      'integer',
      'decimal',
      'text',
      'json'
    )
  )
);


CREATE UNIQUE INDEX IF NOT EXISTS idx_features_code_unique
  ON public.features(lower(code));


CREATE INDEX IF NOT EXISTS idx_features_product_code
  ON public.features(product_code);


CREATE INDEX IF NOT EXISTS idx_features_category
  ON public.features(category);


CREATE INDEX IF NOT EXISTS idx_features_active
  ON public.features(is_active);


-- =========================================================
-- 4. DIREITOS DE CADA PLANO
-- =========================================================

CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  plan_id uuid NOT NULL
    REFERENCES public.plans(id)
    ON DELETE CASCADE,

  feature_id uuid NOT NULL
    REFERENCES public.features(id)
    ON DELETE CASCADE,

  is_enabled boolean NOT NULL DEFAULT false,

  limit_value numeric,
  text_value text,
  json_value jsonb,

  reset_period text NOT NULL DEFAULT 'none',

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT plan_entitlements_reset_period_check
  CHECK (
    reset_period IN (
      'none',
      'daily',
      'weekly',
      'monthly',
      'annual',
      'lifetime'
    )
  ),

  CONSTRAINT plan_entitlements_limit_value_check
  CHECK (
    limit_value IS NULL
    OR limit_value >= 0
  ),

  CONSTRAINT plan_entitlements_plan_feature_unique
  UNIQUE (
    plan_id,
    feature_id
  )
);


CREATE INDEX IF NOT EXISTS idx_plan_entitlements_plan
  ON public.plan_entitlements(plan_id);


CREATE INDEX IF NOT EXISTS idx_plan_entitlements_feature
  ON public.plan_entitlements(feature_id);


CREATE INDEX IF NOT EXISTS idx_plan_entitlements_enabled
  ON public.plan_entitlements(is_enabled);


-- =========================================================
-- 5. ASSINATURAS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  plan_id uuid NOT NULL
    REFERENCES public.plans(id)
    ON DELETE RESTRICT,

  subscriber_type text NOT NULL,

  user_id uuid
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  organization_id uuid
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'pending',

  billing_cycle text NOT NULL DEFAULT 'monthly',

  quantity integer NOT NULL DEFAULT 1,

  currency text NOT NULL DEFAULT 'BRL',

  unit_amount_cents integer,
  total_amount_cents integer,

  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  provider_price_id text,

  trial_starts_at timestamptz,
  trial_ends_at timestamptz,

  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,

  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  ended_at timestamptz,

  created_by uuid
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subscriptions_subscriber_type_check
  CHECK (
    subscriber_type IN (
      'user',
      'organization'
    )
  ),

  CONSTRAINT subscriptions_owner_check
  CHECK (
    (
      subscriber_type = 'user'
      AND user_id IS NOT NULL
      AND organization_id IS NULL
    )
    OR
    (
      subscriber_type = 'organization'
      AND organization_id IS NOT NULL
      AND user_id IS NULL
    )
  ),

  CONSTRAINT subscriptions_status_check
  CHECK (
    status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'canceled',
      'expired',
      'incomplete',
      'unpaid'
    )
  ),

  CONSTRAINT subscriptions_billing_cycle_check
  CHECK (
    billing_cycle IN (
      'free',
      'monthly',
      'annual',
      'one_time',
      'custom'
    )
  ),

  CONSTRAINT subscriptions_quantity_check
  CHECK (
    quantity >= 1
  ),

  CONSTRAINT subscriptions_currency_check
  CHECK (
    currency ~ '^[A-Z]{3}$'
  ),

  CONSTRAINT subscriptions_unit_amount_check
  CHECK (
    unit_amount_cents IS NULL
    OR unit_amount_cents >= 0
  ),

  CONSTRAINT subscriptions_total_amount_check
  CHECK (
    total_amount_cents IS NULL
    OR total_amount_cents >= 0
  ),

  CONSTRAINT subscriptions_trial_period_check
  CHECK (
    trial_ends_at IS NULL
    OR trial_starts_at IS NULL
    OR trial_ends_at >= trial_starts_at
  ),

  CONSTRAINT subscriptions_current_period_check
  CHECK (
    current_period_ends_at IS NULL
    OR current_period_starts_at IS NULL
    OR current_period_ends_at >= current_period_starts_at
  )
);


CREATE INDEX IF NOT EXISTS idx_subscriptions_plan
  ON public.subscriptions(plan_id);


CREATE INDEX IF NOT EXISTS idx_subscriptions_user
  ON public.subscriptions(user_id);


CREATE INDEX IF NOT EXISTS idx_subscriptions_organization
  ON public.subscriptions(organization_id);


CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);


CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_customer
  ON public.subscriptions(provider, provider_customer_id);


CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_unique
  ON public.subscriptions(provider, provider_subscription_id)
  WHERE provider IS NOT NULL
    AND provider_subscription_id IS NOT NULL;


CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_user_unique
  ON public.subscriptions(user_id)
  WHERE user_id IS NOT NULL
    AND status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'incomplete'
    );


CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_organization_unique
  ON public.subscriptions(organization_id)
  WHERE organization_id IS NOT NULL
    AND status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'incomplete'
    );


-- =========================================================
-- 6. LICENÇAS INSTITUCIONAIS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.organization_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  subscription_id uuid NOT NULL
    REFERENCES public.subscriptions(id)
    ON DELETE CASCADE,

  organization_id uuid NOT NULL
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,

  user_id uuid NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  assigned_by uuid
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  status text NOT NULL DEFAULT 'active',

  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,

  revoked_at timestamptz,
  revoked_by uuid
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT organization_licenses_status_check
  CHECK (
    status IN (
      'pending',
      'active',
      'suspended',
      'revoked',
      'expired'
    )
  ),

  CONSTRAINT organization_licenses_period_check
  CHECK (
    ends_at IS NULL
    OR ends_at >= starts_at
  )
);


CREATE INDEX IF NOT EXISTS idx_organization_licenses_subscription
  ON public.organization_licenses(subscription_id);


CREATE INDEX IF NOT EXISTS idx_organization_licenses_organization
  ON public.organization_licenses(organization_id);


CREATE INDEX IF NOT EXISTS idx_organization_licenses_user
  ON public.organization_licenses(user_id);


CREATE INDEX IF NOT EXISTS idx_organization_licenses_status
  ON public.organization_licenses(status);


CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_licenses_active_user_unique
  ON public.organization_licenses(
    organization_id,
    user_id
  )
  WHERE status IN (
    'pending',
    'active',
    'suspended'
  );


-- =========================================================
-- 7. CONTADORES DE USO
-- =========================================================

CREATE TABLE IF NOT EXISTS public.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  feature_id uuid NOT NULL
    REFERENCES public.features(id)
    ON DELETE CASCADE,

  subscription_id uuid
    REFERENCES public.subscriptions(id)
    ON DELETE CASCADE,

  user_id uuid
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  organization_id uuid
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,

  period_type text NOT NULL DEFAULT 'monthly',

  period_starts_at timestamptz NOT NULL,
  period_ends_at timestamptz NOT NULL,

  usage_value numeric NOT NULL DEFAULT 0,

  last_increment_at timestamptz,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT usage_counters_owner_check
  CHECK (
    user_id IS NOT NULL
    OR organization_id IS NOT NULL
  ),

  CONSTRAINT usage_counters_period_type_check
  CHECK (
    period_type IN (
      'daily',
      'weekly',
      'monthly',
      'annual',
      'lifetime'
    )
  ),

  CONSTRAINT usage_counters_period_check
  CHECK (
    period_ends_at >= period_starts_at
  ),

  CONSTRAINT usage_counters_usage_value_check
  CHECK (
    usage_value >= 0
  )
);


CREATE INDEX IF NOT EXISTS idx_usage_counters_feature
  ON public.usage_counters(feature_id);


CREATE INDEX IF NOT EXISTS idx_usage_counters_subscription
  ON public.usage_counters(subscription_id);


CREATE INDEX IF NOT EXISTS idx_usage_counters_user
  ON public.usage_counters(user_id);


CREATE INDEX IF NOT EXISTS idx_usage_counters_organization
  ON public.usage_counters(organization_id);


CREATE INDEX IF NOT EXISTS idx_usage_counters_period
  ON public.usage_counters(
    period_starts_at,
    period_ends_at
  );


CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_counters_user_period_unique
  ON public.usage_counters(
    feature_id,
    user_id,
    period_type,
    period_starts_at,
    period_ends_at
  )
  WHERE user_id IS NOT NULL
    AND organization_id IS NULL;


CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_counters_organization_period_unique
  ON public.usage_counters(
    feature_id,
    organization_id,
    period_type,
    period_starts_at,
    period_ends_at
  )
  WHERE organization_id IS NOT NULL
    AND user_id IS NULL;


CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_counters_user_organization_period_unique
  ON public.usage_counters(
    feature_id,
    user_id,
    organization_id,
    period_type,
    period_starts_at,
    period_ends_at
  )
  WHERE user_id IS NOT NULL
    AND organization_id IS NOT NULL;


-- =========================================================
-- 8. EXCEÇÕES DE ACESSO
-- =========================================================

CREATE TABLE IF NOT EXISTS public.access_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  feature_id uuid NOT NULL
    REFERENCES public.features(id)
    ON DELETE CASCADE,

  user_id uuid
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  organization_id uuid
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,

  override_type text NOT NULL,

  is_enabled boolean,

  limit_value numeric,
  text_value text,
  json_value jsonb,

  reason text NOT NULL,

  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,

  approved_by uuid NOT NULL
    REFERENCES auth.users(id)
    ON DELETE RESTRICT,

  revoked_at timestamptz,
  revoked_by uuid
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT access_overrides_owner_check
  CHECK (
    user_id IS NOT NULL
    OR organization_id IS NOT NULL
  ),

  CONSTRAINT access_overrides_type_check
  CHECK (
    override_type IN (
      'grant',
      'deny',
      'limit'
    )
  ),

  CONSTRAINT access_overrides_period_check
  CHECK (
    ends_at IS NULL
    OR ends_at >= starts_at
  ),

  CONSTRAINT access_overrides_limit_check
  CHECK (
    limit_value IS NULL
    OR limit_value >= 0
  ),

  CONSTRAINT access_overrides_reason_not_empty_check
  CHECK (
    length(trim(reason)) > 0
  )
);


CREATE INDEX IF NOT EXISTS idx_access_overrides_feature
  ON public.access_overrides(feature_id);


CREATE INDEX IF NOT EXISTS idx_access_overrides_user
  ON public.access_overrides(user_id);


CREATE INDEX IF NOT EXISTS idx_access_overrides_organization
  ON public.access_overrides(organization_id);


CREATE INDEX IF NOT EXISTS idx_access_overrides_active_period
  ON public.access_overrides(
    starts_at,
    ends_at
  );


-- =========================================================
-- 9. EVENTOS FINANCEIROS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  subscription_id uuid
    REFERENCES public.subscriptions(id)
    ON DELETE SET NULL,

  user_id uuid
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  organization_id uuid
    REFERENCES public.organizations(id)
    ON DELETE SET NULL,

  event_type text NOT NULL,
  event_status text NOT NULL DEFAULT 'received',

  provider text,
  provider_event_id text,
  provider_customer_id text,
  provider_subscription_id text,
  provider_payment_id text,
  provider_invoice_id text,

  amount_cents integer,
  currency text NOT NULL DEFAULT 'BRL',

  occurred_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,

  error_code text,
  error_message text,

  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT billing_events_type_not_empty_check
  CHECK (
    length(trim(event_type)) > 0
  ),

  CONSTRAINT billing_events_status_check
  CHECK (
    event_status IN (
      'received',
      'processing',
      'processed',
      'ignored',
      'failed'
    )
  ),

  CONSTRAINT billing_events_amount_check
  CHECK (
    amount_cents IS NULL
    OR amount_cents >= 0
  ),

  CONSTRAINT billing_events_currency_check
  CHECK (
    currency ~ '^[A-Z]{3}$'
  )
);


CREATE INDEX IF NOT EXISTS idx_billing_events_subscription
  ON public.billing_events(subscription_id);


CREATE INDEX IF NOT EXISTS idx_billing_events_user
  ON public.billing_events(user_id);


CREATE INDEX IF NOT EXISTS idx_billing_events_organization
  ON public.billing_events(organization_id);


CREATE INDEX IF NOT EXISTS idx_billing_events_type
  ON public.billing_events(event_type);


CREATE INDEX IF NOT EXISTS idx_billing_events_status
  ON public.billing_events(event_status);


CREATE INDEX IF NOT EXISTS idx_billing_events_occurred_at
  ON public.billing_events(occurred_at DESC);


CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_provider_event_unique
  ON public.billing_events(
    provider,
    provider_event_id
  )
  WHERE provider IS NOT NULL
    AND provider_event_id IS NOT NULL;


-- =========================================================
-- 10. UPDATED_AT AUTOMÁTICO
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_commercial_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_plans_updated_at
  ON public.plans;

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.set_commercial_updated_at();


DROP TRIGGER IF EXISTS trg_features_updated_at
  ON public.features;

CREATE TRIGGER trg_features_updated_at
BEFORE UPDATE ON public.features
FOR EACH ROW
EXECUTE FUNCTION public.set_commercial_updated_at();


DROP TRIGGER IF EXISTS trg_plan_entitlements_updated_at
  ON public.plan_entitlements;

CREATE TRIGGER trg_plan_entitlements_updated_at
BEFORE UPDATE ON public.plan_entitlements
FOR EACH ROW
EXECUTE FUNCTION public.set_commercial_updated_at();


DROP TRIGGER IF EXISTS trg_subscriptions_updated_at
  ON public.subscriptions;

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_commercial_updated_at();


DROP TRIGGER IF EXISTS trg_organization_licenses_updated_at
  ON public.organization_licenses;

CREATE TRIGGER trg_organization_licenses_updated_at
BEFORE UPDATE ON public.organization_licenses
FOR EACH ROW
EXECUTE FUNCTION public.set_commercial_updated_at();


DROP TRIGGER IF EXISTS trg_usage_counters_updated_at
  ON public.usage_counters;

CREATE TRIGGER trg_usage_counters_updated_at
BEFORE UPDATE ON public.usage_counters
FOR EACH ROW
EXECUTE FUNCTION public.set_commercial_updated_at();


DROP TRIGGER IF EXISTS trg_access_overrides_updated_at
  ON public.access_overrides;

CREATE TRIGGER trg_access_overrides_updated_at
BEFORE UPDATE ON public.access_overrides
FOR EACH ROW
EXECUTE FUNCTION public.set_commercial_updated_at();


-- =========================================================
-- 11. ROW LEVEL SECURITY
-- =========================================================
--
-- RLS é habilitada agora.
-- As políticas serão criadas em migration específica.
-- Até lá, somente service_role e operações administrativas
-- autorizadas no Supabase deverão acessar estas tabelas.
-- =========================================================

ALTER TABLE public.plans
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.features
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.plan_entitlements
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.organization_licenses
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usage_counters
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.access_overrides
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.billing_events
  ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- 12. DOCUMENTAÇÃO DAS TABELAS
-- =========================================================

COMMENT ON TABLE public.plans IS
  'Planos comerciais oficiais da EduData IA, separados dos perfis funcionais dos usuários.';


COMMENT ON TABLE public.features IS
  'Recursos comerciais e capacidades disponibilizadas pelos produtos da plataforma.';


COMMENT ON TABLE public.plan_entitlements IS
  'Direitos, limites e configurações de recursos concedidos por cada plano comercial.';


COMMENT ON TABLE public.subscriptions IS
  'Assinaturas individuais ou institucionais da EduData IA.';


COMMENT ON TABLE public.organization_licenses IS
  'Distribuição de licenças institucionais de uma organização para usuários autorizados.';


COMMENT ON TABLE public.usage_counters IS
  'Contadores de consumo utilizados para controlar cotas e limites comerciais.';


COMMENT ON TABLE public.access_overrides IS
  'Exceções temporárias ou administrativas de acesso a recursos da plataforma.';


COMMENT ON TABLE public.billing_events IS
  'Eventos financeiros e registros de integração com provedores de pagamento.';


COMMENT ON COLUMN public.plans.code IS
  'Código técnico permanente do plano, como edi_free ou edi_professor_pro.';


COMMENT ON COLUMN public.plans.audience_type IS
  'Define se o plano é individual, institucional, de rede ou administrativo.';


COMMENT ON COLUMN public.features.code IS
  'Código técnico global do recurso, como agenda.events ou evidences.upload.';


COMMENT ON COLUMN public.subscriptions.subscriber_type IS
  'Define se a assinatura pertence a um usuário individual ou a uma organização.';


COMMENT ON COLUMN public.subscriptions.status IS
  'Situação operacional e financeira da assinatura.';


COMMENT ON COLUMN public.billing_events.payload IS
  'Conteúdo bruto do evento recebido do provedor, preservado para auditoria.';


COMMIT;
BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 25 — SUPPORT SLA MANAGEMENT
-- =========================================================
--
-- Objetivos:
-- 1. Evoluir a Central de Suporte já existente.
-- 2. Implementar gestão de níveis de serviço.
-- 3. Registrar a fotografia do perfil do solicitante.
-- 4. Calcular prioridade operacional sem confiar apenas
--    na prioridade informada pelo usuário.
-- 5. Preparar dashboard, filtros, farol e indicadores.
-- 6. Preservar isolamento, RLS e trilhas de auditoria.
--
-- Esta migração:
-- - não cria uma Central de Suporte paralela;
-- - não remove campos ou registros existentes;
-- - não altera a assinatura das RPCs da migration 24;
-- - não transforma metas internas em SLA contratual;
-- - não concede acesso institucional aos chamados;
-- - não permite acesso entre usuários solicitantes.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÕES
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


DO $$
BEGIN
  IF to_regclass(
       'public.support_tickets'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.support_tickets. Execute primeiro a migration 24.';
  END IF;

  IF to_regclass(
       'public.support_staff_members'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.support_staff_members.';
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
END;
$$;


-- =========================================================
-- 2. PESOS CONFIGURÁVEIS DE PRIORIDADE
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_priority_weights (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    rule_type text NOT NULL,

    rule_value text NOT NULL,

    score integer NOT NULL
      DEFAULT 0,

    description text,

    is_active boolean NOT NULL
      DEFAULT true,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_priority_weights_unique
    UNIQUE (
      rule_type,
      rule_value
    ),

    CONSTRAINT
      support_priority_weights_type_check
    CHECK (
      rule_type IN (
        'requested_priority',
        'account_type',
        'service_tier',
        'category',
        'impact',
        'urgency'
      )
    ),

    CONSTRAINT
      support_priority_weights_value_check
    CHECK (
      length(
        trim(rule_value)
      ) > 0
    ),

    CONSTRAINT
      support_priority_weights_metadata_check
    CHECK (
      jsonb_typeof(metadata) =
      'object'
    )
  );


CREATE INDEX IF NOT EXISTS
  idx_support_priority_weights_active
ON public.support_priority_weights(
  rule_type,
  is_active
);


INSERT INTO
  public.support_priority_weights (
    rule_type,
    rule_value,
    score,
    description
  )
VALUES
  (
    'requested_priority',
    'low',
    0,
    'Prioridade baixa informada pelo solicitante.'
  ),
  (
    'requested_priority',
    'normal',
    15,
    'Prioridade normal informada pelo solicitante.'
  ),
  (
    'requested_priority',
    'high',
    25,
    'Prioridade alta informada pelo solicitante.'
  ),
  (
    'requested_priority',
    'urgent',
    60,
    'Sinalização urgente informada pelo solicitante.'
  ),

  (
    'account_type',
    'individual',
    0,
    'Conta individual.'
  ),
  (
    'account_type',
    'corporate',
    5,
    'Conta vinculada a instituição.'
  ),
  (
    'account_type',
    'platform',
    10,
    'Operação interna da plataforma.'
  ),

  (
    'service_tier',
    'individual_free',
    0,
    'Usuário individual gratuito.'
  ),
  (
    'service_tier',
    'individual_pro',
    5,
    'Usuário individual com plano profissional.'
  ),
  (
    'service_tier',
    'institutional',
    10,
    'Usuário vinculado a contrato institucional.'
  ),
  (
    'service_tier',
    'network',
    20,
    'Usuário vinculado a uma rede educacional.'
  ),
  (
    'service_tier',
    'platform',
    15,
    'Operação administrativa interna.'
  ),

  (
    'category',
    'technical',
    10,
    'Falha técnica.'
  ),
  (
    'category',
    'access',
    15,
    'Problema de autenticação ou acesso.'
  ),
  (
    'category',
    'billing',
    10,
    'Pagamento, cobrança ou ativação.'
  ),
  (
    'category',
    'product',
    5,
    'Produto ou funcionalidade.'
  ),
  (
    'category',
    'pedagogical',
    5,
    'Orientação pedagógica.'
  ),
  (
    'category',
    'privacy',
    30,
    'Privacidade, segurança ou proteção de dados.'
  ),
  (
    'category',
    'suggestion',
    0,
    'Sugestão de melhoria.'
  ),
  (
    'category',
    'other',
    0,
    'Outras categorias.'
  ),

  (
    'impact',
    'single_user',
    0,
    'Impacto restrito a um usuário.'
  ),
  (
    'impact',
    'multiple_users',
    10,
    'Impacto em vários usuários.'
  ),
  (
    'impact',
    'school',
    20,
    'Impacto em uma escola.'
  ),
  (
    'impact',
    'organization',
    30,
    'Impacto em uma instituição.'
  ),
  (
    'impact',
    'network',
    40,
    'Impacto em uma rede.'
  ),
  (
    'impact',
    'platform',
    50,
    'Impacto generalizado na plataforma.'
  ),

  (
    'urgency',
    'low',
    0,
    'Pode aguardar planejamento.'
  ),
  (
    'urgency',
    'normal',
    0,
    'Atendimento no fluxo normal.'
  ),
  (
    'urgency',
    'high',
    20,
    'Necessidade elevada de atendimento.'
  ),
  (
    'urgency',
    'critical',
    40,
    'Necessidade crítica e imediata.'
  )

ON CONFLICT (
  rule_type,
  rule_value
)
DO UPDATE SET
  score =
    EXCLUDED.score,

  description =
    EXCLUDED.description,

  is_active =
    true,

  updated_at =
    now();


-- =========================================================
-- 3. FAIXAS DE PRIORIDADE
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_priority_bands (
    priority text PRIMARY KEY,

    minimum_score integer NOT NULL,

    sort_order integer NOT NULL,

    description text,

    is_active boolean NOT NULL
      DEFAULT true,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_priority_bands_priority_check
    CHECK (
      priority IN (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),

    CONSTRAINT
      support_priority_bands_minimum_check
    CHECK (
      minimum_score >= 0
    )
  );


INSERT INTO
  public.support_priority_bands (
    priority,
    minimum_score,
    sort_order,
    description
  )
VALUES
  (
    'low',
    0,
    10,
    'Baixa prioridade operacional.'
  ),
  (
    'normal',
    15,
    20,
    'Prioridade operacional normal.'
  ),
  (
    'high',
    45,
    30,
    'Alta prioridade operacional.'
  ),
  (
    'urgent',
    80,
    40,
    'Prioridade operacional urgente.'
  )

ON CONFLICT (priority)
DO UPDATE SET
  minimum_score =
    EXCLUDED.minimum_score,

  sort_order =
    EXCLUDED.sort_order,

  description =
    EXCLUDED.description,

  is_active =
    true,

  updated_at =
    now();


-- =========================================================
-- 4. POLÍTICAS DE NÍVEL DE SERVIÇO
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_sla_policies (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    code text NOT NULL,

    name text NOT NULL,

    description text,

    account_type text,

    service_tier text,

    requester_role text,

    product_code text,

    category text,

    priority text,

    first_response_minutes integer NOT NULL,

    resolution_minutes integer NOT NULL,

    warning_percent integer NOT NULL
      DEFAULT 70,

    critical_percent integer NOT NULL
      DEFAULT 90,

    pause_on_waiting_user boolean NOT NULL
      DEFAULT true,

    clock_basis text NOT NULL
      DEFAULT 'elapsed',

    timezone text NOT NULL
      DEFAULT 'America/Sao_Paulo',

    is_contractual boolean NOT NULL
      DEFAULT false,

    sort_order integer NOT NULL
      DEFAULT 0,

    is_active boolean NOT NULL
      DEFAULT true,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_sla_policies_code_unique
    UNIQUE (code),

    CONSTRAINT
      support_sla_policies_code_check
    CHECK (
      length(
        trim(code)
      ) > 0
    ),

    CONSTRAINT
      support_sla_policies_name_check
    CHECK (
      length(
        trim(name)
      ) > 0
    ),

    CONSTRAINT
      support_sla_policies_account_check
    CHECK (
      account_type IS NULL
      OR account_type IN (
        'individual',
        'corporate',
        'platform'
      )
    ),

    CONSTRAINT
      support_sla_policies_tier_check
    CHECK (
      service_tier IS NULL
      OR service_tier IN (
        'individual_free',
        'individual_pro',
        'institutional',
        'network',
        'platform'
      )
    ),

    CONSTRAINT
      support_sla_policies_priority_check
    CHECK (
      priority IS NULL
      OR priority IN (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),

    CONSTRAINT
      support_sla_policies_first_response_check
    CHECK (
      first_response_minutes >= 1
    ),

    CONSTRAINT
      support_sla_policies_resolution_check
    CHECK (
      resolution_minutes >=
      first_response_minutes
    ),

    CONSTRAINT
      support_sla_policies_warning_check
    CHECK (
      warning_percent BETWEEN 1 AND 99
    ),

    CONSTRAINT
      support_sla_policies_critical_check
    CHECK (
      critical_percent BETWEEN 1 AND 100
      AND critical_percent >
          warning_percent
    ),

    CONSTRAINT
      support_sla_policies_clock_check
    CHECK (
      clock_basis IN (
        'elapsed',
        'business'
      )
    ),

    CONSTRAINT
      support_sla_policies_metadata_check
    CHECK (
      jsonb_typeof(metadata) =
      'object'
    )
  );


CREATE INDEX IF NOT EXISTS
  idx_support_sla_policies_match
ON public.support_sla_policies(
  is_active,
  account_type,
  service_tier,
  priority,
  category,
  product_code
);


-- Metas operacionais internas iniciais.
-- Não representam compromisso contratual publicado.

INSERT INTO
  public.support_sla_policies (
    code,
    name,
    account_type,
    service_tier,
    priority,
    first_response_minutes,
    resolution_minutes,
    warning_percent,
    critical_percent,
    is_contractual,
    sort_order,
    metadata
  )
VALUES
  (
    'platform-urgent',
    'Operação interna urgente',
    'platform',
    'platform',
    'urgent',
    15,
    120,
    60,
    85,
    false,
    500,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'platform-high',
    'Operação interna alta',
    'platform',
    'platform',
    'high',
    30,
    240,
    70,
    90,
    false,
    490,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'platform-normal',
    'Operação interna normal',
    'platform',
    'platform',
    'normal',
    60,
    480,
    70,
    90,
    false,
    480,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'platform-low',
    'Operação interna baixa',
    'platform',
    'platform',
    'low',
    120,
    960,
    70,
    90,
    false,
    470,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),

  (
    'network-urgent',
    'Rede urgente',
    'corporate',
    'network',
    'urgent',
    30,
    240,
    60,
    85,
    false,
    450,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'network-high',
    'Rede alta',
    'corporate',
    'network',
    'high',
    60,
    480,
    70,
    90,
    false,
    440,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'network-normal',
    'Rede normal',
    'corporate',
    'network',
    'normal',
    120,
    960,
    70,
    90,
    false,
    430,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'network-low',
    'Rede baixa',
    'corporate',
    'network',
    'low',
    240,
    1440,
    70,
    90,
    false,
    420,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),

  (
    'institutional-urgent',
    'Institucional urgente',
    'corporate',
    'institutional',
    'urgent',
    60,
    480,
    60,
    85,
    false,
    400,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'institutional-high',
    'Institucional alta',
    'corporate',
    'institutional',
    'high',
    120,
    720,
    70,
    90,
    false,
    390,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'institutional-normal',
    'Institucional normal',
    'corporate',
    'institutional',
    'normal',
    240,
    1440,
    70,
    90,
    false,
    380,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'institutional-low',
    'Institucional baixa',
    'corporate',
    'institutional',
    'low',
    480,
    2880,
    70,
    90,
    false,
    370,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),

  (
    'individual-pro-urgent',
    'Individual Pro urgente',
    'individual',
    'individual_pro',
    'urgent',
    120,
    720,
    60,
    85,
    false,
    350,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'individual-pro-high',
    'Individual Pro alta',
    'individual',
    'individual_pro',
    'high',
    240,
    1440,
    70,
    90,
    false,
    340,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'individual-pro-normal',
    'Individual Pro normal',
    'individual',
    'individual_pro',
    'normal',
    480,
    2880,
    70,
    90,
    false,
    330,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'individual-pro-low',
    'Individual Pro baixa',
    'individual',
    'individual_pro',
    'low',
    720,
    4320,
    70,
    90,
    false,
    320,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),

  (
    'individual-free-urgent',
    'Individual gratuito urgente',
    'individual',
    'individual_free',
    'urgent',
    240,
    1440,
    60,
    85,
    false,
    300,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'individual-free-high',
    'Individual gratuito alta',
    'individual',
    'individual_free',
    'high',
    480,
    2880,
    70,
    90,
    false,
    290,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'individual-free-normal',
    'Individual gratuito normal',
    'individual',
    'individual_free',
    'normal',
    1440,
    7200,
    70,
    90,
    false,
    280,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  ),
  (
    'individual-free-low',
    'Individual gratuito baixa',
    'individual',
    'individual_free',
    'low',
    2880,
    10080,
    70,
    90,
    false,
    270,
    '{"source":"migration_25","type":"internal_target"}'::jsonb
  )

ON CONFLICT (code)
DO UPDATE SET
  name =
    EXCLUDED.name,

  account_type =
    EXCLUDED.account_type,

  service_tier =
    EXCLUDED.service_tier,

  priority =
    EXCLUDED.priority,

  first_response_minutes =
    EXCLUDED.first_response_minutes,

  resolution_minutes =
    EXCLUDED.resolution_minutes,

  warning_percent =
    EXCLUDED.warning_percent,

  critical_percent =
    EXCLUDED.critical_percent,

  is_contractual =
    EXCLUDED.is_contractual,

  sort_order =
    EXCLUDED.sort_order,

  is_active =
    true,

  metadata =
    EXCLUDED.metadata,

  updated_at =
    now();


-- =========================================================
-- 5. EVOLUÇÃO DOS CHAMADOS
-- =========================================================

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS
    requested_priority text,

  ADD COLUMN IF NOT EXISTS
    requester_account_type text,

  ADD COLUMN IF NOT EXISTS
    requester_role text,

  ADD COLUMN IF NOT EXISTS
    requester_hierarchy_level integer,

  ADD COLUMN IF NOT EXISTS
    requester_plan_code text,

  ADD COLUMN IF NOT EXISTS
    requester_service_tier text,

  ADD COLUMN IF NOT EXISTS
    impact text NOT NULL
      DEFAULT 'single_user',

  ADD COLUMN IF NOT EXISTS
    urgency text NOT NULL
      DEFAULT 'normal',

  ADD COLUMN IF NOT EXISTS
    calculated_priority text,

  ADD COLUMN IF NOT EXISTS
    priority_score integer NOT NULL
      DEFAULT 0,

  ADD COLUMN IF NOT EXISTS
    priority_overridden boolean NOT NULL
      DEFAULT false,

  ADD COLUMN IF NOT EXISTS
    priority_override_reason text,

  ADD COLUMN IF NOT EXISTS
    priority_changed_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    sla_policy_id uuid,

  ADD COLUMN IF NOT EXISTS
    sla_started_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    first_response_due_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    resolution_due_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    first_response_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    sla_clock_status text NOT NULL
      DEFAULT 'running',

  ADD COLUMN IF NOT EXISTS
    sla_paused_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    sla_paused_seconds bigint NOT NULL
      DEFAULT 0,

  ADD COLUMN IF NOT EXISTS
    sla_pause_reason text,

  ADD COLUMN IF NOT EXISTS
    first_response_breached_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    resolution_breached_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    sla_completed_at timestamptz,

  ADD COLUMN IF NOT EXISTS
    last_sla_evaluated_at timestamptz;


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_sla_policy_fk;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_sla_policy_fk
  FOREIGN KEY (
    sla_policy_id
  )
  REFERENCES
    public.support_sla_policies(id)
  ON DELETE SET NULL;


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_requested_priority_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_requested_priority_check
  CHECK (
    requested_priority IS NULL
    OR requested_priority IN (
      'low',
      'normal',
      'high',
      'urgent'
    )
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_requester_account_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_requester_account_check
  CHECK (
    requester_account_type IS NULL
    OR requester_account_type IN (
      'individual',
      'corporate',
      'platform'
    )
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_requester_tier_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_requester_tier_check
  CHECK (
    requester_service_tier IS NULL
    OR requester_service_tier IN (
      'individual_free',
      'individual_pro',
      'institutional',
      'network',
      'platform'
    )
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_requester_hierarchy_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_requester_hierarchy_check
  CHECK (
    requester_hierarchy_level IS NULL
    OR (
      requester_hierarchy_level >= 0
      AND requester_hierarchy_level <= 100
    )
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_impact_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_impact_check
  CHECK (
    impact IN (
      'single_user',
      'multiple_users',
      'school',
      'organization',
      'network',
      'platform'
    )
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_urgency_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_urgency_check
  CHECK (
    urgency IN (
      'low',
      'normal',
      'high',
      'critical'
    )
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_calculated_priority_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_calculated_priority_check
  CHECK (
    calculated_priority IS NULL
    OR calculated_priority IN (
      'low',
      'normal',
      'high',
      'urgent'
    )
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_priority_score_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_priority_score_check
  CHECK (
    priority_score >= 0
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_sla_clock_status_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_sla_clock_status_check
  CHECK (
    sla_clock_status IN (
      'running',
      'paused',
      'completed',
      'not_applicable'
    )
  );


ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS
    support_tickets_sla_paused_seconds_check;


ALTER TABLE public.support_tickets
  ADD CONSTRAINT
    support_tickets_sla_paused_seconds_check
  CHECK (
    sla_paused_seconds >= 0
  );


UPDATE public.support_tickets
SET
  requested_priority =
    COALESCE(
      requested_priority,
      priority,
      'normal'
    ),

  calculated_priority =
    COALESCE(
      calculated_priority,
      priority,
      'normal'
    ),

  requester_account_type =
    COALESCE(
      requester_account_type,
      CASE
        WHEN organization_id IS NOT NULL
        THEN 'corporate'

        ELSE 'individual'
      END
    ),

  requester_service_tier =
    COALESCE(
      requester_service_tier,
      CASE
        WHEN organization_id IS NOT NULL
        THEN 'institutional'

        ELSE 'individual_free'
      END
    ),

  impact =
    COALESCE(
      impact,
      'single_user'
    ),

  urgency =
    COALESCE(
      urgency,
      'normal'
    ),

  priority_score =
    COALESCE(
      priority_score,
      0
    ),

  sla_paused_seconds =
    COALESCE(
      sla_paused_seconds,
      0
    ),

  sla_clock_status =
    CASE
      WHEN status IN (
        'resolved',
        'closed'
      )
      THEN 'completed'

      ELSE COALESCE(
        sla_clock_status,
        'running'
      )
    END,

  sla_completed_at =
    CASE
      WHEN status =
           'closed'
      THEN COALESCE(
        sla_completed_at,
        closed_at,
        resolved_at,
        updated_at
      )

      WHEN status =
           'resolved'
      THEN COALESCE(
        sla_completed_at,
        resolved_at,
        updated_at
      )

      ELSE sla_completed_at
    END,

  first_response_at =
    COALESCE(
      first_response_at,
      last_support_message_at
    );


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_sla_queue
ON public.support_tickets(
  status,
  priority,
  first_response_due_at,
  resolution_due_at
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_requester_context
ON public.support_tickets(
  requester_account_type,
  requester_service_tier,
  requester_role
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_sla_policy
ON public.support_tickets(
  sla_policy_id,
  sla_clock_status
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_first_response_due
ON public.support_tickets(
  first_response_due_at
)
WHERE first_response_at IS NULL;


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_resolution_due
ON public.support_tickets(
  resolution_due_at
)
WHERE status NOT IN (
  'resolved',
  'closed'
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_sla_breaches
ON public.support_tickets(
  first_response_breached_at,
  resolution_breached_at
);


-- =========================================================
-- 6. HISTÓRICO DE PRIORIDADE
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_priority_history (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    ticket_id uuid NOT NULL
      REFERENCES
        public.support_tickets(id)
      ON DELETE CASCADE,

    previous_priority text,

    new_priority text NOT NULL,

    previous_score integer,

    new_score integer NOT NULL,

    previous_impact text,

    new_impact text NOT NULL,

    previous_urgency text,

    new_urgency text NOT NULL,

    changed_by_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    change_source text NOT NULL
      DEFAULT 'system',

    reason text,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_priority_history_priority_check
    CHECK (
      new_priority IN (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),

    CONSTRAINT
      support_priority_history_source_check
    CHECK (
      change_source IN (
        'system',
        'support',
        'migration'
      )
    ),

    CONSTRAINT
      support_priority_history_metadata_check
    CHECK (
      jsonb_typeof(metadata) =
      'object'
    )
  );


CREATE INDEX IF NOT EXISTS
  idx_support_priority_history_ticket
ON public.support_priority_history(
  ticket_id,
  created_at ASC
);


-- =========================================================
-- 7. HISTÓRICO DE SLA
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_sla_history (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    ticket_id uuid NOT NULL
      REFERENCES
        public.support_tickets(id)
      ON DELETE CASCADE,

    sla_policy_id uuid
      REFERENCES
        public.support_sla_policies(id)
      ON DELETE SET NULL,

    event_type text NOT NULL,

    previous_clock_status text,

    new_clock_status text,

    due_at timestamptz,

    event_at timestamptz NOT NULL
      DEFAULT now(),

    changed_by_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    reason text,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_sla_history_event_check
    CHECK (
      event_type IN (
        'policy_applied',
        'policy_changed',
        'clock_started',
        'clock_paused',
        'clock_resumed',
        'first_response',
        'first_response_breached',
        'resolution_breached',
        'completed',
        'reopened',
        'recalculated'
      )
    ),

    CONSTRAINT
      support_sla_history_clock_previous_check
    CHECK (
      previous_clock_status IS NULL
      OR previous_clock_status IN (
        'running',
        'paused',
        'completed',
        'not_applicable'
      )
    ),

    CONSTRAINT
      support_sla_history_clock_new_check
    CHECK (
      new_clock_status IS NULL
      OR new_clock_status IN (
        'running',
        'paused',
        'completed',
        'not_applicable'
      )
    ),

    CONSTRAINT
      support_sla_history_metadata_check
    CHECK (
      jsonb_typeof(metadata) =
      'object'
    )
  );


CREATE INDEX IF NOT EXISTS
  idx_support_sla_history_ticket
ON public.support_sla_history(
  ticket_id,
  created_at ASC
);


CREATE INDEX IF NOT EXISTS
  idx_support_sla_history_event
ON public.support_sla_history(
  event_type,
  created_at DESC
);


-- =========================================================
-- 8. CONTEXTO DO SOLICITANTE
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
  selected_account_type text;

  selected_role text;

  selected_hierarchy integer;

  selected_organization_id uuid;

  selected_school_id uuid;

  selected_plan_code text;

  selected_plan_audience text;

  selected_service_tier text;
BEGIN
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

  INTO selected_role

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
    END

  LIMIT 1;


  selected_role :=
    COALESCE(
      selected_role,
      'teacher'
    );


  SELECT
    member.organization_id,
    member.school_id,
    lower(
      COALESCE(
        NULLIF(
          trim(member.role),
          ''
        ),
        selected_role
      )
    ),
    member.hierarchy_level

  INTO
    selected_organization_id,
    selected_school_id,
    selected_role,
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
      member.access_starts_at IS NULL
      OR member.access_starts_at <=
         now()
    )

    AND (
      member.access_ends_at IS NULL
      OR member.access_ends_at >=
         now()
    )

  ORDER BY
    member.hierarchy_level DESC,
    member.updated_at DESC

  LIMIT 1;


  IF selected_organization_id
     IS NOT NULL
  THEN
    selected_account_type :=
      'corporate';

  ELSIF selected_role IN (
    'platform_admin',
    'super_admin'
  )
  THEN
    selected_account_type :=
      'platform';

    selected_hierarchy :=
      COALESCE(
        selected_hierarchy,
        CASE
          WHEN selected_role =
               'super_admin'
          THEN 100

          ELSE 90
        END
      );

  ELSE
    selected_account_type :=
      'individual';

    selected_hierarchy :=
      COALESCE(
        selected_hierarchy,
        CASE
          WHEN selected_role =
               'student'
          THEN 5

          ELSE 10
        END
      );
  END IF;


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

    INNER JOIN
      public.plans
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
      subscription.current_period_ends_at
        DESC NULLS LAST,

      subscription.created_at
        DESC

    LIMIT 1;

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

    INNER JOIN
      public.plans
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
      subscription.current_period_ends_at
        DESC NULLS LAST,

      subscription.created_at
        DESC

    LIMIT 1;
  END IF;


  selected_service_tier :=
    CASE
      WHEN selected_account_type =
           'platform'
      THEN 'platform'

      WHEN selected_account_type =
           'corporate'
           AND (
             selected_plan_audience =
             'network'

             OR selected_role =
                'regional_manager'
           )
      THEN 'network'

      WHEN selected_account_type =
           'corporate'
      THEN 'institutional'

      WHEN lower(
        COALESCE(
          selected_plan_code,
          ''
        )
      ) LIKE '%pro%'
      THEN 'individual_pro'

      ELSE 'individual_free'
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


-- =========================================================
-- 9. CÁLCULO DE PRIORIDADE
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.calculate_support_priority(
    p_requested_priority text,
    p_account_type text,
    p_service_tier text,
    p_category text,
    p_impact text,
    p_urgency text
  )
RETURNS TABLE (
  priority_score integer,
  calculated_priority text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected_score integer;

  selected_priority text;
BEGIN
  SELECT
    COALESCE(
      sum(weight.score),
      0
    )::integer

  INTO selected_score

  FROM public.support_priority_weights
    AS weight

  WHERE weight.is_active =
        true

    AND (
      (
        weight.rule_type =
        'requested_priority'

        AND weight.rule_value =
            lower(
              COALESCE(
                p_requested_priority,
                'normal'
              )
            )
      )

      OR
      (
        weight.rule_type =
        'account_type'

        AND weight.rule_value =
            lower(
              COALESCE(
                p_account_type,
                'individual'
              )
            )
      )

      OR
      (
        weight.rule_type =
        'service_tier'

        AND weight.rule_value =
            lower(
              COALESCE(
                p_service_tier,
                'individual_free'
              )
            )
      )

      OR
      (
        weight.rule_type =
        'category'

        AND weight.rule_value =
            lower(
              COALESCE(
                p_category,
                'other'
              )
            )
      )

      OR
      (
        weight.rule_type =
        'impact'

        AND weight.rule_value =
            lower(
              COALESCE(
                p_impact,
                'single_user'
              )
            )
      )

      OR
      (
        weight.rule_type =
        'urgency'

        AND weight.rule_value =
            lower(
              COALESCE(
                p_urgency,
                'normal'
              )
            )
      )
    );


  SELECT band.priority
  INTO selected_priority

  FROM public.support_priority_bands
    AS band

  WHERE band.is_active =
        true

    AND band.minimum_score <=
        selected_score

  ORDER BY
    band.minimum_score DESC

  LIMIT 1;


  RETURN QUERY
  SELECT
    selected_score,

    COALESCE(
      selected_priority,
      'normal'
    );
END;
$$;


-- =========================================================
-- 10. RESOLUÇÃO DA POLÍTICA DE SLA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.resolve_support_sla_policy(
    p_account_type text,
    p_service_tier text,
    p_requester_role text,
    p_product_code text,
    p_category text,
    p_priority text
  )
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT policy.id

  FROM public.support_sla_policies
    AS policy

  WHERE policy.is_active =
        true

    AND (
      policy.account_type IS NULL
      OR policy.account_type =
         lower(p_account_type)
    )

    AND (
      policy.service_tier IS NULL
      OR policy.service_tier =
         lower(p_service_tier)
    )

    AND (
      policy.requester_role IS NULL
      OR policy.requester_role =
         lower(p_requester_role)
    )

    AND (
      policy.product_code IS NULL
      OR policy.product_code =
         lower(p_product_code)
    )

    AND (
      policy.category IS NULL
      OR policy.category =
         lower(p_category)
    )

    AND (
      policy.priority IS NULL
      OR policy.priority =
         lower(p_priority)
    )

  ORDER BY
    (
      CASE
        WHEN policy.account_type
             IS NOT NULL
        THEN 1
        ELSE 0
      END

      +

      CASE
        WHEN policy.service_tier
             IS NOT NULL
        THEN 1
        ELSE 0
      END

      +

      CASE
        WHEN policy.requester_role
             IS NOT NULL
        THEN 1
        ELSE 0
      END

      +

      CASE
        WHEN policy.product_code
             IS NOT NULL
        THEN 1
        ELSE 0
      END

      +

      CASE
        WHEN policy.category
             IS NOT NULL
        THEN 1
        ELSE 0
      END

      +

      CASE
        WHEN policy.priority
             IS NOT NULL
        THEN 1
        ELSE 0
      END
    ) DESC,

    policy.sort_order DESC,

    policy.created_at ASC

  LIMIT 1;
$$;


-- =========================================================
-- 11. INICIALIZAÇÃO DE CONTEXTO, PRIORIDADE E SLA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.initialize_support_ticket_management(
    p_ticket_id uuid
  )
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  selected_ticket
    public.support_tickets%ROWTYPE;

  selected_context record;

  selected_priority record;

  selected_policy
    public.support_sla_policies%ROWTYPE;

  selected_policy_id uuid;

  selected_started_at timestamptz;
BEGIN
  SELECT ticket.*
  INTO selected_ticket

  FROM public.support_tickets
    AS ticket

  WHERE ticket.id =
        p_ticket_id

  FOR UPDATE;


  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Chamado não encontrado para inicialização de SLA.';
  END IF;


  SELECT context.*
  INTO selected_context

  FROM public.resolve_support_requester_context(
    selected_ticket.requester_user_id
  ) AS context;


  SELECT priority_result.*
  INTO selected_priority

  FROM public.calculate_support_priority(
    COALESCE(
      selected_ticket.requested_priority,
      selected_ticket.priority,
      'normal'
    ),

    selected_context.account_type,

    selected_context.service_tier,

    selected_ticket.category,

    COALESCE(
      selected_ticket.impact,
      'single_user'
    ),

    COALESCE(
      selected_ticket.urgency,
      'normal'
    )
  ) AS priority_result;


  selected_policy_id :=
    public.resolve_support_sla_policy(
      selected_context.account_type,
      selected_context.service_tier,
      selected_context.requester_role,
      selected_ticket.product_code,
      selected_ticket.category,
      selected_priority.calculated_priority
    );


  IF selected_policy_id
     IS NOT NULL
  THEN
    SELECT policy.*
    INTO selected_policy

    FROM public.support_sla_policies
      AS policy

    WHERE policy.id =
          selected_policy_id;
  END IF;


  selected_started_at :=
    COALESCE(
      selected_ticket.sla_started_at,
      selected_ticket.created_at,
      now()
    );


  UPDATE public.support_tickets
  SET
    organization_id =
      COALESCE(
        organization_id,
        selected_context.organization_id
      ),

    school_id =
      COALESCE(
        school_id,
        selected_context.school_id
      ),

    requested_priority =
      COALESCE(
        requested_priority,
        priority,
        'normal'
      ),

    requester_account_type =
      selected_context.account_type,

    requester_role =
      selected_context.requester_role,

    requester_hierarchy_level =
      selected_context.hierarchy_level,

    requester_plan_code =
      selected_context.plan_code,

    requester_service_tier =
      selected_context.service_tier,

    calculated_priority =
      selected_priority.calculated_priority,

    priority_score =
      selected_priority.priority_score,

    priority =
      CASE
        WHEN priority_overridden =
             true
        THEN priority

        ELSE
          selected_priority.calculated_priority
      END,

    priority_changed_at =
      CASE
        WHEN priority IS DISTINCT FROM
             selected_priority.calculated_priority
             AND priority_overridden =
                 false
        THEN now()

        ELSE priority_changed_at
      END,

    sla_policy_id =
      selected_policy_id,

    sla_started_at =
      selected_started_at,

    first_response_due_at =
      CASE
        WHEN selected_policy_id
             IS NULL
        THEN NULL

        ELSE
          selected_started_at
          +
          make_interval(
            mins =>
              selected_policy
                .first_response_minutes
          )
      END,

    resolution_due_at =
      CASE
        WHEN selected_policy_id
             IS NULL
        THEN NULL

        ELSE
          selected_started_at
          +
          make_interval(
            mins =>
              selected_policy
                .resolution_minutes
          )
      END,

    sla_clock_status =
      CASE
        WHEN selected_policy_id
             IS NULL
        THEN 'not_applicable'

        WHEN status IN (
          'resolved',
          'closed'
        )
        THEN 'completed'

        ELSE 'running'
      END,

    sla_completed_at =
      CASE
        WHEN status IN (
          'resolved',
          'closed'
        )
        THEN COALESCE(
          sla_completed_at,
          resolved_at,
          closed_at,
          updated_at
        )

        ELSE NULL
      END,

    last_sla_evaluated_at =
      now(),

    metadata =
      COALESCE(
        metadata,
        '{}'::jsonb
      )
      ||
      jsonb_build_object(
        'support_management',
        jsonb_build_object(
          'initialized_by',
          'migration_25',

          'initialized_at',
          now()
        )
      )

  WHERE id =
        p_ticket_id;


  RETURN p_ticket_id;
END;
$$;


-- =========================================================
-- 12. CONTROLE DO RELÓGIO DE SLA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.manage_support_sla_clock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  selected_policy
    public.support_sla_policies%ROWTYPE;

  paused_duration_seconds bigint;
BEGIN
  NEW.requested_priority :=
    lower(
      COALESCE(
        NEW.requested_priority,
        NEW.priority,
        'normal'
      )
    );


  NEW.requester_account_type :=
    CASE
      WHEN NEW.requester_account_type
           IS NULL
      THEN NULL

      ELSE lower(
        trim(
          NEW.requester_account_type
        )
      )
    END;


  NEW.requester_role :=
    CASE
      WHEN NEW.requester_role
           IS NULL
      THEN NULL

      ELSE lower(
        trim(
          NEW.requester_role
        )
      )
    END;


  NEW.requester_plan_code :=
    CASE
      WHEN NEW.requester_plan_code
           IS NULL
      THEN NULL

      ELSE lower(
        trim(
          NEW.requester_plan_code
        )
      )
    END;


  NEW.requester_service_tier :=
    CASE
      WHEN NEW.requester_service_tier
           IS NULL
      THEN NULL

      ELSE lower(
        trim(
          NEW.requester_service_tier
        )
      )
    END;


  NEW.impact :=
    lower(
      COALESCE(
        NEW.impact,
        'single_user'
      )
    );


  NEW.urgency :=
    lower(
      COALESCE(
        NEW.urgency,
        'normal'
      )
    );


  NEW.calculated_priority :=
    CASE
      WHEN NEW.calculated_priority
           IS NULL
      THEN NULL

      ELSE lower(
        trim(
          NEW.calculated_priority
        )
      )
    END;


  NEW.sla_clock_status :=
    lower(
      COALESCE(
        NEW.sla_clock_status,
        'running'
      )
    );


  NEW.sla_paused_seconds :=
    COALESCE(
      NEW.sla_paused_seconds,
      0
    );


  IF NEW.sla_policy_id
     IS NOT NULL
  THEN
    SELECT policy.*
    INTO selected_policy

    FROM public.support_sla_policies
      AS policy

    WHERE policy.id =
          NEW.sla_policy_id;
  END IF;


  IF OLD.first_response_at
     IS NULL
     AND NEW.first_response_at
         IS NULL
     AND NEW.last_support_message_at
         IS NOT NULL
  THEN
    NEW.first_response_at :=
      NEW.last_support_message_at;
  END IF;


  IF OLD.first_response_at
     IS NULL
     AND NEW.first_response_at
         IS NOT NULL
     AND NEW.first_response_due_at
         IS NOT NULL
     AND NEW.first_response_at >
         NEW.first_response_due_at
     AND NEW.first_response_breached_at
         IS NULL
  THEN
    NEW.first_response_breached_at :=
      NEW.first_response_due_at;
  END IF;


  IF NEW.status IS DISTINCT FROM
     OLD.status
  THEN
    IF NEW.status =
       'waiting_user'
       AND selected_policy.id
           IS NOT NULL
       AND selected_policy
             .pause_on_waiting_user =
           true
       AND OLD.sla_clock_status =
           'running'
    THEN
      NEW.sla_clock_status :=
        'paused';

      NEW.sla_paused_at :=
        now();

      NEW.sla_pause_reason :=
        'Aguardando resposta do usuário.';


    ELSIF OLD.sla_clock_status =
          'paused'
          AND NEW.status <>
              'waiting_user'
    THEN
      paused_duration_seconds :=
        GREATEST(
          0,

          floor(
            extract(
              epoch
              FROM (
                now()
                -
                COALESCE(
                  OLD.sla_paused_at,
                  now()
                )
              )
            )
          )::bigint
        );


      NEW.sla_paused_seconds :=
        COALESCE(
          OLD.sla_paused_seconds,
          0
        )
        +
        paused_duration_seconds;


      NEW.first_response_due_at :=
        CASE
          WHEN OLD.first_response_at
               IS NULL
               AND OLD.first_response_due_at
                   IS NOT NULL
          THEN
            OLD.first_response_due_at
            +
            make_interval(
              secs =>
                paused_duration_seconds
            )

          ELSE
            OLD.first_response_due_at
        END;


      NEW.resolution_due_at :=
        CASE
          WHEN OLD.resolution_due_at
               IS NOT NULL
          THEN
            OLD.resolution_due_at
            +
            make_interval(
              secs =>
                paused_duration_seconds
            )

          ELSE NULL
        END;


      NEW.sla_clock_status :=
        'running';

      NEW.sla_paused_at :=
        NULL;

      NEW.sla_pause_reason :=
        NULL;
    END IF;


    IF NEW.status IN (
      'resolved',
      'closed'
    )
    THEN
      NEW.sla_clock_status :=
        CASE
          WHEN NEW.sla_policy_id
               IS NULL
          THEN 'not_applicable'

          ELSE 'completed'
        END;

      NEW.sla_completed_at :=
        COALESCE(
          NEW.sla_completed_at,
          now()
        );

      NEW.sla_paused_at :=
        NULL;

      NEW.sla_pause_reason :=
        NULL;


    ELSIF NEW.status =
          'reopened'
          AND OLD.status IN (
            'resolved',
            'closed'
          )
    THEN
      NEW.sla_clock_status :=
        CASE
          WHEN NEW.sla_policy_id
               IS NULL
          THEN 'not_applicable'

          ELSE 'running'
        END;

      NEW.sla_completed_at :=
        NULL;

      NEW.resolution_breached_at :=
        NULL;

      NEW.sla_paused_at :=
        NULL;

      NEW.sla_pause_reason :=
        NULL;

      IF selected_policy.id
         IS NOT NULL
      THEN
        NEW.resolution_due_at :=
          now()
          +
          make_interval(
            mins =>
              selected_policy
                .resolution_minutes
          );
      END IF;
    END IF;
  END IF;


  IF NEW.sla_clock_status =
     'running'
  THEN
    IF NEW.first_response_at
       IS NULL
       AND NEW.first_response_due_at
           IS NOT NULL
       AND now() >
           NEW.first_response_due_at
       AND NEW.first_response_breached_at
           IS NULL
    THEN
      NEW.first_response_breached_at :=
        NEW.first_response_due_at;
    END IF;


    IF NEW.status NOT IN (
      'resolved',
      'closed'
    )
       AND NEW.resolution_due_at
           IS NOT NULL
       AND now() >
           NEW.resolution_due_at
       AND NEW.resolution_breached_at
           IS NULL
    THEN
      NEW.resolution_breached_at :=
        NEW.resolution_due_at;
    END IF;
  END IF;


  NEW.last_sla_evaluated_at :=
    now();


  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_manage_support_sla_clock
ON public.support_tickets;


CREATE TRIGGER
  trg_manage_support_sla_clock

BEFORE UPDATE
ON public.support_tickets

FOR EACH ROW
EXECUTE FUNCTION
  public.manage_support_sla_clock();


-- =========================================================
-- 13. AUDITORIA DE PRIORIDADE E SLA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.audit_support_priority_and_sla()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NEW.priority IS DISTINCT FROM
     OLD.priority

     OR NEW.priority_score
        IS DISTINCT FROM
        OLD.priority_score

     OR NEW.impact
        IS DISTINCT FROM
        OLD.impact

     OR NEW.urgency
        IS DISTINCT FROM
        OLD.urgency
  THEN
    INSERT INTO
      public.support_priority_history (
        ticket_id,
        previous_priority,
        new_priority,
        previous_score,
        new_score,
        previous_impact,
        new_impact,
        previous_urgency,
        new_urgency,
        changed_by_user_id,
        change_source,
        reason,
        metadata,
        created_at
      )
    VALUES (
      NEW.id,
      OLD.priority,
      NEW.priority,
      OLD.priority_score,
      NEW.priority_score,
      OLD.impact,
      NEW.impact,
      OLD.urgency,
      NEW.urgency,
      auth.uid(),

      CASE
        WHEN auth.uid()
             IS NULL
        THEN 'system'

        WHEN public
          .current_user_is_active_support_staff()
        THEN 'support'

        ELSE 'system'
      END,

      COALESCE(
        NEW.priority_override_reason,
        'Prioridade recalculada pelo Core de Suporte.'
      ),

      jsonb_build_object(
        'priority_overridden',
        NEW.priority_overridden,

        'requested_priority',
        NEW.requested_priority,

        'calculated_priority',
        NEW.calculated_priority
      ),

      now()
    );
  END IF;


  IF NEW.sla_policy_id
     IS DISTINCT FROM
     OLD.sla_policy_id
  THEN
    INSERT INTO
      public.support_sla_history (
        ticket_id,
        sla_policy_id,
        event_type,
        previous_clock_status,
        new_clock_status,
        due_at,
        event_at,
        changed_by_user_id,
        reason,
        metadata
      )
    VALUES (
      NEW.id,
      NEW.sla_policy_id,

      CASE
        WHEN OLD.sla_policy_id
             IS NULL
        THEN 'policy_applied'

        ELSE 'policy_changed'
      END,

      OLD.sla_clock_status,
      NEW.sla_clock_status,
      NEW.resolution_due_at,
      now(),
      auth.uid(),
      'Política de nível de serviço aplicada ao chamado.',

      jsonb_build_object(
        'first_response_due_at',
        NEW.first_response_due_at,

        'resolution_due_at',
        NEW.resolution_due_at
      )
    );
  END IF;


  IF NEW.sla_clock_status
     IS DISTINCT FROM
     OLD.sla_clock_status
  THEN
    INSERT INTO
      public.support_sla_history (
        ticket_id,
        sla_policy_id,
        event_type,
        previous_clock_status,
        new_clock_status,
        due_at,
        event_at,
        changed_by_user_id,
        reason,
        metadata
      )
    VALUES (
      NEW.id,
      NEW.sla_policy_id,

      CASE
        WHEN NEW.sla_clock_status =
             'paused'
        THEN 'clock_paused'

        WHEN OLD.sla_clock_status =
             'paused'
             AND NEW.sla_clock_status =
                 'running'
        THEN 'clock_resumed'

        WHEN NEW.sla_clock_status =
             'completed'
        THEN 'completed'

        WHEN NEW.status =
             'reopened'
        THEN 'reopened'

        ELSE 'clock_started'
      END,

      OLD.sla_clock_status,
      NEW.sla_clock_status,
      NEW.resolution_due_at,
      now(),
      auth.uid(),

      COALESCE(
        NEW.sla_pause_reason,
        'Estado do relógio de SLA atualizado.'
      ),

      jsonb_build_object(
        'status',
        NEW.status,

        'paused_seconds',
        NEW.sla_paused_seconds
      )
    );
  END IF;


  IF OLD.first_response_at
     IS NULL
     AND NEW.first_response_at
         IS NOT NULL
  THEN
    INSERT INTO
      public.support_sla_history (
        ticket_id,
        sla_policy_id,
        event_type,
        previous_clock_status,
        new_clock_status,
        due_at,
        event_at,
        changed_by_user_id,
        reason,
        metadata
      )
    VALUES (
      NEW.id,
      NEW.sla_policy_id,
      'first_response',
      OLD.sla_clock_status,
      NEW.sla_clock_status,
      NEW.first_response_due_at,
      NEW.first_response_at,
      auth.uid(),
      'Primeira resposta da equipe registrada.',

      jsonb_build_object(
        'within_sla',
        NEW.first_response_breached_at
        IS NULL
      )
    );
  END IF;


  IF OLD.first_response_breached_at
     IS NULL
     AND NEW.first_response_breached_at
         IS NOT NULL
  THEN
    INSERT INTO
      public.support_sla_history (
        ticket_id,
        sla_policy_id,
        event_type,
        previous_clock_status,
        new_clock_status,
        due_at,
        event_at,
        changed_by_user_id,
        reason,
        metadata
      )
    VALUES (
      NEW.id,
      NEW.sla_policy_id,
      'first_response_breached',
      OLD.sla_clock_status,
      NEW.sla_clock_status,
      NEW.first_response_due_at,
      NEW.first_response_breached_at,
      auth.uid(),
      'Prazo de primeira resposta excedido.',
      '{}'::jsonb
    );
  END IF;


  IF OLD.resolution_breached_at
     IS NULL
     AND NEW.resolution_breached_at
         IS NOT NULL
  THEN
    INSERT INTO
      public.support_sla_history (
        ticket_id,
        sla_policy_id,
        event_type,
        previous_clock_status,
        new_clock_status,
        due_at,
        event_at,
        changed_by_user_id,
        reason,
        metadata
      )
    VALUES (
      NEW.id,
      NEW.sla_policy_id,
      'resolution_breached',
      OLD.sla_clock_status,
      NEW.sla_clock_status,
      NEW.resolution_due_at,
      NEW.resolution_breached_at,
      auth.uid(),
      'Prazo de solução excedido.',
      '{}'::jsonb
    );
  END IF;


  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_audit_support_priority_and_sla
ON public.support_tickets;


CREATE TRIGGER
  trg_audit_support_priority_and_sla

AFTER UPDATE
ON public.support_tickets

FOR EACH ROW
EXECUTE FUNCTION
  public.audit_support_priority_and_sla();


-- =========================================================
-- 14. INICIALIZAÇÃO AUTOMÁTICA DE NOVOS CHAMADOS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.trigger_initialize_support_ticket_management()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  PERFORM
    public.initialize_support_ticket_management(
      NEW.id
    );

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_initialize_support_ticket_management
ON public.support_tickets;


CREATE TRIGGER
  trg_initialize_support_ticket_management

AFTER INSERT
ON public.support_tickets

FOR EACH ROW
EXECUTE FUNCTION
  public.trigger_initialize_support_ticket_management();


-- =========================================================
-- 15. RECLASSIFICAÇÃO SEGURA DO CHAMADO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.classify_support_ticket(
    p_ticket_id uuid,
    p_impact text,
    p_urgency text,
    p_manual_priority text DEFAULT NULL,
    p_reason text DEFAULT NULL
  )
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  acting_user_id uuid;

  selected_ticket
    public.support_tickets%ROWTYPE;

  selected_priority record;

  selected_policy
    public.support_sla_policies%ROWTYPE;

  selected_policy_id uuid;

  normalized_impact text;

  normalized_urgency text;

  normalized_manual_priority text;

  normalized_reason text;
BEGIN
  acting_user_id :=
    auth.uid();


  IF acting_user_id
     IS NULL
  THEN
    RAISE EXCEPTION
      'Usuário não autenticado.';
  END IF;


  IF NOT public
    .current_user_is_active_support_staff()
  THEN
    RAISE EXCEPTION
      'Usuário não pertence à equipe ativa de suporte.';
  END IF;


  IF NOT public
    .current_user_can_access_support_ticket(
      p_ticket_id
    )
  THEN
    RAISE EXCEPTION
      'Usuário sem acesso ao chamado.';
  END IF;


  normalized_impact :=
    lower(
      trim(
        COALESCE(
          p_impact,
          'single_user'
        )
      )
    );


  normalized_urgency :=
    lower(
      trim(
        COALESCE(
          p_urgency,
          'normal'
        )
      )
    );


  normalized_manual_priority :=
    NULLIF(
      lower(
        trim(
          COALESCE(
            p_manual_priority,
            ''
          )
        )
      ),
      ''
    );


  normalized_reason :=
    NULLIF(
      trim(
        COALESCE(
          p_reason,
          ''
        )
      ),
      ''
    );


  IF normalized_impact NOT IN (
    'single_user',
    'multiple_users',
    'school',
    'organization',
    'network',
    'platform'
  )
  THEN
    RAISE EXCEPTION
      'Impacto de suporte inválido.';
  END IF;


  IF normalized_urgency NOT IN (
    'low',
    'normal',
    'high',
    'critical'
  )
  THEN
    RAISE EXCEPTION
      'Urgência de suporte inválida.';
  END IF;


  IF normalized_manual_priority
     IS NOT NULL
     AND normalized_manual_priority
         NOT IN (
           'low',
           'normal',
           'high',
           'urgent'
         )
  THEN
    RAISE EXCEPTION
      'Prioridade manual inválida.';
  END IF;


  IF normalized_manual_priority
     IS NOT NULL
     AND normalized_reason
         IS NULL
  THEN
    RAISE EXCEPTION
      'A alteração manual de prioridade exige justificativa.';
  END IF;


  SELECT ticket.*
  INTO selected_ticket

  FROM public.support_tickets
    AS ticket

  WHERE ticket.id =
        p_ticket_id

  FOR UPDATE;


  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Chamado não encontrado.';
  END IF;


  SELECT priority_result.*
  INTO selected_priority

  FROM public.calculate_support_priority(
    selected_ticket.requested_priority,

    selected_ticket.requester_account_type,

    selected_ticket.requester_service_tier,

    selected_ticket.category,

    normalized_impact,

    normalized_urgency
  ) AS priority_result;


  selected_policy_id :=
    public.resolve_support_sla_policy(
      selected_ticket
        .requester_account_type,

      selected_ticket
        .requester_service_tier,

      selected_ticket
        .requester_role,

      selected_ticket
        .product_code,

      selected_ticket
        .category,

      COALESCE(
        normalized_manual_priority,
        selected_priority
          .calculated_priority
      )
    );


  IF selected_policy_id
     IS NOT NULL
  THEN
    SELECT policy.*
    INTO selected_policy

    FROM public.support_sla_policies
      AS policy

    WHERE policy.id =
          selected_policy_id;
  END IF;


  UPDATE public.support_tickets
  SET
    impact =
      normalized_impact,

    urgency =
      normalized_urgency,

    calculated_priority =
      selected_priority
        .calculated_priority,

    priority_score =
      selected_priority
        .priority_score,

    priority =
      COALESCE(
        normalized_manual_priority,
        selected_priority
          .calculated_priority
      ),

    priority_overridden =
      normalized_manual_priority
      IS NOT NULL,

    priority_override_reason =
      normalized_reason,

    priority_changed_at =
      now(),

    sla_policy_id =
      selected_policy_id,

    first_response_due_at =
      CASE
        WHEN selected_policy_id
             IS NULL
        THEN NULL

        ELSE
          COALESCE(
            sla_started_at,
            created_at
          )
          +
          make_interval(
            mins =>
              selected_policy
                .first_response_minutes
          )
          +
          make_interval(
            secs =>
              sla_paused_seconds
          )
      END,

    resolution_due_at =
      CASE
        WHEN selected_policy_id
             IS NULL
        THEN NULL

        ELSE
          COALESCE(
            sla_started_at,
            created_at
          )
          +
          make_interval(
            mins =>
              selected_policy
                .resolution_minutes
          )
          +
          make_interval(
            secs =>
              sla_paused_seconds
          )
      END,

    first_response_breached_at =
      CASE
        WHEN first_response_at
             IS NULL
        THEN NULL

        WHEN selected_policy_id
             IS NOT NULL
             AND first_response_at >
                 (
                   COALESCE(
                     sla_started_at,
                     created_at
                   )
                   +
                   make_interval(
                     mins =>
                       selected_policy
                         .first_response_minutes
                   )
                   +
                   make_interval(
                     secs =>
                       sla_paused_seconds
                   )
                 )
        THEN
          COALESCE(
            first_response_breached_at,
            first_response_at
          )

        ELSE NULL
      END,

    resolution_breached_at =
      CASE
        WHEN status IN (
          'resolved',
          'closed'
        )
             AND selected_policy_id
                 IS NOT NULL
             AND COALESCE(
                   resolved_at,
                   closed_at,
                   updated_at
                 )
                 >
                 (
                   COALESCE(
                     sla_started_at,
                     created_at
                   )
                   +
                   make_interval(
                     mins =>
                       selected_policy
                         .resolution_minutes
                   )
                   +
                   make_interval(
                     secs =>
                       sla_paused_seconds
                   )
                 )
        THEN
          COALESCE(
            resolution_breached_at,
            COALESCE(
              resolved_at,
              closed_at,
              updated_at
            )
          )

        ELSE resolution_breached_at
      END,

    last_sla_evaluated_at =
      now()

  WHERE id =
        p_ticket_id;


  RETURN p_ticket_id;
END;
$$;


-- =========================================================
-- 16. ATUALIZAÇÃO DOS FARÓIS E ESTOUROS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.refresh_support_sla_state()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF auth.uid()
     IS NULL
  THEN
    RAISE EXCEPTION
      'Usuário não autenticado.';
  END IF;


  IF NOT public
    .current_user_is_active_support_staff()
  THEN
    RAISE EXCEPTION
      'Usuário não pertence à equipe ativa de suporte.';
  END IF;


  UPDATE public.support_tickets
    AS ticket

  SET
    last_sla_evaluated_at =
      now()

  WHERE public
    .current_user_can_access_support_ticket(
      ticket.id
    )

    AND ticket.status NOT IN (
      'resolved',
      'closed'
    );


  GET DIAGNOSTICS
    updated_count =
    ROW_COUNT;


  RETURN updated_count;
END;
$$;


-- =========================================================
-- 17. BACKFILL DOS CHAMADOS EXISTENTES
-- =========================================================

DO $$
DECLARE
  selected_ticket record;
BEGIN
  FOR selected_ticket IN
    SELECT ticket.id

    FROM public.support_tickets
      AS ticket

    ORDER BY ticket.created_at ASC
  LOOP
    PERFORM
      public.initialize_support_ticket_management(
        selected_ticket.id
      );
  END LOOP;
END;
$$;


-- =========================================================
-- 18. VISÃO OPERACIONAL DA FILA
-- =========================================================

CREATE OR REPLACE VIEW
  public.support_ticket_operations
WITH (
  security_invoker = true
)
AS

WITH operational_base AS (
  SELECT
    ticket.*,

    policy.code
      AS sla_policy_code,

    policy.name
      AS sla_policy_name,

    policy.warning_percent,

    policy.critical_percent,

    policy.is_contractual,

    CASE
      WHEN ticket.status =
           'open'
      THEN 'open'

      WHEN ticket.status IN (
        'in_analysis',
        'waiting_support',
        'reopened'
      )
      THEN 'in_service'

      WHEN ticket.status =
           'waiting_user'
      THEN 'waiting_user'

      WHEN ticket.status IN (
        'resolved',
        'closed'
      )
      THEN 'closed'

      ELSE 'open'
    END AS operational_status,

    CASE
      WHEN ticket.first_response_at
           IS NULL
      THEN ticket.first_response_due_at

      ELSE ticket.resolution_due_at
    END AS active_sla_due_at

  FROM public.support_tickets
    AS ticket

  LEFT JOIN
    public.support_sla_policies
      AS policy

    ON policy.id =
       ticket.sla_policy_id
)

SELECT
  operational_base.*,

  CASE
    WHEN operational_base
           .sla_clock_status IN (
             'completed',
             'not_applicable'
           )
         OR operational_base.status
            IN (
              'resolved',
              'closed'
            )
    THEN 'gray'

    WHEN operational_base
           .sla_clock_status =
         'paused'
    THEN 'gray'

    WHEN operational_base
           .active_sla_due_at
         IS NULL
    THEN 'gray'

    WHEN operational_base
           .first_response_breached_at
         IS NOT NULL
         AND operational_base
               .first_response_at
             IS NULL
    THEN 'red'

    WHEN operational_base
           .resolution_breached_at
         IS NOT NULL
    THEN 'red'

    WHEN now() >
         operational_base
           .active_sla_due_at
    THEN 'red'

    WHEN now() >=
         (
           operational_base
             .sla_started_at

           +

           (
             operational_base
               .active_sla_due_at
             -
             operational_base
               .sla_started_at
           )

           *

           (
             COALESCE(
               operational_base
                 .critical_percent,
               90
             )
             /
             100.0
           )
         )
    THEN 'orange'

    WHEN now() >=
         (
           operational_base
             .sla_started_at

           +

           (
             operational_base
               .active_sla_due_at
             -
             operational_base
               .sla_started_at
           )

           *

           (
             COALESCE(
               operational_base
                 .warning_percent,
               70
             )
             /
             100.0
           )
         )
    THEN 'yellow'

    ELSE 'green'
  END AS sla_light,

  CASE
    WHEN operational_base
           .active_sla_due_at
         IS NULL
    THEN NULL

    ELSE
      floor(
        extract(
          epoch
          FROM (
            operational_base
              .active_sla_due_at
            -
            now()
          )
        )
      )::bigint
  END AS seconds_until_sla_breach,

  CASE
    WHEN operational_base
           .sla_clock_status IN (
             'completed',
             'not_applicable'
           )
    THEN 5

    WHEN operational_base
           .active_sla_due_at
         IS NULL
    THEN 5

    WHEN now() >
         operational_base
           .active_sla_due_at
    THEN 0

    WHEN now() >=
         (
           operational_base
             .sla_started_at

           +

           (
             operational_base
               .active_sla_due_at
             -
             operational_base
               .sla_started_at
           )

           *

           0.90
         )
    THEN 1

    WHEN now() >=
         (
           operational_base
             .sla_started_at

           +

           (
             operational_base
               .active_sla_due_at
             -
             operational_base
               .sla_started_at
           )

           *

           0.70
         )
    THEN 2

    ELSE 3
  END AS sla_sort_rank,

  CASE operational_base.priority
    WHEN 'urgent'
    THEN 0

    WHEN 'high'
    THEN 1

    WHEN 'normal'
    THEN 2

    ELSE 3
  END AS priority_sort_rank,

  CASE operational_base
         .requester_service_tier
    WHEN 'network'
    THEN 0

    WHEN 'institutional'
    THEN 1

    WHEN 'platform'
    THEN 1

    WHEN 'individual_pro'
    THEN 2

    ELSE 3
  END AS requester_sort_rank

FROM operational_base;


-- =========================================================
-- 19. MÉTRICAS DO DASHBOARD
-- =========================================================

CREATE OR REPLACE VIEW
  public.support_dashboard_metrics
WITH (
  security_invoker = true
)
AS

SELECT
  count(*)::bigint
    AS total_tickets,

  count(*) FILTER (
    WHERE operational_status =
          'open'
  )::bigint
    AS open_tickets,

  count(*) FILTER (
    WHERE operational_status =
          'in_service'
  )::bigint
    AS in_service_tickets,

  count(*) FILTER (
    WHERE operational_status =
          'waiting_user'
  )::bigint
    AS waiting_user_tickets,

  count(*) FILTER (
    WHERE operational_status =
          'closed'
  )::bigint
    AS closed_tickets,

  count(*) FILTER (
    WHERE sla_light =
          'green'
  )::bigint
    AS sla_green,

  count(*) FILTER (
    WHERE sla_light =
          'yellow'
  )::bigint
    AS sla_yellow,

  count(*) FILTER (
    WHERE sla_light =
          'orange'
  )::bigint
    AS sla_orange,

  count(*) FILTER (
    WHERE sla_light =
          'red'
  )::bigint
    AS sla_red,

  count(*) FILTER (
    WHERE assigned_to_user_id
          IS NULL
      AND operational_status
          NOT IN (
            'closed'
          )
  )::bigint
    AS unassigned_tickets,

  round(
    avg(
      extract(
        epoch
        FROM (
          first_response_at
          -
          created_at
        )
      )
      /
      60.0
    ) FILTER (
      WHERE first_response_at
            IS NOT NULL
    ),
    2
  ) AS average_first_response_minutes,

  round(
    avg(
      extract(
        epoch
        FROM (
          COALESCE(
            resolved_at,
            closed_at
          )
          -
          created_at
        )
      )
      /
      60.0
    ) FILTER (
      WHERE COALESCE(
              resolved_at,
              closed_at
            )
            IS NOT NULL
    ),
    2
  ) AS average_resolution_minutes,

  round(
    (
      count(*) FILTER (
        WHERE operational_status =
              'closed'

          AND first_response_breached_at
              IS NULL

          AND resolution_breached_at
              IS NULL
      )::numeric

      /

      NULLIF(
        count(*) FILTER (
          WHERE operational_status =
                'closed'
        ),
        0
      )
    )
    *
    100,
    2
  ) AS sla_compliance_percent

FROM public.support_ticket_operations;


-- =========================================================
-- 20. RLS
-- =========================================================

ALTER TABLE
  public.support_priority_weights
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_priority_bands
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_sla_policies
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_priority_history
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_sla_history
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  support_priority_weights_staff_select
ON public.support_priority_weights;


CREATE POLICY
  support_priority_weights_staff_select

ON public.support_priority_weights

FOR SELECT
TO authenticated

USING (
  public.current_user_is_active_support_staff()
);


DROP POLICY IF EXISTS
  support_priority_bands_staff_select
ON public.support_priority_bands;


CREATE POLICY
  support_priority_bands_staff_select

ON public.support_priority_bands

FOR SELECT
TO authenticated

USING (
  public.current_user_is_active_support_staff()
);


DROP POLICY IF EXISTS
  support_sla_policies_staff_select
ON public.support_sla_policies;


CREATE POLICY
  support_sla_policies_staff_select

ON public.support_sla_policies

FOR SELECT
TO authenticated

USING (
  public.current_user_is_active_support_staff()
);


DROP POLICY IF EXISTS
  support_priority_history_staff_select
ON public.support_priority_history;


CREATE POLICY
  support_priority_history_staff_select

ON public.support_priority_history

FOR SELECT
TO authenticated

USING (
  public.current_user_is_active_support_staff()

  AND public
    .current_user_can_access_support_ticket(
      ticket_id
    )
);


DROP POLICY IF EXISTS
  support_sla_history_staff_select
ON public.support_sla_history;


CREATE POLICY
  support_sla_history_staff_select

ON public.support_sla_history

FOR SELECT
TO authenticated

USING (
  public.current_user_is_active_support_staff()

  AND public
    .current_user_can_access_support_ticket(
      ticket_id
    )
);


-- =========================================================
-- 21. PERMISSÕES
-- =========================================================

REVOKE ALL
ON TABLE
  public.support_priority_weights
FROM PUBLIC;


REVOKE ALL
ON TABLE
  public.support_priority_bands
FROM PUBLIC;


REVOKE ALL
ON TABLE
  public.support_sla_policies
FROM PUBLIC;


REVOKE ALL
ON TABLE
  public.support_priority_history
FROM PUBLIC;


REVOKE ALL
ON TABLE
  public.support_sla_history
FROM PUBLIC;


GRANT SELECT
ON TABLE
  public.support_priority_weights,
  public.support_priority_bands,
  public.support_sla_policies,
  public.support_priority_history,
  public.support_sla_history
TO authenticated;


GRANT SELECT
ON TABLE
  public.support_ticket_operations,
  public.support_dashboard_metrics
TO authenticated;


REVOKE ALL
ON FUNCTION
  public.resolve_support_requester_context(uuid)
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.calculate_support_priority(
    text,
    text,
    text,
    text,
    text,
    text
  )
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.resolve_support_sla_policy(
    text,
    text,
    text,
    text,
    text,
    text
  )
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.initialize_support_ticket_management(uuid)
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.trigger_initialize_support_ticket_management()
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.manage_support_sla_clock()
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.audit_support_priority_and_sla()
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.classify_support_ticket(
    uuid,
    text,
    text,
    text,
    text
  )
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.refresh_support_sla_state()
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION
  public.classify_support_ticket(
    uuid,
    text,
    text,
    text,
    text
  )
TO authenticated;


GRANT EXECUTE
ON FUNCTION
  public.refresh_support_sla_state()
TO authenticated;


-- =========================================================
-- 22. COMENTÁRIOS
-- =========================================================

COMMENT ON TABLE
  public.support_priority_weights
IS
  'Pesos configuráveis utilizados no cálculo da prioridade operacional dos chamados.';


COMMENT ON TABLE
  public.support_priority_bands
IS
  'Faixas que convertem a pontuação do chamado em prioridade baixa, normal, alta ou urgente.';


COMMENT ON TABLE
  public.support_sla_policies
IS
  'Políticas internas ou contratuais de primeira resposta e solução da Central de Suporte EDI.';


COMMENT ON TABLE
  public.support_priority_history
IS
  'Histórico auditável de alterações de impacto, urgência, pontuação e prioridade.';


COMMENT ON TABLE
  public.support_sla_history
IS
  'Histórico auditável dos eventos do relógio e do acordo de nível de serviço.';


COMMENT ON VIEW
  public.support_ticket_operations
IS
  'Fila operacional dos chamados com status consolidado, farol, prazo restante e ordenação de atendimento.';


COMMENT ON VIEW
  public.support_dashboard_metrics
IS
  'Indicadores consolidados para o dashboard da Central de Operações e Suporte EDI.';


COMMIT;
BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 24 — SUPPORT CORE
-- =========================================================
--
-- Objetivos:
-- 1. Criar a Central de Suporte interna da EduData IA.
-- 2. Permitir chamados e conversas dentro da plataforma.
-- 3. Impedir exposição de chamados entre usuários.
-- 4. Autorizar explicitamente integrantes da equipe de suporte.
-- 5. Preparar integração com BackOffice e notificações.
-- 6. Registrar mudanças de status e atribuições.
--
-- Esta migração:
-- - não cria chat público;
-- - não envia mensagens por e-mail;
-- - não cria bucket de anexos;
-- - não concede acesso institucional automático;
-- - não permite que gestores vejam chamados de colaboradores;
-- - não utiliza dados do navegador para autorizar acesso.
-- =========================================================


-- =========================================================
-- 1. EXTENSÃO E VALIDAÇÕES
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


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

  IF to_regclass('public.organizations') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.organizations.';
  END IF;

  IF to_regclass('public.schools') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.schools.';
  END IF;
END;
$$;


-- =========================================================
-- 2. SEQUÊNCIA DE PROTOCOLOS
-- =========================================================

CREATE SEQUENCE IF NOT EXISTS
  public.support_ticket_protocol_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  NO MAXVALUE
  CACHE 1;


CREATE OR REPLACE FUNCTION
  public.next_support_ticket_protocol()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  sequence_value bigint;
BEGIN
  sequence_value :=
    nextval(
      'public.support_ticket_protocol_seq'
    );

  RETURN format(
    'EDI-SUP-%s-%s',
    to_char(
      current_timestamp,
      'YYYY'
    ),
    lpad(
      sequence_value::text,
      6,
      '0'
    )
  );
END;
$$;


COMMENT ON FUNCTION
  public.next_support_ticket_protocol()
IS
  'Gera o protocolo único dos chamados internos da EduData IA.';


-- =========================================================
-- 3. EQUIPE AUTORIZADA DE SUPORTE
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_staff_members (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL
      REFERENCES auth.users(id)
      ON DELETE CASCADE,

    staff_role text NOT NULL
      DEFAULT 'agent',

    status text NOT NULL
      DEFAULT 'active',

    can_view_all boolean NOT NULL
      DEFAULT false,

    can_assign boolean NOT NULL
      DEFAULT false,

    can_manage_staff boolean NOT NULL
      DEFAULT false,

    created_by_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_staff_members_user_unique
    UNIQUE (user_id),

    CONSTRAINT
      support_staff_members_role_check
    CHECK (
      staff_role IN (
        'agent',
        'manager',
        'administrator'
      )
    ),

    CONSTRAINT
      support_staff_members_status_check
    CHECK (
      status IN (
        'active',
        'inactive',
        'suspended'
      )
    ),

    CONSTRAINT
      support_staff_members_metadata_check
    CHECK (
      jsonb_typeof(metadata) =
      'object'
    )
  );


COMMENT ON TABLE
  public.support_staff_members
IS
  'Usuários explicitamente autorizados a operar a Central de Suporte da EduData IA.';


CREATE INDEX IF NOT EXISTS
  idx_support_staff_status
ON public.support_staff_members(
  status,
  staff_role
);


-- Provisiona os administradores atuais como operadores iniciais.
-- Não modifica registros de suporte que já existam.

INSERT INTO
  public.support_staff_members (
    user_id,
    staff_role,
    status,
    can_view_all,
    can_assign,
    can_manage_staff,
    metadata,
    created_at,
    updated_at
  )
SELECT
  profile.user_id,

  CASE
    WHEN lower(profile.role) =
      'super_admin'
    THEN 'administrator'

    ELSE 'manager'
  END,

  'active',
  true,
  true,

  CASE
    WHEN lower(profile.role) =
      'super_admin'
    THEN true

    ELSE false
  END,

  jsonb_build_object(
    'provisioning',
    'migration_24',

    'source_role',
    lower(profile.role)
  ),

  now(),
  now()

FROM public.user_profiles
  AS profile

WHERE lower(profile.role) IN (
  'platform_admin',
  'super_admin'
)

  AND lower(profile.status) =
      'active'

ON CONFLICT (user_id)
DO NOTHING;


-- =========================================================
-- 4. CHAMADOS DE SUPORTE
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_tickets (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    protocol text NOT NULL
      DEFAULT public.next_support_ticket_protocol(),

    requester_user_id uuid NOT NULL
      REFERENCES auth.users(id)
      ON DELETE RESTRICT,

    organization_id uuid
      REFERENCES public.organizations(id)
      ON DELETE SET NULL,

    school_id uuid
      REFERENCES public.schools(id)
      ON DELETE SET NULL,

    product_code text NOT NULL
      DEFAULT 'platform',

    source_module text,

    source_path text,

    category text NOT NULL,

    subject text NOT NULL,

    priority text NOT NULL
      DEFAULT 'normal',

    status text NOT NULL
      DEFAULT 'open',

    assigned_to_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    last_message_at timestamptz NOT NULL
      DEFAULT now(),

    last_requester_message_at timestamptz,

    last_support_message_at timestamptz,

    status_changed_at timestamptz NOT NULL
      DEFAULT now(),

    resolved_at timestamptz,

    closed_at timestamptz,

    privacy_notice_version text NOT NULL
      DEFAULT 'v1.0',

    source_context jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    updated_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_tickets_protocol_unique
    UNIQUE (protocol),

    CONSTRAINT
      support_tickets_category_check
    CHECK (
      category IN (
        'technical',
        'access',
        'billing',
        'product',
        'pedagogical',
        'privacy',
        'suggestion',
        'other'
      )
    ),

    CONSTRAINT
      support_tickets_priority_check
    CHECK (
      priority IN (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),

    CONSTRAINT
      support_tickets_status_check
    CHECK (
      status IN (
        'open',
        'in_analysis',
        'waiting_user',
        'waiting_support',
        'resolved',
        'closed',
        'reopened'
      )
    ),

    CONSTRAINT
      support_tickets_subject_check
    CHECK (
      length(trim(subject))
      BETWEEN 5 AND 200
    ),

    CONSTRAINT
      support_tickets_product_check
    CHECK (
      length(trim(product_code)) > 0
    ),

    CONSTRAINT
      support_tickets_source_context_check
    CHECK (
      jsonb_typeof(source_context) =
      'object'
    ),

    CONSTRAINT
      support_tickets_metadata_check
    CHECK (
      jsonb_typeof(metadata) =
      'object'
    )
  );


COMMENT ON TABLE
  public.support_tickets
IS
  'Chamados de suporte abertos por usuários autenticados da Plataforma EduData IA.';


COMMENT ON COLUMN
  public.support_tickets.source_context
IS
  'Contexto descritivo da página de origem. Não pode ser utilizado como fonte de autorização.';


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_requester
ON public.support_tickets(
  requester_user_id,
  created_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_status
ON public.support_tickets(
  status,
  priority,
  last_message_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_assignee
ON public.support_tickets(
  assigned_to_user_id,
  status,
  last_message_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_product
ON public.support_tickets(
  product_code,
  category,
  created_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_organization
ON public.support_tickets(
  organization_id,
  created_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_support_tickets_school
ON public.support_tickets(
  school_id,
  created_at DESC
);


-- =========================================================
-- 5. MENSAGENS DOS CHAMADOS
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_messages (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    ticket_id uuid NOT NULL
      REFERENCES public.support_tickets(id)
      ON DELETE CASCADE,

    author_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    author_type text NOT NULL,

    visibility text NOT NULL
      DEFAULT 'shared',

    message_type text NOT NULL
      DEFAULT 'message',

    body text NOT NULL,

    metadata jsonb NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_messages_author_type_check
    CHECK (
      author_type IN (
        'requester',
        'support',
        'system'
      )
    ),

    CONSTRAINT
      support_messages_visibility_check
    CHECK (
      visibility IN (
        'shared',
        'internal'
      )
    ),

    CONSTRAINT
      support_messages_type_check
    CHECK (
      message_type IN (
        'message',
        'system_event'
      )
    ),

    CONSTRAINT
      support_messages_body_check
    CHECK (
      length(trim(body))
      BETWEEN 1 AND 10000
    ),

    CONSTRAINT
      support_messages_metadata_check
    CHECK (
      jsonb_typeof(metadata) =
      'object'
    )
  );


COMMENT ON TABLE
  public.support_messages
IS
  'Mensagens trocadas entre o usuário solicitante e a equipe autorizada de suporte.';


CREATE INDEX IF NOT EXISTS
  idx_support_messages_ticket
ON public.support_messages(
  ticket_id,
  created_at ASC
);


CREATE INDEX IF NOT EXISTS
  idx_support_messages_author
ON public.support_messages(
  author_user_id,
  created_at DESC
);


-- =========================================================
-- 6. LEITURA DAS MENSAGENS
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_message_reads (
    message_id uuid NOT NULL
      REFERENCES public.support_messages(id)
      ON DELETE CASCADE,

    user_id uuid NOT NULL
      REFERENCES auth.users(id)
      ON DELETE CASCADE,

    read_at timestamptz NOT NULL
      DEFAULT now(),

    PRIMARY KEY (
      message_id,
      user_id
    )
  );


CREATE INDEX IF NOT EXISTS
  idx_support_message_reads_user
ON public.support_message_reads(
  user_id,
  read_at DESC
);


-- =========================================================
-- 7. HISTÓRICO DE STATUS
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_status_history (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    ticket_id uuid NOT NULL
      REFERENCES public.support_tickets(id)
      ON DELETE CASCADE,

    previous_status text,

    new_status text NOT NULL,

    changed_by_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    actor_type text NOT NULL,

    visibility text NOT NULL
      DEFAULT 'shared',

    reason text,

    created_at timestamptz NOT NULL
      DEFAULT now(),

    CONSTRAINT
      support_status_history_previous_check
    CHECK (
      previous_status IS NULL
      OR previous_status IN (
        'open',
        'in_analysis',
        'waiting_user',
        'waiting_support',
        'resolved',
        'closed',
        'reopened'
      )
    ),

    CONSTRAINT
      support_status_history_new_check
    CHECK (
      new_status IN (
        'open',
        'in_analysis',
        'waiting_user',
        'waiting_support',
        'resolved',
        'closed',
        'reopened'
      )
    ),

    CONSTRAINT
      support_status_history_actor_check
    CHECK (
      actor_type IN (
        'requester',
        'support',
        'system'
      )
    ),

    CONSTRAINT
      support_status_history_visibility_check
    CHECK (
      visibility IN (
        'shared',
        'internal'
      )
    )
  );


CREATE INDEX IF NOT EXISTS
  idx_support_status_history_ticket
ON public.support_status_history(
  ticket_id,
  created_at ASC
);


-- =========================================================
-- 8. HISTÓRICO DE ATRIBUIÇÕES
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.support_assignment_history (
    id uuid PRIMARY KEY
      DEFAULT gen_random_uuid(),

    ticket_id uuid NOT NULL
      REFERENCES public.support_tickets(id)
      ON DELETE CASCADE,

    previous_assignee_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    new_assignee_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    changed_by_user_id uuid
      REFERENCES auth.users(id)
      ON DELETE SET NULL,

    reason text,

    created_at timestamptz NOT NULL
      DEFAULT now()
  );


CREATE INDEX IF NOT EXISTS
  idx_support_assignment_history_ticket
ON public.support_assignment_history(
  ticket_id,
  created_at ASC
);


-- =========================================================
-- 9. FUNÇÕES DE AUTORIZAÇÃO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.current_user_is_active_support_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1

    FROM public.support_staff_members
      AS staff

    WHERE staff.user_id =
          auth.uid()

      AND staff.status =
          'active'
  );
$$;


CREATE OR REPLACE FUNCTION
  public.current_user_support_can_view_all()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1

    FROM public.support_staff_members
      AS staff

    WHERE staff.user_id =
          auth.uid()

      AND staff.status =
          'active'

      AND staff.can_view_all =
          true
  );
$$;


CREATE OR REPLACE FUNCTION
  public.current_user_support_can_assign()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1

    FROM public.support_staff_members
      AS staff

    WHERE staff.user_id =
          auth.uid()

      AND staff.status =
          'active'

      AND (
        staff.can_assign = true
        OR staff.can_view_all = true
      )
  );
$$;


CREATE OR REPLACE FUNCTION
  public.current_user_is_support_ticket_requester(
    target_ticket_id uuid
  )
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1

    FROM public.support_tickets
      AS ticket

    WHERE ticket.id =
          target_ticket_id

      AND ticket.requester_user_id =
          auth.uid()
  );
$$;


CREATE OR REPLACE FUNCTION
  public.current_user_can_access_support_ticket(
    target_ticket_id uuid
  )
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1

    FROM public.support_tickets
      AS ticket

    INNER JOIN
      public.support_staff_members
        AS staff

      ON staff.user_id =
         auth.uid()

     AND staff.status =
         'active'

    WHERE ticket.id =
          target_ticket_id

      AND (
        staff.can_view_all = true

        OR ticket.assigned_to_user_id =
           auth.uid()
      )
  );
$$;


-- =========================================================
-- 10. INTEGRIDADE DOS CHAMADOS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.enforce_support_ticket_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  selected_school_organization_id uuid;
BEGIN
  NEW.product_code :=
    lower(
      trim(
        COALESCE(
          NEW.product_code,
          'platform'
        )
      )
    );

  NEW.category :=
    lower(
      trim(NEW.category)
    );

  NEW.priority :=
    lower(
      trim(
        COALESCE(
          NEW.priority,
          'normal'
        )
      )
    );

  NEW.status :=
    lower(
      trim(
        COALESCE(
          NEW.status,
          'open'
        )
      )
    );

  NEW.subject :=
    trim(NEW.subject);

  NEW.source_module :=
    NULLIF(
      trim(NEW.source_module),
      ''
    );

  NEW.source_path :=
    NULLIF(
      trim(NEW.source_path),
      ''
    );

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

  IF NEW.protocol IS NULL
     OR trim(NEW.protocol) = ''
  THEN
    NEW.protocol :=
      public.next_support_ticket_protocol();
  END IF;

  IF NEW.school_id IS NOT NULL THEN
    SELECT school.organization_id
    INTO selected_school_organization_id

    FROM public.schools
      AS school

    WHERE school.id =
          NEW.school_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'A escola informada no chamado não foi encontrada.';
    END IF;

    IF NEW.organization_id IS NULL THEN
      NEW.organization_id :=
        selected_school_organization_id;
    ELSIF selected_school_organization_id
          IS NOT NULL
      AND NEW.organization_id <>
          selected_school_organization_id
    THEN
      RAISE EXCEPTION
        'A escola informada não pertence à organização do chamado.';
    END IF;
  END IF;

  IF NEW.assigned_to_user_id
     IS NOT NULL
     AND NOT EXISTS (
       SELECT 1

       FROM public.support_staff_members
         AS staff

       WHERE staff.user_id =
             NEW.assigned_to_user_id

         AND staff.status =
             'active'
     )
  THEN
    RAISE EXCEPTION
      'O responsável informado não é um integrante ativo da equipe de suporte.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.protocol <>
       OLD.protocol
    THEN
      RAISE EXCEPTION
        'O protocolo do chamado não pode ser alterado.';
    END IF;

    IF NEW.requester_user_id <>
       OLD.requester_user_id
    THEN
      RAISE EXCEPTION
        'O proprietário do chamado não pode ser alterado.';
    END IF;

    IF NEW.status IS DISTINCT FROM
       OLD.status
    THEN
      NEW.status_changed_at :=
        now();

      IF NEW.status =
         'resolved'
      THEN
        NEW.resolved_at :=
          COALESCE(
            NEW.resolved_at,
            now()
          );

        NEW.closed_at :=
          NULL;
      ELSIF NEW.status =
            'closed'
      THEN
        NEW.closed_at :=
          COALESCE(
            NEW.closed_at,
            now()
          );
      ELSIF NEW.status IN (
        'open',
        'in_analysis',
        'waiting_user',
        'waiting_support',
        'reopened'
      )
      THEN
        NEW.closed_at :=
          NULL;

        IF NEW.status =
           'reopened'
        THEN
          NEW.resolved_at :=
            NULL;
        END IF;
      END IF;
    END IF;
  END IF;

  NEW.updated_at :=
    now();

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_enforce_support_ticket_integrity
ON public.support_tickets;


CREATE TRIGGER
  trg_enforce_support_ticket_integrity

BEFORE INSERT OR UPDATE
ON public.support_tickets

FOR EACH ROW
EXECUTE FUNCTION
  public.enforce_support_ticket_integrity();


-- =========================================================
-- 11. INTEGRIDADE DAS MENSAGENS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.enforce_support_message_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  NEW.body :=
    trim(NEW.body);

  NEW.author_type :=
    lower(
      trim(NEW.author_type)
    );

  NEW.visibility :=
    lower(
      trim(
        COALESCE(
          NEW.visibility,
          'shared'
        )
      )
    );

  NEW.message_type :=
    lower(
      trim(
        COALESCE(
          NEW.message_type,
          'message'
        )
      )
    );

  NEW.metadata :=
    COALESCE(
      NEW.metadata,
      '{}'::jsonb
    );

  IF NOT EXISTS (
    SELECT 1

    FROM public.support_tickets
      AS ticket

    WHERE ticket.id =
          NEW.ticket_id
  ) THEN
    RAISE EXCEPTION
      'O chamado da mensagem não foi encontrado.';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_enforce_support_message_integrity
ON public.support_messages;


CREATE TRIGGER
  trg_enforce_support_message_integrity

BEFORE INSERT
ON public.support_messages

FOR EACH ROW
EXECUTE FUNCTION
  public.enforce_support_message_integrity();


-- =========================================================
-- 12. ABRIR CHAMADO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.open_support_ticket(
    p_category text,
    p_subject text,
    p_message text,
    p_product_code text DEFAULT 'platform',
    p_source_module text DEFAULT NULL,
    p_source_path text DEFAULT NULL,
    p_priority text DEFAULT 'normal',
    p_source_context jsonb DEFAULT '{}'::jsonb
  )
RETURNS TABLE (
  ticket_id uuid,
  protocol text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  acting_user_id uuid;

  created_ticket_id uuid;

  created_protocol text;

  created_message_id uuid;

  normalized_category text;

  normalized_subject text;

  normalized_message text;

  normalized_product_code text;

  normalized_priority text;

  normalized_source_context jsonb;
BEGIN
  acting_user_id :=
    auth.uid();

  IF acting_user_id IS NULL THEN
    RAISE EXCEPTION
      'Usuário não autenticado.';
  END IF;

  IF NOT EXISTS (
    SELECT 1

    FROM public.user_profiles
      AS profile

    WHERE profile.user_id =
          acting_user_id

      AND lower(profile.status) =
          'active'
  ) THEN
    RAISE EXCEPTION
      'O perfil do usuário não está ativo.';
  END IF;

  normalized_category :=
    lower(
      trim(
        COALESCE(
          p_category,
          ''
        )
      )
    );

  normalized_subject :=
    trim(
      COALESCE(
        p_subject,
        ''
      )
    );

  normalized_message :=
    trim(
      COALESCE(
        p_message,
        ''
      )
    );

  normalized_product_code :=
    lower(
      trim(
        COALESCE(
          p_product_code,
          'platform'
        )
      )
    );

  normalized_priority :=
    lower(
      trim(
        COALESCE(
          p_priority,
          'normal'
        )
      )
    );

  normalized_source_context :=
    COALESCE(
      p_source_context,
      '{}'::jsonb
    );

  IF normalized_category NOT IN (
    'technical',
    'access',
    'billing',
    'product',
    'pedagogical',
    'privacy',
    'suggestion',
    'other'
  ) THEN
    RAISE EXCEPTION
      'Categoria de suporte inválida.';
  END IF;

  IF length(normalized_subject)
     NOT BETWEEN 5 AND 200
  THEN
    RAISE EXCEPTION
      'O assunto deve possuir entre 5 e 200 caracteres.';
  END IF;

  IF length(normalized_message)
     NOT BETWEEN 1 AND 10000
  THEN
    RAISE EXCEPTION
      'A mensagem deve possuir entre 1 e 10000 caracteres.';
  END IF;

  IF normalized_priority NOT IN (
    'low',
    'normal',
    'high',
    'urgent'
  ) THEN
    RAISE EXCEPTION
      'Prioridade de suporte inválida.';
  END IF;

  IF jsonb_typeof(
       normalized_source_context
     ) <> 'object'
  THEN
    RAISE EXCEPTION
      'O contexto de origem precisa ser um objeto JSON.';
  END IF;

  INSERT INTO
    public.support_tickets (
      requester_user_id,
      product_code,
      source_module,
      source_path,
      category,
      subject,
      priority,
      status,
      last_message_at,
      last_requester_message_at,
      source_context,
      metadata,
      created_at,
      updated_at
    )
  VALUES (
    acting_user_id,
    normalized_product_code,
    NULLIF(
      trim(p_source_module),
      ''
    ),
    NULLIF(
      trim(p_source_path),
      ''
    ),
    normalized_category,
    normalized_subject,
    normalized_priority,
    'open',
    now(),
    now(),
    normalized_source_context,

    jsonb_build_object(
      'opened_by',
      'authenticated_rpc',

      'migration',
      '24_support_core'
    ),

    now(),
    now()
  )
  RETURNING
    id,
    support_tickets.protocol
  INTO
    created_ticket_id,
    created_protocol;

  INSERT INTO
    public.support_messages (
      ticket_id,
      author_user_id,
      author_type,
      visibility,
      message_type,
      body,
      metadata,
      created_at
    )
  VALUES (
    created_ticket_id,
    acting_user_id,
    'requester',
    'shared',
    'message',
    normalized_message,
    '{}'::jsonb,
    now()
  )
  RETURNING id
  INTO created_message_id;

  INSERT INTO
    public.support_message_reads (
      message_id,
      user_id,
      read_at
    )
  VALUES (
    created_message_id,
    acting_user_id,
    now()
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO
    public.support_status_history (
      ticket_id,
      previous_status,
      new_status,
      changed_by_user_id,
      actor_type,
      visibility,
      reason,
      created_at
    )
  VALUES (
    created_ticket_id,
    NULL,
    'open',
    acting_user_id,
    'requester',
    'shared',
    'Chamado aberto pelo usuário.',
    now()
  );

  RETURN QUERY
  SELECT
    created_ticket_id,
    created_protocol;
END;
$$;


COMMENT ON FUNCTION
  public.open_support_ticket(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    jsonb
  )
IS
  'Abre um chamado autenticado e registra a primeira mensagem da conversa.';


-- =========================================================
-- 13. ENVIAR MENSAGEM
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.send_support_message(
    p_ticket_id uuid,
    p_body text,
    p_visibility text DEFAULT 'shared',
    p_metadata jsonb DEFAULT '{}'::jsonb
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

  requester_access boolean;

  staff_access boolean;

  normalized_body text;

  normalized_visibility text;

  normalized_metadata jsonb;

  selected_author_type text;

  previous_status text;

  next_status text;

  created_message_id uuid;
BEGIN
  acting_user_id :=
    auth.uid();

  IF acting_user_id IS NULL THEN
    RAISE EXCEPTION
      'Usuário não autenticado.';
  END IF;

  normalized_body :=
    trim(
      COALESCE(
        p_body,
        ''
      )
    );

  normalized_visibility :=
    lower(
      trim(
        COALESCE(
          p_visibility,
          'shared'
        )
      )
    );

  normalized_metadata :=
    COALESCE(
      p_metadata,
      '{}'::jsonb
    );

  IF length(normalized_body)
     NOT BETWEEN 1 AND 10000
  THEN
    RAISE EXCEPTION
      'A mensagem deve possuir entre 1 e 10000 caracteres.';
  END IF;

  IF normalized_visibility NOT IN (
    'shared',
    'internal'
  ) THEN
    RAISE EXCEPTION
      'Visibilidade de mensagem inválida.';
  END IF;

  IF jsonb_typeof(
       normalized_metadata
     ) <> 'object'
  THEN
    RAISE EXCEPTION
      'Os metadados da mensagem precisam ser um objeto JSON.';
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

  requester_access :=
    selected_ticket.requester_user_id =
    acting_user_id;

  staff_access :=
    public.current_user_can_access_support_ticket(
      p_ticket_id
    );

  IF NOT requester_access
     AND NOT staff_access
  THEN
    RAISE EXCEPTION
      'Usuário sem permissão para acessar este chamado.';
  END IF;

  IF requester_access
     AND normalized_visibility <>
         'shared'
  THEN
    RAISE EXCEPTION
      'O usuário solicitante não pode criar mensagens internas.';
  END IF;

  previous_status :=
    selected_ticket.status;

  IF requester_access THEN
    selected_author_type :=
      'requester';

    IF previous_status IN (
      'resolved',
      'closed'
    ) THEN
      next_status :=
        'reopened';
    ELSE
      next_status :=
        'waiting_support';
    END IF;
  ELSE
    selected_author_type :=
      'support';

    IF normalized_visibility =
       'internal'
    THEN
      next_status :=
        previous_status;
    ELSE
      next_status :=
        'waiting_user';
    END IF;
  END IF;

  INSERT INTO
    public.support_messages (
      ticket_id,
      author_user_id,
      author_type,
      visibility,
      message_type,
      body,
      metadata,
      created_at
    )
  VALUES (
    p_ticket_id,
    acting_user_id,
    selected_author_type,
    normalized_visibility,
    'message',
    normalized_body,
    normalized_metadata,
    now()
  )
  RETURNING id
  INTO created_message_id;

  INSERT INTO
    public.support_message_reads (
      message_id,
      user_id,
      read_at
    )
  VALUES (
    created_message_id,
    acting_user_id,
    now()
  )
  ON CONFLICT DO NOTHING;

  UPDATE public.support_tickets
  SET
    status =
      next_status,

    last_message_at =
      now(),

    last_requester_message_at =
      CASE
        WHEN requester_access
        THEN now()

        ELSE
          last_requester_message_at
      END,

    last_support_message_at =
      CASE
        WHEN staff_access
             AND normalized_visibility =
                 'shared'
        THEN now()

        ELSE
          last_support_message_at
      END,

    updated_at =
      now()

  WHERE id =
        p_ticket_id;

  IF next_status IS DISTINCT FROM
     previous_status
  THEN
    INSERT INTO
      public.support_status_history (
        ticket_id,
        previous_status,
        new_status,
        changed_by_user_id,
        actor_type,
        visibility,
        reason,
        created_at
      )
    VALUES (
      p_ticket_id,
      previous_status,
      next_status,
      acting_user_id,
      selected_author_type,
      CASE
        WHEN normalized_visibility =
             'internal'
        THEN 'internal'

        ELSE 'shared'
      END,
      'Status atualizado após nova mensagem.',
      now()
    );
  END IF;

  RETURN created_message_id;
END;
$$;


-- =========================================================
-- 14. ALTERAR STATUS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.change_support_ticket_status(
    p_ticket_id uuid,
    p_new_status text,
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

  requester_access boolean;

  staff_access boolean;

  normalized_status text;

  normalized_reason text;

  selected_actor_type text;
BEGIN
  acting_user_id :=
    auth.uid();

  IF acting_user_id IS NULL THEN
    RAISE EXCEPTION
      'Usuário não autenticado.';
  END IF;

  normalized_status :=
    lower(
      trim(
        COALESCE(
          p_new_status,
          ''
        )
      )
    );

  normalized_reason :=
    NULLIF(
      trim(p_reason),
      ''
    );

  IF normalized_status NOT IN (
    'open',
    'in_analysis',
    'waiting_user',
    'waiting_support',
    'resolved',
    'closed',
    'reopened'
  ) THEN
    RAISE EXCEPTION
      'Status de suporte inválido.';
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

  requester_access :=
    selected_ticket.requester_user_id =
    acting_user_id;

  staff_access :=
    public.current_user_can_access_support_ticket(
      p_ticket_id
    );

  IF requester_access THEN
    IF normalized_status NOT IN (
      'closed',
      'reopened'
    ) THEN
      RAISE EXCEPTION
        'O usuário pode apenas encerrar ou reabrir o próprio chamado.';
    END IF;

    IF normalized_status =
       'reopened'
       AND selected_ticket.status
           NOT IN (
             'resolved',
             'closed'
           )
    THEN
      RAISE EXCEPTION
        'Somente chamados resolvidos ou encerrados podem ser reabertos.';
    END IF;

    selected_actor_type :=
      'requester';
  ELSIF staff_access THEN
    selected_actor_type :=
      'support';
  ELSE
    RAISE EXCEPTION
      'Usuário sem permissão para alterar este chamado.';
  END IF;

  IF selected_ticket.status =
     normalized_status
  THEN
    RETURN p_ticket_id;
  END IF;

  UPDATE public.support_tickets
  SET
    status =
      normalized_status,

    updated_at =
      now()

  WHERE id =
        p_ticket_id;

  INSERT INTO
    public.support_status_history (
      ticket_id,
      previous_status,
      new_status,
      changed_by_user_id,
      actor_type,
      visibility,
      reason,
      created_at
    )
  VALUES (
    p_ticket_id,
    selected_ticket.status,
    normalized_status,
    acting_user_id,
    selected_actor_type,
    'shared',
    normalized_reason,
    now()
  );

  RETURN p_ticket_id;
END;
$$;


-- =========================================================
-- 15. ATRIBUIR RESPONSÁVEL
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.assign_support_ticket(
    p_ticket_id uuid,
    p_assignee_user_id uuid,
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

  normalized_reason text;

  next_status text;
BEGIN
  acting_user_id :=
    auth.uid();

  IF acting_user_id IS NULL THEN
    RAISE EXCEPTION
      'Usuário não autenticado.';
  END IF;

  IF NOT public.current_user_support_can_assign()
  THEN
    RAISE EXCEPTION
      'Usuário sem permissão para atribuir chamados.';
  END IF;

  IF NOT EXISTS (
    SELECT 1

    FROM public.support_staff_members
      AS staff

    WHERE staff.user_id =
          p_assignee_user_id

      AND staff.status =
          'active'
  ) THEN
    RAISE EXCEPTION
      'O responsável selecionado não pertence à equipe ativa de suporte.';
  END IF;

  normalized_reason :=
    NULLIF(
      trim(p_reason),
      ''
    );

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

  IF NOT public.current_user_can_access_support_ticket(
    p_ticket_id
  ) THEN
    RAISE EXCEPTION
      'Usuário sem permissão para acessar este chamado.';
  END IF;

  next_status :=
    CASE
      WHEN selected_ticket.status IN (
        'open',
        'reopened'
      )
      THEN 'in_analysis'

      ELSE selected_ticket.status
    END;

  UPDATE public.support_tickets
  SET
    assigned_to_user_id =
      p_assignee_user_id,

    status =
      next_status,

    updated_at =
      now()

  WHERE id =
        p_ticket_id;

  INSERT INTO
    public.support_assignment_history (
      ticket_id,
      previous_assignee_user_id,
      new_assignee_user_id,
      changed_by_user_id,
      reason,
      created_at
    )
  VALUES (
    p_ticket_id,
    selected_ticket.assigned_to_user_id,
    p_assignee_user_id,
    acting_user_id,
    normalized_reason,
    now()
  );

  IF next_status IS DISTINCT FROM
     selected_ticket.status
  THEN
    INSERT INTO
      public.support_status_history (
        ticket_id,
        previous_status,
        new_status,
        changed_by_user_id,
        actor_type,
        visibility,
        reason,
        created_at
      )
    VALUES (
      p_ticket_id,
      selected_ticket.status,
      next_status,
      acting_user_id,
      'support',
      'shared',
      'Chamado atribuído para análise.',
      now()
    );
  END IF;

  RETURN p_ticket_id;
END;
$$;


-- =========================================================
-- 16. MARCAR MENSAGENS COMO LIDAS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.mark_support_ticket_read(
    p_ticket_id uuid
  )
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  acting_user_id uuid;

  requester_access boolean;

  staff_access boolean;

  inserted_count integer;
BEGIN
  acting_user_id :=
    auth.uid();

  IF acting_user_id IS NULL THEN
    RAISE EXCEPTION
      'Usuário não autenticado.';
  END IF;

  requester_access :=
    public.current_user_is_support_ticket_requester(
      p_ticket_id
    );

  staff_access :=
    public.current_user_can_access_support_ticket(
      p_ticket_id
    );

  IF NOT requester_access
     AND NOT staff_access
  THEN
    RAISE EXCEPTION
      'Usuário sem permissão para acessar este chamado.';
  END IF;

  INSERT INTO
    public.support_message_reads (
      message_id,
      user_id,
      read_at
    )

  SELECT
    message.id,
    acting_user_id,
    now()

  FROM public.support_messages
    AS message

  WHERE message.ticket_id =
        p_ticket_id

    AND (
      staff_access = true

      OR message.visibility =
         'shared'
    )

  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS
    inserted_count =
      ROW_COUNT;

  RETURN inserted_count;
END;
$$;


-- =========================================================
-- 17. SEGURANÇA DAS FUNÇÕES
-- =========================================================

REVOKE ALL
ON FUNCTION
  public.next_support_ticket_protocol()
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.current_user_is_active_support_staff()
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.current_user_support_can_view_all()
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.current_user_support_can_assign()
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.current_user_is_support_ticket_requester(uuid)
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.current_user_can_access_support_ticket(uuid)
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.open_support_ticket(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    jsonb
  )
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.send_support_message(
    uuid,
    text,
    text,
    jsonb
  )
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.change_support_ticket_status(
    uuid,
    text,
    text
  )
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.assign_support_ticket(
    uuid,
    uuid,
    text
  )
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.mark_support_ticket_read(uuid)
FROM PUBLIC;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname =
          'authenticated'
  ) THEN
    GRANT EXECUTE
    ON FUNCTION
      public.current_user_is_active_support_staff()
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.current_user_support_can_view_all()
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.current_user_support_can_assign()
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.current_user_is_support_ticket_requester(uuid)
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.current_user_can_access_support_ticket(uuid)
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.open_support_ticket(
        text,
        text,
        text,
        text,
        text,
        text,
        text,
        jsonb
      )
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.send_support_message(
        uuid,
        text,
        text,
        jsonb
      )
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.change_support_ticket_status(
        uuid,
        text,
        text
      )
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.assign_support_ticket(
        uuid,
        uuid,
        text
      )
    TO authenticated;

    GRANT EXECUTE
    ON FUNCTION
      public.mark_support_ticket_read(uuid)
    TO authenticated;
  END IF;
END;
$$;


-- =========================================================
-- 18. ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE
  public.support_staff_members
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_tickets
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_messages
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_message_reads
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_status_history
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  public.support_assignment_history
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  support_staff_members_select_own
ON public.support_staff_members;


CREATE POLICY
  support_staff_members_select_own

ON public.support_staff_members

FOR SELECT

TO authenticated

USING (
  user_id =
  auth.uid()
);


DROP POLICY IF EXISTS
  support_tickets_select_authorized
ON public.support_tickets;


CREATE POLICY
  support_tickets_select_authorized

ON public.support_tickets

FOR SELECT

TO authenticated

USING (
  requester_user_id =
  auth.uid()

  OR public.current_user_can_access_support_ticket(
    id
  )
);


DROP POLICY IF EXISTS
  support_messages_select_authorized
ON public.support_messages;


CREATE POLICY
  support_messages_select_authorized

ON public.support_messages

FOR SELECT

TO authenticated

USING (
  public.current_user_can_access_support_ticket(
    ticket_id
  )

  OR (
    visibility =
    'shared'

    AND public.current_user_is_support_ticket_requester(
      ticket_id
    )
  )
);


DROP POLICY IF EXISTS
  support_message_reads_select_own
ON public.support_message_reads;


CREATE POLICY
  support_message_reads_select_own

ON public.support_message_reads

FOR SELECT

TO authenticated

USING (
  user_id =
  auth.uid()
);


DROP POLICY IF EXISTS
  support_status_history_select_authorized
ON public.support_status_history;


CREATE POLICY
  support_status_history_select_authorized

ON public.support_status_history

FOR SELECT

TO authenticated

USING (
  public.current_user_can_access_support_ticket(
    ticket_id
  )

  OR (
    visibility =
    'shared'

    AND public.current_user_is_support_ticket_requester(
      ticket_id
    )
  )
);


DROP POLICY IF EXISTS
  support_assignment_history_select_staff
ON public.support_assignment_history;


CREATE POLICY
  support_assignment_history_select_staff

ON public.support_assignment_history

FOR SELECT

TO authenticated

USING (
  public.current_user_can_access_support_ticket(
    ticket_id
  )
);


-- =========================================================
-- 19. PERMISSÕES DAS TABELAS
-- =========================================================

REVOKE ALL
ON TABLE public.support_staff_members
FROM anon, authenticated;


REVOKE ALL
ON TABLE public.support_tickets
FROM anon, authenticated;


REVOKE ALL
ON TABLE public.support_messages
FROM anon, authenticated;


REVOKE ALL
ON TABLE public.support_message_reads
FROM anon, authenticated;


REVOKE ALL
ON TABLE public.support_status_history
FROM anon, authenticated;


REVOKE ALL
ON TABLE public.support_assignment_history
FROM anon, authenticated;


GRANT SELECT
ON TABLE public.support_staff_members
TO authenticated;


GRANT SELECT
ON TABLE public.support_tickets
TO authenticated;


GRANT SELECT
ON TABLE public.support_messages
TO authenticated;


GRANT SELECT
ON TABLE public.support_message_reads
TO authenticated;


GRANT SELECT
ON TABLE public.support_status_history
TO authenticated;


GRANT SELECT
ON TABLE public.support_assignment_history
TO authenticated;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname =
          'service_role'
  ) THEN
    GRANT ALL
    ON TABLE
      public.support_staff_members,
      public.support_tickets,
      public.support_messages,
      public.support_message_reads,
      public.support_status_history,
      public.support_assignment_history
    TO service_role;

    GRANT USAGE, SELECT
    ON SEQUENCE
      public.support_ticket_protocol_seq
    TO service_role;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname =
          'postgres'
  ) THEN
    GRANT ALL
    ON TABLE
      public.support_staff_members,
      public.support_tickets,
      public.support_messages,
      public.support_message_reads,
      public.support_status_history,
      public.support_assignment_history
    TO postgres;

    GRANT ALL
    ON SEQUENCE
      public.support_ticket_protocol_seq
    TO postgres;
  END IF;
END;
$$;


-- =========================================================
-- 20. VALIDAÇÃO FINAL
-- =========================================================

DO $$
DECLARE
  required_table text;

  rls_enabled boolean;

  duplicate_protocols integer;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'support_staff_members',
    'support_tickets',
    'support_messages',
    'support_message_reads',
    'support_status_history',
    'support_assignment_history'
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
        'Tabela obrigatória não criada: public.%.',
        required_table;
    END IF;

    SELECT class.relrowsecurity
    INTO rls_enabled

    FROM pg_class
      AS class

    INNER JOIN pg_namespace
      AS namespace

      ON namespace.oid =
         class.relnamespace

    WHERE namespace.nspname =
          'public'

      AND class.relname =
          required_table;

    IF rls_enabled
       IS DISTINCT FROM true
    THEN
      RAISE EXCEPTION
        'RLS não foi habilitado em public.%.',
        required_table;
    END IF;
  END LOOP;

  IF to_regprocedure(
       'public.open_support_ticket(text,text,text,text,text,text,text,jsonb)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'A função open_support_ticket não foi criada.';
  END IF;

  IF to_regprocedure(
       'public.send_support_message(uuid,text,text,jsonb)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'A função send_support_message não foi criada.';
  END IF;

  IF to_regprocedure(
       'public.change_support_ticket_status(uuid,text,text)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'A função change_support_ticket_status não foi criada.';
  END IF;

  IF to_regprocedure(
       'public.assign_support_ticket(uuid,uuid,text)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'A função assign_support_ticket não foi criada.';
  END IF;

  IF to_regprocedure(
       'public.mark_support_ticket_read(uuid)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'A função mark_support_ticket_read não foi criada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1

    FROM pg_trigger

    WHERE tgname =
          'trg_enforce_support_ticket_integrity'

      AND tgisinternal =
          false
  ) THEN
    RAISE EXCEPTION
      'O trigger de integridade dos chamados não foi criado.';
  END IF;

  IF NOT EXISTS (
    SELECT 1

    FROM pg_trigger

    WHERE tgname =
          'trg_enforce_support_message_integrity'

      AND tgisinternal =
          false
  ) THEN
    RAISE EXCEPTION
      'O trigger de integridade das mensagens não foi criado.';
  END IF;

  SELECT count(*)
  INTO duplicate_protocols

  FROM (
    SELECT protocol

    FROM public.support_tickets

    GROUP BY protocol

    HAVING count(*) > 1
  ) AS duplicates;

  IF duplicate_protocols <> 0 THEN
    RAISE EXCEPTION
      'Existem protocolos de suporte duplicados.';
  END IF;
END;
$$;


COMMIT;
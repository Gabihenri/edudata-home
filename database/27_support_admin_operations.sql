BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 27 — SUPPORT ADMIN OPERATIONS
-- =========================================================
--
-- Objetivos:
-- 1. Criar operações exclusivas da equipe de suporte.
-- 2. Garantir que um operador também solicitante atue como
--    suporte dentro do BackOffice.
-- 3. Permitir respostas compartilhadas e notas internas.
-- 4. Permitir alteração administrativa de status.
-- 5. Disponibilizar a lista segura de operadores ativos.
--
-- Esta migração:
-- - não altera as políticas RLS existentes;
-- - não concede acesso institucional automático;
-- - não expõe e-mails dos operadores;
-- - não permite que solicitantes criem notas internas;
-- - não altera chamados existentes;
-- - mantém toda autorização no servidor.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DA ESTRUTURA EXISTENTE
-- =========================================================

DO $$
BEGIN
  IF to_regclass(
       'public.support_staff_members'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.support_staff_members.';
  END IF;

  IF to_regclass(
       'public.support_tickets'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.support_tickets.';
  END IF;

  IF to_regclass(
       'public.support_messages'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.support_messages.';
  END IF;

  IF to_regclass(
       'public.support_message_reads'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.support_message_reads.';
  END IF;

  IF to_regclass(
       'public.support_status_history'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.support_status_history.';
  END IF;

  IF to_regclass(
       'public.user_profiles'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.user_profiles.';
  END IF;

  IF to_regprocedure(
       'public.current_user_is_active_support_staff()'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Função obrigatória não encontrada: current_user_is_active_support_staff().';
  END IF;

  IF to_regprocedure(
       'public.current_user_support_can_assign()'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Função obrigatória não encontrada: current_user_support_can_assign().';
  END IF;

  IF to_regprocedure(
       'public.current_user_can_access_support_ticket(uuid)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'Função obrigatória não encontrada: current_user_can_access_support_ticket(uuid).';
  END IF;
END;
$$;


-- =========================================================
-- 2. LISTAR OPERADORES ATIVOS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.list_active_support_staff()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  staff_role text,
  status text,
  can_view_all boolean,
  can_assign boolean,
  can_manage_staff boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
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

  IF NOT public
    .current_user_support_can_assign()
  THEN
    RAISE EXCEPTION
      'Usuário sem permissão para consultar a equipe de atribuição.';
  END IF;

  RETURN QUERY
  SELECT
    staff.id,

    staff.user_id,

    COALESCE(
      NULLIF(
        trim(
          profile.display_name
        ),
        ''
      ),

      NULLIF(
        trim(
          auth_user
            .raw_user_meta_data
            ->> 'full_name'
        ),
        ''
      ),

      NULLIF(
        trim(
          auth_user
            .raw_user_meta_data
            ->> 'name'
        ),
        ''
      ),

      NULLIF(
        trim(
          split_part(
            auth_user.email,
            '@',
            1
          )
        ),
        ''
      ),

      'Operador de suporte'
    )::text
      AS display_name,

    staff.staff_role,

    staff.status,

    staff.can_view_all,

    staff.can_assign,

    staff.can_manage_staff

  FROM public.support_staff_members
    AS staff

  LEFT JOIN public.user_profiles
    AS profile

    ON profile.user_id =
       staff.user_id

  LEFT JOIN auth.users
    AS auth_user

    ON auth_user.id =
       staff.user_id

  WHERE staff.status =
        'active'

  ORDER BY
    CASE staff.staff_role
      WHEN 'administrator'
      THEN 0

      WHEN 'manager'
      THEN 1

      ELSE 2
    END,

    COALESCE(
      NULLIF(
        trim(
          profile.display_name
        ),
        ''
      ),

      NULLIF(
        trim(
          auth_user
            .raw_user_meta_data
            ->> 'full_name'
        ),
        ''
      ),

      NULLIF(
        trim(
          auth_user
            .raw_user_meta_data
            ->> 'name'
        ),
        ''
      ),

      NULLIF(
        trim(
          split_part(
            auth_user.email,
            '@',
            1
          )
        ),
        ''
      ),

      'Operador de suporte'
    ) ASC;
END;
$$;


COMMENT ON FUNCTION
  public.list_active_support_staff()
IS
  'Lista operadores ativos para atribuição de chamados sem expor dados privados de autenticação.';


-- =========================================================
-- 3. MENSAGEM EXCLUSIVA DA EQUIPE DE SUPORTE
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.send_support_staff_message(
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

  normalized_body text;

  normalized_visibility text;

  normalized_metadata jsonb;

  previous_status text;

  next_status text;

  created_message_id uuid;
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
      'Usuário sem permissão para acessar este chamado.';
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

  IF length(
       normalized_body
     )
     NOT BETWEEN 1 AND 10000
  THEN
    RAISE EXCEPTION
      'A mensagem deve possuir entre 1 e 10000 caracteres.';
  END IF;

  IF normalized_visibility
     NOT IN (
       'shared',
       'internal'
     )
  THEN
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

  IF NOT FOUND
  THEN
    RAISE EXCEPTION
      'Chamado não encontrado.';
  END IF;

  IF normalized_visibility =
     'shared'
     AND selected_ticket.status
         IN (
           'resolved',
           'closed'
         )
  THEN
    RAISE EXCEPTION
      'O chamado precisa ser reaberto antes de uma nova resposta da equipe.';
  END IF;

  previous_status :=
    selected_ticket.status;

  next_status :=
    CASE
      WHEN normalized_visibility =
           'internal'
      THEN previous_status

      ELSE 'waiting_user'
    END;

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
    'support',
    normalized_visibility,
    'message',
    normalized_body,

    normalized_metadata
    ||
    jsonb_build_object(
      'created_by',
      'support_staff_rpc',

      'staff_user_id',
      acting_user_id
    ),

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

  /*
   * Notas internas não alteram datas ou status visíveis
   * ao solicitante.
   */

  IF normalized_visibility =
     'shared'
  THEN
    UPDATE public.support_tickets
    SET
      status =
        next_status,

      last_message_at =
        now(),

      last_support_message_at =
        now(),

      updated_at =
        now()

    WHERE id =
          p_ticket_id;

    IF next_status
       IS DISTINCT FROM
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
        'support',
        'shared',
        'Status atualizado após resposta da equipe de suporte.',
        now()
      );
    END IF;
  END IF;

  RETURN created_message_id;
END;
$$;


COMMENT ON FUNCTION
  public.send_support_staff_message(
    uuid,
    text,
    text,
    jsonb
  )
IS
  'Registra resposta compartilhada ou nota interna com ator support, mesmo quando o operador também é o solicitante do chamado.';


-- =========================================================
-- 4. ALTERAÇÃO ADMINISTRATIVA DE STATUS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.change_support_staff_ticket_status(
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

  normalized_status text;

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
      'Usuário sem permissão para alterar este chamado.';
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
      trim(
        COALESCE(
          p_reason,
          ''
        )
      ),
      ''
    );

  IF normalized_status
     NOT IN (
       'open',
       'in_analysis',
       'waiting_user',
       'waiting_support',
       'resolved',
       'closed',
       'reopened'
     )
  THEN
    RAISE EXCEPTION
      'Status de suporte inválido.';
  END IF;

  IF normalized_status
     IN (
       'resolved',
       'closed'
     )
     AND normalized_reason
         IS NULL
  THEN
    RAISE EXCEPTION
      'A resolução ou o encerramento exige uma justificativa.';
  END IF;

  SELECT ticket.*
  INTO selected_ticket

  FROM public.support_tickets
    AS ticket

  WHERE ticket.id =
        p_ticket_id

  FOR UPDATE;

  IF NOT FOUND
  THEN
    RAISE EXCEPTION
      'Chamado não encontrado.';
  END IF;

  IF selected_ticket.status =
     normalized_status
  THEN
    RETURN p_ticket_id;
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
    'support',
    'shared',
    normalized_reason,
    now()
  );

  RETURN p_ticket_id;
END;
$$;


COMMENT ON FUNCTION
  public.change_support_staff_ticket_status(
    uuid,
    text,
    text
  )
IS
  'Altera o status como equipe de suporte, inclusive quando o operador também abriu o chamado.';


-- =========================================================
-- 5. PROTEÇÃO DAS FUNÇÕES
-- =========================================================

REVOKE ALL
ON FUNCTION
  public.list_active_support_staff()
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.send_support_staff_message(
    uuid,
    text,
    text,
    jsonb
  )
FROM PUBLIC;


REVOKE ALL
ON FUNCTION
  public.change_support_staff_ticket_status(
    uuid,
    text,
    text
  )
FROM PUBLIC;


-- =========================================================
-- 6. PERMISSÃO PARA USUÁRIOS AUTENTICADOS
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1

    FROM pg_roles

    WHERE rolname =
          'authenticated'
  )
  THEN
    GRANT EXECUTE
    ON FUNCTION
      public.list_active_support_staff()
    TO authenticated;


    GRANT EXECUTE
    ON FUNCTION
      public.send_support_staff_message(
        uuid,
        text,
        text,
        jsonb
      )
    TO authenticated;


    GRANT EXECUTE
    ON FUNCTION
      public.change_support_staff_ticket_status(
        uuid,
        text,
        text
      )
    TO authenticated;
  END IF;
END;
$$;


-- =========================================================
-- 7. VALIDAÇÃO FINAL DA MIGRAÇÃO
-- =========================================================

DO $$
BEGIN
  IF to_regprocedure(
       'public.list_active_support_staff()'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'A função list_active_support_staff() não foi criada.';
  END IF;

  IF to_regprocedure(
       'public.send_support_staff_message(uuid,text,text,jsonb)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'A função send_support_staff_message(uuid,text,text,jsonb) não foi criada.';
  END IF;

  IF to_regprocedure(
       'public.change_support_staff_ticket_status(uuid,text,text)'
     ) IS NULL
  THEN
    RAISE EXCEPTION
      'A função change_support_staff_ticket_status(uuid,text,text) não foi criada.';
  END IF;
END;
$$;


COMMIT;
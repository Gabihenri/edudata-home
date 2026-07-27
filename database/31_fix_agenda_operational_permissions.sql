BEGIN;

-- =========================================================
-- CORREÇÃO DE PRIVILÉGIOS DOS RECURSOS OPERACIONAIS DA AGENDA
-- =========================================================
--
-- Contexto:
--
-- As tabelas do ciclo operacional possuem políticas RLS para
-- SELECT, INSERT e UPDATE, porém a migration de fundação
-- revogou INSERT e UPDATE da role authenticated.
--
-- Sem o privilégio SQL básico, o PostgreSQL interrompe a
-- operação antes de avaliar as políticas RLS, produzindo:
--
-- permission denied for table agenda_lessons
--
-- Esta migration:
--
-- 1. preserva a RLS;
-- 2. preserva a governança;
-- 3. preserva a auditoria;
-- 4. preserva a proibição de DELETE físico;
-- 5. libera somente SELECT, INSERT e UPDATE para usuários
--    autenticados;
-- 6. mantém anon sem acesso aos recursos operacionais.
--
-- Arquitetura preservada:
--
-- Framework EDI
--      ↓
-- EIOS
--      ↓
-- Core Compartilhado
--      ↓
-- Agenda Inteligente EDI
--

-- =========================================================
-- 1. BLOQUEIO DO USUÁRIO ANÔNIMO
-- =========================================================

REVOKE ALL
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
FROM anon;


-- =========================================================
-- 2. PRIVILÉGIOS DO USUÁRIO AUTENTICADO
-- =========================================================
--
-- As políticas RLS continuam sendo responsáveis por decidir
-- quais registros cada usuário pode consultar, criar ou
-- atualizar.
--

GRANT SELECT, INSERT, UPDATE
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
TO authenticated;


-- =========================================================
-- 3. PROIBIÇÃO DE EXCLUSÃO FÍSICA
-- =========================================================
--
-- A exclusão permanece disponível apenas pelo fluxo oficial:
--
-- public.soft_delete_agenda_record()
--
-- A restauração permanece disponível pelo fluxo oficial:
--
-- public.restore_agenda_record()
--

REVOKE DELETE
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
FROM authenticated, anon;


-- =========================================================
-- 4. PRESERVAÇÃO DO SERVICE ROLE
-- =========================================================
--
-- Mantém operações administrativas e internas do EIOS.
--

GRANT ALL
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
TO service_role;


-- =========================================================
-- 5. GARANTIA DE RLS ATIVA
-- =========================================================

ALTER TABLE public.agenda_objectives
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agenda_lessons
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agenda_lesson_reflections
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agenda_planning_objectives
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agenda_lesson_objectives
  ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- 6. VALIDAÇÃO DOS PRIVILÉGIOS
-- =========================================================

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'agenda_objectives',
    'agenda_lessons',
    'agenda_lesson_reflections',
    'agenda_planning_objectives',
    'agenda_lesson_objectives'
  ]
  LOOP
    IF NOT has_table_privilege(
      'authenticated',
      format(
        'public.%I',
        target_table
      ),
      'SELECT'
    ) THEN
      RAISE EXCEPTION
        'A role authenticated não possui SELECT em public.%.',
        target_table;
    END IF;

    IF NOT has_table_privilege(
      'authenticated',
      format(
        'public.%I',
        target_table
      ),
      'INSERT'
    ) THEN
      RAISE EXCEPTION
        'A role authenticated não possui INSERT em public.%.',
        target_table;
    END IF;

    IF NOT has_table_privilege(
      'authenticated',
      format(
        'public.%I',
        target_table
      ),
      'UPDATE'
    ) THEN
      RAISE EXCEPTION
        'A role authenticated não possui UPDATE em public.%.',
        target_table;
    END IF;

    IF has_table_privilege(
      'authenticated',
      format(
        'public.%I',
        target_table
      ),
      'DELETE'
    ) THEN
      RAISE EXCEPTION
        'A role authenticated não pode possuir DELETE físico em public.%.',
        target_table;
    END IF;

    IF has_table_privilege(
      'anon',
      format(
        'public.%I',
        target_table
      ),
      'SELECT'
    )
    OR has_table_privilege(
      'anon',
      format(
        'public.%I',
        target_table
      ),
      'INSERT'
    )
    OR has_table_privilege(
      'anon',
      format(
        'public.%I',
        target_table
      ),
      'UPDATE'
    )
    OR has_table_privilege(
      'anon',
      format(
        'public.%I',
        target_table
      ),
      'DELETE'
    ) THEN
      RAISE EXCEPTION
        'A role anon possui privilégio indevido em public.%.',
        target_table;
    END IF;
  END LOOP;
END;
$$;


-- =========================================================
-- 7. COMENTÁRIO DA MIGRATION
-- =========================================================

COMMENT ON TABLE public.agenda_lessons IS
  'Aulas programadas e realizadas da Agenda Inteligente EDI, protegidas por RLS e liberadas para SELECT, INSERT e UPDATE da role authenticated. Exclusão física permanece bloqueada.';

COMMIT;
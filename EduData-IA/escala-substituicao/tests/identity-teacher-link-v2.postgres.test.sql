-- Escala Inteligente de Substituição
-- Harness isolado para academic_teacher_identity_links v2
-- NÃO EXECUTAR EM PRODUÇÃO.
-- O harness usa apenas schema sintético e termina em ROLLBACK.

BEGIN;

CREATE SCHEMA escala_identity_link_test;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE escala_identity_link_test.organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE escala_identity_link_test.schools (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_identity_link_test.organizations(id),
  name text NOT NULL,
  UNIQUE (id, organization_id)
);

CREATE TABLE escala_identity_link_test.auth_users (
  id uuid PRIMARY KEY,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE escala_identity_link_test.teacher_profiles (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  name text NOT NULL,
  UNIQUE (id, organization_id, school_id),
  FOREIGN KEY (school_id, organization_id)
    REFERENCES escala_identity_link_test.schools(id, organization_id)
);

CREATE TABLE escala_identity_link_test.organization_members (
  organization_id uuid NOT NULL REFERENCES escala_identity_link_test.organizations(id),
  school_id uuid,
  user_id uuid NOT NULL REFERENCES escala_identity_link_test.auth_users(id),
  status text NOT NULL CHECK (status IN ('active','inactive')),
  PRIMARY KEY (organization_id, user_id, school_id)
);

CREATE TABLE escala_identity_link_test.links (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  teacher_profile_id uuid NOT NULL,
  auth_user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','active','revoked')),
  valid_from date NOT NULL,
  valid_until date,
  source text NOT NULL,
  verified_by uuid,
  verified_at timestamptz,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= valid_from),
  FOREIGN KEY (school_id, organization_id)
    REFERENCES escala_identity_link_test.schools(id, organization_id),
  FOREIGN KEY (teacher_profile_id, organization_id, school_id)
    REFERENCES escala_identity_link_test.teacher_profiles(id, organization_id, school_id),
  FOREIGN KEY (auth_user_id)
    REFERENCES escala_identity_link_test.auth_users(id)
);

-- Impede duas relações ativas concorrentes para o mesmo professor.
ALTER TABLE escala_identity_link_test.links
  ADD CONSTRAINT links_teacher_active_period_excl
  EXCLUDE USING gist (
    teacher_profile_id WITH =,
    daterange(valid_from, COALESCE(valid_until + 1, 'infinity'::date), '[)') WITH &&
  ) WHERE (status = 'active');

-- Impede duas relações ativas concorrentes para o mesmo Auth dentro da mesma escola.
ALTER TABLE escala_identity_link_test.links
  ADD CONSTRAINT links_auth_school_active_period_excl
  EXCLUDE USING gist (
    auth_user_id WITH =,
    school_id WITH =,
    daterange(valid_from, COALESCE(valid_until + 1, 'infinity'::date), '[)') WITH &&
  ) WHERE (status = 'active');

-- Validação institucional: Auth precisa possuir membership ativo compatível.
CREATE FUNCTION escala_identity_link_test.validate_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM escala_identity_link_test.auth_users a
    WHERE a.id = NEW.auth_user_id AND a.active
  ) THEN
    RAISE EXCEPTION 'LINK-02: Auth inexistente/inativo';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM escala_identity_link_test.organization_members m
    WHERE m.organization_id = NEW.organization_id
      AND m.user_id = NEW.auth_user_id
      AND m.status = 'active'
      AND (m.school_id IS NULL OR m.school_id = NEW.school_id)
  ) THEN
    RAISE EXCEPTION 'LINK-04/LINK-05: membership institucional incompatível';
  END IF;

  IF NEW.status = 'active' AND (NEW.verified_by IS NULL OR NEW.verified_at IS NULL) THEN
    RAISE EXCEPTION 'LINK-15: vínculo ativo sem homologador/data';
  END IF;

  IF NEW.status = 'active'
     AND NOT (NEW.provenance ? 'homologation_evidence') THEN
    RAISE EXCEPTION 'LINK-01: evidência de homologação ausente';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_link
BEFORE INSERT OR UPDATE ON escala_identity_link_test.links
FOR EACH ROW EXECUTE FUNCTION escala_identity_link_test.validate_link();

-- Dados sintéticos.
INSERT INTO escala_identity_link_test.organizations VALUES
('00000000-0000-0000-0000-000000000001','Org A'),
('00000000-0000-0000-0000-000000000002','Org B');

INSERT INTO escala_identity_link_test.schools VALUES
('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','School A1'),
('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','School A2'),
('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000002','School B1');

INSERT INTO escala_identity_link_test.auth_users VALUES
('10000000-0000-0000-0000-000000000001',true),
('10000000-0000-0000-0000-000000000002',true),
('10000000-0000-0000-0000-000000000003',true),
('10000000-0000-0000-0000-000000000004',false);

INSERT INTO escala_identity_link_test.organization_members VALUES
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001','active'),
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000001','active'),
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000002','active'),
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000003','active');

INSERT INTO escala_identity_link_test.teacher_profiles VALUES
('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','Docente A'),
('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','Docente A Multi'),
('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','Docente B');

-- LINK-01: vínculo válido.
INSERT INTO escala_identity_link_test.links
VALUES ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active','2026-01-01',NULL,'manual_homologation','10000000-0000-0000-0000-000000000003',now(),' {"homologation_evidence":"EV-001"}'::jsonb,'{}'::jsonb,now(),now());

-- LINK-07: revogação preserva histórico.
UPDATE escala_identity_link_test.links
SET status='revoked', valid_until='2026-06-30', updated_at=now()
WHERE id='30000000-0000-0000-0000-000000000001';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escala_identity_link_test.links
    WHERE id='30000000-0000-0000-0000-000000000001' AND status='revoked'
  ) THEN RAISE EXCEPTION 'LINK-07 falhou'; END IF;
END $$;

-- LINK-08: reativação requer nova homologação.
INSERT INTO escala_identity_link_test.links
VALUES ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active','2026-07-01',NULL,'revalidation','10000000-0000-0000-0000-000000000003',now(),' {"homologation_evidence":"EV-002"}'::jsonb,'{}'::jsonb,now(),now());

-- LINK-10: reprodução temporal.
DO $$
DECLARE v uuid;
BEGIN
  SELECT id INTO v
  FROM escala_identity_link_test.links
  WHERE teacher_profile_id='20000000-0000-0000-0000-000000000001'
    AND status='active'
    AND valid_from <= '2026-08-01'
    AND (valid_until IS NULL OR valid_until >= '2026-08-01');
  IF v <> '30000000-0000-0000-0000-000000000002' THEN RAISE EXCEPTION 'LINK-10 falhou'; END IF;
END $$;

-- LINK-11/LINK-12: mesma identidade em escolas diferentes é permitida quando a política e o período forem compatíveis.
INSERT INTO escala_identity_link_test.links
VALUES ('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','active','2026-01-01',NULL,'manual_homologation','10000000-0000-0000-0000-000000000003',now(),' {"homologation_evidence":"EV-003","multi_school":true}'::jsonb,'{}'::jsonb,now(),now());

-- LINK-09: nome/e-mail isolado não cria active. Simula fila pendente.
INSERT INTO escala_identity_link_test.links
VALUES ('30000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','pending','2026-01-01',NULL,'name_email_review',NULL,NULL,'{"match_basis":"name_email_only"}'::jsonb,'{}'::jsonb,now(),now());

-- LINK-13: professor de outra organização deve falhar pela FK composta.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_identity_link_test.links
    VALUES ('30000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','pending','2026-01-01',NULL,'test',NULL,NULL,'{}'::jsonb,'{}'::jsonb,now(),now());
    RAISE EXCEPTION 'LINK-13 não bloqueou';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

-- LINK-14: intervalo inválido deve falhar.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_identity_link_test.links
    VALUES ('30000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','pending','2026-09-01','2026-08-01','test',NULL,NULL,'{}'::jsonb,'{}'::jsonb,now(),now());
    RAISE EXCEPTION 'LINK-14 não bloqueou';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

-- LINK-15: active sem homologador/data deve falhar.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_identity_link_test.links
    VALUES ('30000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','active','2026-09-01',NULL,'test',NULL,NULL,'{"homologation_evidence":"EV-X"}'::jsonb,'{}'::jsonb,now(),now());
    RAISE EXCEPTION 'LINK-15 não bloqueou';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'LINK-15:%' THEN RAISE; END IF;
  END;
END $$;

-- LINK-06: sobreposição ativa deve falhar.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_identity_link_test.links
    VALUES ('30000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active','2026-08-01',NULL,'test','10000000-0000-0000-0000-000000000003',now(),'{"homologation_evidence":"EV-X"}'::jsonb,'{}'::jsonb,now(),now());
    RAISE EXCEPTION 'LINK-06 não bloqueou';
  EXCEPTION WHEN exclusion_violation THEN NULL;
  END;
END $$;

-- LINK-02: Auth inativo/inexistente.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_identity_link_test.links
    VALUES ('30000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','pending','2026-01-01',NULL,'test',NULL,NULL,'{}'::jsonb,'{}'::jsonb,now(),now());
    RAISE EXCEPTION 'LINK-02 não bloqueou';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'LINK-02:%' THEN RAISE; END IF;
  END;
END $$;

-- LINK-03: teacher inexistente deve falhar pela FK.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_identity_link_test.links
    VALUES ('30000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000009999','10000000-0000-0000-0000-000000000001','pending','2026-01-01',NULL,'test',NULL,NULL,'{}'::jsonb,'{}'::jsonb,now(),now());
    RAISE EXCEPTION 'LINK-03 não bloqueou';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

-- Resultado mínimo automatizado.
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c FROM escala_identity_link_test.links;
  IF c <> 4 THEN RAISE EXCEPTION 'Contagem inesperada após testes: %', c; END IF;
END $$;

-- O isolamento é deliberado: nenhum artefato permanece no banco após o harness.
ROLLBACK;

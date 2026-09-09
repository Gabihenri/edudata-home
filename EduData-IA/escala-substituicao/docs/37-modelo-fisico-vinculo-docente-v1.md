# 37 — Modelo Físico Candidato do Vínculo de Identidade Docente v1

**Data:** 2026-09-09  
**Status:** 🟡 CANDIDATO AUDITÁVEL — NÃO EXECUTAR DDL  
**Produto:** Escala Inteligente de Substituição

## 1. Objetivo

Materializar, em modelo PostgreSQL isolado, a ponte entre identidade autenticada e identidade acadêmica docente sem restaurar o modelo legado e sem alterar o Core de produção.

O modelo é candidato para `academic_teacher_identity_links` e somente poderá virar migration após auditoria, homologação de RLS e fechamento das dependências críticas.

## 2. Decisões preservadas

- `teacher_profiles.id` permanece a identidade acadêmica do domínio.
- `auth.users.id` permanece a identidade de autenticação.
- `user_profiles.user_id` é a ponte estrutural já comprovada entre Auth e perfil de usuário.
- `organization_members` permanece a base de autorização institucional.
- `academic_teacher_identity_links` resolve exclusivamente a correspondência Auth ↔ docente.
- Não haverá matching automático por nome, e-mail, cargo ou similaridade.
- Não haverá novo RBAC.
- Não haverá terceiro ledger de auditoria.
- Nenhum DDL deste documento deve ser executado na produção nesta fase.

## 3. Modelo lógico

```text
auth.users.id
      │
      ▼
user_profiles.user_id
      │
      ▼
organization_members.user_id
      │
      │ autorização
      ▼
academic_teacher_identity_links
      │                 │
      ▼                 ▼
auth_user_id      teacher_profile_id
                        │
                        ▼
                 teacher_profiles.id
```

## 4. Estrutura candidata

### `academic_teacher_identity_links`

| Campo | Tipo | Obrigatório | Regra |
|---|---|---:|---|
| `id` | uuid | sim | PK |
| `organization_id` | uuid | sim | FK `organizations.id` |
| `school_id` | uuid | sim | FK `schools.id` |
| `teacher_profile_id` | uuid | sim | FK `teacher_profiles.id` |
| `auth_user_id` | uuid | sim | identidade Auth; mecanismo de referência ainda a homologar |
| `status` | text | sim | `pending`, `active`, `revoked` |
| `valid_from` | date | sim | início da vigência |
| `valid_until` | date | não | fim da vigência; nulo = vigência aberta |
| `source` | text | sim | origem da associação |
| `verified_by` | uuid | não | identidade do homologador |
| `verified_at` | timestamptz | não | momento da homologação |
| `provenance` | jsonb | sim | evidências/origem; default `{}` |
| `metadata` | jsonb | sim | extensões não canônicas; default `{}` |
| `created_at` | timestamptz | sim | criação |
| `updated_at` | timestamptz | sim | última alteração |

## 5. Regras de integridade

### 5.1 Domínio de status

Somente os estados abaixo são válidos:

```text
pending → active → revoked
```

A aplicação pode permitir correções administrativas controladas, mas uma associação historicamente utilizada não deve ser apagada fisicamente.

### 5.2 Vigência

`valid_until` deve ser maior ou igual a `valid_from`.

Para avaliar sobreposição de intervalos, considerar `valid_until IS NULL` como intervalo aberto.

Conceitualmente:

```text
A.start <= B.end
AND B.start <= A.end
```

com tratamento específico para extremos abertos.

Para relações temporais estritamente incompatíveis, a regra operacional deve evitar duas associações `active` concorrentes no mesmo escopo.

### 5.3 Integridade institucional

O `school_id` deve pertencer a `organization_id`.

O `teacher_profile_id` deve representar docente compatível com a organização/escola do vínculo.

Como `teacher_profiles` atualmente possui `school_id` e `organization_id`, essa compatibilidade deverá ser garantida por constraint composta, trigger ou função de validação homologada, sem depender de validação apenas no frontend.

### 5.4 Identidade Auth

`auth_user_id` não deve ser aceito apenas porque possui formato UUID.

A estratégia de referência a `auth.users` deve ser definida após validação de segurança do projeto Supabase. São aceitáveis, mediante homologação, FK direta ou mecanismo controlado de validação no servidor/banco.

Não criar cópia de usuários em `public`.

## 6. Multi-escola

A arquitetura deve permitir que uma mesma identidade Auth tenha vínculos acadêmicos válidos em mais de uma escola quando isso representar situação institucional legítima.

Portanto, **não** aplicar uma unicidade global simples sobre `auth_user_id`.

A regra deve ser contextual:

- mesmo Auth + mesma escola + período incompatível → bloqueado;
- mesmo Auth + escolas diferentes + períodos compatíveis → permitido somente se a política institucional homologada permitir;
- mesmo `teacher_profile_id` + Auths diferentes + período incompatível → bloqueado quando a relação institucional for 1:1;
- toda exceção multi-escola deve ser explicitamente representada e auditável.

## 7. Homologação

Um vínculo somente pode atingir `active` quando houver:

1. identidade Auth comprovada;
2. `teacher_profile_id` comprovado;
3. organização e escola compatíveis;
4. origem registrada;
5. responsável pela validação;
6. data/hora da validação;
7. vigência definida;
8. proveniência suficiente para reprodução da decisão.

`pending` não pode alimentar automaticamente a grade publicada nem o motor de substituição.

## 8. RLS e autorização — contrato candidato

A tabela não deve ser liberada para escrita geral de usuários autenticados.

### Leitura

A leitura deve depender cumulativamente do contexto institucional e das permissões do produto Escala, respeitando as funções centrais de identidade já existentes.

### Escrita

Operações administrativas de criação, alteração, revogação e homologação devem exigir permissão específica do produto, a ser homologada no catálogo `identity_product_permissions`.

Permissões candidatas:

- `escala.view_candidates` para consulta operacional quando aplicável;
- `escala.view_audit` para contexto de auditoria;
- uma permissão administrativa específica para homologação de identidade docente, caso o catálogo central ainda não possua essa capacidade.

**Não criar policy baseada somente em `organization_id`.**

## 9. Auditoria

Eventos de criação, homologação, alteração de vigência e revogação devem ser registrados no ledger central `identity_audit_logs`.

Quando uma alteração fizer parte de fluxo decisório da Escala, o evento poderá também ser relacionado ao EIOS governance existente.

Não criar `academic_teacher_identity_audit_logs`.

Campos mínimos de auditoria esperados:

- ator Auth;
- ação;
- entidade e identificador;
- estado anterior/posterior quando aplicável;
- organização/escola;
- timestamp;
- proveniência;
- justificativa quando houver override.

## 10. Reprodução histórica

O vínculo deve ser tratado como entidade versionável por vigência e histórico, não como simples atributo mutável do professor.

Uma execução da Escala deve conseguir reconstruir qual vínculo estava vigente no momento do processamento.

Alterações posteriores não podem reescrever silenciosamente a interpretação histórica de uma execução já registrada.

## 11. Interface com a grade oficial

A grade oficial somente poderá publicar uma referência docente resolvida quando:

```text
Auth comprovado
      AND
teacher_profile comprovado
      AND
link = active
      AND
vigência cobre a ocorrência
      AND
organização/escola compatíveis
```

Se qualquer condição falhar, a linha permanece em staging como `unresolved` ou `ambiguous`.

## 12. Interface com o motor

O motor usa `teacher_profile_id` como identidade acadêmica.

O `auth_user_id` é utilizado para:

- autorização;
- autoria da operação;
- responsabilidade pela decisão;
- auditoria.

Não substituir `teacher_profile_id` por Auth UUID no domínio da Escala.

## 13. DDL conceitual — não executável

O seguinte é apenas uma representação estrutural para orientar o harness futuro:

```sql
CREATE TABLE academic_teacher_identity_links (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  teacher_profile_id uuid NOT NULL,
  auth_user_id uuid NOT NULL,
  status text NOT NULL,
  valid_from date NOT NULL,
  valid_until date,
  source text NOT NULL,
  verified_by uuid,
  verified_at timestamptz,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
```

**Este bloco não constitui migration e não deve ser executado na produção.**

## 14. Testes físicos obrigatórios

O harness deverá comprovar, no mínimo:

| ID | Cenário | Resultado esperado |
|---|---|---|
| LINK-01 | vínculo válido | aceita `active` após homologação |
| LINK-02 | Auth inexistente | bloqueia |
| LINK-03 | teacher inexistente | bloqueia |
| LINK-04 | organização divergente | bloqueia |
| LINK-05 | escola divergente | bloqueia |
| LINK-06 | sobreposição ativa | bloqueia |
| LINK-07 | revogação | preserva histórico |
| LINK-08 | reativação | exige nova homologação/auditoria |
| LINK-09 | nome/e-mail como única evidência | permanece `pending` |
| LINK-10 | reprodução temporal | recupera vínculo vigente correto |
| LINK-11 | multi-escola legítima | permitido conforme política homologada |
| LINK-12 | Auth mesmo em escolas diferentes | não bloqueia globalmente de forma indevida |
| LINK-13 | teacher com organização incompatível | bloqueia |
| LINK-14 | `valid_until < valid_from` | bloqueia |
| LINK-15 | vínculo ativo sem homologador quando obrigatório | bloqueia |

## 15. Dependências antes da produção

1. confirmar mecanismo seguro de referência a `auth.users`;
2. definir política oficial de multi-escola;
3. homologar permissão administrativa de vínculo docente;
4. homologar RLS com contexto institucional e produto;
5. executar harness em PostgreSQL isolado;
6. auditar integração com `identity_audit_logs`;
7. validar reprodução histórica;
8. somente então preparar migration de produção.

## 16. Gate

**Estado atual: AMARELO / NÃO LIBERADO.**

O modelo físico candidato está definido, mas ainda existem dependências críticas abertas:

- mecanismo Auth → ponte;
- política multi-escola;
- RLS;
- permissão administrativa;
- execução do harness;
- auditoria final.

**Não executar DDL de produção.**

### Próximo passo

Criar o harness físico isolado `tests/identity-teacher-link-v2.postgres.test.sql`, cobrindo LINK-01..LINK-15 e sem qualquer conexão com o schema produtivo.
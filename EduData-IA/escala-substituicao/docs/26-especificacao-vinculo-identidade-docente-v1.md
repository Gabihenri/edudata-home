# 26 — Especificação do Vínculo de Identidade Docente v1

**Data:** 2026-09-09  
**Status:** 🟡 ESPECIFICAÇÃO HOMOLOGÁVEL — NÃO EXECUTAR DDL  
**Produto:** Escala Inteligente de Substituição

## 1. Objetivo

Definir o contrato físico e semântico do vínculo entre a identidade autenticada e o perfil docente, sem restaurar o modelo legado `public.users` nem assumir que `teacher_profiles.id = auth.users.id`.

## 2. Evidências

O Core atual possui `auth.users`, `user_profiles.user_id`, `organization_members.user_id` e `teacher_profiles`. A relação Auth → `user_profiles` é estruturalmente estabelecida. A relação `user_profiles`/Auth → `teacher_profiles` não foi comprovada.

O SQL legado `database/03_users_profiles.sql` mostra que anteriormente `teacher_profiles.user_id` referenciava `users.id`. Essa evidência confirma uma relação histórica, mas não autoriza restaurar o modelo legado no Core atual.

## 3. Decisão

Adotar, caso nenhuma relação canônica adicional seja encontrada, uma entidade explícita:

`academic_teacher_identity_links`

Ela será uma ponte de identidade acadêmica, não um novo usuário, não um novo RBAC e não uma duplicação de `teacher_profiles`.

Fluxo:

```text
auth.users.id
     ↓
user_profiles.user_id
     ↓
organization_members.user_id
     ↓
academic_teacher_identity_links.auth_user_id
     ↓
academic_teacher_identity_links.teacher_profile_id
     ↓
teacher_profiles.id
```

`organization_members` continua sendo a base de autorização; o vínculo acadêmico resolve somente a correspondência entre pessoa autenticada e perfil docente.

## 4. Modelo mínimo proposto

### `academic_teacher_identity_links`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | NOT NULL, FK `organizations.id` |
| `school_id` | uuid | NOT NULL, FK `schools.id` |
| `teacher_profile_id` | uuid | NOT NULL, FK `teacher_profiles.id` |
| `auth_user_id` | uuid | NOT NULL, referência a Auth, conforme mecanismo Supabase homologado |
| `status` | text | `pending`, `active`, `revoked` |
| `valid_from` | date | NOT NULL |
| `valid_until` | date | opcional; >= `valid_from` |
| `source` | text | NOT NULL |
| `verified_by` | uuid | responsável pela homologação |
| `verified_at` | timestamptz | obrigatório para vínculo ativo quando política exigir |
| `provenance` | jsonb | NOT NULL, default `{}` |
| `metadata` | jsonb | NOT NULL, default `{}` |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

## 5. Integridade institucional

O vínculo deve obedecer simultaneamente:

```text
organization_id = organization do school_id
organization_id = organization do teacher_profile
```

A implementação deve impedir vínculo cruzado entre instituições.

Também deve impedir associação de perfil docente de uma escola a `school_id` incompatível, salvo regra institucional explícita para docentes com atuação multi-escola.

## 6. Unicidade e temporalidade

Não deve existir mais de um vínculo `active` para a mesma identidade Auth dentro do mesmo escopo e período incompatível.

Também não deve existir mais de um vínculo ativo concorrente para o mesmo `teacher_profile_id` no mesmo escopo temporal quando isso representar uma relação 1:1 institucional.

A política de múltiplas escolas deve ser explícita; não deve ser inferida pela constraint.

Para intervalos de validade A e B, há sobreposição quando:

`A.valid_from < B.valid_until AND B.valid_from < A.valid_until`

com tratamento explícito para `valid_until IS NULL` como vigência aberta.

## 7. Estados

- `pending`: associação registrada, ainda não homologada;
- `active`: associação validada e utilizável pelo domínio;
- `revoked`: associação invalidada, preservada para histórico.

Não usar exclusão física para desfazer uma associação já utilizada.

## 8. Canonização

### Permitido como evidência

- identificador Auth;
- identificador institucional docente homologado;
- referência previamente validada por gestor;
- registro de origem/proveniência.

### Não permitido como chave automática

- nome;
- e-mail;
- cargo textual;
- ordem de importação;
- escola isoladamente;
- similaridade/fuzzy matching.

Nome/e-mail podem auxiliar a fila de revisão, mas nunca produzir `active` automaticamente quando não houver identificador homologado.

## 9. Homologação

A criação de vínculo ativo deve registrar:

1. identidade Auth;
2. perfil docente;
3. organização;
4. escola;
5. origem da associação;
6. responsável pela validação;
7. timestamp;
8. vigência;
9. evidência/proveniência.

A operação deve ser auditável em `identity_audit_logs` e, quando integrada ao ciclo decisório da Escala, em `eios_governance_*`, sem criar terceiro ledger.

## 10. RLS e autorização

O vínculo não deve ser protegido apenas por `organization_id`.

A autorização deve combinar:

- `auth.uid()`;
- membership institucional;
- escola;
- escopo de responsabilidade;
- produto Escala;
- permissão específica.

Professor comum não pode alterar vínculos. A homologação deve exigir permissão administrativa específica, prevista no conjunto `escala.*`.

## 11. Relação com a grade

Somente docentes com vínculo `active` e vigente poderão ser associados automaticamente a entradas/ocorrências da grade oficial.

Linhas de importação sem vínculo resolvido devem permanecer em staging como `unresolved` ou `ambiguous`.

Não publicar uma grade contendo professor sem identidade docente homologada.

## 12. Relação com o motor de substituição

O motor deve trabalhar com `teacher_profile_id` como identidade acadêmica de domínio.

A identidade Auth é necessária para autorização, autoria e responsabilidade, mas não deve substituir a identidade acadêmica do docente.

A execução deve preservar ambos os identificadores quando necessários:

```text
engine_run
  → teacher_profile_id
  → auth actor / decision actor
```

Isso permite distinguir claramente:

- quem é o docente envolvido;
- quem executou o processamento;
- quem confirmou a substituição.

## 13. Testes obrigatórios

### ID-01 — vínculo válido

Auth + perfil docente + organização/escola compatíveis → `active` permitido após homologação.

### ID-02 — Auth inexistente

Identidade Auth não comprovada → bloqueio.

### ID-03 — perfil docente inexistente

`teacher_profile_id` inexistente → bloqueio por FK.

### ID-04 — instituição divergente

Auth/membership de organização A + professor de organização B → bloqueio.

### ID-05 — escola divergente

Professor incompatível com escola → bloqueio, salvo regra multi-escola explicitamente homologada.

### ID-06 — duplicidade ativa

Dois vínculos concorrentes incompatíveis → bloqueio.

### ID-07 — revogação

Vínculo utilizado historicamente pode ser revogado sem apagar o registro.

### ID-08 — reativação

Reativação exige nova validação e registro de auditoria; não deve apagar o histórico da revogação.

### ID-09 — fuzzy match

Correspondência somente por nome/e-mail aproximado → nunca `active` automaticamente.

### ID-10 — reprodução histórica

Uma execução antiga deve continuar identificando o vínculo/versão utilizado naquele momento mesmo após alteração posterior.

## 14. Auditoria desta especificação

| ID | Achado | Severidade | Estado |
|---|---|---|---|
| ID-AUD-01 | modelo legado não deve ser restaurado | Critical | **Fechado como decisão arquitetural** |
| ID-AUD-02 | Auth → `user_profiles` | High | **Fechado estruturalmente** |
| ID-AUD-03 | Auth → docente sem vínculo atual | Critical | **Aberto** |
| ID-AUD-04 | ponte explícita versionada | Critical | **Definida** |
| ID-AUD-05 | integridade organização/escola | Critical | **Obrigatória** |
| ID-AUD-06 | unicidade temporal | High | **Obrigatória / testar** |
| ID-AUD-07 | canonização sem fuzzy | Critical | **Fechado como regra** |
| ID-AUD-08 | RLS por produto + escopo | High | **A homologar** |
| ID-AUD-09 | auditoria central | High | **Definida** |
| ID-AUD-10 | reprodução histórica | High | **Obrigatória / testar** |

## 15. Gate

Este documento não libera DDL.

Antes da migration de produção:

1. confirmar se existe relação canônica adicional no Core atual;
2. validar FKs possíveis sem criar dependência indevida em `auth`;
3. validar política de múltiplas escolas;
4. implementar testes ID-01–ID-10 em ambiente isolado;
5. homologar RLS;
6. homologar permissões `escala.*`;
7. integrar auditoria/governance;
8. executar auditoria final sem Critical aberto.

**Decisão atual: DDL DE PRODUÇÃO BLOQUEADO.**

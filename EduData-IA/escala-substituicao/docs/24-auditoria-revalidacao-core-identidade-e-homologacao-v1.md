# 24 — Auditoria de Revalidação do Core e Homologação PostgreSQL v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — NOVA EVIDÊNCIA REGISTRADA; DDL DE PRODUÇÃO CONTINUA BLOQUEADO

## 1. Objetivo

Revalidar as dependências do Core antes da próxima etapa da Escala e registrar a primeira materialização do harness PostgreSQL sintético.

A auditoria foi realizada somente com consultas read-only no projeto Supabase `EduData IA` (`ihchzfndmdwtoabttkil`) e leitura do repositório. Nenhum DDL foi executado no projeto remoto.

## 2. Nova evidência física

A consulta atual confirmou a existência de:

- `user_profiles`;
- `identity_audit_logs`;
- `organization_members`;
- `teacher_profiles`.

Também confirmou que `user_profiles.user_id` é `uuid NOT NULL` e que `identity_audit_logs` possui `actor_user_id`, `organization_id`, `school_id`, `product_code`, `action`, `resource_type`, `resource_id`, `success`, `before_data`, `after_data`, `metadata` e `occurred_at`.

`organization_members` possui `user_id`, `organization_id`, `school_id`, `role`, `status`, `hierarchy_level`, `scope_type`, `scope_id`, responsabilidades e permissões institucionais.

`teacher_profiles` continua sem `user_id` e sua única FK identificada é `school_id → schools.id`.

## 3. Correção de auditoria anterior

Documentos anteriores mencionaram a ausência de estruturas de identidade/perfil de usuário de forma ampla. Essa formulação deve ser interpretada como ausência de `public.users`/`public.identity_users`, não como ausência de todo o modelo de identidade.

A existência de `user_profiles` melhora significativamente a hipótese de integração, mas **não prova** o vínculo `user_profiles.user_id ↔ teacher_profiles.id`.

Não foi encontrada FK entre `user_profiles` e `teacher_profiles`, nem FK de `teacher_profiles.id` para uma identidade autenticada.

Portanto:

```text
user_profiles.user_id
        ≠ relação comprovada = teacher_profiles.id
```

A decisão segura permanece: não inferir identidade por nome/e-mail e não assumir igualdade de UUIDs.

## 4. Impacto sobre `academic_teacher_identity_links`

O vínculo explícito continua tecnicamente necessário como hipótese de projeto, mas sua criação deve ocorrer somente após auditoria adicional de:

1. FKs de `user_profiles`;
2. funções de identidade existentes;
3. dados de `user_profiles` e `organization_members`, respeitando privacidade;
4. eventual relação existente fora das FKs simples;
5. comportamento de Auth/RLS.

Se uma relação canônica já existir, a Escala deve reutilizá-la. Se não existir, o vínculo explícito será materializado no Core.

## 5. Auditoria de governança

`identity_audit_logs` é uma evidência importante de que o Core possui um ledger de auditoria de identidade separado das estruturas `eios_governance_*`.

Decisão:

- `identity_audit_logs` deve registrar eventos de acesso/autorização;
- `eios_governance_*` deve registrar provenance/workflow/decisão quando sua integração for homologada;
- a Escala não deve criar um terceiro ledger concorrente.

A migration EIOS Governance existente usa registros append-only e políticas de consulta/inserção baseadas nas funções de autorização da Agenda. Isso ainda precisa ser homologado para o produto Escala; não é autorização automática da Escala.

## 6. Harness PostgreSQL criado

Arquivo:

`EduData-IA/escala-substituicao/tests/adapter-staging-grade.postgres.test.sql`

Commit:

`c064baf90d415a49f81dbeca738b00c07a3ca9c5`

O harness:

- usa schema isolado `escala_test`;
- utiliza UUIDs sintéticos;
- executa dentro de `BEGIN … ROLLBACK`;
- não referencia tabelas produtivas da Escala;
- cria constraints mínimas de escopo, validade e temporalidade;
- verifica matching, payload bruto/normalizado, idempotência, versionamento e sobreposição;
- reserva RLS e Governance para a camada Auth/EIOS do ambiente isolado.

O harness contém 20 assertions planejadas e cobre os comportamentos centrais do contrato.

## 7. Limite de execução

O SQL **não foi executado no projeto remoto**.

Motivos:

- o projeto remoto não possui as entidades candidatas oficiais da grade;
- `pgtap` não está instalado no projeto remoto;
- o harness é deliberadamente dependente de ambiente local/efêmero;
- executar `CREATE EXTENSION pgtap` ou criar schema de teste no remoto seria uma alteração desnecessária no ambiente de produção.

A execução deverá ocorrer somente após disponibilização/comprovação do ambiente local Supabase.

## 8. Matriz de auditoria

| ID | Achado | Severidade | Resultado |
|---|---|---:|---|
| REVAL-01 | `user_profiles` existe e possui `user_id` | High | Confirmado |
| REVAL-02 | vínculo `user_profiles` ↔ `teacher_profiles` não comprovado | Critical | Aberto |
| REVAL-03 | `identity_audit_logs` existe | High | Confirmado |
| REVAL-04 | `organization_members` possui escopo institucional | High | Confirmado |
| REVAL-05 | `teacher_profiles.id` continua sem equivalência Auth comprovada | Critical | Aberto |
| REVAL-06 | harness PostgreSQL sintético materializado | High | Implementado |
| REVAL-07 | harness ainda não executado em ambiente isolado | High | Aberto |
| REVAL-08 | RLS Escala ainda não materializado | Critical | Aberto |
| REVAL-09 | fonte oficial da grade ainda ausente | Critical | Aberto |
| REVAL-10 | turma/componente canônicos ainda ausentes | Critical | Aberto |
| REVAL-11 | EIOS Governance ainda não homologado para Escala | Medium | Aberto |
| REVAL-12 | nenhum DDL remoto executado | — | Confirmado |

## 9. Decisão sobre o gate

A nova evidência **não libera o DDL de produção**.

Ela, porém, reduz uma incerteza anterior: o Core possui `user_profiles` e `identity_audit_logs`, portanto a próxima auditoria de identidade deve partir dessas estruturas, e não de uma suposição de que o Core não possui perfil de usuário.

## 10. Próximo avanço

A próxima etapa deve:

1. auditar as FKs e funções de `user_profiles`/`organization_members` com foco exclusivo em identidade;
2. determinar se existe relação canônica Auth ↔ perfil docente;
3. preparar o ambiente local Supabase para executar o harness;
4. executar e registrar as 20 assertions;
5. corrigir eventuais falhas do harness;
6. somente depois homologar constraints físicas da futura grade.

**Regra permanente:**

```text
Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar
```

**Conclusão:** avançamos de desenho para um primeiro artefato SQL executável de homologação, mas a Escala continua sem autorização para migration produtiva.
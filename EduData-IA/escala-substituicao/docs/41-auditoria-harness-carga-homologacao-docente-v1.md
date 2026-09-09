# 41 — Auditoria do Harness de Carga e Homologação Docente v1

**Status:** concluído — auditoria estrutural; execução PostgreSQL real pendente.

## Escopo

Auditar `tests/teacher-load-homologation.postgres.test.sql` contra o contrato `40-contrato-carga-homologacao-docente-v1.md`, sem executar DDL em produção.

## Resultado

| ID | Controle | Resultado | Evidência |
|---|---|---|---|
| DOC-HARNESS-01 | Isolamento por schema e rollback | 🟢 | schema `escala_doc_test`; `ROLLBACK` final |
| DOC-HARNESS-02 | Contexto institucional | 🟢 | FKs compostas org/escola |
| DOC-HARNESS-03 | Identificador institucional | 🟢 | `institutional_teacher_id` + unicidade contextual |
| DOC-HARNESS-04 | Preservação raw/normalized | 🟢 | dois payloads distintos |
| DOC-HARNESS-05 | Estados de matching | 🟢 | resolved/ambiguous/unresolved/rejected |
| DOC-HARNESS-06 | Proibição de nome/email/fuzzy | 🟢 | trigger explícito |
| DOC-HARNESS-07 | Gate de canonicalização | 🟢 | resolved exige `teacher_profile_id` |
| DOC-HARNESS-08 | Idempotência da carga | 🟢 | hash único por contexto |
| DOC-HARNESS-09 | Vigência temporal | 🟢 | intervalo + exclusão de sobreposição |
| DOC-HARNESS-10 | Auth ativa | 🟢 | trigger de validação |
| DOC-HARNESS-11 | Membership compatível | 🟢 | FK contextual composta |
| DOC-HARNESS-12 | Professor ativo | 🟢 | trigger de validação |
| DOC-HARNESS-13 | Verificação humana | 🟢 | active exige verified_by/verified_at |
| DOC-HARNESS-14 | Multi-escola contextual | 🟢 | vínculos independentes por escola |
| DOC-HARNESS-15 | Histórico/revogação | 🟢 | vínculo revogado preservado |
| DOC-HARNESS-16 | Cross-organization | 🟢 | FKs compostas bloqueiam |
| DOC-HARNESS-17 | Professor inexistente | 🟢 | FK bloqueia |
| DOC-HARNESS-18 | Promoção após validação | 🟢 | assertion DOC-20 |
| DOC-HARNESS-19 | Execução PostgreSQL real | 🟡 | pendente de ambiente local/homologação |
| DOC-HARNESS-20 | RLS real | 🔴 | ainda não pode ser homologado sem modelo físico aprovado e dados reais |

## Achado crítico preservado

A estrutura do teste não resolve a ausência atual de uma fonte oficial de docentes, de identificadores institucionais reais e de dados operacionais em `teacher_profiles`. O harness prova comportamento do modelo, não sua integração com dados reais.

Também não autoriza produção: RLS, catálogo de permissões `escala` e fluxo administrativo de homologação continuam pendentes.

## Correção necessária antes da execução real

1. disponibilizar uma amostra real ou homologada da fonte institucional de docentes;
2. identificar o campo institucional estável usado pela fonte;
3. homologar o permissionamento central do produto Escala;
4. definir o ator autorizado a homologar/revogar vínculos;
5. executar o harness em PostgreSQL isolado;
6. registrar resultados e corrigir qualquer falha antes de qualquer DDL produtivo.

## Gate

**VERDE:** contrato e comportamento estrutural do harness.

**AMARELO:** execução PostgreSQL e integração de dados.

**VERMELHO:** produção — permanece bloqueada por achados críticos externos ao harness.

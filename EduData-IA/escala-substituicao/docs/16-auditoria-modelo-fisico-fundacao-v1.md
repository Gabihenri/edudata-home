# 16 — Auditoria do Modelo Físico da Fundação v1

**Data:** 2026-09-09  
**Artefato auditado:** `15-modelo-fisico-fundacao-v1.md`  
**Status:** AUDITORIA CONCLUÍDA — DDL DE PRODUÇÃO BLOQUEADO

## 1. Objetivo

Auditar o modelo físico candidato antes de qualquer materialização no Supabase, verificando dependências, semântica, integridade, temporalidade, importação, autorização e governança.

## 2. Evidências utilizadas

- auditoria física do projeto Supabase `EduData IA`;
- estrutura atual de `organizations`, `schools`, `teacher_profiles`, `school_years`, `academic_periods`;
- estruturas `identity_*`;
- estruturas `eios_governance_*`;
- Agenda (`agenda_classes`, `agenda_lessons`, `agenda_schedule_templates`);
- contratos EIOS acadêmicos e semânticos;
- documentos 07–15 da Escala.

## 3. Resultado por controle

| Controle | Resultado | Severidade |
|---|---|---|
| Dependência de `schedules` legado | Não utilizada | OK |
| Dependência de `classes/subjects` legados | Não utilizada | OK |
| Identidade docente ↔ Auth | Ainda não comprovada | High |
| Turma oficial | Modelo proposto no Core | Critical — pré-DDL |
| Componente oficial | Modelo proposto no Core | Critical — pré-DDL |
| Grade versionada | Modelo proposto | Critical — pré-DDL |
| Ocorrência temporal | Modelo proposto | High — pré-DDL |
| Matching/importação | Staging previsto | High |
| RLS por organização apenas | Rejeitado | High |
| Permissões específicas Escala | Ainda não materializadas | High |
| Governance EIOS | Integração prevista | Medium |
| Histórico/reprocessamento | Preservado por versão/run | High |

## 4. Achados

### PHY-AUD-01 — Identidade docente

**Severidade:** High  
**Status:** Aberto

Não existe evidência suficiente para afirmar equivalência entre `teacher_profiles.id` e a identidade autenticada. O modelo corretamente mantém a associação como condicional.

**Ação:** auditar dados reais e decidir equivalência comprovada ou vínculo explícito.

### PHY-AUD-02 — Turma e componente

**Severidade:** Critical  
**Status:** Aberto

As entidades propostas são coerentes com os contratos EIOS, mas sua criação física ainda representa evolução do Core compartilhado. Devem ser submetidas a revisão de impacto sobre os demais produtos antes do DDL.

### PHY-AUD-03 — Grade oficial

**Severidade:** Critical  
**Status:** Aberto

O desenho está adequado conceitualmente: versão → entry → occurrence. Entretanto, ainda falta definir o formato real de importação/publicação e o responsável institucional pela publicação.

### PHY-AUD-04 — Integridade composta

**Severidade:** High  
**Status:** Aberto

FKs isoladas não garantem todas as relações de mesma organização/escola. A migration futura deve usar constraints, triggers ou funções transacionais auditadas para impedir cruzamentos de escopo.

### PHY-AUD-05 — RLS

**Severidade:** High  
**Status:** Aberto

O modelo corretamente rejeita `same_organization` como autorização suficiente. Ainda é necessário materializar `product_code` e permissões específicas da Escala e testar os escopos de responsabilidade.

### PHY-AUD-06 — Governança

**Severidade:** Medium  
**Status:** Aberto

A integração com EIOS Governance é recomendada, mas as tabelas/funções atuais precisam ser testadas para `resource_type`, `run_id`, provenance e decisão da Escala antes da reutilização em produção.

### PHY-AUD-07 — Staging

**Severidade:** High  
**Status:** Aberto

O modelo define staging conceitualmente, mas não fixa ainda nomes físicos. Isso é intencional: o contrato de importação precisa ser definido antes da migration para evitar uma camada de importação descartável.

## 5. Testes de segurança obrigatórios

Antes do DDL:

- usuário sem `escala.view_candidates` não pode consultar candidatos;
- professor não pode consultar scores de colegas por simples pertencimento à organização;
- usuário de outra escola não pode acessar ocorrências/vagas;
- somente escopo autorizado pode confirmar;
- override exige justificativa e auditoria;
- tentativa de acesso indevido deve gerar evento quando aplicável.

## 6. Testes de integridade obrigatórios

- escola e organização consistentes;
- professor pertencente ao escopo da escola;
- turma e componente válidos;
- versão publicada única;
- validade temporal coerente;
- entry contida na versão;
- occurrence derivada de entry válida;
- intervalos com `end > start`;
- nenhuma publicação de matching `ambiguous/unresolved`;
- nova versão não altera silenciosamente a anterior.

## 7. Testes do motor dependentes do modelo

1. conflito temporal simples;
2. candidato indisponível;
3. qualificação incompatível;
4. múltiplas vagas com competição global;
5. ausência sem candidato;
6. empate determinístico;
7. mudança de grade antes da confirmação;
8. reexecução idempotente sem apagar histórico.

## 8. Gate de liberação

A auditoria **não libera DDL** neste momento.

Para mudar o status para verde, precisam ser fechados:

1. `PHY-AUD-01` — identidade docente;
2. `PHY-AUD-02` — impacto Core de turma/componente;
3. `PHY-AUD-03` — publicação/importação da grade;
4. `PHY-AUD-04` — integridade composta;
5. `PHY-AUD-05` — RBAC/RLS Escala;
6. `PHY-AUD-06` — integração Governance;
7. `PHY-AUD-07` — staging.

## 9. Decisão

**Modelo físico candidato: APROVADO COMO ARTEFATO DE DESIGN.**

**Migration de produção: NÃO LIBERADA.**

Próxima etapa: fechar os contratos que ainda dependem de evidência operacional, começando pela identidade docente e pelo contrato de importação/publicação da grade. Nenhum DDL será executado antes desses gates.

**Status global:** 🟡 AMARELO — design aprovado para continuidade, produção bloqueada.

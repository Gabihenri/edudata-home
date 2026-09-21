# 116 — Auditoria de reexecução da fixture sintética v1

## Status

**VERDE — coerência sintética reestabelecida / integração produtiva ainda bloqueada.**

**Data:** 2026-09-21

## Escopo

Auditoria realizada após a correção da fixture e da regressão sintética da Escala de Substituição.

Arquivos envolvidos:

- `escala-substituicao/mvp/data/escola-sintetica-v1.json`
- `escala-substituicao/mvp/tests/regression-fixture-v1.mjs`

A fixture permanece explicitamente `official: false`.

## Verificações do robô

### C01 — titular excluído

O docente titular da ocorrência não aparece no conjunto de candidatos.

**Resultado: PASS**

### C02 — conflito temporal

O docente bloqueado pela própria ocorrência/atribuição não aparece como candidato; permanecem candidatos válidos.

**Resultado: PASS**

### C03/C04 — alocação global

Para quatro ocorrências simultâneas:

- solução global: cobertura 4;
- solução greedy local: cobertura 3.

Isso demonstra, na fixture sintética, a necessidade do algoritmo global para maximizar cobertura antes da qualidade.

**Resultado: PASS**

### C05 — uncovered

O cenário constrói explicitamente a ausência de cobertura por mutação controlada de disponibilidade dos candidatos de Química.

**Resultado: PASS**

### C06 — override humano

O override `teacher-s02` permanece sujeito às restrições duras e, após sua reserva, as três ocorrências restantes continuam cobertas.

**Resultado: PASS**

### C07 — mudança material

A fixture continua preparada para alteração de disponibilidade como evento que exige nova rodada/snapshot.

**Resultado: PASS por contrato sintético**

### C08 — determinismo/histórico

A persistência de rodada continua protegida pelo teste separado `round-persistence-v1.mjs`, com snapshot, versões, assinatura e preservação do histórico.

**Resultado: PASS por contrato existente**

## Resultado consolidado

| Controle | Resultado |
|---|---|
| Titular fora dos candidatos | PASS |
| Restrições duras antes do score | PASS |
| Cobertura global | PASS |
| Greedy inferior à solução global no cenário sintético | PASS |
| Cenário uncovered real | PASS |
| Override sujeito a restrições duras | PASS |
| Mudança material / snapshot | PASS por contrato |
| Persistência / histórico | PASS por contrato |
| Fixture oficial SED | **NÃO** — permanece bloqueada |

## Decisão

A inconsistência interna identificada na auditoria 74 foi corrigida **somente no conjunto sintético e nos testes sintéticos**.

Não houve alteração em:

- Supabase;
- RLS;
- DDL produtivo;
- Agenda Inteligente EDI;
- integração SED;
- fonte oficial de grade;
- atribuição oficial;
- arquitetura do Core.

## Gate atual

**GATE-FONTE-SED: RED/BLOCKED**

A Escala pode avançar no harness sintético, mas não deve promover a fixture a fonte operacional nem executar atribuição oficial automática.

## Próxima etapa segura

Auditar o conjunto de testes executáveis e seus contratos de persistência/rodada, mantendo a separação entre:

**fixture sintética → motor/harness → fonte SED → operação produtiva.**

# 111 — Auditoria de Concorrência e Atomicidade

**Data:** 29/09/2026

## Atomicidade

Harness:

`tests/atomicity-real-postgres.test.sql`

Execução no PostgreSQL real:

- **3 casos**
- **3 PASS**
- **0 FAIL**

AT-R01 — rollback em savepoint restaura estado anterior: PASS.  
AT-R02 — mutação bem-sucedida permanece no estado transacional: PASS.  
AT-R03 — falha posterior com rollback preserva o trabalho anterior: PASS.

O teste usa tabelas temporárias e termina em `ROLLBACK`.

Commit do harness: `f502930ed24c167d17d40cb6af90efdc3b13929d`.

## Concorrência

O arquivo existente `tests/concurrency-contract-01-10.postgres.test.sql` permanece explicitamente classificado como **CONTRACT HARNESS**, não como prova de concorrência física.

A infraestrutura de execução disponível nesta auditoria fornece uma sessão SQL por chamada. Não foi possível abrir duas transações PostgreSQL simultâneas e controlar a ordem de interleaving de forma independente.

Portanto:

- CONC-01 — duas confirmações simultâneas: **PENDENTE**;
- CONC-02..10 — contratos sintéticos existentes, **não convertidos em prova física**;
- não há declaração de que locks/constraints/RPC/RLS já resolvem concorrência;
- nenhuma solução física foi inventada para preencher essa lacuna.

## Gate

**Atomicidade:** 🟢 evidência PostgreSQL real.  
**Concorrência:** 🟠 contrato validado, prova física pendente.

Próximo gate: definir o mecanismo físico somente após a homologação das entidades Core/E3, e então executar teste com duas sessões PostgreSQL reais ou ambiente equivalente de concorrência controlada.

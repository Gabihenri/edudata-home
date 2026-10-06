# 142 — Consolidação da Regressão PostgreSQL da Escala v1

**Data:** 2026-10-06  
**Projeto Supabase:** `EduData IA`  
**Repositório:** `Gabihenri/edudata-home`

## Resultado da rodada

### Execução confirmada

- Ocorrência → Vaga: **12/12 aprovados**.
- Harness adversarial R15/R16: **PASS_MULTI_ASSOCIATED_TEACHERS_REMAIN_CONTEXTUAL**.
- Optimalidade global: harness executado após correção sintática; caso final **PASS_PARTIAL_PLAN_EXPLICIT**.
- Outros harnesses da suíte executados no PostgreSQL real sem erro de execução SQL:
  - global-allocation-v1
  - global-allocation-reproducibility-v1
  - human-override-preservation-v1
  - snapshot-reexecution-v1
  - snapshot-change-state-v1
  - round-persistence-v1

O adaptador de execução retornou apenas a última linha/result set de alguns desses scripts; portanto, esta auditoria **não transforma ausência de erro de execução em aprovação automática de todas as assertions internas**. As assertions individuais que foram retornadas foram registradas somente quando observáveis.

## Correção realizada

O harness `global-allocation-optimality-v1.sql` possuía uma construção inválida de CTE em três casos (`plans/candidates` seguidos de `best/valid`). A sintaxe foi corrigida sem alterar as regras de negócio.

Commit da correção:

`68b7af3139c70d97a80ab94ce7e328bb3cdec14d`

## Estado

- Harness PostgreSQL real: **avançando / evidência parcial consolidada**
- Cadeia Ocorrência → Vaga: **GREEN**
- R15/R16: **GREEN**
- Optimalidade: **corrigida e executável**
- Fonte SED: **RED/BLOCKED**
- DDL produtivo: **continua bloqueado pelo gate acadêmico**

## Próximo passo

Fechar a auditoria das assertions restantes com resultados observáveis, sem alterar o schema produtivo, e depois preparar a especificação física pós-E3.

# Auditoria de Execução PostgreSQL — Score e Ranking v1

**Produto:** Escala de Substituição  
**Data:** 2026-09-10  
**Artefato:** `tests/candidate-score-ranking.postgres.test.sql`  
**Referência do harness:** SHA `11ba69ca22229f828f1ba0d7f15a6f2190a5e117`  
**Gate:** 🔴 RED / BLOCKED

## 1. Objetivo

Registrar a revalidação da lógica crítica do harness de pontuação/ranking contra PostgreSQL real e separar falhas do repositório de erros introduzidos por reprodução manual.

## 2. Evidência de execução

A conexão PostgreSQL do projeto foi validada e a reprodução da regra crítica de proximidade foi executada no banco real.

Resultado observado:

- candidato com `proximity_evidence_status = 'homologated'` e proximidade `1` obteve score `100.000`;
- candidato com `proximity_evidence_status = 'not_available'` e proximidade `1` também obteve score `100.000`;
- portanto, a ausência de evidência não neutraliza o valor de proximidade antes do cálculo.

**Resultado:** GATE-06 reproduz falha semântica real da lógica atualmente presente no harness.

## 3. Correção da interpretação anterior

A tentativa anterior de execução completa utilizou uma consulta manualmente reconstruída que continha `run_id = 90000000-0000-0000-0000-000000000008`. Esse identificador não pertence ao arquivo atual do repositório.

A inspeção do arquivo atual confirma que os runs existentes são somente:

- `90000000-0000-0000-0000-000000000001` → `score-v1`;
- `90000000-0000-0000-0000-000000000002` → `score-v2`.

Logo, o erro de FK observado nessa tentativa manual **não deve ser atribuído ao arquivo do repositório**.

## 4. Achado crítico confirmado

### FIND-60-01 — Proximidade sem evidência ainda participa do score

**Severidade:** Alta  
**Status:** Aberto / requer correção

A função `calculate_score` utiliza diretamente `c.proximity`, independentemente de `proximity_evidence_status`. Assim, o estado `not_available` não impede que o valor bruto de proximidade produza pontos.

Isso contradiz o contrato, segundo o qual proximidade somente pode produzir mérito quando houver evidência homologada.

### Correção requerida

A pontuação efetiva de SCORE-06 deve ser condicionada ao estado da evidência. Para `not_available` e demais estados não homologados, o valor efetivo deve ser `0`, acompanhado do motivo `PROXIMITY_NOT_AVAILABLE` quando aplicável.

A mesma regra deve ser aplicada ao breakdown e à contribuição armazenada, evitando divergência entre valor calculado e evidência declarada.

## 5. Outros pontos ainda abertos

1. O desempate do harness ainda usa `distribution_balance DESC`; o contrato requer **menor número de substituições válidas**.
2. O identificador usado no desempate ainda é modelado como UUID acompanhado de booleano, sem vínculo com uma identidade acadêmica homologada real.
3. O `score-v2` ainda não mantém breakdown detalhado equivalente ao v1.
4. O harness continua sintético e contratual; não executa o motor produtivo.
5. A execução integral, usando exatamente o arquivo versionado, ainda precisa ser concluída após a correção.

## 6. Decisão

**Não aprovar o harness para GREEN.**

A evidência PostgreSQL real confirmou um defeito semântico relevante. A próxima alteração deve ser limitada ao arquivo do harness, corrigindo a neutralização da proximidade sem evidência e preservando a rastreabilidade do breakdown.

Nenhum DDL de produção deve ser criado nesta etapa.

# 141 — Auditoria de Execução PostgreSQL da Escala v1

**Data:** 2026-10-06  
**Repositório:** `Gabihenri/edudata-home`  
**Branch:** `main`  
**Projeto Supabase:** `EduData IA` (`ihchzfndmdwtoabttkil`)

## 1. Objetivo

Registrar a primeira execução controlada, em PostgreSQL real, dos harnesses sintéticos da cadeia operacional da Escala de Substituição.

A execução não altera o banco produtivo: os harnesses utilizam schema temporário e/ou transação com `ROLLBACK`.

## 2. Resultado

### Ocorrência → Ausência → Vaga

Arquivo:

`EduData-IA/escala-substituicao/tests/occurrence-vacancy.postgres.test.sql`

Resultado:

- 12 casos executados;
- 12 aprovados;
- 0 falhas.

Resultado agregado:

`case_count=12`, `pass_count=12`, `fail_count=0`.

Foram validados, entre outros:

- ocorrência baseada em versão publicada;
- cobertura temporal da ausência;
- exclusão de ausência pendente/cancelada;
- idempotência da materialização;
- consistência de escola/organização;
- vínculo entre vaga e versão de origem;
- restrição de uma vaga ativa por ocorrência;
- restrição única do par ocorrência/ausência.

### R15/R16 — multiplicidade

Arquivo:

`escala-substituicao/tests/global-allocation-adversarial-v1.sql`

Resultado:

`PASS_MULTI_ASSOCIATED_TEACHERS_REMAIN_CONTEXTUAL`

O cenário adversarial confirma que múltiplos professores associados permanecem como contexto e não são convertidos automaticamente em responsabilidade efetiva.

## 3. Interpretação

A camada sintética de persistência e invariantes operacionais possui evidência de execução em PostgreSQL real.

Isso **não desbloqueia** a fonte SED nem autoriza DDL produtivo da Escala. O `GATE-FONTE-SED` permanece RED/BLOCKED para integração acadêmica oficial.

## 4. Próximos passos

1. Executar os demais harnesses PostgreSQL ainda não comprovados nesta rodada.
2. Consolidar os resultados R01–R16.
3. Preparar a camada física isolada da Escala sem inventar chaves SED.
4. Quando o artefato E3 estiver disponível, homologar identidade, chaves, vigência e publicação.
5. Só então promover a estrutura física para integração produtiva.

## 5. Estado

**Motor/invariantes sintéticos:** GREEN  
**PostgreSQL real — ocorrência/vaga:** GREEN (12/12)  
**R15/R16 adversarial:** GREEN  
**Fonte SED oficial:** RED/BLOCKED  
**DDL produtivo da Escala:** aguardando homologação E3

# 127 — Plano de Harness E3: Cobertura das Invariantes v1

Data: 2026-09-28
Status: PLANO DE TESTE / SEM ALTERAÇÃO DE PRODUÇÃO

## 1. Objetivo

Definir a cobertura mínima para transformar o contrato E3-I01..E3-I12 em testes reproduzíveis.

## 2. Casos

E3-H01 — DI coerente
Esperado: responsabilidade resolvida quando demais relações estão homologadas.

E3-H02 — DI divergente
Esperado: SOURCE_UNCERTAIN/BLOCKED.

E3-H03 — DI ausente
Esperado: UNRESOLVED/BLOCKED quando DI for obrigatório.

E3-H04 — escola ausente
Esperado: BLOCKED.

E3-H05 — multi-escola
Esperado: resolução somente no contexto escolar explicitamente homologado.

E3-H06 — fora da vigência
Esperado: BLOCKED.

E3-H07 — associação sem Grade relacionada
Esperado: BLOCKED.

E3-H08 — Grade sem associação
Esperado: BLOCKED para responsabilidade docente.

E3-H09 — inferência por nome
Esperado: BLOCKED.

E3-H10 — substituição não retroativa
Esperado: responsabilidade original preservada e substituição tratada como contexto distinto.

E3-H11 — concomitância não resolvida
Esperado: BLOCKED.

E3-H12 — proveniência ausente
Esperado: BLOCKED.

E3-H13 — múltiplos DIs sem reconciliação
Esperado: SOURCE_UNCERTAIN.

E3-H14 — múltiplas escolas com contextos válidos
Esperado: cada contexto resolvido independentemente.

E3-H15 — associação histórica fora da vigência
Esperado: BLOCKED.

E3-H16 — Grade histórica fora da vigência
Esperado: BLOCKED ou SOURCE_UNCERTAIN.

E3-H17 — mesma identidade, associações diferentes
Esperado: nenhuma associação substitui outra sem regra de origem.

E3-H18 — ausência sem ocorrência homologada
Esperado: não criar vaga operacional.

## 3. Critérios de PASS

Um caso só passa quando:
1. não depende de inferência;
2. preserva a proveniência;
3. respeita vigência;
4. respeita contexto escolar;
5. distingue associação de ocorrência;
6. falha fechadamente quando há conflito.

## 4. Execução futura

O harness será criado em ambiente isolado com chaves explicitamente sintéticas.

Quando o artefato SED real for disponibilizado, os testes deverão ser adaptados para validar:
- nomes reais de campos;
- IDs reais;
- cardinalidades reais;
- relação Associação ↔ Grade;
- versionamento real;
- comportamento temporal real.

Nenhum fixture sintético poderá ser tratado como representação dos IDs da SED.

## 5. Bloqueios

O harness não desbloqueia:
- parser produtivo;
- DDL produtivo;
- ingestão SED;
- integração de efetivação;
- RLS de produção.

Ele apenas protege o contrato contra regressões enquanto o E3 técnico permanece pendente.

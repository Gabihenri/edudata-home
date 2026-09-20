# 74 — Auditoria de coerência da regressão Escola Sintética v1

## Status

**AMARELO — regressão bloqueada por inconsistências internas da fixture/teste.**

Esta auditoria foi realizada antes de qualquer alteração produtiva. O objetivo é separar falha do contrato, falha do teste e falha da fixture.

## Evidências verificadas

Arquivos auditados:

- `escala-substituicao/mvp/data/escola-sintetica-v1.json`
- `escala-substituicao/mvp/tests/regression-fixture-v1.mjs`

A fixture permanece marcada como `official: false`.

## Achados

### A01 — Titular da ocorrência ainda pode aparecer como candidato

O predicado `eligible()` não exclui explicitamente `occurrence.teacher_id`.

Consequência: em C01, `teacher-s03`, titular da ocorrência `occ-s01-seg-p1`, pode ser retornado como candidato.

Isso viola o princípio operacional consolidado: o professor ausente/titular da vaga não pode ser candidato à própria substituição.

**Classificação:** falha de contrato do teste/motor sintético.

### A02 — C02 contradiz os bloqueios da própria fixture

Para `occ-s02-seg-p1`, o teste exige `teacher-s01` como candidato.

Porém a fixture registra `teacher-s01` em uma atribuição no mesmo `seg-p1`. A função `hasAssignmentConflict()` o exclui.

Portanto, a expectativa de C02 não é compatível com os dados atuais.

**Classificação:** inconsistência fixture × expectativa.

### A03 — C03/C04 não sustentam cobertura 4 com as restrições atuais

As quatro ocorrências simultâneas usam o mesmo período.

Com as regras implementadas no teste:

- C01 pode usar candidatos de Física;
- C02 fica sem candidato após os conflitos registrados;
- C03 pode usar `teacher-s09` para Química;
- C04 fica sem candidato após os conflitos de Matemática.

Logo, a fixture atual não sustenta a expectativa `coverage = 4`.

Isso impede validar a tese de otimização global versus greedy usando os dados atuais.

**Classificação:** inconsistência estrutural da fixture.

### A04 — C05 está declarado como “uncovered”, mas a fixture base possui candidato

O cenário C05 é rotulado como `uncovered`, porém a regressão verifica apenas se existe candidato para Química na fixture base.

Esse teste não reproduz um cenário sem cobertura.

**Classificação:** teste insuficiente para o cenário declarado.

### A05 — C06 escolhe um override incompatível

O cenário C06 define `teacher-s02` como override para `occ-s01-seg-p1`.

Entretanto a fixture registra para `teacher-s02` um compromisso ATPCA no mesmo período. O contrato da escala estabelece que compromisso é restrição dura.

Portanto, o override não deve transformar um candidato inelegível em substituição válida.

**Classificação:** conflito entre cenário de override e restrições duras.

## Decisão de auditoria

**Não corrigir o MVP nem criar integração produtiva neste ponto.**

Primeiro deve ser corrigida a coerência do conjunto sintético de testes, preservando:

1. restrições duras antes do score;
2. titular ausente fora do conjunto de candidatos;
3. cobertura global como objetivo primário;
4. C05 realmente reproduzindo ausência de cobertura;
5. override humano sujeito às restrições duras;
6. determinismo;
7. fixture explicitamente não oficial.

## Próxima ação autorizada

A próxima alteração deve ser **somente na fixture sintética**, após redesenhar os oito cenários para que os dados realmente produzam os resultados esperados.

Não alterar SED, Agenda EDI, banco, RLS, DDL ou arquitetura produtiva.

## Gate

- GATE-FONTE-SED: **RED/BLOCKED**
- Fixture sintética: **não oficial**
- MVP produtivo: **sem alteração**
- Regressão C01–C08: **BLOCKED até correção de coerência**
- Memória Operacional EDI: **sem integração física**

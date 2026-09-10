# 53 — Auditoria do Harness de Ocorrências da Grade v1

**Produto:** Escala Inteligente de Substituição — EduData IA  
**Data:** 2026-09-09  
**Status:** 🟡 HARNESS CRIADO — EXECUÇÃO PostgreSQL PENDENTE  
**Gate de produção:** 🔴 BLOQUEADO

## 1. Objetivo

Auditar o primeiro harness isolado dedicado às ocorrências temporais da grade oficial e sua relação com ausência e conflitos de horário.

## 2. Artefato

`tests/official-schedule-occurrences.postgres.test.sql`

Commit de criação: `a7ce952edb0385626c15c64ccc4d74720864ee97`.

O arquivo é exclusivamente de teste, termina em `ROLLBACK` e não constitui migration de produção.

## 3. Cobertura

O harness verifica estruturalmente:

- ocorrência apoiada em versão publicada;
- intervalo `end_time > start_time`;
- detecção de sobreposição temporal entre ocorrências do mesmo docente;
- regra de interseção `A.start < B.end AND B.start < A.end`;
- ausência de conflito quando um intervalo termina exatamente quando o outro começa;
- identificação de ocorrência coberta por ausência confirmada;
- bloqueio lógico de versão não publicada;
- detecção de conflito simultâneo do docente antes da substituição.

## 4. Auditoria

| ID | Controle | Resultado estático |
|---|---|---|
| OCC-AUD-01 | versão publicada | 🟢 |
| OCC-AUD-02 | intervalo válido | 🟢 |
| OCC-AUD-03 | overlap docente | 🟢 |
| OCC-AUD-04 | limite exato sem overlap | 🟢 |
| OCC-AUD-05 | ausência cobre ocorrência | 🟢 |
| OCC-AUD-06 | versão não publicada | 🟢 |
| OCC-AUD-07 | conflito simultâneo observável | 🟢 |

## 5. Limitações

A auditoria acima é **estática**. O runtime atual não possui `psql` nem Docker disponíveis para executar PostgreSQL localmente. Portanto, não há evidência de execução real nesta etapa.

Também não há dados reais da SED no harness. Os identificadores são sintéticos por desenho.

## 6. Achados abertos

### OCC-AUD-08 — Execução PostgreSQL real
**Severidade:** High — ABERTO

É necessário executar o harness em PostgreSQL real e registrar o resultado dos testes.

### OCC-AUD-09 — Integração com `substitution_vacancies`
**Severidade:** Critical — ABERTO

Ainda não existe uma implementação produtiva homologada ligando a ocorrência oficial a uma vaga de substituição.

### OCC-AUD-10 — Fonte SED real
**Severidade:** Critical — ABERTO

O harness valida o contrato interno, mas não prova a capacidade de importar a grade real da SED. O artefato técnico de exportação/API da Associação Professor–Classe + Grade Horária continua não localizado.

## 7. Decisão

O harness está aprovado como instrumento de validação isolada do domínio temporal.

**Não está autorizado:**

- criar DDL produtivo;
- conectar o parser à SED por inferência;
- usar Agenda como fonte da grade;
- gerar vagas sem ocorrência oficial correspondente.

## 8. Próximo passo

Integrar conceitualmente a ocorrência com `substitution_absences` e definir o contrato de `substitution_vacancies`, mantendo a referência futura na ocorrência oficial e submetendo o desenho a nova auditoria antes de qualquer DDL.

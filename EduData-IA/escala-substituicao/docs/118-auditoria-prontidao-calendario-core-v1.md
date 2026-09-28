# 118 — Auditoria de Prontidão do Calendário Core para a Escala v1

**Data:** 2026-09-28  
**Status:** 🟠 CONTEXTO ESTRUTURAL DISPONÍVEL / FONTE OFICIAL NÃO HOMOLOGADA

## 1. Objetivo

Verificar se o calendário existente no Core pode ser utilizado pela Escala Inteligente EDI como referência temporal para reconciliar a Grade SED e gerar ocorrências.

## 2. Estruturas existentes

O Core possui:

- `school_years`;
- `academic_periods`;
- `institutional_calendar_events`;
- `school_calendar_exceptions`;
- `school_operating_hours`.

Essas estruturas são adequadas como domínio institucional de calendário, mas sua existência não prova que os dados sejam a publicação oficial da SED.

## 3. Evidência física auditada

Foi localizado um registro de `school_years` para 2026 com:

- ano: 2026;
- início: 2026-02-02;
- término: 2026-12-18;
- status: `draft`.

Também foram observados eventos em `institutional_calendar_events` associados a 2026, porém os registros auditados estavam com:

- `status = cancelled`;
- `source_type = institutional`;
- descrições de teste;
- sem publicação oficial registrada.

Consequentemente, esses registros não podem ser promovidos a calendário oficial homologado para o motor da Escala.

## 4. Classificação

### CAL-01 — Existência da estrutura
**Resultado:** 🟢

O Core possui estrutura suficiente para representar ano letivo, período e eventos de calendário.

### CAL-02 — Ano letivo 2026 operacional
**Resultado:** 🔴

O único registro auditado de `school_years` está em `draft`.

### CAL-03 — Eventos oficiais publicados
**Resultado:** 🔴

Os eventos físicos observados estão cancelados e apresentam características de dados de teste.

### CAL-04 — Fonte oficial SED
**Resultado:** 🔴

Não há evidência física suficiente, neste estado, de que o calendário Core seja uma cópia/publicação homologada do calendário oficial SED.

## 5. Regra para a Escala

O calendário Core pode fornecer **contexto institucional**, mas não deve ser usado sozinho para afirmar que existe uma aula.

A cadeia permanece:

`CALENDÁRIO HOMOLOGADO + GRADE SED HOMOLOGADA + ASSOCIAÇÃO HOMOLOGADA → OCORRÊNCIA`

Portanto:

- dia letivo ≠ aula;
- calendário ≠ grade;
- grade ≠ ocorrência;
- ocorrência ≠ ausência;
- ausência ≠ vaga automática sem ocorrência homologada.

## 6. Não fazer

Até homologação:

- não importar calendário externo presumido;
- não promover registros `draft` a oficiais;
- não usar eventos cancelados como evidência operacional;
- não criar ocorrência a partir de calendário;
- não alterar os registros existentes apenas para satisfazer a Escala.

## 7. Próximo passo

Quando o E3 SED chegar, o calendário deverá ser reconciliado com:

1. escola;
2. ano letivo;
3. período;
4. data da aula;
5. status/publicação;
6. exceções;
7. vigência da Grade;
8. evidência da fonte oficial.

Depois disso será possível definir se o Core já pode receber a publicação oficial ou se será necessária uma camada de ingestão/proveniência específica.

## 8. Gate

**Estrutura Core de calendário:** 🟢  
**Dados 2026 homologados:** 🔴  
**Calendário oficial SED:** 🔴  
**Grade SED:** 🔴  
**Ocorrência oficial:** 🔴  
**Engine operacional:** 🔴

Nenhuma alteração de produção foi realizada.

**Conclusão:** o calendário não é o próximo ponto a ser implementado; é mais uma dependência que precisa de homologação de fonte antes da operação real.

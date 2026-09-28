# 119 — Auditoria de Separação entre Ocorrência Agenda e Ocorrência Escala v1

**Data:** 2026-09-28  
**Status:** 🟢 SEPARAÇÃO CONCEITUAL CONFIRMADA / SEM ALTERAÇÃO DE PRODUÇÃO

## 1. Objetivo

Verificar se alguma estrutura física existente no Core pode ser reutilizada como ocorrência operacional da Escala Inteligente EDI e evitar acoplamento indevido com produtos existentes.

## 2. Resultado

A tabela física `agenda_student_occurrences` existe no Core, porém seus campos demonstram que ela representa uma ocorrência da Agenda relacionada ao contexto de estudante/registro pedagógico.

Entre seus campos estão:

- `student_id`;
- `class_id`;
- `offering_id`;
- `lesson_id`;
- `academic_period_id`;
- `recorded_by_user_id`;
- `occurred_at`;
- `nature`;
- `status`;
- `user_id`;
- `organization_id`;
- `school_id`;
- campos de evidência, governança e privacidade.

Não foi encontrada evidência de que essa tabela represente a relação operacional necessária entre:

`Associação Professor–Classe + Grade Horária + vigência + calendário + proveniência SED`.

## 3. Regra de não reutilização

`agenda_student_occurrences` **não deve ser utilizada como ocorrência oficial da Escala**.

A Escala não deve:

- interpretar `lesson_id` como chave SED de ocorrência;
- interpretar `class_id` como evidência suficiente de associação docente;
- usar `occurred_at` para reconstruir Grade;
- usar registros da Agenda para inferir professor responsável;
- criar vínculo implícito entre Agenda e Escala;
- converter registro pedagógico em ocorrência operacional de substituição.

Isso preserva a separação entre produtos e impede que dados de registro pedagógico sejam tratados como fonte acadêmica oficial da SED.

## 4. Relação correta

A ocorrência da Escala continua dependendo da reconciliação:

`ARTEFATO SED`
→ `RAW`
→ `NORMALIZAÇÃO`
→ `MATCHING`
→ `VALIDAÇÃO TEMPORAL`
→ `OCORRÊNCIA HOMOLOGADA`

com:

`ASSOCIAÇÃO DOCENTE`
+
`GRADE HORÁRIA`
+
`VIGÊNCIA`
+
`CALENDÁRIO APLICÁVEL`
+
`PROVENIÊNCIA`

A Agenda pode eventualmente consumir ou referenciar resultados homologados por contratos explícitos no futuro, mas não constitui a fonte da responsabilidade docente da Escala.

## 5. Calendário

As estruturas:

- `school_years`;
- `academic_periods`;
- `institutional_calendar_events`;
- `school_calendar_exceptions`;
- `school_operating_hours`;

permanecem como domínio de calendário institucional do Core.

A auditoria anterior demonstrou que os dados 2026 atualmente observados não estão homologados como calendário oficial operacional. Portanto, essas tabelas também não autorizam, isoladamente, a criação de ocorrências da Escala.

## 6. Consequência arquitetural

A decisão reforça a arquitetura:

`Framework EDI → EIOS → Core Compartilhado → Escala Inteligente EDI`

sem criar dependência circular:

`Agenda → Escala`

nem transformar dados de produto em autoridade acadêmica compartilhada.

A autoridade acadêmica necessária para a Escala deverá ser estabelecida por contrato próprio de ingestão/reconciliação da fonte SED, preservando o Core como camada compartilhada de identidade, organização, calendário e governança quando aplicável.

## 7. Gate atual

| Gate | Estado |
|---|---|
| Separação Agenda × Escala | 🟢 |
| Calendário estrutural Core | 🟢 |
| Calendário 2026 homologado | 🔴 |
| Grade SED operacional | 🔴 |
| Associação Professor–Classe operacional | 🔴 |
| Relação Associação ↔ Grade | 🔴 |
| Ocorrência Escala homologada | 🔴 |
| Engine operacional | 🔴 |

## 8. Próximo passo seguro

Continuar a auditoria documental e de contratos do gate E3, procurando somente evidências que possam esclarecer:

1. identificadores técnicos da Associação;
2. identificadores técnicos da Grade;
3. relação entre Associação e Grade;
4. vigência/versionamento;
5. estado de publicação;
6. artefato operacional atual.

Nenhum ID, chave, parser ou DDL deve ser inventado a partir das estruturas já existentes no Core.

**Conclusão:** a estrutura existente da Agenda foi auditada e explicitamente preservada fora da autoridade da Escala. Nenhuma alteração de produção foi realizada.

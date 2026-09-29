# 115 — Matriz Consolidada de Gates — Escala Inteligente EDI

**Data:** 29/09/2026

## 1. Gates verdes

| Gate | Evidência | Resultado |
|---|---|---:|
| R03/R15/R16 | harness PostgreSQL | 🟢 |
| Occurrence → Vacancy | 12 casos | 🟢 12/12 |
| HARD eligibility | 11 casos | 🟢 11/11 |
| Score / Ranking | 13 casos | 🟢 13/13 |
| Global allocation | 13 casos | 🟢 13/13 |
| Round persistence / override | 10 casos | 🟢 10/10 |
| Atomicity | PostgreSQL real | 🟢 3/3 |
| Authorization Resolver | PostgreSQL harness | 🟢 12/12 |
| RLS / Governance contract | PostgreSQL harness | 🟢 8/8 |
| Chain transitions/invalidation | PostgreSQL real | 🟢 |

## 2. Gates amarelos

| Gate | Estado | Motivo |
|---|---|---|
| Concorrência real | 🟠 | contrato validado, duas sessões concorrentes ainda pendentes |
| Resolver contra Core real | 🟠 | dados operacionais Core ainda vazios |
| RLS física Escala | 🟠 | policy produtiva ainda não autorizada |
| Governança física Escala | 🟠 | integração ainda não autorizada |

## 3. Gates vermelhos

### E3 / SED
Necessários: artefato operacional autorizado de Grade Horária e Associação Professor–Classe; IDs técnicos; relação Associação ↔ Grade; turma/subturma; componente; vigência; versão/publicação; cardinalidades; regra de atualização e proveniência.

Sem isso: **não criar parser, DDL ou recurso acadêmico oficial por inferência.**

### Core operacional
Ainda ausentes: memberships reais; responsibility scopes reais; teacher profiles reais; permissões `product_code='escala'`; ponte homologada `academic_teacher_identity_links`; recurso acadêmico oficial para ownership/assignment.

## 4. Sequência crítica

`E3 SED + Core homologado → Resolver físico → harness real → RLS → EIOS Governance → concorrência física → DDL produtivo → engine ponta a ponta`

## 5. Não fazer agora

- criar `product_code='escala'`;
- criar RLS Escala;
- criar RPC produtiva;
- criar tabelas oficiais de Grade/Associação;
- inferir professor por nome/e-mail/CPF;
- usar Agenda como Grade oficial;
- usar Sala do Futuro como substituto da fonte E3;
- transformar contrato sintético em evidência de produção;
- liberar confirmação automática no SED.

## 6. Conclusão

A Escala possui maturidade elevada no núcleo lógico e comportamental, mas permanece bloqueada para integração produtiva por E3/SED e pela ausência de dados operacionais homologados do Core.

**Estado global: 🟠 PRONTO NO COMPORTAMENTO / 🔴 BLOQUEADO NA INTEGRAÇÃO PRODUTIVA.**
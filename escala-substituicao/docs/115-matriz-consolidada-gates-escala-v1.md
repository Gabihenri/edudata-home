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

## Nota de atualização documental — 29/09/2026

Esta matriz é a referência consolidada de estado atual para os gates técnicos. Auditorias anteriores que registram execução PostgreSQL como “pendente” devem ser interpretadas como registros do estado na data de sua emissão, não como estado atual.

Desde aquelas auditorias, foram obtidas evidências reais em PostgreSQL para os principais harnesses de comportamento listados nesta matriz. Isso não altera os gates independentes de integração: E3/SED, Core operacional, identidade acadêmica, RLS físico, governança física e concorrência multi-sessão permanecem pendentes.

**Regra de precedência documental:** para status atual, utilizar esta matriz e as auditorias posteriores numeradas 116–138; para reconstrução histórica, preservar o texto original das auditorias anteriores.
## Atualização de cobertura documental — 29/09/2026

Documentos 133–138 verificados fisicamente no repositório e incorporados ao estado consolidado:

| Documento | Cobertura | Estado |
|---|---|---|
| 133 | E3 H01–H22 / vigência | 🟢 22/22 PostgreSQL real |
| 134 | Staging → Publication | 🟢 prova isolada PostgreSQL real |
| 135 | Core × identidade | 🔴 dados operacionais ausentes |
| 136 | Pacote de entrada E3 | 🟢 especificação fechada / artefato pendente |
| 137 | Decisão de homologação E3 | 🟢 protocolo fechado / aplicação pendente |
| 138 | Coerência documental E3 | 🟢 sem contradição material |

A cobertura documental 133–138 está consistente com o gate consolidado: o avanço comportamental continua permitido em harness; o avanço físico permanece bloqueado até E3 SED e Core operacional homologados.

## Auditoria de integridade do gate E3 — 29/09/2026

Foi realizada busca adicional no repositório por artefatos operacionais, fixtures ou parsers que pudessem ser confundidos com fonte SED real.

Resultado:

- não foi localizado XLSX/CSV operacional SED da Grade Horária;
- não foi localizado XLSX/CSV operacional SED da Associação Professor–Classe;
- não foi localizado parser produtivo autorizado para essas fontes;
- os arquivos encontrados relacionados a Grade/Associação permanecem contratos, auditorias, harnesses ou evidências documentais;
- não foi identificada evidência de promoção de fixture sintética/histórica a fonte operacional.

**Conclusão:** o GATE-FONTE-SED permanece corretamente **RED/BLOCKED**. A ausência do artefato real continua sendo um bloqueio externo e explícito, não uma lacuna documental interna.

## Auditoria de localização documental — 29/09/2026

A auditoria 139 identificou uma divergência de raiz documental que precisa ser considerada na interpretação da cobertura 133–138.

- A matriz atual está em `escala-substituicao/docs/`.
- O documento 138 foi localizado em `EduData-IA/escala-substituicao/docs/`, e não no caminho atual da matriz.
- O documento 133 não foi localizado no caminho atual `escala-substituicao/docs/`; há referência histórica dele em `EduData-IA/escala-substituicao/docs/`.
- O harness R03/R15/R16 está no caminho atual `escala-substituicao/tests/`.

Portanto, a tabela 133–138 deve ser interpretada como **cobertura documental histórica/consolidada**, e não como prova de que todos esses arquivos estejam hoje na mesma raiz canônica.

A divergência não altera os resultados dos harnesses nem qualquer gate produtivo. Até a reconciliação das raízes, não mover, duplicar ou excluir documentação automaticamente.

**Regra atualizada:** arquivos presentes no `main` no caminho canônico têm precedência operacional; arquivos encontrados somente em histórico servem para reconstrução histórica e não devem ser tratados como artefatos atuais.

Auditoria detalhada: `escala-substituicao/docs/139-auditoria-localizacao-documental-integridade-gate-v1.md`.

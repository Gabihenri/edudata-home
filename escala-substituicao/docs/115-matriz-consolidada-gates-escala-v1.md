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
| Organização documental | 🟠 | documentação E3 histórica confirmada, mas parte permanece na raiz histórica |

## 3. Gates vermelhos

### E3 / SED
Necessários: artefato operacional autorizado de Grade Horária e Associação Professor–Classe; IDs técnicos; relação Associação ↔ Grade; turma/subturma; componente; vigência; versão/publicação; cardinalidades; regra de atualização e proveniência.

Sem isso: **não criar parser, DDL ou recurso acadêmico oficial por inferência.**

### Core operacional
Ainda ausentes: memberships reais; responsibility scopes reais; teacher profiles reais; permissões product_code='escala'; ponte homologada academic_teacher_identity_links; recurso acadêmico oficial para ownership/assignment.

## 4. Sequência crítica

E3 SED + Core homologado → Resolver físico → harness real → RLS → EIOS Governance → concorrência física → DDL produtivo → engine ponta a ponta

## 5. Não fazer agora

- criar product_code='escala';
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

**Regra de precedência documental:** para status atual, utilizar esta matriz e as auditorias posteriores; para reconstrução histórica, preservar o texto original das auditorias anteriores.

## Atualização de cobertura documental — 29/09/2026

A documentação E3 117–138 foi posteriormente reconciliada pela árvore Git do commit-base da matriz. A árvore confirmou que os documentos 117–138 existiam fisicamente no repositório sob a raiz histórica EduData-IA/escala-substituicao/docs/.

Isso corrige a interpretação anterior: não há evidência de que a documentação E3 tenha sido inventada ou perdida; existe uma **divergência de raiz documental** decorrente da reorganização do módulo.

O documento 128 não foi encontrado na filtragem da pasta docs/, devendo ser reconciliado no diretório de testes/harness antes de qualquer conclusão sobre sua presença.

### Estado correto da cobertura

| Faixa | Estado |
|---|---|
| Documentos 117–138 na árvore histórica do commit-base | 🟢 confirmado, com exceção de 128 na pasta docs/ |
| Documentação E3 completa na raiz canônica atual | 🟠 não confirmada |
| Existência histórica da documentação E3 | 🟢 confirmada |
| Movimentação/duplicação automática | 🔴 não autorizada |

Auditorias relacionadas:
- 139-auditoria-localizacao-documental-integridade-gate-v1.md
- 140-auditoria-presenca-faixa-documental-117-138-v1.md
- 141-reconciliacao-definitiva-raizes-documentais-v1.md

## Auditoria de integridade do gate E3 — 29/09/2026

Foi realizada busca adicional no repositório por artefatos operacionais, fixtures ou parsers que pudessem ser confundidos com fonte SED real.

Resultado:
- não foi localizado XLSX/CSV operacional SED da Grade Horária;
- não foi localizado XLSX/CSV operacional SED da Associação Professor–Classe;
- não foi localizado parser produtivo autorizado para essas fontes;
- os arquivos encontrados relacionados a Grade/Associação permanecem contratos, auditorias, harnesses ou evidências documentais;
- não foi identificada evidência de promoção de fixture sintética/histórica a fonte operacional.

**Conclusão:** o GATE-FONTE-SED permanece corretamente **RED/BLOCKED**. A ausência do artefato real continua sendo um bloqueio externo e explícito, não uma lacuna documental interna.
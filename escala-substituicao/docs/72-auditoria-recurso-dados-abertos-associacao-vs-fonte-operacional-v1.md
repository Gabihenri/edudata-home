# Auditoria 72 — Recurso Dados Abertos x fonte operacional da Associação

**Projeto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** RED/BLOCKED para integração técnica

## 1. Objetivo

Verificar se o conjunto oficial de Dados Abertos identificado como “Associação do Professor à Classe” pode ser utilizado como fonte técnica atual para canonização docente e grade da Escala.

## 2. Resultado da busca oficial

O catálogo oficial atualmente apresenta o conjunto **Associação do Professor à Classe**, descrito como **“Base anonimizada de Associação de Professores às Classes”**.

O conjunto disponibiliza:

- Associação do Professor Classe — Dicionário XLS;
- Associação do Professor Classe — 2021 CSV;
- Associação do Professor Classe — 2020 CSV;
- Associação do Professor Classe — 2019 CSV.

O catálogo informa atualização de metadados em fevereiro de 2026, mas os recursos de dados listados permanecem 2019–2021.

## 3. Busca por API

Foi realizada busca direcionada por endpoints CKAN públicos associados ao identificador do conjunto. Não foi localizado, nos resultados públicos indexados, um endpoint `package_show` ou equivalente que disponibilizasse um artefato operacional 2025/2026.

Isso não prova que não exista uma API autenticada ou endpoint interno da SED; apenas significa que ela não foi homologada como interface pública nesta investigação.

## 4. Consequência

O conjunto de Dados Abertos é útil como **evidência auxiliar/histórica** e eventualmente como material para estudar nomenclatura e estrutura histórica.

Ele não pode ser tratado como fonte operacional corrente da Escala porque:

1. os recursos publicados são históricos;
2. a própria descrição informa anonimização;
3. não foi comprovado um identificador docente canônico atual;
4. não foi comprovado o vínculo técnico com a grade corrente;
5. não foi comprovado endpoint de atualização operacional.

## 5. Decisão

Não criar parser de produção baseado no CSV 2019–2021.

Não inferir identidade atual por CPF, DI, nome ou posição de linha.

Não substituir a fonte SED operacional pelo catálogo de Dados Abertos.

## 6. Rota seguinte

A investigação técnica deve priorizar um artefato atual obtido legitimamente pela interface SED, especialmente o **Gerar Excel** da Lista de Associação, ou documentação oficial que forneça o contrato técnico equivalente.

O artefato, quando obtido, deverá ser preservado com:

- origem;
- data/hora;
- ano letivo;
- filtros utilizados;
- unidade escolar/DE;
- hash do arquivo;
- nome/formato do arquivo;
- evidência visual da tela de exportação, quando possível.

Somente depois deve ser feita a comparação com o modelo canônico da Escala.

## 7. Gate

**GATE-FONTE-SED: RED/BLOCKED.**

A busca reduziu a hipótese de que o catálogo aberto seja a fonte operacional atual, mas ainda não homologou o artefato técnico corrente da SED.

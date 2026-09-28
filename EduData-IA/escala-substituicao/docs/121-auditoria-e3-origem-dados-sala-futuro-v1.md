# 121 — Auditoria E3: Origem dos Dados e Limite da Sala do Futuro v1

**Data:** 2026-09-28  
**Status:** 🟢 LIMITE DE FONTE CONFIRMADO / E3 TÉCNICO CONTINUA BLOQUEADO

## 1. Objetivo

Determinar se a Sala do Futuro pode ser tratada como fonte primária para a Escala Inteligente EDI ou se deve ser considerada apenas uma camada de apresentação dos dados originados na SED e demais sistemas.

## 2. Evidência oficial

O Portal de Atendimento da SEDUC-SP, no Guia de Responsabilidades da Sala do Futuro, declara que a plataforma não é responsável por todos os dados que exibe ou conecta.

Na seção referente à Agenda Escolar, a documentação informa que a Sala do Futuro apenas exibe dados provenientes das fontes, incluindo:

- Grade Horária;
- Calendário homologado SED;
- atividades cadastradas pelos professores.

Fonte oficial:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-08325/pt-br

Isso estabelece uma distinção importante entre:

`FONTE ACADÊMICA` → `DADO` → `SALA DO FUTURO`

e não:

`SALA DO FUTURO` → `FONTE PRIMÁRIA`

## 3. Evidência adicional

A SED também informa que os horários exibidos no Diário de Classe correspondem aos horários cadastrados na Aba 1 da Associação do Professor à Classe e na Grade Horária.

Fonte oficial:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-11257/pt-br

Portanto, a interface do Diário pode ser utilizada como evidência funcional do comportamento do sistema, mas não fornece, por si só, os identificadores físicos necessários para a ingestão E3.

## 4. Evidência temporal

O Comunicado CITEM/DGREM/CVESC nº 6, de 10/03/2025, estabelece que alterações da Grade Horária passam a ser refletidas no Diário de Classe a partir das 05h00, considerando a última Grade cadastrada até 04h59 do dia vigente.

Fonte oficial:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-11328/pt-br

Isso confirma que a Grade possui comportamento temporal operacional.

Não confirma, entretanto, o nome ou formato das chaves físicas utilizadas internamente pela SED.

## 5. Consequência para a Escala

A Escala não deverá fazer scraping, automação de tela ou inferência de dados a partir da Sala do Futuro para substituir a ausência do artefato técnico E3.

A fonte operacional necessária continua sendo um artefato autorizado que preserve os dados de origem e seus identificadores.

Preferência:

1. exportação oficial XLSX/CSV;
2. relatório oficial com layout conhecido;
3. API/serviço oficial autorizado;
4. outro artefato técnico formalmente disponibilizado.

A interface web pode ser usada como evidência funcional e para validação visual, mas não como substituto silencioso da fonte técnica.

## 6. O que foi fechado

### Confirmado

- Sala do Futuro não é a autoridade primária de todos os dados que exibe.
- Grade Horária possui origem própria.
- Calendário homologado possui origem própria.
- Associação Professor–Classe participa do contexto de horários do Diário.
- Alterações da Grade possuem regra temporal.
- O comportamento da interface não revela automaticamente o modelo físico da fonte.

### Não confirmado

- IDs técnicos da Associação;
- IDs técnicos da Grade;
- ID do horário;
- chave Associação ↔ Grade;
- layout do artefato de exportação;
- endpoint/API autorizado;
- versionamento físico;
- cardinalidades.

## 7. Regra arquitetural consolidada

A Escala deve seguir:

`FONTE SED AUTORIZADA`
→ `RAW`
→ `NORMALIZAÇÃO`
→ `RECONCILIAÇÃO`
→ `VALIDAÇÃO TEMPORAL`
→ `OCORRÊNCIA HOMOLOGADA`
→ `MOTOR`

A Sala do Futuro pode atuar como evidência funcional de comportamento:

`FONTE SED`
→ `SALA DO FUTURO`
→ `OBSERVAÇÃO/VALIDAÇÃO`

mas não como substituta do primeiro estágio.

## 8. Gate E3

| Elemento | Estado |
|---|---|
| Origem conceitual dos dados | 🟢 |
| Limite da Sala do Futuro como fonte | 🟢 |
| Semântica Associação | 🟢 |
| Semântica Grade | 🟢 |
| Vigência/temporalidade | 🟢 |
| Artefato técnico E3 | 🔴 |
| IDs físicos | 🔴 |
| Relação Associação ↔ Grade | 🔴 |
| Parser produtivo | 🔴 |
| DDL produtivo | 🔴 |
| Ocorrência oficial | 🔴 |

## 9. Conclusão

A auditoria fecha mais uma hipótese de risco: **a interface da Sala do Futuro não será usada como atalho para preencher a lacuna do E3**.

A Escala continuará dependente de uma fonte operacional autorizada e tecnicamente auditável.

Nenhuma alteração de produção foi realizada.

**GATE-FONTE-SED = RED/BLOCKED para implementação física.**

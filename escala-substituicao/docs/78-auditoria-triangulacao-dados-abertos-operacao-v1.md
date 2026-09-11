# Auditoria 78 — Triangulação de Dados Abertos para operação docente — v1

**Projeto:** Escala de Substituição  
**Data:** 2026-09-11  
**Status:** nova evidência estrutural; gate técnico permanece RED/BLOCKED

## 1. Objetivo

Investigar se outros conjuntos oficiais de Dados Abertos da SEDUC ajudam a delimitar o domínio operacional da Escala sem transformar bases anonimizadas em contratos de integração.

## 2. Associação do Professor à Classe

O catálogo oficial mantém o conjunto **Associação do Professor à Classe**, descrito como **Base anonimizada de Associação de Professores às Classes**, com um dicionário XLS e bases CSV de 2019, 2020 e 2021. O catálogo registra `dct_issued` em 06/09/2022 e, no espelho atual, atualização do catálogo em 02/02/2026. O conteúdo dos recursos continua histórico e anonimizado.

Fonte:
https://dadosabertos.des.sp.gov.br/dataset/50b6947e-3cc6-4b2e-9654-323edafb0fd1

## 3. Nova triangulação — Ausências por servidor

Foi localizado outro conjunto oficial da Secretaria da Educação: **Ausências por servidor**, descrito como **Ausências funcionários ativos anonimizado**.

O conjunto possui um **Dicionário de Dados Base Ausência** e séries mensais de arquivos CSV. Há recursos mensais que alcançam 2025, incluindo `Base Ausências 1125`, `1025`, `0925` etc. O recurso do dicionário está marcado como ativo e o catálogo informa atualização dos dados/metadados em fevereiro de 2026.

Fonte:
https://dadosabertos.des.sp.gov.br/dataset/98c4fb29-4a13-4066-bcde-57d9e2cb1d78

## 4. Nova triangulação — Carga Horária por docente

O catálogo também mantém **Carga Horária por docente**, descrita como **Carga horária anonimizado docentes ativos**, com recurso de dicionário denominado **Dicionário de Dados Carga Hora Sala Aula**.

Fonte do recurso de dicionário:
https://dadosabertos.homologacao.sp.gov.br/dataset/55464cae-c206-4c27-a30a-8cc2f1a89bd3/resource/719b3198-f910-4273-b4ab-a5727451327f

O recurso está ativo no catálogo e possui atualização de dados/metadados registrada em fevereiro de 2026. A existência desse conjunto reforça que carga horária é tratada como domínio de dados próprio, separado da Associação.

## 5. Nova triangulação — Formação por servidor

O catálogo oficial mantém ainda **Formação por servidor**, descrito como **Formação funcionários anonimizado**.

Isso é relevante para a Escala porque formação/habilitação já aparece como elemento de elegibilidade no processo de atribuição, mas a base pública não deve ser usada para inferir o vínculo técnico atual entre uma pessoa e uma autorização de docência.

## 6. Nova triangulação — Servidores ativos por Unidade

O catálogo mantém **Servidores ativos por Unidade**, descrito como **Cadastro funcional anonimizado funcionários ativos**.

A existência conjunta de servidores ativos, formação, carga horária e ausências demonstra que a SEDUC publica domínios distintos para aspectos que o motor da Escala precisa cruzar internamente.

## 7. Evidência especialmente útil — Disciplinas sem docentes associados

Também foi localizado o conjunto **Disciplinas sem docentes associados**, descrito como **Aulas sem docente atribuído (janeiro, fevereiro e março 2019)**.

Embora histórico, ele é conceitualmente relevante: comprova que a própria publicação de dados da SEDUC reconhece a situação de uma aula/disciplina sem docente atribuído como um objeto analítico distinto.

Fonte do catálogo:
https://dadosabertos.des.sp.gov.br/dataset/?organization=secretaria-da-educacao&tags=desafios-seduc

## 8. Consequência para a Escala

A triangulação reforça a decomposição do domínio:

`servidor/docente`  
`+ formação`  
`+ carga horária`  
`+ associação docente-classe`  
`+ ausência`  
`+ necessidade/vaga`  
`+ substituição`

Nenhum desses conjuntos deve ser colapsado em uma única tabela física sem evidência técnica adicional.

## 9. Importante: o que NÃO foi homologado

Mesmo com os novos conjuntos, continuam não homologados:

- IDs técnicos atuais de docente;
- IDs técnicos de classe/turma;
- IDs técnicos de componente/disciplina;
- chave de reconciliação entre bases;
- layout da exportação atual da Associação;
- API operacional da Associação;
- regra para transformar ausência em vaga de substituição;
- autorização para escrita automática na SED.

As bases são anonimizadas e algumas são históricas. Elas servem como evidência estrutural e como referência para harnesses, não como contrato de integração.

## 10. Decisão arquitetural

A arquitetura interna da Escala deve continuar orientada por um **modelo canônico próprio**, alimentado por adaptadores de fontes externas.

As fontes abertas podem apoiar:

- descoberta de conceitos;
- validação de separação de entidades;
- testes sintéticos;
- análise histórica;
- desenho de indicadores.

Não podem, isoladamente, autorizar:

- canonização de IDs;
- sincronização em produção;
- escrita na SED;
- parser de exportação atual.

## 11. Próximo passo

A busca documental pública está convergindo para o limite útil. O próximo avanço deve priorizar o **dicionário oficial da Associação** e, se seu conteúdo permanecer inacessível automaticamente, formalizar a obtenção do Excel real por usuário autorizado da escola/SED.

Paralelamente, o motor interno pode avançar sobre contratos sintéticos usando as entidades já comprovadas: associação, carga horária, formação, ausência, ocorrência, necessidade, candidato e decisão.

## 12. Gate

**GATE-FONTE-SED = RED/BLOCKED.**

A triangulação aumenta a confiança no modelo de domínio, mas não fecha o contrato técnico atual da SED.

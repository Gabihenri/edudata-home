# 62 — Auditoria do dicionário público da Associação do Professor à Classe v1

**Data:** 2026-09-10  
**Escopo:** evidência pública de estrutura da Associação do Professor à Classe / Grade Horária  
**Status:** evidência estrutural relevante; gate de produção permanece RED.

## 1. Descoberta

O Portal Dados Abertos SP mantém, sob a Secretaria da Educação, o conjunto oficial **“Associação do Professor à Classe”**.

O catálogo o descreve como **base anonimizada de Associação de Professores às Classes** e disponibiliza, entre outros recursos, um **“Associação do Professor Classe - Dicionário XLS”** e arquivos CSV históricos de 2019, 2020 e 2021.

O catálogo registra atualização dos metadados/recursos em 02/02/2026.

## 2. Artefato de dicionário

O catálogo identifica o recurso de dicionário com:

- package: `50b6947e-3cc6-4b2e-9654-323edafb0fd1`
- resource: `a4a95fd5-cf5d-4988-b2b5-48522d589046`
- formato: XLS
- nome: `Associação do Professor Classe - Dicionário XLS`
- recurso de origem indicado: `https://dados.educacao.sp.gov.br/sites/default/files/DICIONARIO_ASSOCIACAO_PROF_CLASSE.xlsx`

O arquivo XLS não pôde ser baixado pelo ambiente de investigação porque o servidor de origem respondeu com bloqueio HTTP 403. Portanto, **não foi possível inspecionar o conteúdo das colunas**.

## 3. Valor probatório

Esta descoberta muda a classificação da fonte:

Antes:
- existência da fonte comprovada;
- layout técnico desconhecido.

Agora:
- existência de um **dicionário oficial publicado pela Secretaria da Educação** comprovada;
- existência de arquivos históricos associados comprovada;
- nome e identificadores do recurso reproduzíveis;
- conteúdo do dicionário ainda não inspecionado.

O dicionário público não deve ser confundido com um export operacional atual da SED. Os CSVs são históricos e o próprio conjunto é anonimizado.

## 4. Implicação para identidade docente

A existência do dicionário confirma que há uma especificação pública de campos para a família de dados Associação Professor–Classe.

Entretanto, sem acesso ao conteúdo do XLS, ainda não é possível afirmar quais campos representam:

- docente;
- DI;
- turma;
- componente;
- vigência;
- escola;
- atribuição;
- identificador técnico.

Também não é possível concluir que qualquer campo histórico seja o identificador técnico atual.

## 5. Evidência complementar de interface

Material institucional de 2025 apresenta a tela atual da Associação do Professor à Classe com campos como CPF, Professor, DI, Tipo de Ensino, Turma, Sub Turma, Disciplina, Atribuição em Substituição, Tipo/Fase de Atribuição e início/fim de vigência.

Essa evidência é útil para correlacionar o dicionário com a interface, mas **não substitui o dicionário técnico nem prova a chave interna do sistema**.

## 6. Gate

| Controle | Estado |
|---|---|
| Família de fonte oficial | 🟢 |
| Dataset público oficial | 🟢 |
| Dicionário oficial identificado | 🟢 |
| Conteúdo do dicionário inspecionado | 🔴 bloqueado por 403 |
| Exportação operacional 2025/2026 | 🔴 não comprovada |
| ID técnico atual do docente | 🔴 não homologado |
| ID técnico atual da turma | 🔴 não homologado |
| ID técnico atual do componente | 🔴 não homologado |
| Parser de produção | 🔴 bloqueado |
| DDL de produção | 🔴 bloqueado |

## 7. Próximo passo

Obter o conteúdo do XLS por fonte oficial acessível, cópia oficial/indexada ou solicitação institucional de dados/documentação.

Somente após inspeção do dicionário será possível atualizar os contratos 46/47/50/51/52 com nomes reais de campos e classificar os identificadores.

**Regra mantida:** não implementar parser com campos inferidos a partir de telas, nomes, CPF, posição de coluna ou arquivos históricos anonimizados.

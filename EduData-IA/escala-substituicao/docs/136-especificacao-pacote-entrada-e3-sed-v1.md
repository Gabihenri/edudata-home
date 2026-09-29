# 136 — Especificação do Pacote de Entrada E3 — SED

**Data:** 29/09/2026  
**Status:** 🟢 especificação de recepção e homologação; artefato SED real ainda pendente  
**Gate:** não autoriza parser produtivo nem DDL

## 1. Objetivo

Definir o mínimo necessário para receber, preservar, auditar e homologar os artefatos operacionais do SED usados pela Escala Inteligente EDI.

A especificação não presume nomes de colunas, IDs, formatos ou relacionamentos que ainda não foram observados em uma fonte autorizada.

## 2. Pacote mínimo solicitado

Preferência de formato: XLSX ou CSV original, acompanhado de contexto de extração.

1. Relatório/Exportação de **Grade Horária**.
2. Relatório/Consulta de **Associação do Professor à Classe**.

PDF pode servir apenas como evidência preliminar; não deve ser tratado como contrato técnico do parser.

## 3. Metadados obrigatórios do artefato

Antes de interpretar qualquer linha, preservar:

- nome original do arquivo;
- formato;
- tamanho;
- SHA-256;
- data/hora da extração;
- sistema/tela/relatório de origem;
- usuário/perfil responsável pela extração, quando disponível;
- escola/organização de referência;
- ano letivo;
- filtros utilizados;
- período de validade informado pela fonte;
- versão/publicação, quando existente;
- referência/protocolo da consulta, quando existente.

## 4. Campos que devem ser identificados — não presumidos

### 4.1 Identidade acadêmica/docente

Localizar, quando presentes:

- identificador técnico do docente;
- DI ou identificador equivalente;
- identificador técnico da associação;
- vínculo/status;
- escola;
- ano letivo;
- vigência.

Não converter nenhum identificador SED diretamente para `auth_user_id` ou `teacher_profile_id`.

### 4.2 Associação Professor–Classe

Identificar:

- chave técnica da associação;
- professor;
- classe;
- escola;
- componente curricular;
- turma/subgrupo, se aplicável;
- status;
- início da vigência;
- fim da vigência;
- versão/publicação;
- referência à Grade, se existir.

### 4.3 Grade Horária

Identificar:

- chave técnica da Grade;
- escola;
- classe;
- dia/data;
- período/aula;
- horário inicial;
- horário final;
- componente;
- associação relacionada, se existir;
- versão;
- estado de publicação;
- vigência;
- chave técnica do registro de horário.

## 5. Relação crítica Associação ↔ Grade

A relação deve ser **demonstrada pelo artefato ou documentação técnica autorizada**.

Aceitar somente quando houver evidência de chave ou relacionamento formal.

Não inferir a relação por:

- nome do professor;
- nome da classe;
- componente;
- coincidência de horário;
- proximidade temporal;
- ordem das colunas;
- registros da Agenda;
- Sala do Futuro;
- frequência;
- histórico anterior.

Se a relação não puder ser comprovada:

`reconciliation_state = SOURCE_UNCERTAIN` ou `BLOCKED`.

## 6. Cardinalidades a medir

Após a primeira carga, calcular e registrar:

- associações por docente;
- associações por classe;
- grades por escola;
- grades por classe;
- grades por associação;
- registros por versão;
- sobreposição de vigências;
- duplicidades de chaves;
- associações sem Grade;
- Grades sem associação;
- componentes sem vínculo válido;
- múltiplas associações concorrentes.

Nenhuma cardinalidade será presumida antes da medição.

## 7. Vigência

Para cada entidade temporal, preservar início e fim conforme a fonte.

A resolução de uma ocorrência somente pode ocorrer quando:

- a associação estiver válida na data da ocorrência;
- a Grade estiver válida na data da ocorrência;
- a relação Associação ↔ Grade estiver homologada;
- a escola/contexto forem compatíveis;
- a versão utilizada estiver publicada/homologada.

As fronteiras inclusivas já estão cobertas pelo harness E3-H19/H20. Fora da vigência, o resultado deve ser bloqueado.

## 8. Versionamento e publicação

Cada conjunto recebido deve preservar:

- source_version, se fornecido;
- extraction_id/lote técnico;
- hash do artefato;
- estado de validação;
- estado de homologação;
- estado de publicação.

Somente versão publicada e homologada poderá alimentar a resolução operacional.

## 9. Separação das camadas

Fluxo obrigatório:

`RAW → NORMALIZED → MATCHED → VALIDATED → HOMOLOGATED → PUBLISHED`

A camada RAW deve permanecer imutável.

Uma linha com erro de matching ou proveniência não pode ser promovida apenas porque os demais campos parecem plausíveis.

## 10. Estados de rejeição

No mínimo:

- `AMBIGUOUS`
- `UNRESOLVED`
- `BLOCKED`
- `SOURCE_UNCERTAIN`

Nenhum desses estados pode produzir ocorrência operacional resolvida.

## 11. Critérios de homologação do primeiro artefato

O pacote E3 será considerado tecnicamente utilizável somente depois de comprovar:

- origem autorizada;
- integridade/hash;
- mapa real de campos;
- identificadores técnicos reais;
- identidade docente;
- escola;
- classe;
- componente;
- Associação;
- Grade;
- relação Associação ↔ Grade;
- vigência;
- versão/publicação;
- cardinalidades observadas;
- comportamento de alteração de Grade;
- fixture sanitizada;
- execução do harness E3;
- resultado reproduzível.

## 12. Proibições

Até o fechamento do E3:

- não criar parser produtivo;
- não criar DDL produtivo;
- não criar tabela oficial de Grade por hipótese;
- não criar ponte Auth ↔ docente por inferência;
- não usar Agenda como Grade oficial;
- não usar Sala do Futuro como substituto do artefato operacional;
- não transformar recomendação da Escala em efetivação SED.

## 13. Resultado

Este documento fecha a **interface de recepção do E3**, mas não inventa o contrato técnico da SED.

O próximo evento técnico relevante é a entrada dos dois artefatos reais. A partir deles, a análise deverá começar pela preservação do original e identificação das chaves, antes de qualquer implementação.

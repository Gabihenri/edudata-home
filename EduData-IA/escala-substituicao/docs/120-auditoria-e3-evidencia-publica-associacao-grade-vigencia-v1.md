# 120 — Auditoria E3: Evidência Pública Atual de Associação, Grade e Vigência v1

**Data:** 2026-09-28  
**Status:** 🟠 EVIDÊNCIA FUNCIONAL REFORÇADA / CHAVES TÉCNICAS AINDA NÃO HOMOLOGADAS

## 1. Objetivo

Atualizar o gate E3 com evidência pública oficial da SED, verificando se a documentação disponível permite fechar a semântica de Associação, Grade Horária e vigência sem inventar identificadores físicos.

## 2. Evidência oficial atual

O Portal de Atendimento da Secretaria de Estado da Educação de São Paulo informa que os horários exibidos no Diário de Classe correspondem aos horários cadastrados na Aba 1 da Associação do Professor à Classe e na Grade Horária. Também informa que, sem cadastro da Grade Horária, o sistema pode apresentar horários disponíveis ao professor para registro, com risco de lançamentos incorretos.

Fonte oficial:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-11257/pt-br

A orientação oficial sobre a Sala do Futuro Professor informa que, para que as turmas estejam corretamente disponíveis, devem estar ajustadas:

1. Homologação da Matriz Curricular;
2. Atribuição dos professores às turmas;
3. Homologação do Calendário Escolar;
4. Cadastro da Grade Horária.

Fonte oficial:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-08024/pt-br

A mesma orientação estabelece que as turmas precisam estar associadas com vigência ativa e descreve a associação em duas dimensões operacionais: o professor associado à turma e os horários correspondentes.

## 3. Evidência temporal

O Comunicado CITEM/DGREM/CVESC nº 6, de 10/03/2025, estabelece que alterações da Grade Horária passam a ser refletidas no Diário de Classe a partir das 05h00, considerando a última Grade cadastrada até 04h59 do dia vigente.

O comunicado também registra que o relatório de frequência e registro de aulas, naquele momento, ainda considerava somente a Grade mais recente, enquanto o Diário preservava a possibilidade de acesso a registros relacionados à Grade anterior.

Fonte oficial:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-11328/pt-br

## 4. O que foi confirmado

A documentação oficial permite confirmar semanticamente que:

- Associação do Professor à Classe é entidade operacional própria;
- Grade Horária é entidade operacional própria;
- horário do professor na turma é necessário para habilitar determinados registros;
- vigência da associação é relevante para disponibilidade operacional;
- alterações da Grade possuem comportamento temporal;
- calendário, atribuição/associação e Grade precisam estar coerentes para o funcionamento do Diário/Sala do Futuro.

Essas evidências reforçam o contrato de ocorrência já criado.

## 5. O que NÃO foi confirmado

A documentação pública consultada não fornece, por si só, os elementos necessários para fechar o contrato físico da ingestão E3:

- nome do identificador técnico da Associação;
- nome do identificador técnico da Grade;
- chave técnica do horário;
- chave da relação Associação ↔ Grade;
- chave técnica de classe/subturma;
- chave técnica de componente;
- formato oficial de exportação XLSX/CSV;
- layout de relatório operacional;
- API/endpoint autorizado para extração;
- dicionário técnico de campos;
- regra completa de versionamento físico;
- cardinalidades físicas da relação Associação × Grade.

Portanto, a evidência pública é suficiente para **semântica**, mas não para **homologação técnica**.

## 6. Consequência para o motor

O motor deve considerar como pré-condição:

`ASSOCIAÇÃO VÁLIDA + VIGÊNCIA APLICÁVEL + GRADE VÁLIDA + CALENDÁRIO HOMOLOGADO`

antes da criação de uma ocorrência operacional.

Não é permitido substituir essa pré-condição por:

- nome do professor;
- nome da turma;
- horário textual;
- coincidência de data;
- dados da Agenda;
- relatório de frequência;
- qualquer chave criada internamente sem correspondência comprovada na fonte.

## 7. Estado do Gate E3

| Elemento | Estado |
|---|---|
| Semântica Associação | 🟢 |
| Semântica Grade | 🟢 |
| Necessidade de vigência | 🟢 |
| Comportamento temporal | 🟢 |
| Dependência do calendário | 🟢 |
| ID técnico Associação | 🔴 |
| ID técnico Grade | 🔴 |
| Relação Associação ↔ Grade | 🔴 |
| Layout operacional | 🔴 |
| Artefato E3 atual | 🔴 |
| Parser produtivo | 🔴 |
| DDL produtivo | 🔴 |

## 8. Conclusão

O gate E3 avançou na camada de evidência funcional e temporal, mas permanece bloqueado na camada técnica.

A próxima evidência necessária continua sendo um artefato operacional autorizado, preferencialmente:

- Relatório Grade Horária;
- Relatório/Consulta Associação do Professor à Classe;

em XLSX/CSV ou outro formato técnico autorizado que preserve os identificadores e relacionamentos reais.

Nenhuma chave física será criada a partir de inferência documental.

**GATE-FONTE-SED = RED/BLOCKED para implementação física.**

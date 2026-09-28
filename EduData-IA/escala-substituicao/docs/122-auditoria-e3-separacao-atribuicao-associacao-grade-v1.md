# 122 — Auditoria E3: Separação Atribuição × Associação × Horário v1

Data: 2026-09-28
Status: SEMÂNTICA REFINADA / IDENTIFICADORES TÉCNICOS AINDA BLOQUEADOS

## 1. Nova evidência oficial

A documentação oficial da SED permanece atualizada em 2026 e reforça que a atribuição/associação docente possui etapas e contextos distintos.

O Portal de Atendimento informa que, para a correta disponibilização das turmas na Sala do Futuro Professor, devem estar ajustados:

1. homologação da Matriz Curricular;
2. atribuição dos professores às turmas;
3. homologação do Calendário Escolar;
4. cadastro da Grade Horária.

Fonte:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-08024/pt-br

## 2. Evidência sobre horário

A SED informa que os horários disponíveis no Diário são os cadastrados na Aba 1 da Associação do Professor à Classe e na Grade Horária.

Fonte:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-11257/pt-br

Portanto, para a Escala, não é correto colapsar atribuição do professor, associação professor-classe, horário da associação e grade horária em uma única entidade.

## 3. Evidência sobre alterações de atribuição

Documento oficial de 2026 também registra que determinadas aulas podem ser associadas em outra unidade escolar e por modalidades distintas de atribuição, inclusive aulas livres ou em substituição.

Fonte:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-12975/pt-br

Isso reforça que escola, docente, vínculo/atribuição, classe, componente e modalidade precisam permanecer identificáveis separadamente.

## 4. Regra para o motor

A Escala deverá trabalhar com relações explícitas:

DOCENTE → ATRIBUIÇÃO/ASSOCIAÇÃO → CLASSE → COMPONENTE → HORÁRIO → GRADE → VIGÊNCIA

e não com uma chave sintética inferida por nome + turma + horário.

## 5. Nova regra de bloqueio

Mesmo que um relatório público apresente nome do professor, classe, componente, dia e horário, isso ainda não autoriza a criação do vínculo físico no motor.

É necessário saber se cada registro possui:
- identificador técnico da associação;
- identificador técnico da classe;
- identificador técnico do componente;
- identificador técnico da grade;
- chave do horário;
- vigência;
- versão/publicação;
- relação entre associação e grade.

## 6. E3 após esta rodada

| Camada | Estado |
|---|---|
| Semântica docente → classe | 🟢 |
| Separação atribuição/associação | 🟢 |
| Separação horário/grade | 🟢 |
| Vigência | 🟢 |
| Dependência do calendário | 🟢 |
| Fonte oficial pública | 🟢 |
| Layout técnico operacional | 🔴 |
| IDs técnicos | 🔴 |
| Associação ↔ Grade | 🔴 |
| Cardinalidades físicas | 🔴 |
| Parser | 🔴 |
| DDL | 🔴 |

## 7. Conclusão

A auditoria não encontrou, nas fontes públicas oficiais consultadas, um layout técnico autorizado contendo as chaves necessárias para a ingestão E3.

A documentação atualizada em 2026, contudo, tornou a especificação semântica mais precisa e confirma que a Escala deve preservar as entidades e relações separadamente.

Nenhum dado foi inferido e nenhuma alteração de produção foi realizada.

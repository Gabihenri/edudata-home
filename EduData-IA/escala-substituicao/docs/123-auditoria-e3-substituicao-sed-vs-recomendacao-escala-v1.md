# 123 — Auditoria E3: Substituição Oficial SED × Recomendação Escala EDI v1

Data: 2026-09-28
Status: SEMÂNTICA OPERACIONAL REFINADA / INTEGRAÇÃO FÍSICA BLOQUEADA

## 1. Evidência oficial nova

A documentação oficial da SED para Professor Presente + Sala do Futuro Professor descreve explicitamente o fluxo de substituição.

Quando há falta do professor regente, o Trio Gestor pode indicar um substituto pelo módulo Gestão Presença Professor.

A mesma documentação determina que, no contexto PEI, o substituto deve ser um professor da própria unidade e ser cadastrado na SED como responsável temporário pela turma, permitindo o registro de frequência e conteúdo.

Fonte:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-08024/pt-br

## 2. Consequência arquitetural

Isso estabelece uma distinção fundamental:

SED:
- registra/efetiva a situação funcional e a responsabilidade temporária;
- controla a disponibilização do substituto para o registro pedagógico;
- mantém o vínculo operacional necessário ao Diário.

Escala Inteligente EDI:
- identifica a necessidade;
- gera candidatos;
- aplica restrições;
- calcula alocação/recomendação;
- registra decisão humana;
- pode encaminhar a decisão para efetivação na SED quando existir integração autorizada.

Portanto:

NECESSIDADE ≠ RECOMENDAÇÃO ≠ DECISÃO HUMANA ≠ EFETIVAÇÃO SED

## 3. Novo ponto de integração

A documentação oficial indica que o substituto precisa ser cadastrado na SED como responsável temporário.

Assim, uma futura integração não deverá simplesmente gravar “substituição = professor X”.

Ela precisará preservar, no mínimo:
- ocorrência/aula de origem;
- professor regente;
- ausência homologada;
- substituto candidato;
- decisão humana;
- responsabilidade temporária;
- vigência da substituição;
- escola;
- classe;
- componente;
- horário;
- origem/proveniência;
- estado da efetivação;
- referência técnica da operação SED, quando disponível.

## 4. Regra para o motor

O motor da Escala pode recomendar:

Professor A ausente → vaga/necessidade → Professor B candidato → alocação recomendada

Mas não deve declarar:

Professor B = substituto oficial

até existir confirmação humana e, quando aplicável, efetivação/homologação no sistema oficial.

## 5. Evidência sobre múltiplas ausências

A mesma documentação oficial orienta que, quando faltarem vários professores no mesmo turno, a gestão deve utilizar professores disponíveis da própria unidade e, se necessário, membros da gestão para assumir salas.

Isso confirma que o problema é de alocação global de recursos, e não apenas de busca individual de um substituto.

Para a Escala, isso reforça a necessidade do modelo GLOBAL ALLOCATION já especificado.

Fonte:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-08024/pt-br

## 6. Impacto no E3

Esta evidência não resolve os IDs técnicos da SED, mas melhora a especificação da integração futura.

O E3 agora possui duas camadas:

Camada A — Fonte acadêmica:
- associação;
- classe;
- componente;
- grade;
- horário;
- vigência;
- calendário.

Camada B — Efetivação da substituição:
- ausência;
- candidato;
- decisão;
- responsável temporário;
- vigência;
- registro oficial.

As duas camadas não devem ser confundidas.

## 7. Estado atualizado

| Elemento | Estado |
|---|---|
| Semântica da ocorrência | 🟢 |
| Semântica da ausência | 🟢 |
| Necessidade/vaga | 🟢 |
| Recomendação | 🟢 |
| Decisão humana | 🟢 |
| Substituição oficial SED | 🟢 conceitual |
| Responsável temporário SED | 🟢 conceitual |
| Identificadores técnicos SED | 🔴 |
| API/exportação oficial | 🔴 |
| Integração de efetivação | 🔴 |
| Parser físico | 🔴 |
| DDL produtivo | 🔴 |

## 8. Conclusão

A documentação oficial confirmou que a SED já possui um conceito operacional equivalente à efetivação de uma substituição.

A Escala Inteligente EDI deve permanecer como motor de inteligência e governança, sem usurpar a autoridade da SED.

A fronteira correta é:

SED = autoridade do registro oficial
Escala EDI = inteligência, restrições, alocação, recomendação, decisão e rastreabilidade

Nenhuma alteração de produção foi realizada.

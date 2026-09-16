# 102 — Auditoria de Evidência da Grade e Associação Operacional 2026 v1

**Projeto:** Escala de Substituição  
**Status:** EVIDÊNCIA FUNCIONAL / GATE-FONTE-SED RED-BLOCKED  
**Data:** 2026-09-10

## 1. Objetivo

Registrar evidência oficial atualizada que fortalece o contrato funcional entre Matriz Curricular, Associação de Professor à Classe, Grade Horária e lançamentos do Diário/Sala do Futuro, sem promovê-la a contrato técnico de integração.

## 2. Evidência SED-03613 — Matriz Curricular

O Portal de Atendimento informa que a Matriz Curricular é um sistema da SED e que sua homologação fornece o subsídio principal para a Associação de Professor à Classe. Após a homologação, o sistema cruza as informações com as turmas coletadas e gera o quadro de aulas.

Fonte oficial: SED-03613 — Matriz Curricular da rede estadual.

Conclusão: a cadeia conceitual deve preservar a precedência:

`matriz curricular homologada → turmas coletadas → quadro de aulas → associação`

Isso reforça que a ferramenta de substituição não deve inventar a grade a partir de uma agenda local.

## 3. Evidência SED-05190 — Grade Horária

O Portal informa que os horários exibidos no campo de frequência correspondem aos horários cadastrados na Aba 1 da Associação do Professor à Classe e Grade Horária. Sem cadastro na Aba 1, o campo pode permanecer sem horário selecionável.

Fonte oficial: SED-05190 — Diário de Classe – Cadastro de Horário/Grade horária.

Conclusão: a grade horária é um componente operacional necessário para transformar a associação em disponibilidade temporal de aulas. O motor deve continuar tratando ocorrência temporal como objeto próprio, e não apenas como vínculo professor-turma.

## 4. Evidência SED-05178 / SED-01387 — Vigência ativa

O Portal informa que, para as turmas aparecerem nos lançamentos, a associação precisa existir e estar com vigência ativa. A documentação também separa a associação na turma da associação dos horários.

Conclusão: `vigência` e `horário` permanecem dimensões distintas e necessárias para determinar se uma associação é operacionalmente válida em determinado período.

## 5. Evidência SED-08125 — alteração da grade durante o ano

A orientação oficial de 2025 registra que a grade horária pode ser alterada durante o ano letivo e que, após alteração, os docentes deixam de ter acesso aos dias da grade anterior para novos lançamentos/correções naquele fluxo.

Conclusão: mudanças de grade possuem impacto temporal real e reforçam os contratos já definidos para snapshot, vigência, detecção de mudança e reexecução.

## 5.1 Evidência adicional — cardinalidade de horários na Associação

A base oficial de conhecimento da SED mantém orientações específicas para **“Incluir mais de um horário na 1ª aba da Associação do professor na classe”**, inclusive uma orientação específica para **PEI**, e também mantém uma orientação separada para **“Edição – Cadastro de Horário do Professor à Classe (3º Passo da Associação)”**. O catálogo oficial também lista procedimentos para associações em substituição e situações de substituições concomitantes. citeturn0search0

Essas entradas permitem uma conclusão funcional limitada: uma associação professor-classe pode estar relacionada a **mais de um registro/horário de aula**, e o cadastro/edição do horário constitui uma dimensão operacional própria da associação. Isso é compatível com o modelo da Escala, no qual uma associação não deve ser reduzida a uma única janela temporal.

**Limitação:** os títulos e descrições do catálogo não homologam cardinalidade física, nomes de colunas, chaves ou estrutura de banco. Portanto, a implementação deve representar essa possibilidade apenas no contrato conceitual/sintético até que um artefato técnico atual seja obtido.

## 6. Impacto no modelo da Escala

A evidência atual fortalece o seguinte encadeamento:

`Matriz homologada → classes/turmas → quadro de aulas → associação professor-classe → grade horária → ocorrência temporal → ausência → necessidade de cobertura → candidatos → alocação → validação humana`

Além disso, a evidência adicional reforça que a camada temporal da associação deve admitir múltiplos horários sem assumir uma cardinalidade física ainda não homologada.

Nenhuma dessas evidências, porém, fornece o artefato técnico necessário para determinar as chaves internas, endpoints, payloads ou contratos de integração da SED.

## 7. Atualização do GATE-FONTE-SED

**Resultado: RED/BLOCKED permanece.**

A evidência reduz incerteza funcional, mas não fecha os itens técnicos críticos:

- artefato operacional atual exportável ou contrato técnico verificável;
- dicionário técnico correspondente;
- identificadores homologados de professor, turma e componente;
- regra técnica de reconciliação;
- contrato de atualização/versionamento;
- autoridade e proveniência da extração.

## 8. Regra de implementação

É permitido atualizar contratos comportamentais, fixtures sintéticas e testes para refletir essas evidências.

Não é permitido, com base apenas nestas páginas:

- criar parser da SED;
- inferir chaves internas;
- criar DDL produtivo;
- consumir endpoint não documentado;
- usar CPF/DI como chave interna sem homologação;
- considerar a Agenda fonte oficial da grade.

## 9. Conclusão

A documentação oficial de 2026/2025 confirma com maior precisão que a Associação e a Grade Horária participam da cadeia operacional que habilita os registros de aula e frequência. Também confirma que a vigência e as alterações de grade possuem efeito operacional.

A documentação oficial adicional sobre inclusão de mais de um horário e edição do horário do professor fortalece especificamente o modelo temporal da associação, sem autorizar inferência sobre o esquema físico da SED.

Isso fortalece o desenho do motor de substituição e, principalmente, a necessidade de snapshots temporais e reexecução diante de mudanças.

A evidência é suficiente para avançar no **modelo conceitual**, mas não para abrir o **GATE-FONTE-SED técnico**.
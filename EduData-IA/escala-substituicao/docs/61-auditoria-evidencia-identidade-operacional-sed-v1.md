# 61 — Auditoria da evidência de identidade operacional SED v1

**Data:** 2026-09-10  
**Escopo:** Associação do Professor à Classe / Grade Horária  
**Status:** evidência parcial; não libera o gate de produção.

## 1. Objetivo

Registrar o que foi possível comprovar sobre a identificação do docente e a estrutura operacional da Associação do Professor à Classe, sem converter evidência histórica de interface em contrato técnico atual.

## 2. Evidência localizada

Foi localizado um tutorial público que documenta o módulo **Associação do Professor à Classe** da Plataforma SED e descreve cinco etapas: cadastro de horários, associação de professores às turmas, associação do professor aos horários, ATPC e consulta.

O tutorial informa que, na etapa de associação, o cadastro era iniciado mediante **CPF do professor** e que, após isso, eram preenchidos dados como DI, tipo de ensino, turma, disciplina, atribuição em substituição, tipo/fase de atribuição e início/fim de vigência.

O mesmo material descreve que a etapa seguinte associa o professor aos intervalos de horário da turma e que a substituição de professor atualiza a associação subsequente.

Fonte localizada: tutorial público de Associação do Professor à Classe, publicado como cópia do material de 19/04/2018. A evidência deve ser tratada como histórica, não como contrato vigente.

## 3. Interpretação controlada

A evidência é suficiente para registrar que **CPF foi utilizado operacionalmente pela SED em material histórico para localizar/cadastrar o professor na Associação**.

Isso **não** prova que:

- CPF seja atualmente o identificador técnico primário da SED;
- CPF seja a chave interna da base atual;
- exista uma API que aceite CPF;
- o layout atual de exportação contenha CPF;
- CPF possa ser usado como chave canônica permanente no EduData IA.

Portanto, CPF permanece classificado como **atributo potencial de matching de fonte**, sujeito a contrato técnico atual e às regras de proteção de dados.

## 4. Evidência estrutural adicional

A documentação atual da SED confirma que os horários exibidos no Diário de Classe são os mesmos cadastrados na Aba 1 da Associação do Professor à Classe e Grade Horária.

Também há evidência pública de que a associação docente envolve turma, disciplina/componente e vigência, e que alterações da associação podem repercutir na organização dos horários.

Essa evidência reforça a autoridade operacional da família de fontes Associação Professor–Classe + Grade Horária, mas não fornece o layout atual de integração.

## 5. Impacto no contrato do adaptador

A descoberta não altera a regra arquitetural existente:

```text
Fonte SED
  ↓
staging bruto
  ↓
identificador(es) oficiais comprovados
  ↓
matching determinístico
  ↓
homologação
  ↓
teacher_profile
  ↓
grade oficial
```

Não deve ser implementado parser baseado exclusivamente em CPF, nome, e-mail ou posição de arquivo.

## 6. Gate

| Controle | Estado |
|---|---|
| Família de fonte operacional confirmada | 🟢 |
| Relação professor–turma–disciplina–vigência evidenciada | 🟢 |
| CPF como mecanismo histórico de associação | 🟡 confirmado historicamente |
| CPF como identificador técnico atual | 🔴 não comprovado |
| Exportação/API atual | 🔴 não comprovada |
| Dicionário atual | 🔴 não comprovado |
| Identificador canônico atual do docente | 🔴 não homologado |
| Parser de produção | 🔴 bloqueado |
| DDL de produção | 🔴 bloqueado |

## 7. Próximo passo

Buscar evidência atual de 2025/2026 que permita distinguir explicitamente:

1. identificador funcional do docente;
2. identificador acadêmico/associação;
3. identificador da turma/classe;
4. identificador do componente;
5. identificador da versão/registro da grade;
6. mecanismo de exportação ou integração.

Somente com essa evidência o contrato técnico do adaptador poderá ser promovido de **RED** para implementação.

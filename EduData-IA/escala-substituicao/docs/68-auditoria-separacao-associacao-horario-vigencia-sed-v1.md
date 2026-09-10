# 68 — Auditoria: separação entre associação docente, horário e vigência na SED v1

**Produto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** GREEN para regra conceitual; RED para contrato físico atual

## 1. Objetivo

Consolidar evidências oficiais da SED sobre três conceitos que não devem ser colapsados no modelo da Escala:

1. associação do professor à turma/classe;
2. associação do professor ao horário da turma;
3. vigência da associação.

## 2. Evidência oficial SED

Boletim Informativo SED, edição 33, de 05/08/2016, descreve explicitamente que a associação das turmas do professor ocorre em duas etapas:

- associação do professor à turma, por exemplo, professor lecionando Ciências no 6º Ano B;
- associação do professor ao horário da turma, por exemplo, professor lecionando Ciências às terças e quintas, das 7h às 7h50.

O mesmo documento informa que, se a primeira etapa existir mas a segunda não, o professor pode visualizar a turma na SED, mas não consegue realizar frequência, registro de aulas e avaliações. Também afirma que a associação deve possuir vigência ativa.

Fonte: Boletim Informativo SED, 05/08/2016, linhas 21–40 do documento oficial.

## 3. Consequência arquitetural

Esta evidência impede que o modelo da Escala trate uma associação professor–turma como se ela fosse, por si só, uma obrigação temporal de aula.

O modelo deve distinguir:

`associação acadêmica`

`+ horário/grade`

`+ vigência`

`= obrigação operacional contextualizada`

Para o motor de substituição, a unidade executável continua sendo a **ocorrência oficial** com data e intervalo de início/fim.

## 4. Relação com o modelo atual

A evidência dá suporte adicional ao desenho já definido:

- `academic_classes`: identidade da turma/classe;
- `academic_components`: componente/disciplina;
- `official_schedule_versions`: versão temporal da grade;
- `official_schedule_entries`: regra recorrente de horário/associação;
- `official_schedule_occurrences`: ocorrência datada usada pelo motor.

A associação docente não deve ser interpretada automaticamente como ocorrência. Uma associação pode existir com vigência ativa sem que uma determinada data/hora seja a ocorrência específica a ser substituída.

## 5. Efeito sobre a substituição imediata

Para uma falta em uma aula específica, o motor deve resolver:

1. qual escola está no contexto;
2. qual versão da grade estava vigente;
3. qual ocorrência corresponde à data/hora;
4. qual associação docente estava vigente naquela ocorrência;
5. se o docente titular está ausente;
6. quais candidatos estão elegíveis naquele instante.

Isso preserva o requisito central do produto: resolver rapidamente uma falta momentânea sem reconstruir a grade a partir de informações genéricas ou atuais.

## 6. Evidência adicional de vínculo com Matriz e Quadro-Aulas

O mesmo boletim oficial informa que a associação dos professores é realizada com base no **Quadro-Aulas**, que é gerado a partir da **Matriz Curricular**. Quando uma nova matriz é homologada, um novo Quadro-Aulas é gerado e a associação anterior é invalidada, exigindo nova associação.

O tutorial SED de 2019 também confirma que o módulo Associação do Professor à Classe está vinculado ao sistema de Matriz Curricular e que a exclusão da matriz provoca a exclusão do quadro de aulas e das associações correspondentes. O tutorial determina ainda que a matriz esteja homologada e o quadro de aulas gerado antes do cadastro das associações.

## 7. O que permanece não homologado

Esta evidência não revela:

- nomes físicos atuais das tabelas;
- chaves técnicas atuais;
- identificador canônico do professor;
- identificador canônico da turma;
- identificador canônico do componente;
- API atual;
- formato atual do Excel;
- dicionário atual dos campos;
- regras atuais completas de vigência no backend.

Portanto, não autoriza DDL produtivo nem parser definitivo.

## 8. Gate

### Regra conceitual
**GREEN:** associação, horário e vigência são conceitos distintos e devem permanecer distintos no domínio.

### Fonte operacional atual
**RED:** falta o artefato técnico atual homologado.

### Identidade técnica
**RED:** ainda sem chave canônica homologada.

### Implementação produtiva
**RED/BLOCKED:** sem parser/DDL definitivo enquanto o contrato físico atual não for obtido.

## 9. Próximo passo

Continuar a busca por documentação/artefato oficial atual que permita mapear:

`professor → associação → turma → componente → horário → vigência → versão da grade`

sem inferência por nome, e-mail, CPF, DI ou posição de linha.

# Auditoria 70 — Base de conhecimento SED: associação docente e grade horária

**Projeto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** VERDE para evidência funcional; VERMELHO para homologação técnica  

## 1. Objetivo

Reavaliar, em fonte oficial atual do Portal de Atendimento da SEDUC-SP, se a documentação pública sustenta o vínculo entre Associação do Professor à Classe e Grade Horária usado como fonte do motor da Escala.

## 2. Evidência oficial atual

O artigo oficial **Diário de Classe – Cadastro de Horário/Grade horária** informa que os horários exibidos no campo de frequência são os mesmos cadastrados na **Aba 1 da Associação do Professor à Classe e Grade Horária**. Também informa que, sem cadastro na Aba 1 da associação, o campo fica sem horários para seleção; sem Grade Horária, ficam disponíveis todos os horários, com risco de lançamentos incorretos.

Fonte oficial: Portal de Atendimento SEDUC-SP, artigo SED-05190, consultado em 10/09/2026.

## 3. Consequência arquitetural

A evidência reforça que o modelo da Escala não deve tratar Agenda como fonte da grade oficial. O caminho operacional comprovado é:

`Associação do Professor à Classe + Grade Horária → Diário de Classe → obrigação/aula operacional`

Para o produto:

`Fonte SED homologada → staging → canonização → official_schedule_versions → official_schedule_entries → official_schedule_occurrences`

A ocorrência continua sendo a unidade temporal adequada ao motor, pois a grade precisa ser reproduzida por data, horário, docente, turma e componente.

## 4. O que foi confirmado

- A SED mantém uma relação operacional entre Associação do Professor à Classe e Grade Horária.
- A Aba 1 da associação participa diretamente da determinação dos horários usados no Diário de Classe.
- A ausência de cadastro de grade altera o conjunto de horários disponíveis para lançamento.
- Portanto, associação e grade são fontes institucionais críticas para a Escala.

## 5. O que NÃO foi confirmado

Esta evidência não revela:

- nome físico das tabelas da SED;
- identificador técnico canônico do docente;
- identificador técnico canônico da turma;
- identificador técnico do componente/disciplina;
- identificador técnico da associação;
- endpoint/API de extração;
- formato atual do Excel gerado pela SED;
- contrato atual do arquivo exportado;
- frequência de atualização da extração;
- mecanismo oficial de autenticação/integração para consumo externo.

Portanto, **não autoriza DDL de produção, parser definitivo ou matching por CPF/DI como chave canônica**.

## 6. Estado do gate

**GATE-FONTE-SED: RED/BLOCKED.**

A evidência funcional está fortalecida, mas o artefato técnico ainda não está homologado.

## 7. Próximo passo obrigatório

Obter, por rota oficial e legítima, um artefato atual de 2025/2026 que permita comparar:

1. cabeçalhos reais do Excel exportado pela SED;
2. identificadores e seus significados;
3. campos de escola/turma/componente/docente;
4. vigência;
5. horário/grade;
6. substituição;
7. versionamento/ano letivo;
8. origem e método de extração.

Somente depois dessa homologação deve ser iniciado o adaptador/parsers e qualquer DDL de integração física.

## 8. Decisão

**Decisão:** avançar a auditoria da fonte oficial e manter bloqueada a implementação física dependente de IDs/layout ainda não comprovados.

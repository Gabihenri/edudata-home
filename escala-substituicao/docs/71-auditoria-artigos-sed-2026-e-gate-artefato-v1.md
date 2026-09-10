# Auditoria 71 — Artigos SED 2026 e gate do artefato técnico

**Projeto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** RED/BLOCKED para integração técnica

## 1. Objetivo

Verificar se a base oficial de conhecimento da SEDUC-SP disponibiliza documentação atual suficiente para homologar o artefato técnico da Associação do Professor à Classe/Grade Horária.

## 2. Evidências encontradas

A base oficial de conhecimento atualmente indexa, entre outros:

- **Atribuição Inicial de Classes e Aulas — Ano Letivo de 2026**, associada à Resolução SEDUC nº 3, de 13/01/2026;
- **Edição – Cadastro de Horário do Professor à Classe (3º Passo da Associação)**;
- **Aulas em substituição na associação de professor à classe - SED**;
- **Associação Professor(a) em Substituição - Tutorial**;
- **Associação de professor em mais de uma escola - SED**;
- **Associação do Professor à Classe - principais mudanças - PERFIS**.

A listagem oficial demonstra que o processo possui documentação própria para associação, horário e substituição. citeturn3view0turn3view1turn3view2

## 3. Limitação encontrada

Ao tentar abrir o artigo de **Atribuição Inicial de Classes e Aulas — Ano Letivo de 2026**, o portal retorna **Artigo indisponível**. Portanto, a existência do artigo pode ser comprovada pela listagem, mas seu conteúdo técnico não pode ser usado como contrato de integração.

O artigo específico de edição do horário também não pôde ser recuperado pela ferramenta nesta execução (cache miss). Isso impede inferir campos internos, IDs ou endpoints a partir dele.

## 4. Evidência funcional consolidada

O artigo atual do Diário de Classe continua acessível e afirma que os horários exibidos para frequência são os mesmos cadastrados na **Aba 1 da Associação do Professor à Classe e Grade Horária**. Sem o cadastro correspondente, o comportamento do Diário muda. citeturn1search0

A documentação operacional de 2025 também mostra a interface da Associação com **Escolher Colunas, Imprimir, Gerar Excel e Gerar PDF**, comprovando exportação pela interface do usuário, mas não disponibiliza o arquivo gerado nem um contrato técnico público. citeturn1search2

## 5. Decisão de engenharia

Não há evidência suficiente para homologar:

- ID técnico canônico do docente;
- ID técnico canônico da turma;
- ID técnico canônico do componente;
- ID da associação;
- layout atual do Excel 2025/2026;
- endpoint/API de extração;
- contrato de autenticação;
- chave estável de reconciliação.

Consequentemente, CPF e DI continuam classificados como **atributos/locators da fonte**, e não como chaves canônicas do Core.

## 6. Próxima rota legítima

A investigação deve continuar por duas vias:

1. documentação pública oficial e recursos do Portal de Atendimento;
2. artefato real exportado pela interface SED, obtido legitimamente por usuário autorizado da escola/DE.

Se o segundo caminho for utilizado, o arquivo deve ser preservado como evidência, com origem, data/hora, ano letivo, filtros usados e hash, antes de qualquer parser.

## 7. Gate

**GATE-FONTE-SED: RED/BLOCKED.**

A arquitetura funcional está suficientemente fundamentada para continuar o desenho conceitual, mas a implementação física dependente da fonte permanece bloqueada.

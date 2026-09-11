# Auditoria 73 — Base SED: associação, horário e substituição — consolidação 2026

**Projeto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** RED/BLOCKED para integração técnica; evidência funcional fortalecida

## 1. Objetivo

Consolidar a busca atual na Base de Conhecimento oficial da SEDUC-SP e verificar se existem peças documentais suficientes para inferir o contrato técnico da fonte da Escala.

## 2. Resultado da busca oficial

A base oficial atualmente lista, de forma separada, artigos para:

- Associação de professor em mais de uma escola;
- Associação do Professor à Classe e perfis;
- Associação em substituição;
- Aulas em substituição na Associação do Professor à Classe;
- Professor(a) em Substituição;
- Edição — Cadastro de Horário do Professor à Classe, identificado como **3º Passo da Associação**;
- Associação e Carga Horária;
- problemas da Associação;
- Atribuição Inicial de Classes e Aulas — **Ano Letivo 2026**.

A própria indexação do portal confirma que horário e associação possuem um fluxo específico e que substituição é tratada dentro desse ecossistema operacional.

## 3. Nova evidência relevante

A existência do artigo **Edição — Cadastro de Horário do Professor à Classe (3º Passo da Associação)** é uma evidência adicional de que o horário do docente à classe não deve ser modelado como simples atributo genérico da Agenda.

Também existe artigo específico sobre **Aulas em substituição na associação de professor à classe - SED**, reforçando que a substituição está relacionada à associação operacional da SED.

## 4. Limite da evidência

A base pública é uma base de conhecimento para operação humana. Ela não expõe, nas páginas recuperadas nesta auditoria:

- schema físico;
- nomes de tabelas;
- identificadores internos;
- contrato de API;
- endpoint de exportação;
- layout técnico atual do Excel;
- regras de autenticação para integração máquina-a-máquina.

Portanto, a documentação é suficiente para confirmar o **domínio operacional**, mas não para construir o **adaptador técnico**.

## 5. Decisão arquitetural consolidada

O Core da Escala deve permanecer desacoplado da implementação interna da SED.

Contrato conceitual:

`SED / artefato homologado → staging SED → validação → canonização → grade oficial → ocorrências → vagas → candidatos → ranking → alocação`

Nenhum campo de origem deve ser promovido automaticamente a chave canônica sem evidência técnica.

## 6. Consequência prática

A busca documental pública chegou a um ponto de retorno decrescente. O próximo ganho de informação depende de um artefato operacional real:

**exportação Gerar Excel da tela Associação do Professor à Classe**, obtida legitimamente por usuário autorizado.

O arquivo deverá ser preservado com:

- data/hora da exportação;
- ano letivo;
- escola/DE;
- filtros aplicados;
- nome original do arquivo;
- hash SHA-256;
- cópia somente-leitura para evidência;
- registro de quem realizou a exportação, quando permitido.

## 7. Gate

**GATE-FONTE-SED: RED/BLOCKED.**

Não liberar parser definitivo, DDL de produção, matching por CPF/DI ou sincronização automática enquanto o artefato técnico não estiver homologado.

## 8. Próximo passo

Quando o Excel real estiver disponível, executar imediatamente uma auditoria de layout e semântica antes de qualquer implementação:

1. inventário dos cabeçalhos;
2. tipos de dados;
3. cardinalidade;
4. chaves candidatas;
5. IDs e sua estabilidade;
6. vigência;
7. associação/substituição;
8. relação com horário;
9. duplicidades;
10. reconciliação com o modelo oficial da Escala.

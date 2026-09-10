# 51 — Auditoria da Grade SEDUC v2

**Produto:** Escala Inteligente de Substituição — EduData IA  
**Data:** 2026-09-09  
**Status do gate:** 🔴 BLOQUEADO para DDL/produção

## 1. Objetivo

Consolidar a evidência oficial disponível sobre a origem operacional da grade horária e verificar se as bases públicas localizadas são suficientes para alimentar ocorrências de substituição.

## 2. Evidência oficial

A documentação oficial da SEDUC informa que os horários exibidos no Diário de Classe são os horários cadastrados na **Associação do Professor à Classe e Grade Horária**. Sem cadastro da grade, o comportamento do Diário de Classe pode permitir horários inadequados para registro. A grade, portanto, é uma fonte operacional própria e não deve ser reconstruída a partir de cadastro funcional. [SED-05190]

A documentação de 2025 também informa que a Sala do Futuro Professor depende, entre outros requisitos, da atribuição dos professores às turmas e do cadastro da grade horária. [SED-08125]

O comunicado CITEM/DGREM/CVESC de 10/03/2025 estabelece comportamento temporal da grade: alterações passam a refletir no Diário de Classe a partir das 05h00, preservando determinados registros da grade anterior. Isso confirma que vigência/versionamento são requisitos do domínio. [SED-08189]

A documentação de responsabilidades da Sala do Futuro informa ainda que a Agenda Escolar apenas exibe dados provenientes das fontes, incluindo a grade horária, e não é a origem desses dados. [SED-08325]

## 3. Resultado da busca por bases abertas

Foram pesquisados os catálogos oficiais da SEDUC para **Carga horária de professores** e **Turmas (classes ativas e encerradas)**.

O Plano de Dados Abertos confirma esses domínios como bases catalogadas, mas a pesquisa atual não localizou um artefato público atual que permita afirmar que essas bases constituem o export operacional completo da Associação Professor–Classe + Grade Horária.

Assim:

- **Servidores ativos por Unidade:** fonte funcional auxiliar;
- **Carga horária de professores:** candidata a fonte auxiliar de atribuição/carga;
- **Turmas:** candidata a fonte auxiliar de identidade de classes;
- **Associação Professor–Classe + Grade Horária:** fonte operacional primária comprovada documentalmente;
- **Agenda EDI:** consumidor/registro operacional, não fonte da grade.

## 4. Achado crítico

### GRADE-AUD-01 — Artefato técnico da grade não localizado

**Status: 🔴 ABERTO — CRÍTICO**

A documentação comprova a existência e a função operacional da grade, mas não foi localizada, nesta etapa, uma API, export, arquivo técnico ou contrato de integração público que permita importar deterministicamente suas ocorrências.

Não é permitido criar um parser baseado em nomes de colunas presumidos.

## 5. Requisitos técnicos já comprovados

Uma futura integração da grade deverá preservar pelo menos:

- organização;
- escola;
- referência do docente;
- referência da turma;
- componente curricular;
- dia/data ou recorrência;
- início;
- fim;
- turno;
- vigência;
- versão da grade;
- origem;
- data de publicação/alteração;
- responsável ou mecanismo de publicação, quando disponível.

A ocorrência só poderá alimentar o motor após publicação/validação da versão correspondente.

## 6. Evidência sobre substituição

A FAQ oficial da Sala do Futuro descreve que, diante da ausência do professor regente, o trio gestor pode acessar o módulo Professor Presente e indicar substitutos. Isso reforça que a Escala Inteligente deve funcionar como camada de recomendação/gestão e não como substituição automática do processo institucional da SED.

## 7. Decisão

A arquitetura permanece validada:

```text
Fonte funcional
     ↓
identidade docente
     ↓
Professor–Classe / atribuição
     ↓
Grade Horária publicada
     ↓
ocorrências
     ↓
Escala Inteligente
     ↓
recomendação
     ↓
validação humana
     ↓
registro/auditoria
```

A base de servidores não pode preencher a grade. A Agenda não pode preencher a grade. Bases públicas de carga/turmas só poderão ser utilizadas como auxiliares depois de comprovada sua semântica e autoridade.

## 8. Próximo passo seguro

Investigar o material oficial de formação/documentação da **Associação do Professor à Classe**, especialmente o fluxo de cadastro de horário do professor à classe, procurando referências a identificadores, relatórios, exportações ou integrações que permitam especificar o adaptador da grade sem inferência.

Até essa evidência existir, o gate permanece vermelho e nenhuma DDL produtiva deve ser executada.

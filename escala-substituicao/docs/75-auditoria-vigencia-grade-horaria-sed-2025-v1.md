# Auditoria 75 — Vigência da Grade Horária SED 2025 — v1

**Projeto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** RED/BLOCKED para integração técnica

## 1. Objetivo

Registrar nova evidência oficial sobre a temporalidade da grade horária da SED e verificar se ela altera as decisões do GATE-FONTE-SED.

## 2. Evidência oficial principal

O **Comunicado CITEM/DGREM/CVESC nº 6, de 10/03/2025**, informa que as alterações na grade horária passam a ser refletidas no Diário de Classe a partir das **05h00**. A regra operacional considera a última grade cadastrada até 04h59 do dia vigente.

A mesma comunicação explica que, após uma alteração, o professor ainda pode acessar registros vinculados à grade anterior para preservar a integralidade dos lançamentos. O documento também informa que, naquele momento, o relatório de frequência e registro de aulas ainda não refletia a vigência da grade e estava em aprimoramento.

Fonte oficial: Portal de Atendimento SEDUC, artigo `SED-08189`.

## 3. Evidência complementar de URE

Documento oficial da Diretoria de Ensino Região Norte 2, de dezembro de 2024, reproduz o comunicado sobre o cadastro da Grade Horária para 2025 e orienta as escolas a concluir o cadastro para garantir o funcionamento do Diário de Classe.

A peça também registra que as Diretorias de Ensino poderiam acompanhar a execução por meio do **Relatório Grade Horária**, em `Gestão Escolar > Grade Horária > Relatório Grade Horária`.

Documento correlato: `Rede nº 653/24`, de 18/12/2024.

## 4. Impacto no modelo da Escala

A evidência fortalece uma decisão já adotada no projeto:

`official_schedule_versions → official_schedule_entries → official_schedule_occurrences`

não deve ser reduzido a uma única fotografia da grade atual.

Uma ocorrência oficial precisa poder ser relacionada à **versão/vigência da grade aplicável ao momento da aula**. Alterações posteriores não podem simplesmente sobrescrever a interpretação histórica de uma ocorrência já existente.

## 5. O que esta evidência NÃO comprova

O comunicado não revela:

- ID técnico do docente;
- ID técnico da turma/classe;
- ID técnico do componente/disciplina;
- ID da associação;
- layout do Excel da Associação;
- endpoint da Associação;
- chave estável de reconciliação;
- contrato de autenticação para integração máquina-a-máquina.

Portanto, nenhum desses elementos deve ser criado ou inferido a partir desta evidência.

## 6. Relação com o Diário de Classe

A documentação reforça a cadeia funcional já estabelecida:

**Associação do Professor à Classe + Grade Horária → Diário de Classe**

A novidade desta auditoria é a explicitação de que essa relação possui comportamento temporal: mudanças na grade entram em vigor segundo uma regra de vigência e o sistema precisa preservar o contexto de registros anteriores.

## 7. Decisão do gate

**GATE-FONTE-SED = RED/BLOCKED.**

A evidência melhora o modelo temporal da grade, mas não fornece o artefato técnico necessário para homologar a fonte de identidade docente e grade.

Continuam bloqueados:

- parser definitivo;
- DDL físico de produção;
- matching por CPF/DI como chave canônica;
- sincronização automática com a SED.

## 8. Próximo passo

Continuar a busca por documentação oficial de 2025/2026 vinculada à Associação e à Grade Horária, especialmente materiais que exponham estrutura de exportação, identificadores ou mecanismos oficiais de integração.

Se a busca pública continuar sem produzir o contrato técnico, o projeto deverá seguir para o protocolo de obtenção de um **Excel real da Associação do Professor à Classe**, gerado legitimamente por usuário autorizado.

# Auditoria 76 — Atribuição, vagas e substituição 2026 — v1

**Projeto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** evidência operacional ampliada; gate técnico permanece RED/BLOCKED

## 1. Objetivo

Investigar a camada imediatamente anterior à formação de vaga, candidatos e substituição, usando documentação oficial atual de 2026, sem inferir o schema técnico da Associação.

## 2. Evidência oficial atual — Atribuição 2026

O Portal de Atendimento SEDUC mantém o artigo **SED-08430 — QM para atribuição de classes e aulas para o ano letivo de 2026**, associado à Portaria DIPES nº 05, de 15/01/2026.

O material identifica explicitamente os atores envolvidos: docentes efetivos/nomeados, docentes não efetivos, contratados/candidatos à contratação, Unidades Escolares e Unidades Regionais de Ensino.

O cronograma diferencia atendimento em nível de UE e URE e registra fases como constituição, ampliação e composição de jornada e carga suplementar. Também registra situações de docentes não atendidos e processos em nível regional.

## 3. Evidência oficial atual — PEI 2026

O artigo **SED-08419 — Ajustes do Processo de Atribuição PEI 2026** informa que as Unidades Escolares registram informações na SED, identificam excedentes, inserem vagas remanescentes na SED e atualizam novamente as vagas após etapas posteriores. A URE consolida os dados e publica o saldo final de vagas.

O documento também explicita critérios de alocação em determinadas etapas: disponibilidade de vagas, classificação do docente e formação compatível.

## 4. Consequência para a arquitetura da Escala

A evidência atual sustenta uma separação explícita entre:

`grade oficial` → `ocorrência/aula` → `situação de ausência` → `vaga de substituição` → `candidatos` → `elegibilidade` → `classificação/ranking` → `validação humana`.

Uma vaga não deve ser modelada simplesmente como “aula sem professor”. A documentação de atribuição mostra que **vaga é um objeto operacional do processo de atribuição**, com saldo, etapas, níveis UE/URE e critérios próprios.

A Escala deve, portanto, preservar a origem da vaga e seu contexto temporal, sem transformar automaticamente qualquer ausência docente em vaga elegível para substituição.

## 5. Evidência sobre associação em substituição

O catálogo oficial atual do Portal de Atendimento mantém artigos específicos para:

- aulas em substituição na Associação do Professor à Classe;
- aulas em substituição e/ou Artigo 22 na associação;
- Associação Professor(a) em Substituição — Tutorial;
- associação em substituição no PEI;
- licença de docente substituto;
- mensagens de substituições concomitantes.

Isso confirma que substituição possui regras próprias dentro do domínio da Associação.

**Limite:** o catálogo não expõe, nesta consulta pública, o schema técnico dessas operações nem seus identificadores internos de dados.

## 6. Nova regra de domínio registrada

A implementação futura deverá distinguir, no mínimo:

1. **Ocorrência oficial:** aula prevista pela grade vigente;
2. **Ausência:** evento que pode gerar necessidade de cobertura;
3. **Vaga:** necessidade operacional reconhecida pelo fluxo da SED/gestão;
4. **Substituição:** atribuição/cobertura efetivamente realizada.

Não será permitido colapsar esses quatro conceitos em uma única entidade física sem evidência posterior.

## 7. IDs e chaves

Nenhum dos identificadores acima foi promovido a chave técnica canônica.

Continuam desconhecidos para o domínio operacional da Associação:

- ID técnico do docente;
- ID técnico da classe/turma;
- ID técnico do componente;
- ID técnico da associação;
- ID técnico da vaga;
- chave de reconciliação entre grade, atribuição e associação.

## 8. Gate

**GATE-FONTE-SED = RED/BLOCKED.**

A evidência funcional e operacional está crescendo, mas continua ausente o artefato técnico necessário para homologar o contrato da fonte.

## 9. Próximo passo

Continuar a busca por artefatos oficiais específicos da Associação e das telas/relatórios de atribuição que possam revelar campos exportáveis e identificadores. Se não houver exposição pública, encerrar a busca documental com protocolo formal de obtenção do Excel real por usuário autorizado.

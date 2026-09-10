# Auditoria do Harness de Pontuação e Ranking v1

**Produto:** Escala de Substituição  
**Artefato auditado:** `tests/candidate-score-ranking.postgres.test.sql`  
**Versão:** v1  
**Data:** 2026-09-10  
**Gate de produção:** 🔴 RED / BLOCKED

## 1. Objetivo

Auditar o harness sintético de PostgreSQL responsável por verificar o contrato de pontuação e ranking de candidatos após a passagem pelas regras HARD de elegibilidade.

O arquivo auditado está versionado no repositório e possui SHA `679ffe340a780e665bee4fe09c9fc6e389d3478f`.

## 2. Escopo

Foram confrontados:

- pesos dos sete critérios;
- faixa de pontuação;
- bloqueio de candidatos inelegíveis;
- reconstrução do score por contribuições;
- diferenciação por componente;
- tratamento de evidência de proximidade;
- desempate determinístico;
- versão do conjunto de regras;
- referência do snapshot.

Também foram procuradas lacunas entre o contrato `58-contrato-pontuacao-ranking-v1.md` e o que o harness efetivamente demonstra.

## 3. Resultado resumido

| Controle | Status | Observação |
|---|---|---|
| SR-AUD-01 — pesos totalizam 100 | 🟢 | GATE-01 cobre explicitamente |
| SR-AUD-02 — score entre 0 e 100 | 🟢 | GATE-02 cobre faixa |
| SR-AUD-03 — HARD bloqueia score operacional | 🟢/🟡 | GATE-03 bloqueia scored/ranked, mas usa `score=0` para excluído |
| SR-AUD-04 — breakdown reconstrutível | 🟢 | GATE-04 demonstra soma das contribuições |
| SR-AUD-05 — componente influencia score | 🟢 | GATE-05 demonstra diferença numérica |
| SR-AUD-06 — proximidade sem evidência não gera vantagem | 🟡 | Não há estado explícito de evidência |
| SR-AUD-07 — desempate determinístico | 🟡 | Ordenação é demonstrada, mas não existe ranking materializado de múltiplos candidatos |
| SR-AUD-08 — regra de desempate usa identificador homologado | 🟡 | Harness trata `teacher_id` como técnico, sem campo explícito de homologação |
| SR-AUD-09 — mudança de rule set gera novo run | 🔴 | Não testado |
| SR-AUD-10 — histórico não é sobrescrito | 🔴 | Não testado |
| SR-AUD-11 — score excluído é nulo | 🔴 | Contrato prevê `null`; harness exige `NOT NULL` e usa zero |
| SR-AUD-12 — execução PostgreSQL real | 🔴 | Harness não foi executado contra banco real |
| SR-AUD-13 — avaliação real do motor | 🟡 | Harness injeta resultados esperados; não implementa o motor |

## 4. Achados

### FIND-01 — Score de candidato excluído está representado como zero

**Severidade:** Alta  
**Status:** Aberto

O contrato de pontuação estabelece que candidatos excluídos não recebem score operacional. A modelagem do harness, entretanto, declara `score numeric ... NOT NULL` e registra o candidato inelegível com `score = 0`.

Isso pode ser interpretado como um score válido, ainda que acompanhado de `ranking_status = 'excluded'`.

**Risco:** ambiguidade semântica entre “não pontuado” e “pontuado com zero”.

**Correção requerida:** permitir `score NULL` para `excluded` e validar que candidatos excluídos não possuam score nem rank. As contribuições também devem ser nulas ou explicitamente tratadas como não calculadas, conforme decisão final do contrato.

### FIND-02 — Proximidade não possui estado explícito de evidência

**Severidade:** Média  
**Status:** Aberto

O harness representa ausência de evidência de proximidade simplesmente com `proximity = 0`. O contrato, porém, determina que proximidade só pode produzir mérito quando existir fonte homologada e prevê o motivo `PROXIMITY_NOT_AVAILABLE`.

**Risco:** não é possível distinguir “evidência inexistente”, “evidência indisponível”, “distância efetivamente desfavorável” e “valor normalizado zero”.

**Correção requerida:** adicionar estado/proveniência explícita da evidência de proximidade ou uma estrutura equivalente que permita reconstrução da decisão.

### FIND-03 — O harness não demonstra ranking real entre múltiplos candidatos

**Severidade:** Média  
**Status:** Aberto

O cenário S02 demonstra que uma diferença de componente altera o valor calculado, e S04 demonstra uma ordenação determinística sobre `teacher_id`. Porém, não há uma consulta de ranking que produza posições para um conjunto de candidatos elegíveis e valide a ordem completa segundo todos os critérios de desempate.

**Risco:** o contrato de ranking pode estar correto no papel sem que a implementação do ranking seja efetivamente verificada.

**Correção requerida:** incluir cenário com múltiplos candidatos, scores calculados e `rank_position` produzido por ordenação determinística conforme o contrato.

### FIND-04 — Identificador do desempate não comprova homologação

**Severidade:** Média  
**Status:** Aberto

O comentário de S04 chama `teacher_id` de “homologated technical id”, mas o esquema não possui um atributo ou relação que demonstre essa homologação.

**Risco:** o teste pode passar usando qualquer UUID técnico, sem provar que o identificador utilizado no desempate é o identificador acadêmico oficial homologado.

**Correção requerida:** representar explicitamente a propriedade de homologação ou vincular o identificador a uma entidade/contrato de identidade acadêmica já aprovado.

### FIND-05 — Versionamento do rule set não testa criação de novo run

**Severidade:** Média  
**Status:** Aberto

GATE-08 prova apenas que um run conserva sua versão e snapshot. Não prova que uma alteração de `rule_set_version` gere um novo `engine_run/score_run` nem que o resultado anterior permaneça histórico.

**Correção requerida:** adicionar cenário v1 → v2 com novo run e preservação integral do resultado anterior.

### FIND-06 — Ausência de teste de não sobrescrita histórica

**Severidade:** Média  
**Status:** Aberto

O `UNIQUE (run_id, candidate_id)` impede duplicidade dentro de um mesmo run, mas não demonstra a política histórica entre runs diferentes.

**Correção requerida:** provar que rerun/reprocessamento cria novo contexto de execução e não modifica silenciosamente resultado histórico.

### FIND-07 — Harness é contratual/assertivo, não implementação do motor

**Severidade:** Média  
**Status:** Informativo / aberto para integração

Os cenários inserem diretamente valores esperados em `scores` e `candidate` e depois executam gates. Portanto, o arquivo valida propriedades estruturais e invariantes do contrato, mas não executa uma implementação real do motor de pontuação/ranking.

Isso é adequado nesta fase de definição, desde que não seja confundido com teste de integração ou teste de produção.

**Correção requerida:** manter o harness como contrato e, posteriormente, adicionar teste de integração do motor real quando as dependências físicas forem homologadas.

## 5. Pontos positivos

- Os sete pesos definidos no contrato estão representados e somam exatamente 100.
- A faixa 0–100 possui gate explícito.
- A barreira entre elegibilidade HARD e pontuação operacional está explicitamente testada.
- A decomposição das contribuições permite reconstruir o score máximo.
- O componente, de maior peso, é demonstrado como fator diferenciador.
- A regra temporal de proximidade não concede vantagem quando seu valor é zero.
- O desempate não depende da ordem de inserção.
- O run preserva `rule_set_version` e `snapshot_reference`.
- O teste permanece sintético, isolado e termina com `ROLLBACK`, sem modificar tabelas de produção.

## 6. Correções prioritárias

### Prioridade P0
1. Corrigir semântica de score excluído (`NULL`, não zero), conforme contrato.
2. Executar o harness em PostgreSQL real e registrar evidência.

### Prioridade P1
3. Criar evidência explícita de proximidade e sua proveniência.
4. Testar ranking efetivo de múltiplos candidatos.
5. Representar homologação do identificador usado no desempate.
6. Testar mudança de rule set com novo run.
7. Testar preservação histórica entre runs.

### Prioridade P2
8. Integrar o harness contratual ao motor real somente após homologação das dependências físicas e de identidade.

## 7. Dependências externas que continuam bloqueando produção

Este audit não altera o gate geral do produto. Permanecem bloqueadores já registrados:

1. artefato técnico/API/export da Grade Horária oficial da SEDUC ainda não homologado;
2. identificador oficial de professor ainda não homologado;
3. identificador oficial de turma ainda não homologado;
4. código/ID oficial de componente ainda não homologado;
5. ponte Auth ↔ identidade acadêmica docente ainda não física/homologada;
6. catálogo de permissões e RLS específico da Escala ainda não publicado;
7. execução real dos harnesses PostgreSQL ainda pendente;
8. DDL físico de produção para vagas, candidatos e alocações ainda pendente;
9. versão final do motor de regras ainda pendente.

## 8. Decisão de auditoria

**Resultado: 🔴 RED / BLOCKED.**

O contrato de pontuação/ranking está suficientemente especificado para continuar a etapa de correção do harness, mas não há evidência suficiente para considerar o componente validado para produção.

A próxima ação segura é **corrigir o harness de score/ranking**, começando pela semântica de candidato excluído e, na mesma sequência controlada de engenharia, ampliar a prova de ranking, evidência e versionamento. Não criar DDL de produção enquanto os bloqueadores de identidade, fonte oficial SEDUC e execução PostgreSQL permanecerem abertos.

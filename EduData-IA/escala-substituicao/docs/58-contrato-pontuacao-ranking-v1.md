# Escala de Substituição — Contrato de Pontuação e Ranking v1

**Status:** aprovado como contrato lógico preliminar  
**Gate:** 🔴 RED / BLOCKED para produção  
**Princípio:** pontuação ordena apenas candidatos já elegíveis; nunca contorna HARD rules.

## 1. Objetivo

Definir uma camada determinística de pontuação para ordenar candidatos elegíveis a uma vaga de substituição, preservando explicabilidade, estabilidade e possibilidade de auditoria.

Fluxo obrigatório:

`Vaga → HARD rules → candidatos elegíveis → pontuação → ranking → validação humana → alocação`

Nenhum candidato com `eligibility_status != eligible` pode receber posição de ranking operacional.

## 2. Critérios v1

A pontuação v1 usa somente critérios preferenciais já previstos no contrato de elegibilidade:

| Código | Critério | Peso |
|---|---|---:|
| SCORE-01 | correspondência de componente/disciplina | 30 |
| SCORE-02 | correspondência de área de conhecimento | 20 |
| SCORE-03 | compatibilidade de disponibilidade | 15 |
| SCORE-04 | continuidade pedagógica | 15 |
| SCORE-05 | equilíbrio de distribuição de substituições | 10 |
| SCORE-06 | proximidade confiável | 5 |
| SCORE-07 | preferência institucional explícita | 5 |
| **Total** | | **100** |

Os pesos são parte da versão do conjunto de regras e não devem ser alterados silenciosamente.

## 3. Normalização

Cada critério produz um valor normalizado entre `0` e `1`.

A pontuação final é:

`score = Σ (peso × valor_normalizado)`

Como os pesos somam 100, o resultado fica entre `0` e `100`.

Valores ausentes ou não comprovados **não devem ser convertidos automaticamente em máxima pontuação**. A ausência de evidência deve produzir valor neutro ou zero conforme a definição do critério, sempre registrada na explicação.

## 4. Definição dos critérios

### SCORE-01 — Componente/disciplina

- `1.0`: candidato possui correspondência homologada com o componente da vaga;
- `0.0`: não há correspondência.

Este critério nunca substitui `HARD-06` qualificação.

### SCORE-02 — Área de conhecimento

- `1.0`: mesma área homologada;
- `0.5`: relação institucional explicitamente reconhecida;
- `0.0`: sem correspondência.

### SCORE-03 — Disponibilidade

Mede aderência da disponibilidade declarada ao contexto da vaga entre candidatos que já passaram por HARD-03.

- `1.0`: disponibilidade integral e comprovada;
- `0.5`: disponibilidade parcialmente comprovada, quando operacionalmente admissível;
- `0.0`: ausência de evidência suficiente.

Não pode transformar uma indisponibilidade confirmada em elegibilidade.

### SCORE-04 — Continuidade pedagógica

Prioriza continuidade quando houver vínculo pedagógico relevante e comprovado com a turma/componente da vaga.

- `1.0`: continuidade direta e comprovada;
- `0.5`: continuidade institucional relevante;
- `0.0`: sem evidência.

### SCORE-05 — Equilíbrio de distribuição

Evita concentrar substituições sempre nos mesmos docentes.

A métrica deve utilizar somente substituições válidas no mesmo contexto institucional e janela temporal definida pelo motor.

Normalização inicial proposta:

`valor = 1 - (substituições_do_candidato / máximo_substituições_entre_elegíveis)`

com tratamento explícito para `máximo = 0`, resultando em `1.0` para todos os candidatos elegíveis.

### SCORE-06 — Proximidade confiável

Só deve ser utilizada quando existir fonte homologada e metodologia institucionalmente definida para medir deslocamento.

Na ausência dessa evidência, o critério recebe `0.0` e a explicação registra `PROXIMITY_NOT_AVAILABLE`.

Não usar localização aproximada, inferência por endereço incompleto ou dado não homologado.

### SCORE-07 — Preferência institucional explícita

Somente preferências formalmente configuradas por autoridade competente e dentro do escopo da vaga podem influenciar o ranking.

Preferências não documentadas, implícitas ou inferidas por comportamento não são válidas.

## 5. Gate de elegibilidade

Antes de pontuar:

```text
if candidate.eligibility_status != 'eligible':
    candidate.rank = null
    candidate.score = null
    candidate.ranking_status = 'excluded'
```

O motor deve bloquear qualquer tentativa de pontuação de candidato que possua pelo menos uma HARD rule reprovada.

## 6. Desempate determinístico

Quando dois ou mais candidatos tiverem o mesmo score final, aplicar, nesta ordem:

1. maior SCORE-01;
2. maior SCORE-02;
3. maior SCORE-04;
4. menor número de substituições válidas na janela considerada;
5. identificador acadêmico homologado em ordem determinística, apenas como último desempate técnico.

O identificador usado no último desempate não possui significado de preferência pedagógica.

Não usar ordem de inserção, posição em planilha, nome alfabético ou timestamp de criação como critério de mérito.

## 7. Explicabilidade obrigatória

Cada resultado de ranking deve permitir reconstruir:

- `vacancy_id`;
- `teacher_profile_id`;
- `engine_run_id`;
- `rule_set_version`;
- status de elegibilidade;
- score final;
- contribuição de cada critério;
- evidência/fonte de cada critério;
- critérios indisponíveis e motivo;
- desempate aplicado, quando houver;
- timestamp da avaliação.

Sugestão de estrutura lógica:

`score_breakdown = [{code, weight, normalized_value, contribution, evidence_status, reason_code}]`

## 8. Reprodutibilidade

Uma mesma entrada, mesma versão de regras e mesmas evidências devem produzir o mesmo ranking.

Toda alteração em:

- pesos;
- fórmulas;
- ordem de desempate;
- fontes consideradas;
- normalização;

exige nova `rule_set_version` e novo `engine_run_id`.

Resultados históricos não devem ser sobrescritos.

## 9. Concurrency e snapshot

O ranking deve ser calculado sobre um snapshot coerente da vaga e dos dados utilizados.

Se disponibilidade, ausência, substituição confirmada ou outra condição HARD mudar durante o processamento, o resultado anterior não deve ser silenciosamente reaproveitado.

Deve ser possível invalidar/reexecutar o ranking com nova versão de execução.

## 10. Restrições

É proibido:

- usar score para liberar candidato inelegível;
- compensar uma HARD rule com pontos em outro critério;
- usar fuzzy matching para componente, docente ou turma;
- usar Agenda como fonte da grade oficial;
- usar dados não homologados como mérito;
- alterar pesos sem versionamento;
- sobrescrever ranking histórico;
- esconder critérios que reduziram a pontuação;
- usar critério subjetivo não documentado.

## 11. Contrato de saída

Estados mínimos:

- `excluded` — candidato barrado antes da pontuação;
- `scored` — candidato elegível pontuado;
- `ranked` — candidato elegível com posição determinística;
- `pending_validation` — resultado disponível para validação humana.

A confirmação da substituição permanece uma decisão humana/autorizada; ranking é recomendação, não autorização automática.

## 12. Auditoria futura

O próximo harness deverá comprovar, no mínimo:

- candidatos inelegíveis não recebem score;
- soma dos pesos = 100;
- score permanece entre 0 e 100;
- contribuição por critério é reconstruível;
- maior correspondência de componente vence quando demais fatores empatam;
- desempate é determinístico;
- empate completo termina no identificador técnico homologado;
- ausência de proximidade não gera vantagem artificial;
- mudança de rule set gera nova execução;
- histórico não é sobrescrito;
- score não atravessa HARD rule;
- resultados podem ser reproduzidos a partir do snapshot.

## 13. Dependências críticas

Este contrato não autoriza produção enquanto permanecerem pendentes:

1. fonte técnica homologada da Grade Horária SEDUC;
2. identificadores oficiais de docente, turma e componente;
3. ponte Auth ↔ identidade acadêmica docente;
4. permissões/RLS específicas de Escala;
5. execução real dos harnesses em PostgreSQL;
6. DDL física das entidades de vaga, candidato e alocação;
7. definição homologada das fontes para disponibilidade, qualificação, continuidade, distribuição e proximidade.

## 14. Decisão

**Aprovado para especificação e testes sintéticos.**

**Não aprovado para execução produtiva.**

Próximo artefato seguro: `tests/candidate-score-ranking.postgres.test.sql`, seguido da auditoria correspondente.

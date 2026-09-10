# Auditoria do Harness de Pontuação e Ranking v2

**Artefato:** `tests/candidate-score-ranking.postgres.test.sql`  
**Contrato:** `docs/58-contrato-pontuacao-ranking-v1.md`  
**Auditoria anterior:** `docs/59-auditoria-harness-score-ranking-v1.md`  
**SHA auditado:** `b936befddc3694feaba687f8902db876fea8e6a1`  
**Data:** 2026-09-10  
**Gate:** 🔴 RED / BLOCKED

## 1. Resultado executivo

A v2 corrigiu os principais achados formais da auditoria anterior: candidato excluído pode permanecer sem score, proximidade passou a possuir estado de evidência, existe cenário materializado de múltiplos candidatos, o desempate declara homologação e há dois runs com versões distintas.

Entretanto, a nova versão ainda é um **harness contratual sintético**, não um teste do motor real. Além disso, parte dos novos controles verifica dados previamente inseridos em vez de provar que a lógica de cálculo/ranking os produziu. Portanto, a auditoria não autoriza promoção para produção.

**Decisão: 🔴 RED / BLOCKED.**

## 2. Controles

| Controle | Status | Evidência/limitação |
|---|---|---|
| SR2-AUD-01 — pesos = 100 | 🟢 | GATE-01 percorre as versões registradas |
| SR2-AUD-02 — score 0–100 | 🟢 | GATE-02 valida scores não nulos |
| SR2-AUD-03 — inelegível sem score/rank | 🟢 | S07 + GATE-03 e constraint da tabela |
| SR2-AUD-04 — breakdown reconstruível | 🟢 | S06 + GATE-04 |
| SR2-AUD-05 — componente diferencia | 🟢 | GATE-05 |
| SR2-AUD-06 — proximidade possui estado explícito | 🟢 | `proximity_evidence_status` + GATE-06 |
| SR2-AUD-07 — ranking de múltiplos candidatos | 🟡 | S08/GATE-09 validam posições materializadas, mas não calculam essas posições |
| SR2-AUD-08 — identificador homologado | 🟢/🟡 | campo booleano obrigatório, porém não há FK/evidência externa da homologação |
| SR2-AUD-09 — novo rule set/new run | 🟢/🟡 | S09 cria v2, mas pesos v1/v2 são iguais |
| SR2-AUD-10 — histórico preservado | 🟢/🟡 | dois runs coexistem, mas não há tentativa controlada de detectar alteração do resultado antigo |
| SR2-AUD-11 — snapshot reprodutível | 🟡 | referência textual existe, mas não há reconstrução dos dados a partir dela |
| SR2-AUD-12 — score_breakdown/evidência completa | 🟡 | contribuições existem, mas evidência por critério não está estruturada |
| SR2-AUD-13 — execução PostgreSQL real | 🔴 | ainda não executado contra ambiente PostgreSQL real |
| SR2-AUD-14 — motor real | 🔴 | o harness insere os resultados esperados manualmente |

## 3. Achados

### FIND-01 — Ranking é materializado manualmente, não produzido pela ordenação do motor

**Severidade:** Alta  
**Status:** Aberto

O cenário S08 insere diretamente `score` e `rank_position` e o GATE-09 apenas compara a sequência armazenada. Isso prova a consistência do registro de uma ordenação já conhecida, mas não prova que uma implementação do ranking produziria essa ordenação.

**Correção requerida:** adicionar uma consulta/rotina de ranking sobre candidatos elegíveis que calcule o score e atribua `rank_position` por `ORDER BY` determinístico, preservando os critérios de desempate do contrato.

### FIND-02 — Homologação do identificador ainda é apenas um booleano sintético

**Severidade:** Média  
**Status:** Aberto

`teacher_id_homologated` melhora o contrato do teste, mas não comprova vínculo com o identificador acadêmico oficial. A homologação real depende da identidade acadêmica docente ainda não física/homologada.

**Correção requerida:** na integração futura, substituir a prova booleana por relação com a identidade acadêmica homologada. Não inventar identificador SEDUC.

### FIND-03 — Novo rule set não demonstra alteração efetiva de regra

**Severidade:** Média  
**Status:** Aberto

O harness possui `score-v1` e `score-v2`, mas os pesos registrados são idênticos. Assim, demonstra coexistência de versões, não que uma alteração real de fórmula/peso exige novo resultado.

**Correção requerida:** usar uma alteração controlada e compatível com um cenário de teste, comprovando que v2 produz novo resultado sem modificar o resultado histórico de v1.

### FIND-04 — Preservação histórica ainda não é proteção contra sobrescrita

**Severidade:** Média  
**Status:** Aberto

A coexistência de linhas com `run_id` diferente é positiva. Porém, não existe um gate que capture o estado de v1, execute v2 e prove que o estado original continua exatamente igual.

**Correção requerida:** registrar uma fotografia/assertion do resultado v1 antes da nova execução e compará-la depois.

### FIND-05 — Snapshot é apenas referência nominal

**Severidade:** Média  
**Status:** Aberto

`snapshot_reference` é armazenado, mas o harness não reconstrói os dados de entrada a partir dele. Logo, a reprodutibilidade está declarada, não demonstrada.

**Correção requerida:** quando houver infraestrutura de snapshot real, validar que mesma entrada + mesma versão + mesmas evidências reproduzem o resultado.

### FIND-06 — Explicabilidade ainda não contém evidência por critério

**Severidade:** Média  
**Status:** Aberto

O contrato prevê `score_breakdown` contendo código, peso, valor normalizado, contribuição, `evidence_status` e `reason_code`. O harness mantém contribuições em colunas separadas e só explicita estado para proximidade.

**Correção requerida:** representar, no mínimo no harness, estado/motivo de evidência dos critérios relevantes ou estrutura equivalente auditável.

### FIND-07 — Harness não executa a implementação do motor

**Severidade:** Alta para validação produtiva; esperada nesta fase
**Status:** Aberto

Os dados de score e ranking são inseridos diretamente. Os gates verificam invariantes sobre esses dados. Isso é apropriado como teste contratual, mas não como evidência de que o algoritmo implementado funciona.

**Correção requerida:** manter este harness como camada contratual e criar posteriormente teste de integração do motor real, após DDL e fontes homologadas.

## 4. Regressões verificadas

Não foram identificadas regressões aparentes nos controles que já existiam na v1:

- pesos continuam totalizando 100;
- faixa de score permanece 0–100;
- candidato inelegível não recebe score/rank;
- máximo de evidências reconstrói 100;
- componente continua diferenciando candidatos;
- proximidade indisponível não recebe vantagem artificial;
- desempate não depende de ordem de inserção;
- `rule_set_version` e snapshot continuam registrados.

## 5. Próxima correção controlada

A próxima alteração deve permanecer restrita ao **mesmo harness**, sem DDL produtivo:

1. transformar S08 em ranking calculado por consulta determinística;
2. introduzir alteração controlada entre `score-v1` e `score-v2`;
3. provar preservação exata do resultado histórico;
4. reforçar snapshot/reprodutibilidade quando houver fonte de snapshot testável;
5. estruturar evidência/reason code por critério.

## 6. Dependências críticas externas

Continuam bloqueando produção:

1. artefato técnico homologado da Grade Horária SEDUC;
2. identificadores oficiais de docente, turma e componente;
3. ponte Auth ↔ identidade acadêmica docente;
4. permissões/RLS específicas de Escala;
5. execução real dos harnesses em PostgreSQL;
6. DDL física de vaga, candidato e alocação;
7. fontes homologadas para disponibilidade, qualificação, continuidade, distribuição e proximidade;
8. implementação e validação do motor real.

## 7. Decisão final

**🔴 RED / BLOCKED.**

A v2 está mais coerente com o contrato e pode continuar sendo utilizada como base de especificação. Ainda não há evidência suficiente para considerar score/ranking operacionalmente validado.

A sequência segura permanece:

`Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar`

O próximo passo é a correção controlada do harness, não a criação de tabelas produtivas.

# Contrato — Candidatos e Elegibilidade v1

**Produto:** Escala de Substituição  
**Camada:** Motor de decisão  
**Status:** Especificação  
**Gate:** RED / BLOCKED

## 1. Objetivo

Definir o contrato para transformar uma `substitution_vacancy` validada em um conjunto auditável de docentes candidatos, separando claramente **elegibilidade** de **pontuação**.

Fluxo:

`vaga válida → universo elegível → filtros duros → candidatos elegíveis → pontuação → recomendação`

Nenhum score pode tornar elegível um docente que viola uma restrição dura.

## 2. Unidade de decisão

A unidade de decisão é:

`candidate = docente × vacancy`

O mesmo docente pode ser candidato para várias vagas, desde que cada relação seja avaliada independentemente e dentro do mesmo contexto institucional/temporal.

A identidade canônica do docente deve ser `teacher_profile_id` homologado. Nome, e-mail ou CPF não podem ser usados como chave interna substituta.

## 3. Contrato mínimo de candidato

Entidade lógica proposta: `substitution_candidates`.

Campos mínimos:

- `id` — UUID, chave primária.
- `vacancy_id` — referência obrigatória à vaga.
- `teacher_profile_id` — referência obrigatória ao docente homologado.
- `organization_id` — escopo obrigatório.
- `school_id` — escopo obrigatório.
- `eligibility_status` — `eligible`, `ineligible`, `blocked`, `pending_validation`.
- `decision_reason_code` — código estruturado da decisão.
- `evaluated_at` — instante da avaliação.
- `engine_run_id` — execução do motor responsável pela avaliação.
- `rule_set_version` — versão das regras aplicadas.

A existência do candidato não significa recomendação. Recomendação é uma etapa posterior.

## 4. Restrições duras

As seguintes condições devem ser avaliadas **antes da pontuação**.

### HARD-01 — identidade docente homologada

O candidato precisa possuir identidade acadêmica docente válida e homologada.

Identidade apenas por nome/e-mail ou correspondência fuzzy é insuficiente.

### HARD-02 — escopo institucional

O docente deve estar autorizado a participar do processo dentro da organização/escola/contexto definido pela regra vigente.

Pertencer à mesma organização não implica automaticamente pertencer ao mesmo escopo operacional.

### HARD-03 — disponibilidade

O docente não pode possuir indisponibilidade confirmada que conflite com a ocorrência da vaga.

Regra de conflito temporal:

`A.start < B.end AND B.start < A.end`

Intervalos que apenas encostam nas bordas não configuram conflito.

### HARD-04 — conflito com própria carga/aula

O docente não pode estar simultaneamente vinculado a outra obrigação letiva incompatível no mesmo período.

A verificação deve usar ocorrência oficial, não apenas eventos da Agenda.

### HARD-05 — conflito com outra substituição confirmada

O docente não pode estar alocado em outra substituição confirmada cujo intervalo temporal conflite com a nova vaga.

### HARD-06 — qualificação obrigatória

O docente deve atender às exigências de habilitação/qualificação aplicáveis ao componente da vaga, quando houver requisito obrigatório homologado.

Na ausência de catálogo oficial homologado, o motor não deve inventar uma equivalência.

### HARD-07 — impedimento administrativo

Impedimentos administrativos oficialmente registrados e vigentes bloqueiam o candidato quando a regra correspondente estiver homologada.

### HARD-08 — integridade temporal

A avaliação deve considerar a data e os horários reais da ocorrência. Não é suficiente verificar apenas o dia da semana.

## 5. Resultado das restrições

Cada candidato deve possuir resultado estruturado, permitindo explicar por que foi aceito ou bloqueado.

Exemplo conceitual:

```text
teacher_profile_id: T1
vacancy_id: V1
eligibility_status: ineligible
decision_reason_code: SCHEDULE_CONFLICT
rule_set_version: v1
```

Múltiplas violações podem existir. O modelo definitivo deve decidir se preservará todas as violações ou apenas uma razão principal acompanhada de evidências. A recomendação é preservar **todas as razões duras encontradas** para auditoria.

## 6. Códigos de razão mínimos

- `IDENTITY_NOT_HOMOLOGATED`
- `OUT_OF_SCOPE`
- `UNAVAILABLE`
- `SCHEDULE_CONFLICT`
- `CONFIRMED_SUBSTITUTION_CONFLICT`
- `QUALIFICATION_MISMATCH`
- `ADMINISTRATIVE_BLOCK`
- `INVALID_TEMPORAL_CONTEXT`
- `SOURCE_NOT_PUBLISHED`
- `PENDING_VALIDATION`

Os códigos devem ser estáveis e independentes da mensagem apresentada ao usuário.

## 7. Separação entre elegibilidade e score

A arquitetura obrigatória é:

```text
1. Validar vaga
2. Construir universo de docentes
3. Aplicar restrições duras
4. Persistir/avaliar elegibilidade
5. Pontuar somente elegíveis
6. Ordenar recomendações
7. Exigir validação humana para confirmação
```

Um candidato `ineligible` não pode receber score competitivo.

Se o sistema precisar preservar um valor técnico para análise, ele não deve ser apresentado como pontuação de recomendação.

## 8. Pontuação futura

Somente após a elegibilidade será aplicada a camada preferencial, inicialmente prevista para considerar:

- aderência ao componente/disciplina;
- área de conhecimento;
- disponibilidade adicional;
- continuidade pedagógica;
- distribuição equilibrada de substituições;
- proximidade confiável, quando houver dado válido;
- preferências institucionais homologadas.

Esses critérios não podem violar as restrições duras.

## 9. Idempotência

A avaliação deve ser reproduzível para a mesma combinação de:

`vacancy_id + teacher_profile_id + engine_run_id + rule_set_version`

O modelo físico deve evitar duplicação acidental dentro de uma mesma execução.

Reprocessamentos devem criar uma nova execução do motor quando houver mudança relevante de regras ou dados, preservando o histórico anterior.

## 10. Proveniência

Cada avaliação deve permitir reconstruir:

`candidato → vaga → ocorrência → versão da grade → ausência → regras → execução do motor`.

A recomendação não deve depender de dados mutáveis sem que a execução registre sua versão/contexto.

## 11. Multi-escola

Um docente associado a mais de uma escola deve ser avaliado no contexto correto da vaga.

Não criar uma regra global que permita acesso ou elegibilidade automática em todas as escolas da organização.

O contexto mínimo é:

`organization_id + school_id + vacancy + teacher_profile_id`.

## 12. Segurança e RLS

O resultado de candidatos é dado operacional sensível da instituição.

O acesso deverá respeitar:

- organização;
- escola/contexto;
- vínculo do usuário;
- permissão específica do produto Escala;
- operação solicitada.

Permissões previstas:

- `escala.view_candidates`
- `escala.view_explanations`
- `escala.run_engine`
- `escala.rerun_engine`
- `escala.confirm_substitution`
- `escala.override_decision`
- `escala.view_audit`

O catálogo ainda precisa homologar o produto `escala`.

## 13. Auditoria explicável

Para cada bloqueio ou elegibilidade, o sistema deve responder:

1. Qual vaga foi avaliada?
2. Qual docente foi avaliado?
3. Qual ocorrência originou a vaga?
4. Quais regras duras foram aplicadas?
5. Qual versão das regras foi usada?
6. Qual evidência sustentou o resultado?
7. Qual execução do motor produziu a decisão?

Mensagens amigáveis podem ser derivadas dos códigos, mas não substituem os códigos estruturados.

## 14. Proibições

É proibido:

- usar fuzzy matching para decidir identidade;
- promover candidato apenas por score;
- usar Agenda como fonte da obrigação letiva;
- ignorar conflito temporal;
- tratar mesma organização como autorização automática;
- esconder bloqueios sem razão estruturada;
- sobrescrever resultado anterior sem nova execução auditável;
- criar ledger paralelo fora da auditoria central.

## 15. Dependências

Antes do DDL de produção precisam estar homologados:

1. `substitution_vacancies` físico;
2. `official_schedule_occurrences` físico;
3. identidade docente acadêmica;
4. vínculo Auth ↔ docente;
5. disponibilidade/impedimentos oficiais;
6. catálogo de qualificação aplicável;
7. permissões do produto Escala;
8. RLS;
9. execução PostgreSQL dos harnesses;
10. versão final das regras do motor.

## 16. Decisão

**Aprovado como contrato lógico v1 para orientar os próximos harnesses.**

Não autoriza implementação física de produção.

## 17. Gate

**RED / BLOCKED**

O próximo artefato deve transformar as restrições HARD-01 a HARD-08 em um harness PostgreSQL sintético, incluindo casos positivos, bloqueios e múltiplas violações, sem depender dos identificadores ainda não homologados da SEDUC.

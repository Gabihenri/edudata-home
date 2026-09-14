# Plano de Migration v1 — Escala Inteligente de Substituição

**Status:** PLANEJAMENTO — NÃO EXECUTAR

## 1. Objetivo

Preparar a primeira migration física da Escala sem duplicar o Core/EIOS e sem alterar estruturas compartilhadas antes da validação de compatibilidade.

Este documento é um **plano condicionado à homologação**. A existência do plano não constitui autorização para criar ou executar DDL de produção.

## 2. Gate de entrada

A migration física somente poderá avançar quando estiverem comprovados, no mínimo:

- artefato operacional SED atual e autorizado;
- contrato/dicionário/layout correspondente;
- identificadores oficiais de docente, escola, turma e componente, quando aplicáveis;
- chave(s) de associação e cardinalidades relevantes;
- vigência e versionamento da grade;
- regra de publicação/consumo da versão oficial;
- proveniência e mecanismo de atualização;
- schema Core/EIOS efetivamente aplicado;
- funções/papéis de autorização efetivamente existentes;
- compatibilidade com RLS e auditoria central.

Enquanto qualquer dependência crítica permanecer sem evidência, o estado é **BLOCKED**.

## 3. Estratégia

A migration será incremental e dividida em duas categorias **somente após o gate de entrada**:

### A. Novas estruturas do domínio

Criar somente, se ainda necessárias após a reconciliação física:

- `substitution_absences`
- `substitution_vacancies`
- `substitution_candidates`
- `substitution_rule_sets`
- `substitution_engine_runs`

A necessidade final de cada tabela deverá ser confirmada contra o Core/EIOS e os contratos de persistência já homologados.

### B. Evolução controlada do Core

Avaliar posteriormente a inclusão de referências em `substitutions`, especialmente `vacancy_id`, `engine_run_id` e `rule_set_id`.

Não duplicar `users`, `teacher_profiles`, `schools`, `classes`, `schedules`, `availability` ou `audit_logs` sem uma decisão arquitetural formal que demonstre inexistência de estrutura compartilhada adequada.

## 4. Ordem de dependências

A ordem abaixo é **conceitual**, não uma autorização para criar as FKs antes da homologação:

```text
organizations / schools
        ↓
users / teacher_profiles
        ↓
schedules / classes / subjects
        ↓
substitution_absences
        ↓
substitution_vacancies
        ↓
substitution_rule_sets
        ↓
substitution_engine_runs
        ↓
substitution_candidates
        ↓
substitutions
```

A existência, nomenclatura e cardinalidade das entidades compartilhadas devem ser confirmadas no schema real antes de qualquer migration executável.

## 5. Constraints obrigatórias

### Ausências

- `start_time < end_time`;
- `status` restrito aos valores homologados;
- referências de organização, escola e docente somente para entidades canônicas confirmadas;
- ausência confirmada precisa de autor e timestamp de confirmação.

### Vagas

- referência obrigatória à ausência;
- referência ao horário oficial somente após homologação da entidade de grade;
- data e intervalo temporal válidos;
- vaga não pode ser criada fora do intervalo da ausência confirmada.

### Candidatos

- uma combinação vaga/docente/execução não pode ser duplicada;
- score dentro do intervalo definido pelo motor;
- ranking determinístico dentro de uma execução;
- candidato inelegível não pode ser confirmado diretamente.

### Rule sets

- versão obrigatória;
- somente uma versão ativa por escopo efetivo;
- versão utilizada por execução não pode ser modificada retroativamente.

### Engine runs

- versão do motor obrigatória;
- rule set obrigatório;
- status controlado;
- `input_hash` obrigatório para execução concluída;
- execução concluída deve possuir `completed_at`.

## 6. Índices mínimos

Somente depois de confirmar as consultas reais, avaliar índices por:

- `organization_id`;
- `school_id`;
- docente;
- data operacional;
- status;
- relações entre ausência, vaga, candidato e execução.

Índices adicionais somente após observar consultas reais ou necessidade comprovada do motor.

## 7. RLS

Cada tabela nova deverá ter RLS habilitado, se compatível com o padrão do ambiente homologado.

A política deve utilizar as funções/estrutura de autorização já existentes no Core/EIOS, em vez de criar um segundo sistema de papéis.

Regras mínimas:

- isolamento por organização;
- isolamento por escola quando aplicável;
- professor não vê candidatos de outros docentes sem autorização;
- gestão vê somente o escopo autorizado;
- histórico de auditoria não pode ser alterado por usuário comum;
- operações de confirmação exigem autorização administrativa.

Nenhuma policy definitiva deve ser escrita com base em nomes hipotéticos de funções, papéis ou claims.

## 8. Auditoria

A migration não deve criar `substitution_audit_log` se o `audit_logs` central puder representar os mesmos eventos.

Registrar, no mínimo:

- criação/alteração/cancelamento de ausência;
- geração de vagas;
- execução do motor;
- recomendação;
- confirmação;
- rejeição;
- alteração manual;
- bloqueio por regra;
- reprocessamento.

A forma física desses registros dependerá do ledger de auditoria efetivamente homologado.

## 9. Transação e dupla alocação

A confirmação de uma substituição deve ocorrer em transação quando a infraestrutura homologada permitir.

Antes da confirmação:

1. verificar se o docente continua elegível;
2. verificar conflitos de horário;
3. verificar novas indisponibilidades/agenda;
4. verificar se outra substituição já ocupou o docente no mesmo intervalo;
5. confirmar somente após todas as validações.

## 10. Idempotência

A geração de vagas deve ser idempotente para a mesma ausência e versão oficial do horário.

A geração de candidatos deve ser idempotente para a mesma vaga, execução e versão do motor.

Reprocessamentos devem gerar nova execução identificável, sem apagar resultados históricos.

## 11. Rollback

A migration deve ser executável de forma controlada e documentar dependências antes de remover ou alterar estruturas do Core.

Nenhuma tabela compartilhada deve ser removida pela primeira migration da Escala.

## 12. Critérios de aprovação antes do Supabase

Antes de transformar este plano em SQL executável, deverão existir evidências de:

- schema real conferido;
- foreign keys conferidas;
- fonte oficial da grade homologada;
- identidade acadêmica homologada;
- vigência/versionamento homologados;
- regra de publicação homologada;
- RLS revisado;
- constraints revisadas;
- teste de isolamento institucional;
- teste de docente ocupado;
- teste de indisponibilidade;
- teste de dupla alocação;
- teste sem candidato;
- teste de empate;
- teste de reprocessamento;
- teste de cancelamento da ausência;
- teste de auditoria.

Os testes sintéticos existentes não substituem essas evidências.

## 13. Ordem de implementação após desbloqueio

1. preservar o artefato SED original e sua proveniência;
2. homologar campos, chaves, identidades, validade e publicação;
3. reconciliar o staging com o schema Core/EIOS efetivamente aplicado;
4. confirmar funções/papéis de autorização;
5. revisar este plano contra o schema confirmado;
6. converter somente as estruturas justificadas em migration SQL executável;
7. auditar a migration;
8. executar testes de integridade/RLS em ambiente seguro;
9. somente então executar no Supabase, com rollback controlado;
10. auditar o resultado pós-migration.

## 14. Resultado esperado

Após a migration v1, se aprovada, a plataforma terá persistência suficiente para executar o fluxo:

```text
Ausência confirmada
       ↓
Aulas afetadas
       ↓
Vagas
       ↓
Candidatos
       ↓
Regras eliminatórias
       ↓
Pontuação
       ↓
Ranking explicável
       ↓
Validação humana
       ↓
Substituição confirmada
       ↓
Auditoria
```

A implementação física do motor e a migration permanecem subordinadas aos contratos homologados de fonte, identidade, temporalidade, autorização e auditoria.

## 15. Status atual

**NÃO EXECUTAR — BLOCKED BY GATE-FONTE-SED.**

Este documento existe para permitir avanço de engenharia sem transformar uma hipótese de schema em alteração física prematura.

Nenhum campo, chave ou relacionamento técnico da SED deve ser criado por inferência a partir de nomes, CPF, DI, posição de coluna, tutorial, screenshot ou dataset histórico.
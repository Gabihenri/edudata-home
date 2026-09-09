# Reconciliação do Core Físico — Escala de Substituição v1

**Status:** auditoria física concluída — migration da Escala ainda bloqueada  
**Projeto Supabase auditado:** `EduData IA`  
**Data da auditoria:** 2026-09-09

## 1. Objetivo

Confrontar o modelo lógico da Escala de Substituição com o schema efetivamente existente no banco Supabase, evitando que estruturas do SQL legado sejam tratadas como se já estivessem implantadas.

Regra: **o banco físico é a referência para decidir dependências de uma migration executável; o repositório é a referência para rastrear intenção, histórico e divergências.**

## 2. Resultado principal

A auditoria física confirmou uma divergência relevante entre o SQL versionado e o banco atual.

### Não localizadas no banco físico

- `schedules`
- `substitutions`
- `availability`
- `audit_logs`

### Confirmadas no banco físico

- `organizations`
- `schools`
- `organization_members`
- `teacher_profiles`
- `agenda_events`
- `agenda_lessons`
- `agenda_schedule_templates`
- `identity_responsibility_scopes`
- `identity_product_permissions`

Também foram confirmadas as funções de autorização contextual da Agenda e as tabelas da camada de governança de identidade.

## 3. Consequência arquitetural

O SQL legado de `substitutions` não pode ser usado como baseline físico da Escala.

Em particular, não é seguro criar uma FK de `substitution_vacancies.schedule_id` para `schedules(id)` enquanto `schedules` não existir no banco ou enquanto a fonte oficial de horários não tiver sido definida.

Da mesma forma, a Escala não deve pressupor que `availability` ou `audit_logs` estejam disponíveis fisicamente apenas porque aparecem em arquivos SQL históricos.

## 4. Reconciliação do modelo de horários

Foram identificadas três estruturas relacionadas a agenda/tempo no banco físico:

### `agenda_lessons`

Possui data programada, horário inicial/final, turma, componente curricular e docente proprietário. É uma estrutura operacional da Agenda.

### `agenda_schedule_templates`

Possui dia da semana, horário inicial/final, usuário, escola, recorrência e período de validade. É uma estrutura de templates recorrentes da Agenda.

### `agenda_events`

Possui início/fim, usuário, escola, recorrência, exceções e referência opcional a aula/objetivo.

**Decisão de auditoria:** nenhuma dessas três estruturas será declarada equivalente a uma grade escolar oficial (`schedules`) sem uma decisão arquitetural explícita e testes de cobertura.

## 5. Autorização física

Foi confirmada a existência de:

- `identity_product_permissions`;
- `identity_responsibility_scopes`;
- RLS ativo nas estruturas de governança e Agenda;
- `can_view_agenda_record(...)`;
- `can_update_agenda_record(...)`;
- funções internas `can_view_agenda_record_as(...)` e `can_manage_agenda_record_as(...)`.

As funções de Agenda usam o produto `agenda_edi` para resolver permissões. Portanto, **não devem ser reutilizadas automaticamente para a Escala**, pois isso faria a autorização do novo domínio depender semanticamente de outro produto.

## 6. Novo achado de segurança/governança

`identity_product_permissions` possui RLS ativo, mas sua policy de leitura autenticada permite leitura ampla (`USING (true)`). Isso não significa por si só exposição de dados sensíveis, pois a tabela contém configuração de permissões; porém confirma que o modelo de autorização é deliberadamente consultável por usuários autenticados.

Para a Escala, as policies das tabelas operacionais devem continuar mais restritivas e não podem depender apenas da existência de uma linha em `identity_product_permissions`.

## 7. Estratégia recomendada para o MVP

A Escala deve seguir duas fases de dados:

### Fase A — fundação da Escala

Criar somente estruturas próprias do domínio que não dependam de `schedules`, `availability` ou `substitutions` físicos ainda ausentes.

Essas estruturas devem receber referências somente para entidades físicas comprovadas.

### Fase B — integração com grade oficial

Depois de definir ou implantar a fonte oficial da grade, adicionar a relação da vaga com a aula/horário oficial e ativar as regras de conflito temporal.

A segunda fase deve possuir migration própria ou evolução versionada e auditada, não um placeholder escondido na primeira migration.

## 8. Evidências da auditoria

A consulta ao banco foi realizada por `information_schema` e catálogos PostgreSQL, verificando existência de tabelas, colunas, funções e RLS/policies.

O banco físico confirmou `agenda_lessons` com `scheduled_date`, `start_time` e `end_time`, além de `agenda_schedule_templates` com `weekday`, `start_time`, `end_time`, validade e recorrência.

As funções de autorização encontradas delegam para mecanismos de identidade e permissões por produto.

## 9. Impacto na migration v1

A migration executável **não deve ainda conter**:

- FK para `schedules`;
- FK para `availability`;
- FK para `substitutions` como se ela já existisse;
- FK para `audit_logs` como se ela já existisse;
- policies copiadas integralmente da Agenda;
- permissões hardcoded fora do Core de identidade.

A migration poderá referenciar entidades físicas comprovadas, desde que seus tipos, cardinalidades e RLS sejam novamente validados no momento da execução.

## 10. Auditoria e critérios de liberação

### AUD-01 — baseline físico

**Resultado:** BLOQUEIO CONFIRMADO.  
O SQL histórico e o banco físico não estão sincronizados em relação a várias entidades do domínio de substituição.

### AUD-02 — horário oficial

**Resultado:** BLOQUEIO CONFIRMADO.  
Não existe `schedules` físico. Agenda não será assumida como substituta sem decisão arquitetural.

### AUD-03 — autorização

**Resultado:** PARCIALMENTE RESOLVIDO.  
Existe infraestrutura robusta de identidade e autorização, mas ainda falta definir o produto/módulo e as permissões específicas da Escala.

### AUD-04 — RLS

**Resultado:** REQUISITO ABERTO.  
As novas tabelas precisarão de policies próprias, baseadas no escopo e no papel, com distinção entre consulta e confirmação administrativa.

### AUD-05 — auditoria

**Resultado:** REQUISITO ABERTO.  
Como `audit_logs` não está presente fisicamente, a estratégia de ledger para a Escala precisa ser reconciliada com a camada EIOS/identity antes da confirmação de substituições.

## 11. Decisão atual

**Migration física da Escala: NÃO LIBERADA.**

A auditoria eliminou uma hipótese perigosa: não estamos diante apenas de uma tabela `schedules` esquecida. Existe uma divergência mais ampla entre o SQL legado e o banco físico atual.

A próxima etapa deve ser a definição formal da **fonte oficial de grade/aulas para a Escala** e do **contrato de autorização/auditoria do novo produto**. Só então o draft poderá ser convertido em DDL executável.

# Auditoria RBAC e RLS — Escala de Substituição v1

**Status:** auditoria ampliada — migration física ainda bloqueada  
**Repositório:** `Gabihenri/edudata-home`  
**Domínio:** `EduData-IA/escala-substituicao/`

## 1. Objetivo

Verificar se o Core atual fornece mecanismos suficientes de identidade, papel, escopo de responsabilidade e autorização para suportar a Escala Inteligente de Substituição sem criar um RBAC paralelo, confrontando o SQL versionado com o banco Supabase efetivamente conectado ao projeto `EduData IA`.

Regra: a Escala deve reutilizar a governança existente e aplicar o princípio de menor privilégio. Recomendação automática não equivale a decisão administrativa.

## 2. Evidências no repositório

### 2.1 Papéis institucionais

`database/13_identity_governance.sql` mantém a matriz `identity_roles`, com papéis como `teacher`, `coordinator`, `vice_principal`, `principal`, `supervisor`, `regional_manager` e `institution_admin`, além de níveis hierárquicos e capacidades de escopo.

**Conclusão:** não criar tabela de papéis específica da Escala.

### 2.2 Escopo explícito de responsabilidade

O Core possui `identity_responsibility_scopes`, com `manager_user_id`, `target_user_id`, organização, escola, tipo de escopo, nível de permissão, validade e aprovação.

A função `can_view_identity_user(...)` consulta esse mecanismo antes de conceder acesso a outro usuário e também considera o escopo escolar/rede da associação institucional.

**Conclusão:** esse mecanismo é candidato natural para autorizar visualização de docentes/candidatos na Escala. Não deve ser duplicado sem necessidade.

### 2.3 Permissões por produto

`identity_product_permissions` possui permissões por `role_code` e `product_code`, incluindo acesso, criação, visualização própria/equipe/escola/organização, atualização, exportação e auditoria.

**Conclusão:** a Escala deve possuir um `product_code` próprio, sujeito à matriz de permissões existente, em vez de introduzir permissões hardcoded isoladas.

### 2.4 Auditoria de acesso

O Core possui `identity_audit_logs`, com ator, papel, organização, escola, produto, módulo, ação, recurso, proprietário, escopo, motivo, resultado, motivo de negação e timestamps. A mesma migration também possui solicitações de acesso de auditoria.

A camada EIOS possui estruturas adicionais de auditoria, workflow, proveniência e decisão humana.

**Conclusão:** decisões e acessos relevantes da Escala devem ser auditáveis. A integração entre `audit_logs`, `identity_audit_logs` e EIOS governance deve ser definida sem gerar três registros concorrentes para o mesmo fato sem justificativa.

## 3. Auditoria direta do Supabase — 09/09/2026

Foi realizada consulta somente leitura no projeto Supabase `EduData IA` (`ihchzfndmdwtoabttkil`). Nenhuma DDL ou migration da Escala foi executada.

### 3.1 Modelo de horários efetivamente aplicado

A consulta ao `information_schema.tables` para estruturas relacionadas a schedule/lesson retornou:

- `agenda_lesson_objectives`
- `agenda_lesson_reflections`
- `agenda_lessons`
- `agenda_schedule_templates`

A tabela `public.schedules` **não existe no banco conectado**.

Também foram verificadas as tabelas centrais esperadas pelo desenho legado da Escala. No banco conectado, `public.substitutions`, `public.availability` e `public.audit_logs` também não existem.

**Achado crítico confirmado:** a divergência não é apenas documental do repositório. O banco Supabase atualmente conectado também não possui `public.schedules`.

### 3.2 Não equivalência automática dos modelos Agenda

`agenda_lessons` possui data/horário, turma, componente curricular e docente por meio de seu modelo próprio. `agenda_schedule_templates` possui dia da semana, horários, validade, escola e usuário.

Essas estruturas podem fornecer dados úteis para a Escala, mas não foram consideradas substitutas automáticas de `schedules`. O modelo da Escala precisa de uma fonte oficial de horário capaz de representar, de forma confiável, a grade docente/turma utilizada para detectar conflito e gerar uma vaga.

**Decisão:** não criar FK para `schedules` e não renomear/repurposear estruturas da Agenda para resolver o bloqueio.

### 3.3 Funções de autorização efetivamente aplicadas

O banco possui as funções:

- `public.can_access_identity_product(text)` → `boolean`;
- `public.can_update_agenda_record(uuid, uuid, uuid)` → `boolean`;
- `public.can_view_agenda_record(uuid, uuid, uuid)` → `boolean`;
- `public.can_view_identity_user(uuid, uuid, uuid)` → `boolean`;
- `public.current_identity_role()` → `text`.

Isso confirma que a camada de autorização contextual do Core/EIOS está efetivamente presente no banco.

**Limite da evidência:** a existência das funções não demonstra, por si só, que `can_view_agenda_record` ou `can_update_agenda_record` implementem exatamente as regras necessárias para confirmação administrativa de substituições. A Escala continuará exigindo uma autorização própria ou uma composição explícita das funções existentes.

### 3.4 RBAC efetivamente aplicado

O banco possui `identity_responsibility_scopes` e `identity_product_permissions`, confirmando a presença física da base de escopo e permissões prevista no SQL versionado.

Isso reforça a decisão de não criar RBAC paralelo para a Escala.

## 4. Achados

### RBAC-01 — mecanismo de autorização institucional existe

**Severidade:** Informativa  
**Estado:** RESOLVIDO PARA ARQUITETURA

O Core já possui papéis, hierarquia, escopo explícito e permissões por produto.

**Decisão:** reutilizar Core; não criar RBAC paralelo.

### RBAC-02 — autorização da Escala ainda não está materializada

**Severidade:** Alta  
**Estado:** ABERTO

Não foi encontrada evidência suficiente para afirmar que já existe um `product_code` específico da Escala nem uma política RLS específica para suas futuras tabelas.

**Ação:** antes da migration executável, definir o código de produto/módulo e a matriz mínima de permissões para leitura de vagas, candidatos, recomendações e confirmação.

### RBAC-03 — função de autorização de Agenda não deve ser reutilizada automaticamente

**Severidade:** Alta  
**Estado:** ABERTO

As migrations EIOS validam a existência de `can_view_agenda_record(uuid,uuid,uuid)` e `can_update_agenda_record(uuid,uuid,uuid)`, e várias policies da Agenda utilizam essa autorização. A auditoria direta confirmou que ambas as funções existem no banco. Isso comprova o mecanismo, mas não prova equivalência semântica com a Escala.

**Ação:** auditar o corpo/semântica dessas funções e definir composição específica para a Escala.

### RBAC-04 — confirmação administrativa exige privilégio distinto de consulta

**Severidade:** Alta  
**Estado:** ABERTO

A Escala precisa distinguir pelo menos:

- visualizar vaga;
- visualizar candidatos/recomendação;
- executar/reexecutar motor;
- confirmar substituição;
- registrar justificativa/alteração excepcional;
- consultar auditoria.

**Ação:** modelar essas capacidades na matriz de permissões existente e nas policies da Escala.

### RBAC-05 — isolamento entre usuários pares deve ser preservado

**Severidade:** Alta  
**Estado:** REQUISITO

O modelo institucional existente estabelece que usuário comum acessa seus próprios registros e que usuários pares não recebem acesso automático aos registros individuais uns dos outros.

**Ação:** nenhuma policy da Escala poderá usar somente `organization_id = ...` para liberar candidatos, recomendações ou decisões individuais.

## 5. Novos achados estruturais do banco

### CORE-SCHEMA-02 — Core físico divergente do conjunto legado de substituições

**Severidade:** CRÍTICA  
**Estado:** BLOQUEADOR

No projeto Supabase auditado, `substitutions`, `availability`, `schedules` e `audit_logs` não estão presentes como tabelas públicas.

Isso impede assumir que o conjunto SQL legado `database/08_substitutions.sql` representa o estado físico atual do banco.

**Implicação:** a migration da Escala não pode ser construída simplesmente adicionando cinco tabelas sobre as referências antigas. Antes é necessário reconciliar o baseline físico do Core e determinar quais entidades do modelo atual serão as fontes oficiais.

### CORE-SCHEMA-03 — Agenda possui estruturas físicas úteis, mas semanticamente insuficientes como substitutas de `schedules`

**Severidade:** Alta  
**Estado:** ABERTO

`agenda_lessons` e `agenda_schedule_templates` existem no banco, mas possuem semântica própria de Agenda. Não há evidência suficiente para tratá-las como grade oficial de substituição.

**Decisão:** manter separação de domínio até que a arquitetura defina formalmente uma fonte de horário compartilhada.

## 6. Matriz preliminar de acesso da Escala

| Recurso | Professor | Coordenação/gestão autorizada | Auditor autorizado |
|---|---:|---:|---:|
| Própria disponibilidade/vínculo | Sim | Conforme escopo | Conforme autorização |
| Vaga de substituição | Conforme necessidade funcional | Sim | Conforme autorização |
| Lista de candidatos | Não por padrão | Sim, dentro do escopo | Conforme autorização |
| Score/explicação da recomendação | Não por padrão | Sim, dentro do escopo | Conforme autorização |
| Confirmar substituição | Não | Sim, se permissão de gestão | Não necessariamente |
| Histórico de decisões | Não por padrão | Dentro do escopo | Sim, com autorização |
| Auditoria | Não | Somente se `can_audit`/escopo permitir | Sim |

Esta tabela é uma matriz de desenho, não uma autorização já implantada.

## 7. Requisitos RLS para a migration

1. Todas as tabelas da Escala devem ter escopo institucional suficiente para aplicação de RLS.
2. Leitura de candidatos e recomendações deve depender de autorização contextual, não apenas de pertencimento à organização.
3. Escrita deve ser mais restritiva que leitura.
4. Confirmação deve exigir usuário autorizado e revalidação transacional da vaga.
5. Registros históricos não devem ser apagados silenciosamente.
6. Negações de acesso relevantes devem ser auditáveis quando o mecanismo central exigir.
7. O desenho não pode conceder acesso privado ao `platform_admin` apenas por seu papel técnico.

## 8. Evidências de auditoria

- `database/13_identity_governance.sql`: matriz de papéis, escopos de responsabilidade, permissões por produto, auditoria de identidade e funções de identidade.
- `database/supabase/migrations/006_agenda_governance_audit.sql`: governança/RLS da Agenda e funções de autorização contextual.
- `database/supabase/migrations/011_eios_governance_core.sql`: validação e integração da governança EIOS.
- `database/08_substitutions.sql`: referência de `substitutions.schedule_id` para `schedules(id)`.
- `database/30_agenda_operational_cycle_foundation.sql`: existência de `agenda_lessons` e evolução operacional da Agenda.
- Consulta direta ao `information_schema` do Supabase em 09/09/2026: confirmou ausência de `schedules`, `substitutions`, `availability` e `audit_logs`, e presença de `agenda_lessons`/`agenda_schedule_templates`.
- Consulta direta a `pg_proc` em 09/09/2026: confirmou as funções de autorização contextual e identidade.

## 9. Resultado

**AUDITORIA RBAC/RLS v1: AMPLIADA E CONCLUÍDA COM BLOQUEIOS CRÍTICOS.**

A auditoria direta mudou o diagnóstico: o problema de `schedules` foi confirmado no banco físico e agora existe uma divergência maior entre o SQL legado e o baseline atualmente aplicado. Portanto, não é seguro liberar a migration da Escala sobre o pressuposto de que `users`, `teacher_profiles`, `availability`, `substitutions`, `audit_logs` e `schedules` estejam todos fisicamente disponíveis no mesmo baseline.

O caminho correto passa a ser:

1. reconciliar o baseline físico do Core;
2. definir a fonte oficial de horário da Escala;
3. definir o `product_code` e permissões específicas da Escala;
4. auditar a semântica das funções contextuais;
5. só então transformar o draft em migration executável;
6. executar auditoria pré e pós-migration em ambiente controlado.

**Status global da migration:** NÃO LIBERADA PARA EXECUÇÃO.

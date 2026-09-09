# Auditoria RBAC e RLS — Escala de Substituição v1

**Status:** auditoria inicial concluída — migration física ainda bloqueada  
**Repositório:** `Gabihenri/edudata-home`  
**Domínio:** `EduData-IA/escala-substituicao/`

## 1. Objetivo

Verificar se o Core atual fornece mecanismos suficientes de identidade, papel, escopo de responsabilidade e autorização para suportar a Escala Inteligente de Substituição sem criar um RBAC paralelo.

Regra: a Escala deve reutilizar a governança existente e aplicar o princípio de menor privilégio. Recomendação automática não equivale a decisão administrativa.

## 2. Evidências encontradas

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

## 3. Achados

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

As migrations EIOS validam a existência de `can_view_agenda_record(uuid,uuid,uuid)` e `can_update_agenda_record(uuid,uuid,uuid)`, e várias policies da Agenda utilizam essa autorização. Isso comprova um mecanismo real de autorização contextual, mas não prova que suas regras sejam semanticamente adequadas para decisões administrativas da Escala.

**Ação:** auditar a implementação dessas funções antes de qualquer reutilização direta.

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

## 4. Matriz preliminar de acesso da Escala

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

## 5. Requisitos RLS para a migration

1. Todas as tabelas da Escala devem ter escopo institucional suficiente para aplicação de RLS.
2. Leitura de candidatos e recomendações deve depender de autorização contextual, não apenas de pertencimento à organização.
3. Escrita deve ser mais restritiva que leitura.
4. Confirmação deve exigir usuário autorizado e revalidação transacional da vaga.
5. Registros históricos não devem ser apagados silenciosamente.
6. Negações de acesso relevantes devem ser auditáveis quando o mecanismo central exigir.
7. O desenho não pode conceder acesso privado ao `platform_admin` apenas por seu papel técnico.

## 6. Relação com o bloqueio de `schedules`

Esta auditoria resolve parcialmente o bloqueio de autorização, mas **não resolve o bloqueio estrutural do schema de horários**.

O Core possui referências a `schedules` em `substitutions` e índices, porém a declaração da tabela continua não localizada no SQL versionado auditado. Os modelos `agenda_lessons` e `agenda_classes` existem, mas não devem ser considerados equivalentes a `schedules` sem decisão arquitetural explícita.

Portanto, a migration física da Escala continua bloqueada.

## 7. Evidências de auditoria

- `database/13_identity_governance.sql`: matriz de papéis, escopos de responsabilidade, permissões por produto, auditoria de identidade e funções de identidade.
- `database/supabase/migrations/006_agenda_governance_audit.sql`: governança/RLS da Agenda e funções de autorização contextual.
- `database/supabase/migrations/011_eios_governance_core.sql`: validação e integração da governança EIOS.
- `database/08_substitutions.sql`: referência de `substitutions.schedule_id` para `schedules(id)`.
- `database/30_agenda_operational_cycle_foundation.sql`: existência de `agenda_lessons`, que permanece semanticamente distinta de `schedules` até prova em contrário.

## 8. Resultado

**AUDITORIA RBAC/RLS v1: CONCLUÍDA COM ACHADOS ABERTOS.**

O Core possui base suficiente para evitar um RBAC paralelo, mas ainda não há evidência suficiente para liberar as policies da Escala. Permanecem dois pontos obrigatórios antes da migration executável:

1. reconciliar o modelo oficial de `schedules`;
2. fechar a autorização específica da Escala e auditar a implementação das funções contextuais antes de reutilizá-las.

**Status global da migration:** NÃO LIBERADA PARA EXECUÇÃO.

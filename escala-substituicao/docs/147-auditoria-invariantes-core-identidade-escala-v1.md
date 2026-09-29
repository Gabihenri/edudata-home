# 147 — Auditoria de Invariantes e Dados do Core de Identidade para Escala v1

**Data:** 29/09/2026  
**Status:** 🟢 SEM REGRESSÃO / 🟠 CORE ESTRUTURAL EXISTE, OPERACIONALIDADE AUSENTE

## 1. Revalidação física

O Core possui estruturas de identidade suficientes para servir futuramente como fonte de autorização, mas elas não estão populadas para operação da Escala.

Contagens verificadas:
- identity_roles: 10;
- organization_members: 0;
- identity_responsibility_scopes: 0;
- identity_product_permissions: 25;
- identity_audit_logs: 171;
- teacher_profiles: 0;
- user_profiles: 2.

## 2. Produtos existentes no catálogo de permissões

As 25 permissões físicas existentes pertencem exclusivamente a:
- academy;
- agenda_edi;
- analytics;
- backoffice;
- experience_manager;
- professor_digital;
- sgpa.

**product_code='escala' permanece ausente.**

Isso é coerente com a regra de não promover a Escala antes da homologação do Core/E3.

## 3. Invariante de identidade

`teacher_profiles` contém campos de perfil como nome, e-mail, escola, função e área, mas possui zero registros.

Portanto esses campos não podem ser usados atualmente para estabelecer qualquer vínculo Auth ↔ docente.

`organization_members` também está vazio, impedindo validar contexto organizacional real.

## 4. Auditoria

Existem 171 registros em `identity_audit_logs`. Sua existência demonstra que o Core possui infraestrutura de auditoria, mas não deve ser confundida com evidência de autorização da Escala nem com homologação de identidade docente.

## 5. Decisão

Não inserir:
- permissões Escala;
- memberships sintéticos;
- scopes sintéticos;
- teacher profiles sintéticos;
- vínculo Auth ↔ docente por nome/e-mail/CPF;
- RLS específica;
- Resolver produtivo.

## 6. Conclusão

O Core apresenta estrutura suficiente para a futura integração, mas não possui ainda dados operacionais homologados para a Escala.

**Nenhuma alteração de produção foi realizada.**

Estado: **🟢 arquitetura preservada / 🔴 integração operacional bloqueada.**

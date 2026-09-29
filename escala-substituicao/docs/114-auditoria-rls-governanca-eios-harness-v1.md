# 114 — Auditoria RLS + Governança EIOS — Harness Escala

**Data:** 29/09/2026  
**Status:** CONTRATO VALIDADO / FÍSICO PRODUTIVO BLOQUEADO

## PostgreSQL

Arquivo:

`tests/rls-governance-contract.postgres.test.sql`

Resultado:

- **8 casos**
- **8 PASS**
- **0 FAIL**

### RLS / segunda barreira

- contexto autorizado permanece acessível;
- outra organização é negada;
- outra escola é negada;
- decisão sem autorização permanece fail closed.

### Governança

- confirmação exige trilha auditável;
- override exige auditoria + justificativa;
- homologação de vínculo de identidade exige auditoria;
- funções de autorização da Agenda não são aceitas como autoridade da Escala.

## Auditoria física adicional

No Core atual, as funções `can_view_agenda_record`, `can_update_agenda_record` e `current_identity_role` estão em `public` e marcadas como `SECURITY DEFINER`.

Elas não foram reutilizadas pelo harness como autorização da Escala.

Isso é relevante porque `SECURITY DEFINER` pode bypassar RLS; qualquer futura função privilegiada da Escala deve seguir o desenho de segurança do Core e não ser criada como atalho para autorização.

## Limitação

O harness representa o comportamento esperado de RLS/Governança em tabelas temporárias. Ele não prova ainda as policies físicas da Escala, porque elas não existem e não devem ser criadas enquanto o Core operacional e E3 permanecem bloqueados.

## Gate

**Contrato RLS:** 🟢  
**Contrato Governança:** 🟢  
**Harness PostgreSQL:** 🟢 8/8  
**Policies Escala físicas:** 🔴  
**Resolver físico:** 🔴  
**Dados Core operacionais:** 🔴  
**E3/SED:** 🔴

Nenhuma alteração produtiva foi feita.

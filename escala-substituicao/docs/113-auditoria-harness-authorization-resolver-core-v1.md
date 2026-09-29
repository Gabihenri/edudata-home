# 113 — Auditoria Harness Authorization Resolver × Core

**Data:** 29/09/2026  
**Status:** HARNESS VALIDADO / IMPLEMENTAÇÃO FÍSICA BLOQUEADA

## Execução PostgreSQL

Arquivo:

`tests/authorization-resolver-core-harness.postgres.test.sql`

Resultado:

- **12 casos**
- **12 resolvidos**
- **3 allow**
- **9 deny**
- **0 unresolved**
- **0 deny sem código**

Casos cobertos:

- contexto válido de coordenador;
- organização incorreta;
- escola incorreta;
- membership expirada;
- professor sem permissão de gestão;
- produto inexistente;
- recurso fora do contexto;
- override sem justificativa;
- professor com recurso explicitamente atribuído;
- tentativa de elevar papel por caminho do cliente;
- usuário com memberships em organizações distintas;
- ausência de escopo.

## Evidência

Os casos negativos retornam códigos determinísticos do contrato:

`SCOPE_WRONG_ORGANIZATION`,
`SCOPE_WRONG_SCHOOL`,
`MEMBERSHIP_EXPIRED`,
`OPERATION_NOT_GRANTED`,
`PRODUCT_NOT_GRANTED`,
`RESOURCE_NOT_OWNED`,
`JUSTIFICATION_REQUIRED`,
`SCOPE_NOT_FOUND`.

Não houve fallback permissivo.

## Limitação

O harness utiliza tabelas temporárias que reproduzem a semântica do Core. Ele não é ainda o Resolver físico nem uma policy RLS produtiva, porque as tabelas Core reais permanecem sem dados operacionais para a Escala.

Também não há ainda vínculo homologado `academic_teacher_identity_links` nem recurso acadêmico oficial da Escala.

## Gate

**Contrato lógico:** 🟢  
**Harness PostgreSQL:** 🟢 12/12  
**Core físico populado para Escala:** 🔴  
**Resolver físico:** 🔴  
**RLS Escala:** 🔴  
**E3/SED:** 🔴

Próximo passo seguro: transformar os casos AUTH em um harness contra dados Core reais somente quando houver fixture/homologação autorizada, e então validar RLS + governança EIOS.

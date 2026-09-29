# 135 — Auditoria Core Identidade Escala — Revalidação 29/09/2026

**Status:** 🔴 BLOQUEADO PARA INTEGRAÇÃO FÍSICA

## Revalidação no PostgreSQL real

Consulta direta ao Core retornou:

| Evidência | Resultado |
|---|---:|
| organization_members | 0 |
| identity_responsibility_scopes | 0 |
| teacher_profiles | 0 |
| identity_product_permissions(product_code='escala') | 0 |
| academic_teacher_identity_links | 0 |
| teacher_profiles com user_id/auth_user_id | 0 |

## Conclusão

Não surgiu, desde a auditoria anterior, uma ponte física canônica entre identidade autenticada e docente acadêmico.

Também não existe ainda contexto institucional operacional suficiente para validar o Authorization Resolver contra dados reais da Escala.

A ausência é positiva do ponto de vista de segurança: nenhuma ponte inferida ou RBAC paralelo foi criado para contornar o bloqueio.

## Regra preservada

Não utilizar:

- nome;
- e-mail;
- CPF;
- cargo;
- similaridade;
- coincidência temporal;
- metadados Auth;
- registros Agenda;

como substitutos de uma relação canônica homologada.

## Próximo desbloqueio

Para avançar fisicamente serão necessários dados Core reais e homologados:

1. membership institucional;
2. perfil docente;
3. contexto escola/organização;
4. escopo de responsabilidade;
5. identidade acadêmica SED;
6. autorização explícita da ponte Auth ↔ docente, caso não exista relação canônica já presente.

Até lá, o Resolver permanece em modo de contrato/harness e nenhuma migration produtiva é autorizada.

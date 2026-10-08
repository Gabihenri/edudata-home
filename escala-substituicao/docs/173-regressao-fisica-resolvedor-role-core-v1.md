# 173 — Regressão física do resolvedor canônico de roles Core

**Data:** 2026-10-08  
**Status:** 🟡 estrutural validada; sessão autenticada real pendente

## Resultados observados

- `resolve_canonical_role(NULL)` falha fechado.
- `current_identity_role()` sem sessão retorna NULL.
- `can_access_identity_product('agenda_edi')` sem sessão retorna false.
- `can_access_identity_product('escala')` sem sessão retorna false.
- `current_user_is_academic_calendar_platform_admin()` sem sessão retorna false.
- Não há memberships operacionais atuais.
- Não há teacher_profiles operacionais atuais.
- Não há permissões `product_code='escala'`.

## Integridade estrutural

- resolvedor `STABLE`;
- `SECURITY DEFINER` com search_path controlado;
- execução do resolvedor bloqueada para `anon`;
- execução permitida para `authenticated`;
- consumidoras usam o resolvedor;
- nenhum role novo foi criado;
- nenhuma membership foi fabricada;
- nenhum dado E3/SED foi introduzido.

## Limite da evidência

O MCP SQL administrativo não representa uma sessão autenticada de usuário real. Portanto H01–H36 e C01–C24 não devem ser declarados como reproduzidos contra o resolvedor físico apenas com esta execução.

**Próximo gate obrigatório:** executar o harness em sessão autenticada controlada, com fixtures temporários isolados, ou através do mecanismo de teste existente que permita estabelecer `auth.uid()` sem contaminar dados operacionais.

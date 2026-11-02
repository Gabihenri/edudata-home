# Contrato de autenticação do backend — Supabase → EIOS

Status: diagnóstico confirmado em 2026-10-14; implementação pendente.

## Evidência do fluxo de login oficial

A rota Next.js `src/app/api/auth/login/route.ts` autentica com `supabase.auth.signInWithPassword` e grava `data.session.access_token` no cookie HTTP-only `sb-access-token`. O middleware renova a sessão chamando o endpoint oficial de refresh do Supabase. Rotas Next.js autenticadas encaminham esse access token como `Authorization: Bearer <token>` ao criar clientes Supabase.

## Incompatibilidade identificada no backend Python

`backend/app/core/security/current_user.py` chama `JWTService.decode_token`. Esse serviço decodifica JWT com `SECRET_KEY` e exige o claim `type=access`. O token emitido pelo Supabase Auth não deve ser presumido como um token emitido por `AuthService.create_token_for_user` da API: são emissores e contratos distintos. Portanto, não se deve proteger as rotas Python com o dependency atual até validar o token oficial emitido pelo Supabase.

A rota `backend/app/routers/auth.py` não implementa login: ela expõe somente um endpoint de status. `AuthService.create_token_for_user` existe, mas não foi localizado no fluxo de login oficial do frontend.

## Contrato obrigatório para a correção

1. O backend deve validar o access token oficial do Supabase Auth (por exemplo, usando a verificação de usuário do Supabase Auth ou uma verificação criptográfica compatível com a configuração atual de chaves/JWKS do projeto). Não confiar apenas em decodificação sem verificação de assinatura.
2. A identidade canônica é o ID retornado pelo provedor após validação; nunca aceitar `user_id`, papel, escola ou organização enviados no corpo da requisição como prova de identidade/autorização.
3. A autorização institucional deve resolver `public.organization_members` para o ID autenticado e verificar `status = 'active'`, janelas `access_starts_at` / `access_ends_at` e escopo necessário. A tabela contém também `school_id`, `scope_type`, `scope_id`, `hierarchy_level` e capacidades explícitas; não reduzir a autorização a um único claim `role`.
4. Se houver múltiplos vínculos ativos, a operação precisa receber um contexto institucional explícito e validá-lo contra os vínculos permitidos. Nunca escolher silenciosamente o primeiro vínculo nem aceitar um `organization_id` do cliente sem validação.
5. As consultas de membership e os dados da Agenda devem respeitar RLS. Não usar uma chave privilegiada para contornar RLS ou substituir verificações de autorização.
6. Responder 401 para token ausente/inválido e 403 (ou 404 sem revelar existência) para vínculo ausente, inativo, expirado ou fora de escopo.
7. Adicionar testes para token Supabase inválido/expirado, usuário sem vínculo, vínculo revogado, múltiplos vínculos, acesso entre escolas e dashboard sem vazamento.

## Sequência segura

1. Implementar e testar uma dependência separada de validação do token Supabase, mantendo `CurrentUser` atual sem adoção automática nas rotas.
2. Implementar resolução de membership em serviço próprio e testes unitários isolados.
3. Integrar primeiro as leituras da Agenda e o resumo, com filtros de escopo antes da consulta.
4. Integrar mutações, depois Users/Organizations, com testes negativos por operação.
5. Verificar RLS real e contratos do banco em ambiente de teste antes de promover.

## Limites deste diagnóstico

Este documento não modifica rotas, chaves, variáveis de ambiente, RLS, migrações ou dados remotos. Não autoriza merge ou deploy. O bloqueio de inicialização observado no Render por ausência de `SUPABASE_KEY` continua sendo um problema separado que precisa de correção operacional validada.

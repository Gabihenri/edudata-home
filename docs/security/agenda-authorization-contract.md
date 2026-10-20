# Contrato de identidade e autorização — Agenda EDI

Status: proposta técnica para orientar a implementação. Este documento não substitui testes nem altera políticas do banco.

## Objetivo

Impedir que um usuário leia ou altere registros de outra escola/organização apenas trocando IDs no caminho, query string ou payload. O escopo precisa ser verificado em cada operação, não somente no login.

## Evidências do estado atual

- `CurrentUser.get` valida um JWT assinado pelo `JWTService` da API e retorna `sub`, `organization_id`, `school_id` e `role` do payload.
- `AuthService.create_token_for_user` emite esses campos, mas o fluxo de login que deveria chamá-lo não foi localizado na rota `backend/app/routers/auth.py`; a rota atual é apenas health/status.
- O cliente de `backend/app/services/supabase_service.py` é criado com `SUPABASE_URL` e `SUPABASE_KEY` compartilhados. Não foi encontrada propagação do JWT do usuário para esse cliente.
- As políticas SQL do Core usam `auth.uid()` e membership ativo. Validar o JWT próprio da API não faz, por si só, com que o Supabase reconheça esse mesmo usuário.
- As rotas de Agenda, Users e Organizations auditadas não aplicam `CurrentUser.get`; alguns endpoints aceitam IDs institucionais diretamente do cliente e o resumo da Agenda lê registros sem filtro institucional.

## Regras obrigatórias para a implementação

1. **Identidade confiável:** obter o ID do usuário apenas do token validado por um fluxo de autenticação oficial. Nunca confiar em `user_id`, `role`, `school_id` ou `organization_id` recebidos no corpo da requisição.
2. **Membership vigente:** resolver membership no Core/banco para cada contexto protegido, considerando status ativo e janelas de acesso. Não usar claims antigos como única fonte de autorização.
3. **Escopo servidor-side:** derivar organização e escola permitidas a partir do membership e do recurso. IDs fornecidos pelo cliente são seletores de recurso, não prova de permissão.
4. **Banco/RLS coerente:** escolher explicitamente uma das opções:
   - propagar o JWT oficial do Supabase para as consultas sujeitas a RLS; ou
   - manter a camada de serviço privilegiada, mas impor autorização explícita no backend antes de cada operação e provar isso com testes negativos. Não usar uma chave privilegiada como substituto de autorização.
5. **Menor privilégio:** ações de coordenação/gestão devem verificar papel e escopo exigidos para aquela ação. Ser membro da organização não implica acesso irrestrito a todas as escolas nem a agendas de pares.
6. **Resumo e listagens:** aplicar filtros institucionais antes de consultar os dados; nunca buscar um conjunto global e confiar que a camada de apresentação o filtre.
7. **Falha fechada:** ausência de token, membership inválido, recurso fora do escopo ou contexto ambíguo resulta em negação, sem fallback para acesso global.
8. **Dados pessoais:** não retornar usuários por e-mail/ID nem listar usuários globalmente sem política explícita e escopo validado.

## Matriz mínima de testes negativos

- Sem token → 401.
- Token inválido/expirado → 401.
- Token válido sem membership ativo → 403.
- Professor da escola A consultando evento da escola B → 404 ou 403, sem vazar conteúdo.
- Professor da escola A enviando `school_id` ou `user_id` da escola B ao criar/atualizar → rejeitar; os campos devem ser derivados ou validados no servidor.
- Membro comum tentando alterar papel, organização ou escola no perfil → rejeitar.
- Gestor da escola A tentando consultar outra escola sem escopo de gestão explícito → negar.
- Usuário de uma organização tentando consultar organização diferente → negar.
- Dashboard/resumo → contém apenas eventos autorizados para a identidade e escopo autenticados.
- Membership revogado/expirado após emissão do token → acesso negado quando a autorização for reavaliada.

## Sequência de implementação segura

1. Confirmar o provedor oficial e o fluxo de emissão/validação do token.
2. Criar dependências reutilizáveis para identidade autenticada e membership ativo, com testes unitários isolados.
3. Criar serviços/repositórios com escopo explícito e sem aceitar escopo de autorização do payload.
4. Cobrir primeiro as leituras da Agenda e o dashboard; adicionar testes cross-school.
5. Cobrir mutações da Agenda, depois Users e Organizations, por operação e permissão.
6. Validar o mecanismo escolhido com RLS real em ambiente de teste antes de promover.
7. Só liberar após corrigir o baseline de migrações locais e confirmar a inicialização do Render.

## Fora de escopo desta proposta

Nenhum segredo, variável de ambiente, dado remoto, RLS, migration aplicada ou deploy deve ser alterado como parte apenas deste contrato. Não realizar merge enquanto os bloqueadores de autorização, migrações e inicialização do serviço persistirem.

## Atualização de implementação — 2026-10-15

- Foi criado `backend/app/core/security/supabase_user.py` para validar o bearer token no Supabase Auth; a dependência ainda não está aplicada às rotas de Agenda/Users.
- Foi criado `backend/app/core/security/membership_context.py` para selecionar um único vínculo ativo e vigente, sem conceder permissões.
- Foi criado `backend/app/core/security/agenda_access_policy.py` como política pura e fail-closed. Ela exige correspondência entre a identidade autenticada e `membership.user_id`, organização compatível, escola exata para eventos escolares e `can_view_school` explícito para leitura de evento de outra pessoa. Escritas ficam limitadas ao proprietário no escopo escolar exato. A política não é proteção efetiva enquanto não for chamada por cada endpoint com dados persistidos confiáveis.
- Foram adicionados testes em `backend/tests/test_agenda_access_policy.py`; o workflow atual descobre a suíte com `python -m unittest discover -s tests -v`. A execução CI dos commits mais recentes ainda precisa ser confirmada.
- **Incompatibilidade a resolver antes de integrar:** a migração local mínima `016_institutional_identity_base.sql` cria `organization_members` sem `school_id`, `access_starts_at`, `access_ends_at`, `can_view_school`, `can_view_team`, `can_view_network` e outros campos usados pelo contrato/helper. Não presumir que o esquema remoto contenha esses campos nem acrescentá-los remotamente sem inventário e migração revisada. A implementação de membership precisa alinhar-se ao esquema canônico e à cadeia de migrações reproduzível.
- O repositório da Agenda ainda usa um cliente Supabase compartilhado criado com `SUPABASE_KEY`; não propagar esse cliente para endpoints protegidos nem tratá-lo como substituto de autorização/RLS.

Nenhuma rota foi declarada protegida por esta etapa. Nenhum segredo, variável de ambiente, RLS remoto, DDL remoto, merge ou deploy foi alterado.

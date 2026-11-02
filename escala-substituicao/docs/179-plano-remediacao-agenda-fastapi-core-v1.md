# Plano de remediação — Agenda FastAPI e Core

**Status:** proposta técnica para revisão; não representa correção aplicada nem liberação para produção.  
**Data da auditoria:** 2026-10-13  
**Branch de documentação:** `docs/agenda-fastapi-remediation-plan`

## Objetivo

Restabelecer uma base segura e coerente para o backend legado FastAPI da EduData IA sem alterar a arquitetura Next.js/Supabase, sem migrar o schema de produção como atalho e sem tornar a integração SED obrigatória.

## Bloqueios observados

1. **Inicialização do backend:** o deploy Render `dep-db725q8m7kps73bpgveg` falhou com `SupabaseException: supabase_key is required`. O build havia terminado, mas o processo não iniciou.
2. **Autorização:** nos arquivos `backend/app/routers/agenda.py` e `backend/app/routers/users.py`, as funções examinadas não declaram dependências locais de autenticação/autorização. Middleware, gateway ou proteção externa ainda precisam ser auditados; a ausência local não prova, sozinha, explorabilidade.
3. **Cliente de banco global:** `backend/app/core/database/base_repository.py` realiza CRUD por meio de um cliente Supabase global. Antes de expor essas operações, é necessário provar qual chave está em uso e como as políticas de autorização/RLS são efetivamente aplicadas.
4. **Contrato temporal divergente:** `backend/app/repositories/agenda_repository.py` usa `start_at` em algumas consultas e `start_datetime` em outras. `backend/app/services/agenda_service.py` valida `start_datetime`/`end_datetime`, enquanto o schema remoto auditado usa `start_at`/`end_at`.
5. **Prontidão enganosa:** o health check simples que responde `healthy` não comprova que o cliente Supabase esteja configurado nem que as operações essenciais funcionem.

## Sequência de remediação

### Fase 1 — Recuperar inicialização sem expor credenciais

- No painel Render, configurar `SUPABASE_KEY` com uma chave adequada ao modelo de segurança aprovado.
- Não copiar credenciais para issues, logs, commits ou mensagens.
- Não substituir por chave `service_role` para fazer o erro desaparecer.
- Confirmar estado `live` do novo deploy e correlacionar os logs com o ID do deploy novo, não com a instância anterior.
- Manter o schema e os dados de produção intocados durante esta fase.

### Fase 2 — Mapear autenticação e autorização de ponta a ponta

- Mapear o fluxo Supabase Auth da aplicação Next.js até o FastAPI, incluindo middleware, proxy, cabeçalhos e validação do token.
- Exigir autenticação em todas as rotas privadas; manter públicas somente rotas explicitamente permitidas, como health/readiness sem dados.
- Derivar identidade, papel e escopo institucional de token validado e vínculos no servidor. Não confiar em `user_id`, `school_id`, `organization_id` ou papel enviados pelo cliente.
- Garantir autorização por organização/escola em cada operação e verificar se o cliente Supabase propaga o JWT do usuário para RLS ou se há uma autorização server-side equivalente e testada.
- Revisar rotas de usuários com privilégio administrativo separado das rotas comuns.

### Fase 3 — Alinhar o contrato temporal

Schema remoto auditado usa `start_at` e `end_at`. Alinhar o contrato da API, validações do serviço, ordenações e indicadores para esse par de nomes, mantendo compatibilidade deliberada na fronteira da API apenas se for necessária.

- `backend/app/repositories/agenda_repository.py`: substituir referências internas inconsistentes a `start_datetime` por `start_at` e verificar uso de `end_at`.
- `backend/app/services/agenda_service.py`: validar o contrato escolhido e garantir que o payload persistido seja convertido explicitamente para os nomes reais da tabela.
- Revisar schemas Pydantic, rotas, dashboard e consumidores antes de implementar; não alterar apenas um arquivo se isso deixar as camadas incompatíveis.
- Adicionar testes para listagem por docente, eventos entre datas, próximos eventos, criação, atualização e resumo do dashboard.

### Fase 4 — Testes de segurança e integração

Executar em ambiente de teste/staging com usuários e vínculos de escola dedicados:

- Sem token: rotas privadas retornam 401.
- Token válido sem papel/permissão: 403.
- Usuário da escola A tenta ler, alterar ou excluir registro da escola B: negado.
- Payload tenta trocar `user_id`, `school_id`, `organization_id` ou papel: valores não autorizados são ignorados ou rejeitados.
- Operações administrativas: somente papéis autorizados conseguem executar.
- Consultas e escritas: RLS e autorização server-side funcionam com a chave realmente usada pela aplicação.
- Testes temporais cobrem limites, fuso horário, fim anterior ao início e nomes das colunas.

### Fase 5 — Readiness e liberação

- Separar liveness (processo ativo) de readiness (configuração/dependências essenciais prontas), sem retornar segredos nem detalhes sensíveis.
- Conferir logs recentes da nova instância e fazer smoke tests autenticados.
- Só considerar o MVP liberável após revisão do diff, CI, testes de sessão real e comprovação do isolamento entre escolas.

## Critérios de aceite

- [ ] Deploy novo em `live`, confirmado pelo ID do deploy.
- [ ] Nenhum segredo privilegiado usado como atalho ou exposto em logs.
- [ ] Todas as rotas privadas exigem autenticação e autorização explícitas ou comprovadamente centralizadas.
- [ ] Isolamento entre escolas comprovado com sessões reais.
- [ ] Nomes temporais consistentes entre API, serviço, repositório e schema.
- [ ] Testes automatizados e smoke tests passam.
- [ ] Nenhuma alteração de produção em schema/RLS sem migração revisada e plano de reversão.

## Arquivos prioritários

1. `backend/app/core/config.py`
2. `backend/app/services/supabase_service.py`
3. `backend/main.py` e configuração de middleware
4. `backend/app/routers/agenda.py`
5. `backend/app/routers/users.py`
6. `backend/app/repositories/agenda_repository.py`
7. `backend/app/services/agenda_service.py`
8. `backend/app/core/database/base_repository.py`
9. Schemas e testes relacionados

## Limites

Este documento é um plano de trabalho, não uma implementação. Não foram alterados dados, schema, grants ou políticas de produção. A tentativa automatizada de alterar a variável de ambiente foi bloqueada e não deve ser contornada.
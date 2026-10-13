# 177 — Auditoria de autenticação e contrato temporal da Agenda EDI

**Data:** 2026-10-13  
**Escopo:** leitura estática do branch `main`; nenhuma alteração no banco ou nos dados de produção.

## Resultado executivo

A Agenda não deve avançar para cadastro operacional ou uso institucional real antes de fechar dois bloqueios:

1. **Autenticação e autorização não aparecem aplicadas nas rotas da Agenda no código inspecionado.**
2. **O repositório consulta colunas de data/hora que não existem no schema remoto consultado.**

Esta é uma auditoria estática do código disponível. Não comprova se existe proteção adicional em proxy, gateway ou configuração de deploy; esses componentes precisam de verificação separada.

## Evidências

### 1. Montagem da aplicação

Arquivo: `backend/main.py`, blob SHA `45b5b18cd09d1fd3d0e6b66c0a8d04f6a5d54a7e`.

A aplicação monta `agenda_router` diretamente com `app.include_router(agenda_router)`. No arquivo inspecionado não há middleware global de autenticação declarado nem dependência global associada a esse router.

### 2. Rotas da Agenda

Arquivo: `backend/app/routers/agenda.py`, blob SHA `9326c7c1f1f9b6cfe974dea8292fb6217c3c3e1f`.

As rotas de listagem, leitura, criação, atualização, alteração de status e exclusão não declaram `Depends` de autenticação/autorização. A função `build_engine_context` recebe `organization_id`, `school_id`, `user_id` e `role` do payload; esses campos não devem ser tratados como prova de identidade autenticada. O código inspecionado também permite consultas por `teacher_id` e `school_id` informados na URL.

**Conclusão limitada:** a camada FastAPI inspecionada não demonstra proteção de autenticação e autorização nas rotas da Agenda. Antes de uso real, validar também proxy/gateway e implantação; não presumir que a ausência de proteção local seja compensada por infraestrutura externa.

### 3. Cliente Supabase

Arquivos:
- `backend/app/services/supabase_service.py`, blob SHA `c8e4fb51fba9c5b888bb205b2142ff6f012c6f23`.
- `backend/app/core/config.py`, blob SHA `5d83b3e6656c2c88f3d23d0505bf121ba604dcfb`.

O cliente é inicializado com `SUPABASE_URL` e `SUPABASE_KEY`, lidos do ambiente. A leitura do código não permite determinar qual chave está configurada no ambiente implantado. É obrigatório confirmar que a API não usa chave privilegiada em caminhos sem autenticação e que o desenho de sessão/RLS corresponde ao modelo de autorização pretendido. Não expor valores de segredo em logs ou documentação.

O arquivo de configuração também contém um segredo JWT padrão de desenvolvimento. Verificar configuração real de produção e impedir inicialização produtiva com esse valor padrão.

### 4. Divergência de colunas de data/hora

Arquivo: `backend/app/repositories/agenda_repository.py`, blob SHA `489ad1ddec747fefb19dc4d974d90caf5393f99e`.

Os métodos `list_by_school`, `list_by_teacher`, `events_between` e `upcoming_events` usam `start_datetime` e/ou `end_datetime`. A consulta de schema remoto realizada nesta auditoria encontrou `agenda_events.start_at` e `agenda_events.end_at`. Se o schema consultado corresponde ao ambiente executado por essa API, essas operações falharão por referência a colunas inexistentes.

Antes de alterar o repositório, adicionar teste unitário que valide os nomes dos filtros/ordenação e o comportamento dos quatro métodos com cliente Supabase simulado. Preservar os filtros por escola/usuário e a ordenação temporal. Confirmar também se `teacher_id` deve representar o UUID de autenticação usado em `agenda_events.user_id`, ou se é outro identificador.

## Sequência segura de correção

1. Confirmar os controles no gateway/deploy e o tipo de chave Supabase configurada, sem revelar segredos.
2. Definir e aplicar autenticação e autorização por organização/escola/usuário nas rotas de Agenda; nunca confiar em `user_id`, `role` ou `organization_id` enviados livremente no payload.
3. Criar testes para acesso anônimo, acesso entre organizações/escolas, papéis permitidos e operações de escrita; não simular uma sessão autenticada como se fosse prova de RLS real.
4. Corrigir os nomes de colunas temporais em um único arquivo e validar com testes antes de avançar.
5. Só depois implementar o fluxo de cadastro institucional de docentes e os dados de escala, mantendo a SED como fonte opcional e sem criar entidades/tabelas novas sem necessidade demonstrada.

## Não realizado

- Nenhum DDL ou alteração de dados no Supabase.
- Nenhuma alteração de código de aplicação nesta etapa.
- Nenhuma alegação de teste de autenticação/RLS em sessão real.
- Nenhuma confirmação sobre gateway, variáveis secretas ou configuração do deploy.

## Referências do repositório

- [Aplicação FastAPI](https://github.com/Gabihenri/edudata-home/blob/main/backend/main.py)
- [Rotas da Agenda](https://github.com/Gabihenri/edudata-home/blob/main/backend/app/routers/agenda.py)
- [Cliente Supabase](https://github.com/Gabihenri/edudata-home/blob/main/backend/app/services/supabase_service.py)
- [Configuração](https://github.com/Gabihenri/edudata-home/blob/main/backend/app/core/config.py)
- [Repositório da Agenda](https://github.com/Gabihenri/edudata-home/blob/main/backend/app/repositories/agenda_repository.py)


## Atualização de execução — 2026-10-13

### Correção isolada aplicada ao repositório de consultas

O arquivo `backend/app/repositories/agenda_repository.py` foi atualizado no commit `993c35f20b9910822858bf371253a9efcc3b8f89` para usar `start_at` e `end_at` nos filtros/ordenação e um instante atual com fuso local explícito em `upcoming_events`.

Foi adicionado o teste unitário `backend/tests/test_agenda_repository_timestamps.py` para cobrir os quatro métodos de consulta. Arquivos:
- [Implementação corrigida](https://github.com/Gabihenri/edudata-home/blob/main/backend/app/repositories/agenda_repository.py)
- [Testes de contrato temporal](https://github.com/Gabihenri/edudata-home/blob/main/backend/tests/test_agenda_repository_timestamps.py)

**Status dos testes:** os testes foram adicionados, mas não foi possível confirmar sua execução nesta etapa. Não declarar a correção como validada em runtime até executar o conjunto de testes em ambiente Python com as dependências do backend.

### Bloqueio residual descoberto no caminho de escrita

A leitura de `backend/app/services/agenda_service.py` e `backend/app/core/services/base_service.py` confirmou que a criação exige `start_datetime` e `end_datetime`, e que o serviço-base envia o dicionário diretamente ao repositório sem tradução. O schema remoto de `agenda_events` expõe `start_at` e `end_at`, e `end_at` aceita nulo.

Além disso, `dashboard_summary` ainda procura `start_datetime` nas linhas retornadas. Portanto, a correção do repositório resolve apenas as consultas específicas descritas acima; **não resolve ainda a compatibilidade de criação/atualização nem o resumo do dashboard**. O próximo ajuste deve estabelecer um contrato explícito de entrada/saída entre a API e o schema persistido, preservando compatibilidade com os clientes existentes e adicionando testes antes de modificar o serviço.

Nenhum DDL ou dado de produção foi alterado.

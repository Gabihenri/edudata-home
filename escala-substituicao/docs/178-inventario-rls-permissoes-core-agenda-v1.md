# 178 — Inventário de RLS e permissões do Core/Agenda

**Data:** 2026-10-13  
**Projeto consultado:** EduData IA (`ihchzfndmdwtoabttkil`)  
**Escopo:** consultas somente leitura ao catálogo PostgreSQL; nenhuma alteração de políticas, permissões ou dados.

## Resultado verificado

Todas as seis tabelas abaixo têm RLS habilitado. Isso, isoladamente, não comprova que a API respeite o isolamento, pois o cliente de backend usa uma chave de ambiente ainda não identificada e chaves privilegiadas podem contornar RLS.

| Tabela | RLS | Políticas encontradas | Grants para anon/authenticated |
|---|---:|---:|---:|
| `agenda_classes` | sim | 3 | 3 |
| `agenda_events` | sim | 3 | 3 |
| `organization_members` | sim | 1 | 1 |
| `organizations` | sim | 1 | 1 |
| `schools` | sim | 0 | 1 |
| `teacher_profiles` | sim | 0 | 0 |

## Políticas observadas

### `agenda_events`
- `SELECT`: `can_view_agenda_record(user_id, organization_id, school_id)`, para `authenticated`.
- `UPDATE`: `can_update_agenda_record(user_id, organization_id, school_id)`, aplicada tanto à linha-alvo como ao novo estado.
- `INSERT`: exige `user_id = auth.uid()` e `deleted_at IS NULL`.
- Não foi encontrada política de `DELETE` no inventário consultado.

### `agenda_classes`
- `SELECT`: `can_view_agenda_record(teacher_id, organization_id, school_id)`.
- `UPDATE`: `can_update_agenda_record(teacher_id, organization_id, school_id)`.
- `INSERT`: exige `teacher_id = auth.uid()` e `deleted_at IS NULL`.
- Não foi encontrada política de `DELETE` no inventário consultado.

### Core institucional
- `organization_members`: leitura própria (`user_id = auth.uid()`).
- `organizations`: leitura quando existe vínculo ativo e dentro da janela de acesso.
- `schools`: RLS habilitado, nenhuma política encontrada. O comportamento padrão com RLS habilitado e sem política permissiva é negar acesso via PostgREST; revisar se isso é intencional para cadastro institucional.
- `teacher_profiles`: RLS habilitado, sem política e sem grants para `anon`/`authenticated` no catálogo consultado. Cadastro de docentes não está pronto para ser consumido diretamente por esses papéis até haver política e permissões explícitas.

## Implicações para a API FastAPI

O arquivo `backend/app/services/supabase_service.py` inicializa um cliente com `SUPABASE_KEY`. A variável do ambiente implantado não foi inspecionada e nenhum segredo foi lido. Antes de usar as rotas da Agenda:
1. Identificar, na configuração de deploy sem revelar o valor, se `SUPABASE_KEY` é chave public/anon, publishable, service-role ou secret.
2. Se for chave privilegiada, tornar a autenticação do usuário e a autorização por organização/escola obrigatórias na API antes de qualquer consulta ou mutação.
3. Preferir propagar o JWT do usuário para que as políticas RLS sejam avaliadas com o contexto autenticado, ou implementar autorização server-side equivalente com testes negativos robustos.
4. Definir explicitamente a política de exclusão/soft-delete e confirmar se a ausência de política `DELETE` é intencional.
5. Criar política de cadastro de docentes baseada em vínculo institucional e papel autorizado, sem permitir que o usuário se atribua papel ou organização pelo payload.
6. Testar com sessões reais separadas por organização e papéis. Não considerar testes com credenciais administrativas ou `auth.uid()` simulado como validação de RLS real.

## Limites desta verificação

- Não foram executadas operações de leitura/escrita como usuário anônimo ou autenticado real.
- Não foram inspecionados os valores de secrets do deploy.
- Não foram alteradas políticas nem grants.
- A consulta ao catálogo confirma as políticas declaradas, não a correção semântica das funções `can_view_agenda_record` e `can_update_agenda_record`; suas definições e testes precisam de revisão dedicada.

## Próxima sequência

1. Fechar o tipo de chave usado pela API e o mecanismo de autenticação.
2. Especificar autorização para leitura, criação, atualização, exclusão e cadastro docente.
3. Construir testes negativos e positivos em sessão autenticada real.
4. Completar o contrato temporal de criação/atualização da Agenda.
5. Só então habilitar cadastro institucional operacional e fluxos de escala.

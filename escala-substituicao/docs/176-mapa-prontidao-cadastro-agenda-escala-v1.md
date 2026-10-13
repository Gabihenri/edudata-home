# 176 — Mapa de prontidão do cadastro institucional Agenda/Escala

**Data:** 13/10/2026  
**Status:** Auditoria estática e consulta de leitura ao Supabase. Nenhuma alteração no banco ou no código nesta etapa.

## Conclusão

A operação sem dependência da SED é viável. O Core já possui organizações, escolas, perfis docentes, memberships e classes da Agenda. Entretanto, o cadastro docente ainda não está pronto para uso operacional: a tabela de perfis docentes está vazia e não há memberships cadastradas no ambiente consultado. A grade recorrente e a disponibilidade precisam ser mapeadas com precisão antes de qualquer novo DDL.

## 1. Contagens exatas no Supabase

| Tabela | Registros |
|---|---:|
| `organizations` | 1 |
| `schools` | 2 |
| `teacher_profiles` | 0 |
| `organization_members` | 0 |
| `agenda_classes` | 2 |
| `agenda_events` | 45 |

RLS está habilitado nas seis tabelas. A existência de RLS não substitui a validação de políticas com sessões autenticadas.

## 2. Entidades para reutilizar

- `organizations`: organização canônica.
- `schools`: unidade escolar vinculada à organização; já suporta origem manual ou INEP.
- `teacher_profiles`: perfil docente com nome, escola, organização, área, etapa e componentes.
- `organization_members`: vínculo de usuário autenticado com organização e escopo.
- `agenda_classes`: turmas já usadas pela Agenda.
- `agenda_events`: eventos com `start_at`, `end_at`, usuário, escola, organização e turma.

Não criar identidades institucionais paralelas. Perfil docente e conta de login são conceitos diferentes; sua associação deve ser explícita e auditável.

## 3. Divergência encontrada no backend Python da Agenda

Arquivo: `backend/app/repositories/agenda_repository.py`  
SHA: `489ad1ddec747fefb19dc4d974d90caf5393f99e`

O repositório usa `start_datetime` e `end_datetime`, enquanto o schema remoto de `agenda_events` contém `start_at` e `end_at`. Os métodos de consulta por período e próximos eventos podem falhar por nomes de colunas divergentes.

**Próxima ação:** corrigir esse repositório em uma alteração isolada e adicionar testes de contrato contra os nomes reais do schema. A correção ainda não foi aplicada.

## 4. Segurança da API a verificar antes de ampliar o cadastro

Arquivo: `backend/app/routers/agenda.py`

As rotas recebem identificadores de professor, escola e usuário por parâmetros/payload. A inspeção desse arquivo não mostra uma dependência local de autenticação e autorização. Isso não prova que inexista proteção global; é necessário confirmar a montagem do router e o tipo de credencial usado pelo cliente Supabase.

Antes de declarar o backend seguro:
1. confirmar autenticação aplicada no nível da aplicação;
2. garantir que identidade e escopo venham da sessão autenticada, não de campos livremente enviados;
3. testar que uma escola não leia ou altere registros de outra;
4. conferir políticas e grants de `teacher_profiles`;
5. testar as operações com usuários autenticados de papéis distintos.

## 5. Lacunas funcionais do cadastro

| Requisito | Estado observado | Ação |
|---|---|---|
| Organização e escola | Existem | Reutilizar Core |
| Cadastro de docente | Tabela existe, vazia | Criar fluxo autorizado |
| Conta de acesso do docente | Associação não comprovada | Definir vínculo separado |
| Membership e escopo | Tabela existe, vazia | Homologar convite/vínculo |
| Turmas | `agenda_classes` existe | Validar vigência e autoria |
| Grade recorrente | Não mapeada nesta auditoria | Localizar fonte canônica |
| Disponibilidade | Não mapeada nesta auditoria | Localizar fonte canônica |
| Ausência/vaga | Modelo do módulo Escala precisa reconciliar com o banco | Evitar tabelas duplicadas |
| Regras do motor | Contratos e testes existem no repositório | Mapear persistência física |

## 6. Sequência recomendada

1. Verificar autenticação/autorização do backend e corrigir o que for necessário.
2. Implementar cadastro de perfis docentes sem exigir conta de login; associação de conta em fluxo separado.
3. Validar RLS para gestores, docentes e operadores.
4. Corrigir a divergência `start_datetime/end_datetime` versus `start_at/end_at` no repositório Python.
5. Mapear grade, disponibilidade e ausência no modelo físico existente.
6. Testar o fluxo completo: cadastro → grade → ausência → recomendação → confirmação humana → auditoria.
7. Homologar somente após os testes autenticados e os gates de migração estarem aprovados.

## 7. Limites

Esta auditoria não alterou dados nem aplicou DDL. A contagem de registros foi consultada por SQL somente de leitura. A ausência de uma tabela em uma lista limitada não prova que o conceito não exista com outro nome ou schema. A suíte sintética da Escala não equivale à homologação operacional autenticada.

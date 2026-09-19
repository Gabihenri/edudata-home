# Reconciliação do pipeline Supabase

## Objetivo

Garantir que o CI valide o mesmo modelo que será usado no desenvolvimento local.

### Estado identificado

O workflow `.github/workflows/edi-qi-local-db.yml` inicia o Supabase local e executa `supabase test db`. Entretanto, o repositório ainda não contém um baseline completo em `supabase/migrations/` capaz de reconstruir o schema moderno existente no projeto remoto.

O teste também referencia `supabase/tests/edi_qi_rls.test.sql`, arquivo que não está presente no branch auditado.

## Regra de reconciliação

Não usar:

- tabelas de compatibilidade criadas apenas para o CI;
- cópia indiscriminada de `database/supabase/migrations/001..016`;
- alterações diretas no banco de produção;
- `db reset --linked`.

## Procedimento previsto

1. Capturar o schema remoto atual como baseline usando o fluxo oficial do Supabase (`supabase db pull`).
2. Revisar o SQL gerado para remover artefatos indesejados e preservar dependências reais.
3. Colocar o baseline na árvore ativa `supabase/migrations/`.
4. Reexecutar `supabase db reset` local.
5. Corrigir somente incompatibilidades comprovadas pela execução.
6. Reintroduzir/validar os testes EDI-QI.
7. Só então executar as migrations da Inteligência Operacional EDI.

## Critério de segurança

Enquanto o baseline não for reproduzível, a PR da Agenda não deve ser considerada homologada.

A produção permanece intocada durante essa etapa.

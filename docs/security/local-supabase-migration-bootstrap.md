# Diagnóstico e plano seguro: migrações locais do Supabase

## Estado observado

O workflow `EDI-QI Local Database` falha no comando `supabase start`, antes de executar os testes SQL. O log do run 38539235430 registra:

```
Applying migration 017_agenda_class_roster_and_attendance.sql...
Applying migration 018_institutional_intelligence_governance.sql...
ERROR: relation "public.organizations" does not exist
```

A migração 018 cria tabelas de governança institucional com FK para `public.organizations` e políticas RLS que consultam `public.organization_members`.

O diretório `supabase/migrations/` contém 017, 018 e duas migrações com versão timestamp. Não há, nesse fluxo, uma migração anterior que estabeleça as tabelas institucionais exigidas.

## Fontes existentes e risco

- `database/01_organizations.sql` contém uma versão legada e mínima da tabela `organizations`.
- `database/14_organizations.sql` evolui a tabela existente, normaliza dados, adiciona constraints e cria índices/triggers.
- `database/supabase/migrations/006_agenda_governance_audit.sql` lista `organization_members` como pré-requisito e depende de outras tabelas/funções de governança.
- O banco remoto já contém `organizations` e `organization_members`, mas a existência remota não prova que o bootstrap local reproduz o schema remoto.

Não copiar ou executar automaticamente os scripts legados no remoto: podem modificar dados e pressupõem outras estruturas. Também não editar silenciosamente a migração 018, pois ela pode já ter sido aplicada em ambientes existentes.

## Correção recomendada

1. Identificar e versionar uma definição-base canônica de `organizations` e `organization_members`, com colunas e constraints necessárias às FKs e políticas da migração 018.
2. Confirmar se a solução deve ser uma migração histórica nova, um baseline de teste isolado ou uma reorganização controlada do conjunto de migrações. Não inserir uma versão antiga em produção sem avaliar o histórico de migrações.
3. Executar `supabase start` e os testes SQL em ambiente descartável; conferir a ordem completa e as políticas criadas.
4. Comparar o resultado com o schema remoto por leitura, sem aplicar DDL remoto nesta correção.
5. Só então integrar o fluxo no CI e registrar os resultados.

## Critério de aceite

- `supabase start` completa sem erro.
- A migração 018 aplica com as tabelas e colunas esperadas.
- `supabase test db supabase/tests/edi_qi_rls.test.sql` executa.
- Os testes de autorização continuam negando acesso entre usuários/escolas.
- Nenhum dado, migration history, segredo ou política do banco remoto é alterado como parte do diagnóstico.

## Limitações atuais

O endpoint de consulta SQL read-only do Supabase foi bloqueado pela configuração de segurança em tentativas anteriores. Por isso, este documento não afirma que todas as policies remotas foram inspecionadas, nem que o bootstrap proposto já foi validado.
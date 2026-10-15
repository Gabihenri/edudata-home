# Diagnóstico e correção: migrações locais do Supabase

## Estado confirmado em 14/10/2026

O workflow `EDI-QI Local Database` falhava ao aplicar `018_institutional_intelligence_governance.sql`, porque `public.organizations` não existia no banco local. A migração 018 também depende de `public.organization_members`.

Foi adicionada a migração-base `016_institutional_identity_base.sql`, com `CREATE TABLE IF NOT EXISTS` para as estruturas mínimas requeridas. Ela não normaliza dados nem tenta evoluir tabelas já existentes.

Também foi criado `supabase/tests/edi_qi_rls.test.sql`, arquivo já referenciado pelo workflow. O teste contém 15 verificações estruturais de tabelas, colunas, RLS habilitado e existência de policies.

## Evidência de CI

No commit `49a24097e546c1de31d99b782291da547b782522`, os jobs abaixo concluíram com sucesso:

- [EDI-QI Local Database](https://github.com/Gabihenri/edudata-home/actions/runs/38542726423): sucesso nos passos `Start local Supabase` e `Run EDI-QI database tests`.
- [Agenda Temporal Contract Tests](https://github.com/Gabihenri/edudata-home/actions/runs/38542726336): sucesso.
- [EduData IA — Escala Regression](https://github.com/Gabihenri/edudata-home/actions/runs/38542726283): sucesso.

Isso confirma que a cadeia local usada pelo workflow inicia e que os testes SQL estruturais executam. **Não** demonstra, por si só, que todos os cenários negativos de autorização entre usuários e escolas foram testados em runtime.

## Risco e limites

- `database/01_organizations.sql` e `database/14_organizations.sql` são scripts legados com pressupostos próprios; não devem ser executados automaticamente no banco remoto.
- A migração-base 016 é um bootstrap mínimo para banco local limpo. Antes de promovê-la para qualquer ambiente compartilhado, comparar o contrato com o schema canônico e o histórico remoto.
- O projeto remoto já possui `organizations` e `organization_members`; não foi aplicado DDL remoto nem alterado histórico, dados, policies ou secrets.
- O deploy Render observado permanece `update_failed` no commit de 13/10/2026, com erro `supabase_key is required`. Os logs disponíveis são dessa implantação anterior; nenhum deploy novo foi disparado nesta etapa.

## Próximos critérios de liberação

1. Comparar o contrato mínimo com o schema remoto em modo somente leitura.
2. Acrescentar testes comportamentais RLS com usuários/contextos distintos, além das verificações estruturais atuais.
3. Resolver a configuração ausente do Supabase no Render sem expor ou registrar valores secretos.
4. Implementar autenticação e autorização por operação nas rotas Agenda/Users, derivando identidade do token validado e aplicando escopo no recurso consultado.
5. Só considerar merge/deploy após validação dos itens acima.

## Princípio de segurança

Não usar service-role para contornar RLS, não confiar em `organization_id`, `school_id`, `user_id` ou `role` enviados pelo cliente como prova de autorização, e não promover a migração-base sem verificar sua compatibilidade com o histórico remoto.
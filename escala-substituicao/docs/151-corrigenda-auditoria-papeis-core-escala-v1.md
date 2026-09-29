# 151 — Corrigenda da Auditoria de Papéis Core × Escala v1

**Data:** 29/09/2026  
**Status:** 🟢 RECONCILIADO

## Correção

A auditoria 150 registrou que `organization_members.role` aceitava somente professor, coordenador, diretor e administrador.

A verificação direta da tabela canônica `identity_roles` demonstrou que essa conclusão estava incompleta.

O catálogo físico atual possui 10 papéis:

- student — nível 5;
- teacher — nível 10;
- coordinator — nível 30;
- vice_principal — nível 40;
- principal — nível 50;
- supervisor — nível 60;
- regional_manager — nível 70;
- institution_admin — nível 80;
- platform_admin — nível 90;
- super_admin — nível 100.

## Consequência para a Escala

Os papéis conceituais anteriormente considerados ausentes — vice-direção, supervisão e gestão regional — **já possuem códigos canônicos no Core**.

Portanto não é necessário criar RBAC paralelo nem novos códigos para esses níveis.

A distinção correta é:

- `identity_roles` contém o catálogo canônico de papéis;
- `organization_members.role` possui constraint compatível com parte desse catálogo, mas deve ser verificado no fluxo de homologação de membership;
- `identity_responsibility_scopes` complementa o papel com escopo, nível de permissão e validade;
- a Escala ainda deve possuir permissões próprias de produto, quando o gate de produção for liberado.

## Estado

A incompatibilidade de papéis registrada na auditoria 150 deve ser considerada **corrigida documentalmente**.

Não houve alteração de produção.

**Conclusão: Core possui catálogo de papéis suficiente para representar a matriz conceitual da Escala sem duplicação de RBAC. O bloqueio continua sendo a ausência de dados operacionais homologados, não a falta de papéis.**

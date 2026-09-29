# 149 — Auditoria do Catálogo de Permissões Core para Escala v1

**Data:** 29/09/2026  
**Status:** 🟢 SEM ESCALA NO CATÁLOGO / 🟠 INTEGRAÇÃO PRESERVADA

## Resultado

O catálogo físico de permissões possui 25 registros distribuídos entre academy, agenda_edi, analytics, backoffice, experience_manager, professor_digital e sgpa.

Não existe nenhum registro com `product_code='escala'`.

As permissões existentes não devem ser reutilizadas como substituto da matriz própria da Escala, pois cada produto possui operações e limites distintos.

## Invariante de autorização

A ausência de `escala` é atualmente correta: inserir permissões antes da homologação de Core/E3 criaria autorização de produto sem recurso operacional homologado.

Também não foi encontrada evidência que permita derivar permissões Escala a partir de:
- papel global;
- papel da Agenda;
- hierarquia;
- `user_profiles.role`;
- metadados Auth.

## Decisão

Não criar permissões Escala nesta etapa.

Quando o gate E3/Core for liberado, a matriz deverá ser materializada explicitamente com operações Escala e vinculada ao Resolver canônico, sem copiar automaticamente as permissões da Agenda.

Nenhuma alteração de produção foi realizada.

**Conclusão: catálogo Core íntegro para o estágio atual; autorização Escala permanece deliberadamente não concedida.**

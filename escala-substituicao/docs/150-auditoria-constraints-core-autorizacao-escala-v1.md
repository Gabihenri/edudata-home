# 150 — Auditoria de Constraints do Core de Autorização para Escala v1

**Data:** 29/09/2026  
**Status:** 🟢 CONSTRAINTS COMPATÍVEIS / 🔴 DADOS OPERACIONAIS AUSENTES

## Resultado

As constraints físicas do Core preservam invariantes importantes para a futura autorização da Escala.

### Organization members
- papel limitado ao catálogo físico atual: professor, coordenador, diretor, administrador;
- status limitado a invited, active, suspended, removed;
- escopo limitado a self, team, area, school, organization, network, platform;
- período de acesso impede término anterior ao início;
- hierarchy_level limitado de 0 a 100.

### Responsibility scopes
- permission_level limitado a view, review, manage, audit;
- scope_type limitado a user, team, area, school, organization, network;
- status limitado a pending, active, suspended, revoked, expired;
- valid_until não pode anteceder valid_from.

## Implicação

Essas constraints são evidência de que o Core já possui mecanismos físicos para restringir estados inválidos. Entretanto, elas não homologam nenhuma pessoa, escola, papel ou scope para a Escala.

A matriz de papéis da Escala deverá ser reconciliada com esses códigos antes de qualquer inserção real. Não se deve assumir que nomes conceituais como vice-principal, supervisor ou regional_manager possam ser inseridos em `organization_members.role` sem verificar a fonte canônica e a arquitetura do Core.

## Decisão

Nenhuma alteração de schema ou dado.

O próximo avanço autorizado é reconciliar a matriz conceitual do Resolver com os códigos físicos existentes, sem inserir dados, e identificar eventuais incompatibilidades que precisem ser resolvidas pelo Core antes da homologação da Escala.

**Conclusão: constraints físicas úteis e preservadas; homologação operacional ainda bloqueada.**

# Auditoria de prontidão física do Authorization Resolver — Escala Inteligente EDI v1

**Data:** 28/09/2026  
**Status:** BLOQUEADO PARA IMPLEMENTAÇÃO FÍSICA  
**Escopo:** somente Core compartilhado e pré-condições do Resolver  
**Regra:** nenhuma alteração de schema foi realizada.

## 1. Resultado

O Core possui a maior parte dos dados necessários ao Resolver, mas **a implementação física da Escala ainda não pode ser criada com segurança**.

A auditoria confirmou:

- `organization_members` existe e contém contexto organizacional/escolar;
- `identity_roles` existe;
- `identity_product_permissions` existe;
- `identity_responsibility_scopes` existe;
- `identity_audit_logs` existe;
- `schools` existe;
- `teacher_profiles` existe.

Porém:

1. não há nenhuma permissão física com `product_code='escala'`;
2. `organization_members` está sem registros;
3. `identity_responsibility_scopes` está sem registros;
4. `teacher_profiles` está sem registros;
5. `teacher_profiles` possui RLS sem policy;
6. `identity_audit_logs` possui RLS sem policy;
7. `schools` possui RLS sem policy;
8. as policies físicas existentes de governança EIOS usam autorização do produto Agenda, não Escala;
9. não existe ainda recurso/tabela produtiva da Escala sobre o qual o Resolver possa validar ownership/assignment.

## 2. Consequência

Não é seguro criar agora uma função produtiva de autorização Escala baseada em dados vazios.

Uma função que retornasse permissões a partir dessas estruturas sem dados homologados poderia produzir:

- falso negativo por ausência de membership;
- falso positivo por fallback indevido;
- autorização baseada em papel sem escopo;
- autorização baseada em escola sem assignment;
- dependência acidental de Agenda;
- impossibilidade de provar RLS com usuários reais.

## 3. Product permission

O catálogo físico atual possui produtos como `agenda_edi`, `academy`, `analytics`, `professor_digital`, `sgpa`, `backoffice` e `experience_manager`.

**Não existe `escala` físico.**

Isso é coerente com o gate atual: não inserir a permissão Escala antes da homologação do Resolver e do modelo de autorização.

## 4. Identidade e escopo

O modelo físico é estruturalmente compatível com o contrato:

`organization_members` fornece membership/contexto;

`identity_roles` fornece o catálogo de papéis;

`identity_product_permissions` fornece autorização por produto/papel;

`identity_responsibility_scopes` fornece escopo institucional e vigência.

Mas os dados operacionais necessários à prova ainda não existem.

## 5. RLS

Estado atual auditado:

| Tabela | RLS | Policies |
|---|---:|---:|
| organization_members | sim | 1 |
| identity_roles | sim | 1 |
| identity_product_permissions | sim | 1 |
| identity_responsibility_scopes | sim | 1 |
| user_profiles | sim | 1 |
| identity_audit_logs | sim | 0 |
| teacher_profiles | sim | 0 |
| schools | sim | 0 |

A ausência de policy em tabelas protegidas é um bloqueio independente da Escala.

Não será corrigida por meio de uma policy genérica apenas para “fazer o teste passar”. Cada policy precisa respeitar o modelo Core e o princípio de least privilege.

## 6. EIOS Governance

As quatro estruturas físicas de governança existem:

- audit events;
- decision records;
- provenance records;
- workflow transitions.

Entretanto, as policies atualmente observadas delegam autorização para funções/padrões de Agenda.

Portanto:

**Governança física EIOS ≠ autorização física Escala.**

A integração correta deve reutilizar o mecanismo central, mas com o contexto Escala resolvido pelo Core.

## 7. Próximo menor passo seguro

Antes de qualquer DDL de tabelas Escala:

1. homologar os dados reais de membership/escopo;
2. homologar a ponte `academic_teacher_identity_links`;
3. definir as permissões Escala no catálogo Core;
4. implementar o Resolver em ambiente controlado;
5. criar harness físico do Resolver contra dados Core reais;
6. somente depois projetar as policies RLS da Escala;
7. integrar governança EIOS;
8. então liberar o modelo produtivo da Escala.

## 8. Decisão

**Authorization Resolver: especificação fechada.**

**Authorization Resolver físico: bloqueado por dados Core/homologação.**

**RLS Escala: bloqueado.**

**DDL Escala: bloqueado.**

O bloqueio atual é deliberado e protege a arquitetura compartilhada contra a criação de um segundo sistema de identidade/autorização.


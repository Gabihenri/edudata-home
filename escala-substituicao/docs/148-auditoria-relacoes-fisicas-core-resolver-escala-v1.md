# 148 — Auditoria de Relações Físicas Core para Resolver Escala v1

**Data:** 29/09/2026  
**Status:** 🟢 RELAÇÕES EXISTENTES PRESERVADAS / 🔴 CONTEXTO OPERACIONAL INSUFICIENTE

## 1. Resultado

A estrutura física confirma apenas uma ponte direta relevante no perfil docente:

`teacher_profiles.school_id → schools.id`.

Não foi encontrada FK direta adicional, nas estruturas auditadas, que ligue `teacher_profiles` a `user_profiles`, `organization_members` ou Auth.

Em `organization_members`, existem FKs para identidade de usuário (`user_id`) e convite, mas a tabela não possui registros operacionais.

## 2. Estado dos dados

- `organization_members`: 0 registros;
- `teacher_profiles`: 0 registros;
- `identity_responsibility_scopes`: 0 registros;
- `schools`: 2 registros;
- `user_profiles`: estrutura ligada a Auth por `user_id`.

A existência de duas escolas não constitui contexto operacional da Escala porque não há membership/teacher profile homologado conectando atores e docentes a elas.

## 3. Consequência para Resolver

O Resolver exige a cadeia:

Auth → user_profile → membership ativa → organização/escola → papel canônico → produto → operação → scope → recurso/atribuição.

A estrutura física suporta partes dessa cadeia, mas os registros necessários para uma decisão real ainda não existem.

O vínculo `teacher_profiles.school_id` também não resolve a identidade Auth ↔ docente.

## 4. Decisão

Não criar FK, bridge ou coluna de identidade por inferência.

Não usar nome, e-mail, função, escola ou proximidade temporal para preencher o vínculo.

Não inserir dados sintéticos no Core produtivo.

**Nenhuma alteração de produção foi realizada.**

## 5. Próximo gate

Homologar dados reais de:
1. membership;
2. teacher profile;
3. organização/escola;
4. scope;
5. identidade acadêmica SED;
6. ponte Auth ↔ docente, caso o Core não forneça relação canônica;
7. somente então executar o Resolver físico contra dados reais.

**Conclusão: a estrutura Core é aproveitável; a evidência operacional ainda não é suficiente para autorizar implementação física da Escala.**

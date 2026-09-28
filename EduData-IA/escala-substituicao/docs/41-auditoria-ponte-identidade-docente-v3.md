# Auditoria da Ponte de Identidade Docente — V3

**Projeto:** EduData IA — Escala Inteligente EDI  
**Escopo:** vínculo entre identidade autenticada, contexto institucional e `teacher_profiles`  
**Status:** 🔴 BLOQUEADO PARA PRODUÇÃO  
**Data da auditoria:** 2026-09-28

## 1. Objetivo

Verificar se o Core físico já possui uma relação canônica que permita resolver, de forma auditável e sem inferência, o vínculo:

`auth.uid() → contexto institucional → teacher_profile_id`

antes de materializar `academic_teacher_identity_links`.

## 2. Evidências físicas verificadas

Foram inspecionadas as estruturas públicas de identidade e as colunas com nomes-chave de relacionamento.

### 2.1 Estruturas existentes

Existem fisicamente:

- `user_profiles`
- `organization_members`
- `teacher_profiles`

`organization_members.user_id` possui chave estrangeira para a identidade de usuário.

`teacher_profiles` possui chave primária própria e chave estrangeira para `schools`, mas não apresenta coluna física `user_id`, `auth_user_id` ou `teacher_profile_id`.

### 2.2 Busca por relação canônica

A inspeção das colunas públicas encontrou `user_id` em `user_profiles`, `organization_members` e diversas estruturas de produtos, mas **não encontrou nenhuma coluna pública `teacher_profile_id` ou `auth_user_id`** que estabeleça uma ponte física com `teacher_profiles`.

Também não foi encontrada chave estrangeira pública ligando diretamente `teacher_profiles` a `user_profiles`, `organization_members` ou à identidade autenticada.

### 2.3 Dados operacionais

Na auditoria anterior, os conjuntos necessários para homologação permanecem sem registros operacionais:

- `teacher_profiles`: 0 registros;
- `organization_members`: 0 registros;
- `identity_responsibility_scopes`: 0 registros.

Portanto, mesmo que uma relação lógica pudesse ser inferida, não existe atualmente base física suficiente para homologar um vínculo real de docente.

## 3. Resultado

### ID-AUD-01 — Relação Auth ↔ teacher_profile

**Severidade:** CRITICAL  
**Resultado:** NÃO HOMOLOGADA

Não há evidência física de relação canônica existente entre a identidade autenticada e `teacher_profiles`.

### ID-AUD-02 — Contexto institucional do docente

**Severidade:** CRITICAL  
**Resultado:** NÃO HOMOLOGADO

`organization_members` é a estrutura adequada para contexto institucional/autorização, porém está sem registros operacionais no estado auditado.

### ID-AUD-03 — Identidade docente operacional

**Severidade:** CRITICAL  
**Resultado:** NÃO HOMOLOGADA

`teacher_profiles` está sem registros. Não é possível provar um `teacher_profile_id` real que possa ser consumido pelo motor.

### ID-AUD-04 — Necessidade da ponte explícita

**Severidade:** HIGH  
**Resultado:** MANTIDA COMO HIPÓTESE DE PROJETO

A entidade `academic_teacher_identity_links` continua sendo a solução explícita prevista para a correspondência Auth ↔ docente caso a homologação de dados reais não revele uma relação canônica já existente.

Sua criação **não está autorizada nesta etapa**.

## 4. Regras de segurança preservadas

Esta auditoria não autoriza:

- matching por nome;
- matching por e-mail;
- matching por CPF;
- matching fuzzy;
- igualdade presumida entre UUIDs;
- uso de `organization_members.role` como identidade docente;
- uso de dados da Agenda como substituto da identidade acadêmica;
- criação de vínculo baseado somente em coincidência temporal;
- criação de DDL de produção para a ponte antes da homologação.

## 5. Dependências para desbloqueio

A ponte somente poderá avançar quando houver:

1. dados reais de `teacher_profiles`;
2. dados reais de `organization_members`;
3. comprovação do contexto `organization_id + school_id`;
4. identificação inequívoca do docente acadêmico;
5. confirmação de que não existe relação canônica adicional no Core;
6. definição do processo de homologação humana;
7. definição da política de RLS da ponte;
8. integração com o Resolver de autorização do Core;
9. harness físico da ponte executado em PostgreSQL;
10. somente depois, avaliação de migration controlada.

## 6. Impacto sobre a Escala

O motor da Escala deve continuar consumindo `teacher_profile_id` como identidade acadêmica canônica.

Enquanto a ponte não estiver homologada:

`auth.uid()` **não pode ser convertido automaticamente** em `teacher_profile_id`.

Consequentemente, permanecem bloqueados:

- execução operacional real do motor;
- autorização real por docente;
- isolamento RLS específico da Escala;
- confirmação real de substituição;
- integração produtiva com a grade oficial.

## 7. Próximo passo seguro

O próximo passo é **homologação de dados reais do Core**, e não criação de tabela.

A sequência permanece:

`Core real → homologação de identidade/contexto → ponte, se necessária → Resolver físico → RLS → modelo operacional → engine`

**Conclusão:** a auditoria reforça o bloqueio existente e elimina, com evidência física adicional, a hipótese de que já exista uma ponte pública simples por `user_id`, `auth_user_id` ou `teacher_profile_id`. Nenhuma alteração de produção foi realizada.

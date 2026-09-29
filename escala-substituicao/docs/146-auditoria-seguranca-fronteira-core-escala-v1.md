# 146 — Auditoria de Segurança de Fronteira do Core para Escala v1

**Data:** 29/09/2026  
**Status:** 🟢 ESCALA SEM ALTERAÇÃO / 🟠 RISCOS CORE FORA DO ESCOPO REGISTRADOS

## 1. Objetivo

Verificar se os achados atuais de segurança do Supabase introduzem risco específico que justifique alterar a implementação da Escala antes da homologação do E3/Core.

## 2. Resultado

O Security Advisor atual mantém:

- 7 tabelas com RLS habilitado sem policy;
- 17 funções SECURITY DEFINER executáveis por usuários autenticados;
- proteção contra senhas vazadas desabilitada.

Entre os objetos observados estão estruturas Core como `teacher_profiles`, `schools` e `identity_audit_logs`, além de funções pertencentes a Agenda, calendário e suporte.

## 3. Interpretação para Escala

Esses achados não constituem autorização para criar ou modificar policies da Escala.

Em particular:
- `teacher_profiles` continua sem policy física e sem dados operacionais;
- a Escala ainda não possui tabelas físicas;
- não existe permissão `product_code='escala'`;
- não existe ponte física homologada Auth ↔ identidade docente;
- as funções SECURITY DEFINER identificadas pertencem a outros contextos e não devem ser reutilizadas como autorização da Escala.

## 4. Decisão

**Nenhuma correção de segurança fora do escopo foi aplicada.**

A correção desses achados deve ser tratada como trilha própria, com auditoria individual de impacto e, quando aplicável, validação contra o modelo de autorização do Core.

Para a Escala, a regra permanece:
**Core homologado → Resolver → RLS específica → Governança → concorrência física → DDL produtivo.**

## 5. Conclusão

Não foi identificada regressão específica da Escala.

Os achados de segurança existentes devem ser preservados como pendências do Core e não usados como justificativa para antecipar a implementação física da Escala.

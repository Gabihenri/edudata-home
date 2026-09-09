# 35 — Auditoria do Harness PostgreSQL do Staging da Grade v1

**Data:** 2026-09-09  
**Status:** 🟡 HARNESS AUDITADO — EXECUÇÃO REMOTA NÃO REALIZADA

## 1. Artefato

`tests/official-grade-staging.postgres.test.sql`

## 2. Cobertura auditada

O harness cobre:

- lote com contexto institucional;
- unicidade por `source_hash` + contexto;
- preservação de `raw_payload`;
- registros `resolved`, `ambiguous`, `unresolved` e `rejected`;
- bloqueio lógico de identidade canônica para estados não resolvidos;
- publicação somente de registro `resolved` + `validated`;
- criação de versão publicada;
- supersession da versão anterior sem apagar histórico;
- retenção da evidência bruta;
- intervalo temporal inválido;
- proibição de `name_only` como método de matching.

## 3. Auditoria estrutural

### STG-HARNESS-01 — isolamento
**Passou por inspeção:** o teste cria schema próprio e termina com `ROLLBACK`.

### STG-HARNESS-02 — idempotência
**Passou por inspeção:** índice UNIQUE contextual sobre hash da fonte simula a barreira de duplicação.

### STG-HARNESS-03 — ambiguidade
**Passou por inspeção:** registros ambíguos não recebem identidade canônica e não entram no conjunto de publicação.

### STG-HARNESS-04 — temporalidade
**Passou por inspeção:** intervalo inválido é protegido por `CHECK` e caso negativo está incluído.

### STG-HARNESS-05 — histórico
**Passou por inspeção:** versão anterior passa a `superseded` sem remoção física.

## 4. Limitação da auditoria

O harness foi revisado estaticamente, mas **não foi executado neste ambiente PostgreSQL**. Portanto, não é correto afirmar que todas as asserções foram executadas com sucesso.

Além disso, o harness é propositalmente sintético. Ele prova regras internas do contrato, mas ainda não prova compatibilidade com o formato real da fonte de grade, nem com RLS/Identity do Supabase de produção.

## 5. Achados

### STG-HARNESS-06 — fonte real
**Critical — ABERTO**

Sem arquivo/API real da fonte oficial, ainda não existe teste de adaptação contra payload verdadeiro.

### STG-HARNESS-07 — autorização
**High — ABERTO**

O harness não modela `identity_responsibility_scopes`, `identity_product_permissions` ou RLS real. Isso será etapa própria antes da migration.

### STG-HARNESS-08 — vínculo docente
**Critical — ABERTO**

O `teacher_canonical_id` é sintético. A prova real depende da homologação do vínculo Auth ↔ `teacher_profiles`.

## 6. Gate

**Contrato:** 🟢 aprovado para próxima etapa de modelagem.  
**Harness:** 🟡 estruturalmente auditado, execução pendente.  
**Fonte oficial:** 🔴 não homologada.  
**Identidade docente:** 🔴 não homologada.  
**RLS:** 🔴 não homologada.  
**DDL produção:** 🔴 BLOQUEADO.

## 7. Próximo avanço

A próxima etapa deve fechar a **identidade docente canônica e sua integração com a importação da grade**, pois essa é agora a principal dependência crítica antes da construção física da grade oficial.

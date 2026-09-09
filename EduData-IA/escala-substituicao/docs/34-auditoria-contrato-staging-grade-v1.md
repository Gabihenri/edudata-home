# 34 — Auditoria do Contrato de Staging da Grade Oficial v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — DDL DE PRODUÇÃO BLOQUEADO

## 1. Escopo

Auditoria do contrato definido em `docs/33-contrato-staging-grade-oficial-v1.md`, verificando preservação da fonte, separação entre staging e produção, matching determinístico, temporalidade, idempotência, governança e capacidade de auditoria.

## 2. Achados

### STG-AUD-01 — preservação da fonte
**Critical — FECHADO**

O contrato exige `raw_payload` imutável e normalização não destrutiva. Isso preserva evidência suficiente para reprodução do processamento.

### STG-AUD-02 — promoção indevida de registros ambíguos
**Critical — FECHADO**

Somente `resolved` homologado pode avançar. `ambiguous`, `unresolved` e `rejected` ficam fora da publicação.

### STG-AUD-03 — identificação docente
**Critical — ABERTO**

A canonização do docente depende do vínculo acadêmico/Auth ainda não homologado. O contrato corretamente não permite nome/e-mail como chave suficiente.

**Ação:** fechar `academic_teacher_identity_links` antes de produção.

### STG-AUD-04 — versionamento da publicação
**High — DEFINIDO**

A publicação cria nova versão; a anterior permanece como `superseded`. Não existe overwrite silencioso.

### STG-AUD-05 — idempotência
**High — DEFINIDO**

`source_hash` + contexto permitem detectar reprocessamento. A política final deve impedir duas publicações semanticamente equivalentes sem identificação explícita.

### STG-AUD-06 — integridade temporal
**High — DEFINIDO**

`start_time < end_time`, vigência e contexto do ano letivo são requisitos pré-publicação.

### STG-AUD-07 — origem oficial ainda desconhecida
**Critical — ABERTO**

O contrato é fonte-agnóstico porque o formato real da fonte oficial ainda não foi homologado. Não é seguro fixar colunas de importação definitivas ou adaptador de produção antes de conhecer o arquivo/API real.

### STG-AUD-08 — autorização
**High — ABERTO**

O staging envolve importação e homologação potencialmente privilegiadas. As permissões `escala.*` e o escopo de responsabilidade precisam ser integrados antes da exposição operacional.

## 3. Auditoria de segurança

Não há autorização implícita para que qualquer usuário da escola importe ou publique uma grade. Importação, matching manual e publicação devem exigir escopo e permissão específicos.

O staging não deve ser disponibilizado diretamente ao frontend como tabela de livre escrita/leitura.

## 4. Auditoria funcional

O contrato cobre o ciclo mínimo:

**receber → interpretar → normalizar → relacionar → homologar → publicar**.

A decisão humana está preservada nos pontos em que a automação não possui evidência determinística.

## 5. Gate

| Item | Estado |
|---|---|
| Preservação raw | 🟢 |
| Matching determinístico | 🟢 |
| Bloqueio de ambiguidade | 🟢 |
| Versionamento | 🟢 |
| Idempotência | 🟡 precisa harness |
| Temporalidade | 🟡 precisa harness |
| Identidade docente | 🔴 bloqueada |
| Fonte oficial real | 🔴 bloqueada |
| Permissões/RLS | 🔴 bloqueada |
| DDL produção | 🔴 bloqueado |

## 6. Próximo passo

Criar o harness PostgreSQL isolado do staging, simulando dois lotes e diferentes estados de matching, incluindo repetição por hash, tentativa de publicação ambígua, publicação homologada, preservação da versão anterior e falhas de integridade temporal.

A execução real deverá ser registrada separadamente da existência do script.

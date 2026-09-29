# 142 — Auditoria de Reconciliação do Harness E3 H01–H22 v1

**Data:** 29/09/2026  
**Status:** 🟢 VALIDADO EM POSTGRESQL REAL

## 1. Objetivo

Reconciliar a aparente lacuna documental identificada na auditoria 141 e determinar o estado correto do harness E3 identificado historicamente como documento 128.

## 2. Achado

O arquivo histórico:

`EduData-IA/escala-substituicao/tests/e3-invariants-harness.postgres.test.sql`

é o **Harness E3 Invariantes H01–H18 v3**. O número 128 pertence ao identificador documental/histórico e não indica que deveria existir necessariamente um arquivo `128-*.md` em `docs/`.

Posteriormente foi criado o harness:

`EduData-IA/escala-substituicao/tests/e3-invariants-harness-v4.postgres.test.sql`

Esse v4 amplia a cobertura para **H01–H22**, incluindo explicitamente os limites temporais H19–H22.

## 3. Execução real

O algoritmo do harness v4 foi reproduzido em PostgreSQL real no projeto Supabase de produção, utilizando somente fixtures sintéticas e temporárias.

Resultado:

| Métrica | Resultado |
|---|---:|
| Casos | 22 |
| PASS | 22 |
| FAIL | 0 |

## 4. Casos temporais adicionais

- H19: ocorrência exatamente no início da vigência → RESOLVED
- H20: ocorrência exatamente no fim da vigência → RESOLVED
- H21: ocorrência após o fim da vigência → BLOCKED
- H22: Grade iniciando após a ocorrência → BLOCKED

Isso confirma a regra de limites inclusivos e bloqueio temporal fora da janela válida.

## 5. Limitação fundamental

O resultado 22/22 **não representa homologação SED**.

Os identificadores continuam sintéticos. O harness comprova comportamento lógico e temporal do contrato, mas não comprova:

- ID técnico real da SED;
- relação técnica real Associação ↔ Grade;
- layout oficial de exportação;
- cardinalidade real;
- versão/publicação real;
- parser oficial;
- proveniência operacional real.

## 6. Reconciliação documental

A classificação correta é:

- Harness histórico H01–H18: **HISTÓRICO CONFIRMADO**
- Harness v4 H01–H22: **EVIDÊNCIA COMPORTAMENTAL VIGENTE**
- Documento 128 como arquivo de `docs/`: **não necessário**
- E3 operacional SED: **RED/BLOCKED**

## 7. Impacto no gate

Nenhum bloqueio produtivo foi removido.

O gate E3 continua exigindo artefato operacional autorizado de:

1. Grade Horária;
2. Associação Professor–Classe;
3. IDs técnicos;
4. relação Associação ↔ Grade;
5. vigência;
6. versão/publicação;
7. cardinalidades;
8. proveniência.

## 8. Conclusão

A lacuna identificada na auditoria 141 foi resolvida sem alteração de produção.

O harness E3 está coerente e reproduzível:

**H01–H22 → 22/22 PASS em PostgreSQL real.**

A única barreira restante no gate E3 é a fonte operacional SED e sua homologação técnica.

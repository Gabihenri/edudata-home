# 134 — Auditoria Staging → Publication E3 v1

**Data:** 29/09/2026  
**Status:** 🟢 CONTRATO DE STAGING VALIDADO EM POSTGRESQL REAL / 🔴 FONTE SED AINDA BLOQUEADA

## Resultado

Foi executada uma prova isolada, sem persistência produtiva, da fronteira entre staging e consumo downstream.

Resultado:

- 1 registro resolved + validated + com três identidades canônicas → publicável;
- 2 registros ambiguous/unresolved → não publicáveis;
- 0 registros não resolvidos carregando identidade canônica;
- 3/3 payloads brutos preservados.

## Invariante reforçada

A camada downstream não deve consumir simplesmente “linhas importadas”.

O caminho correto permanece:

raw → normalized → matching → validation/homologation → published version → downstream.

A existência de um registro em staging não autoriza sua entrada no motor.

## Importante

Esta validação usa referências UUID sintéticas. Não cria nem pressupõe nenhuma chave da SED.

Não houve alteração do banco produtivo.

## Próximo gate

Quando chegar o artefato operacional SED, a mesma fronteira será aplicada ao material real:

1. preservar bruto;
2. calcular hash;
3. registrar origem;
4. mapear campos;
5. homologar identidades;
6. verificar vigência;
7. verificar Associação ↔ Grade;
8. publicar somente registros homologados;
9. alimentar snapshot do motor.

**Decisão:** nenhum parser ou DDL produtivo é liberado por esta validação.

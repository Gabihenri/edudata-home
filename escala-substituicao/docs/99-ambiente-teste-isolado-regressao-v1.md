# Escala de Substituição — Ambiente Isolado de Regressão v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Definir como a bateria sintética deve ser executada sem acesso ou alteração de dados operacionais reais.

## 2. Princípio de isolamento

A regressão deve usar exclusivamente:

- dados fictícios;
- identificadores sintéticos;
- regras versionadas no próprio teste;
- banco/schema temporário ou ambiente explicitamente dedicado;
- nenhuma credencial de produção.

## 3. Proibições

O runner não deve:

- executar contra banco de produção;
- importar dados reais da SED;
- usar CPF/DI reais nos fixtures;
- modificar dados operacionais;
- depender de endpoint externo para decidir PASS/FAIL;
- mascarar falhas SQL.

## 4. Pré-condições

Antes da execução:

1. verificar que `DATABASE_URL` aponta para ambiente de teste autorizado;
2. rejeitar configuração explicitamente marcada como produção;
3. verificar existência dos arquivos de harness;
4. iniciar ambiente limpo quando necessário;
5. registrar versão do commit testado.

## 5. Execução

O runner deve executar a suíte em ordem determinística e capturar:

- arquivo;
- caso;
- saída;
- erro;
- duração;
- status;
- commit/referência testada.

## 6. Resultado

Estados mínimos:

- `PASS` — todos os casos executados e aprovados;
- `FAIL` — pelo menos uma asserção falhou;
- `BLOCKED` — ambiente não atende pré-condições;
- `ERROR` — falha técnica impediu execução confiável.

`BLOCKED` e `ERROR` não devem ser tratados como `PASS`.

## 7. Evidência

Uma execução aprovada deve ser reproduzível a partir do mesmo commit, fixtures e rule-set. O relatório deve permitir identificar exatamente qual caso produziu uma falha.

## 8. CI futuro

A integração contínua poderá executar esta bateria em ambiente efêmero, sem necessidade de qualquer acesso à SED. O pipeline deve bloquear promoção quando a suíte retornar `FAIL`, `BLOCKED` ou `ERROR`.

## 9. Relação com o GATE-FONTE-SED

A suíte pode evoluir e ser executada independentemente da fonte técnica oficial. Um `PASS` da regressão sintética não altera o estado do GATE-FONTE-SED.

## 10. Limites

Este documento não cria infraestrutura, banco, secrets ou pipeline de produção. Define somente o contrato de segurança para futura execução automatizada.
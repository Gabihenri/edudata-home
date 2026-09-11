# Escala de Substituição — Modelo do Ciclo Operacional v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Princípio

A Escala é uma ferramenta de resposta operacional. O valor principal não está apenas em manter uma escala histórica, mas em reduzir o tempo necessário para resolver uma falta inesperada.

## 2. Ciclo

```text
1. OCORREU A FALTA
       ↓
2. IDENTIFICAR OCORRÊNCIA AFETADA
       ↓
3. FORMAR NECESSIDADES DO PERÍODO
       ↓
4. CALCULAR CANDIDATOS
       ↓
5. RESOLVER CONFLITOS GLOBALMENTE
       ↓
6. EXIBIR RECOMENDAÇÃO + EXPLICAÇÃO
       ↓
7. GESTOR CONFIRMA / ALTERA / REJEITA
       ↓
8. REGISTRAR DECISÃO
       ↓
9. ACOMPANHAR RESULTADO
```

## 3. Regra de velocidade

O sistema deve trabalhar com o conceito de **tempo até recomendação**, e não apenas tempo de processamento.

A experiência deve minimizar:

- quantidade de telas;
- digitação repetitiva;
- procura manual de professores;
- comparação mental de conflitos;
- necessidade de reconstruir a grade do período.

## 4. Operação em lote

Se várias faltas ocorrerem no mesmo período, o gestor deve poder tratá-las como um único problema operacional.

A unidade de decisão é o **conjunto de ocorrências simultaneamente descobertas**, respeitando as regras de escopo e autorização.

## 5. Exceções

A operação deve possuir caminhos explícitos para:

- nenhum candidato;
- cobertura parcial;
- empate;
- conflito;
- indisponibilidade de fonte;
- informação insuficiente;
- intervenção manual.

A exceção não deve gerar atribuição silenciosa.

## 6. Modo contingência

Se a fonte necessária estiver indisponível ou desatualizada, a interface deve informar claramente o estado da informação e evitar apresentar dados antigos como atuais.

Não criar fallback que substitua silenciosamente a fonte oficial.

## 7. Auditoria

Cada ciclo deve preservar, conforme o contrato futuro:

- momento da ocorrência;
- snapshot usado;
- plano recomendado;
- decisão humana;
- alteração realizada;
- estado final;
- eventuais falhas.

## 8. Métricas

O ciclo deve alimentar as métricas do Audit 89, principalmente:

- tempo até recomendação;
- cobertura;
- uncovered;
- overrides;
- conflitos evitados;
- falhas críticas.

## 9. Limites

O modelo não autoriza integração com SED, atribuição automática ou criação de schema físico. Regras dependentes da fonte oficial permanecem condicionadas ao GATE-FONTE-SED.
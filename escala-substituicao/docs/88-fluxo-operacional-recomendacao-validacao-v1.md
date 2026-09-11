# Escala de Substituição — Fluxo Operacional de Recomendação e Validação v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## Fluxo

```text
OCORRÊNCIA DESCOBERTA
        ↓
CANDIDATOS ELEGÍVEIS
        ↓
CONFLITOS / RESTRIÇÕES
        ↓
PLANO GLOBAL
        ↓
RECOMENDAÇÃO EXPLICADA
        ↓
[ CONFIRMAR ] [ ALTERAR ] [ REJEITAR ]
        ↓
DECISÃO HUMANA REGISTRADA
        ↓
INDICAÇÃO OPERACIONAL
```

## Regra central

A tela operacional deve privilegiar velocidade sem esconder a justificativa. A pessoa responsável deve conseguir identificar rapidamente a melhor recomendação, entender os principais motivos e agir conscientemente.

## Ações

### Confirmar
Preserva o plano calculado e registra a confirmação do usuário autorizado.

### Alterar
Permite escolher alternativa admissível ou realizar decisão manual autorizada. O plano algorítmico original permanece preservado.

### Rejeitar
Retira a recomendação sem fabricar uma substituição. A ocorrência permanece pendente/uncovered conforme o estado operacional aplicável.

## Segurança

Nenhuma ação de interface deve contornar restrições duras. Uma alteração manual não torna um candidato inelegível em elegível; caso uma intervenção administrativa excepcional seja permitida pela regra oficial futura, ela deverá ser explicitamente registrada como override e validada conforme o contrato homologado.

## Velocidade operacional

A primeira visão deve mostrar somente:

- ocorrência;
- horário;
- turma/componente em representação autorizada;
- candidato recomendado;
- score/resumo;
- motivo principal;
- estado.

Detalhes como alternativas, conflitos e candidatos rejeitados ficam disponíveis em expansão.

## Limites

O fluxo é conceitual e não define endpoint, banco, IDs ou regra técnica da SED. A integração real permanece bloqueada pelo GATE-FONTE-SED.
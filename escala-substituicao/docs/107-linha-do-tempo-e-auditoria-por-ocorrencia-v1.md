# Linha do tempo e auditoria por ocorrência — v1

**Projeto:** Escala de Substituição  
**Status:** OPERACIONAL / PRONTO PARA IMPLEMENTAÇÃO NO MVP  
**Data:** 2026-09-11  
**Gate SED:** RED / BLOCKED

## 1. Objetivo

Transformar o histórico de rodadas em uma linha do tempo operacional centrada na ocorrência. O histórico global continua preservado, mas cada aula que precisa de cobertura passa a possuir uma trilha própria de decisão.

A pergunta da trilha é:

> O que foi recomendado para esta ocorrência, o que mudou, por quê e qual foi a decisão humana final?

A linha do tempo é de **auditoria e explicabilidade**. Ela não executa atribuição oficial.

## 2. Princípio de preservação

Nenhuma nova rodada deve apagar ou sobrescrever uma decisão anterior.

Para cada ocorrência devem permanecer distinguíveis:

1. estado inicial da ocorrência;
2. recomendação algorítmica da rodada;
3. alteração material que tornou a rodada anterior desatualizada;
4. nova recomendação após recálculo;
5. eventual escolha humana;
6. estado de validação.

A recomendação original continua disponível mesmo quando uma escolha humana a substitui.

## 3. Evento mínimo da linha do tempo

Cada evento deve possuir, no mínimo:

| Campo | Significado |
|---|---|
| `occurrence_id` | Identificador da ocorrência |
| `round_version` | Rodada em que o evento ocorreu |
| `snapshot_version` | Snapshot utilizado |
| `event_type` | Tipo de evento de auditoria |
| `previous_teacher` | Professor indicado anteriormente, quando aplicável |
| `new_teacher` | Novo professor indicado, quando aplicável |
| `coverage_before` | Situação de cobertura antes do evento |
| `coverage_after` | Situação de cobertura depois do evento |
| `reason` | Justificativa observável |
| `decision_source` | `ALGORITHM` ou `HUMAN` |
| `validation_state` | Estado de validação naquele momento |
| `algorithm_version` | Versão do algoritmo |
| `timestamp` | Momento do evento |

## 4. Tipos de evento

Os eventos iniciais são:

- `ROUND_RECOMMENDED` — a ocorrência recebeu recomendação algorítmica;
- `MATERIAL_CHANGE` — mudança material invalidou a recomendação vigente;
- `ROUND_RECALCULATED` — nova rodada calculou a ocorrência novamente;
- `HUMAN_OVERRIDE` — responsável escolheu outro candidato;
- `VALIDATION_REQUIRED` — resultado está aguardando validação humana;
- `VALIDATED` — validação humana registrada;
- `UNCOVERED` — nenhuma cobertura elegível foi encontrada;
- `OFFICIAL_PENDING` — aguardando eventual integração/registro oficial;
- `OFFICIAL_CONFIRMED` — reservado exclusivamente para confirmação oficial comprovada.

`OFFICIAL_CONFIRMED` nunca pode ser produzido pelo protótipo sintético.

## 5. Leitura da linha do tempo

Para uma ocorrência `O1`, uma trilha poderá ser apresentada conceitualmente assim:

```text
Rodada 1 · Snapshot 1
└─ ALGORITHM → Prof. João · RECOMMENDED · score 96

Mudança material
└─ Prof. João ficou indisponível no horário

Rodada 2 · Snapshot 2
└─ ALGORITHM → Prof. Maria · RECOMMENDED · score 89

Decisão humana
└─ HUMAN → Prof. Carlos · HUMAN_OVERRIDDEN

Estado atual
└─ HUMAN_VALIDATION_REQUIRED
```

A representação acima é ilustrativa; nomes, scores e eventos reais devem sempre ser derivados do estado efetivamente registrado.

## 6. Regras de reconstrução

A linha do tempo deve ser reconstruível exclusivamente a partir de eventos persistidos. Não depender de um único campo mutável como `currentPlan`.

Para uma ocorrência:

```text
timeline(O) = eventos persistidos ordenados por timestamp + round_version
```

Quando houver empate temporal, utilizar `round_version` e uma ordem determinística de evento.

A linha do tempo deve permitir recuperar:

- primeira recomendação;
- última recomendação algorítmica válida;
- última escolha humana;
- cobertura em cada rodada;
- score da recomendação em cada rodada;
- motivo de cada mudança;
- snapshot que sustentou cada decisão;
- estado de validação.

## 7. Comparação antes/depois

Para cada nova rodada, calcular por ocorrência:

```text
teacher_before
teacher_after
coverage_before
coverage_after
score_before
score_after
state_before
state_after
```

Classificações mínimas:

- `UNCHANGED` — mesma alocação e mesmo estado relevante;
- `TEACHER_CHANGED` — professor indicado mudou;
- `COVERAGE_GAINED` — passou de sem cobertura para coberta;
- `COVERAGE_LOST` — passou de coberta para sem cobertura;
- `SCORE_CHANGED` — professor permaneceu, mas score/avaliação mudou;
- `HUMAN_OVERRIDDEN` — escolha humana substituiu a recomendação;
- `RECALC_REQUIRED` — resultado anterior não pode mais ser confirmado por mudança material.

Uma ocorrência pode possuir mais de uma classificação na mesma transição.

## 8. Relação com o histórico global

O histórico global responde:

> Como a escala inteira mudou entre rodadas?

A linha do tempo por ocorrência responde:

> Como esta aula mudou entre rodadas?

Os dois níveis são complementares:

```text
HISTÓRICO DA ESCALA
        │
        ├── Rodada 1
        │     ├── O1
        │     ├── O2
        │     └── O3
        │
        ├── Rodada 2
        │     ├── O1
        │     ├── O2
        │     └── O3
        │
        └── Rodada 3
              ├── O1
              ├── O2
              └── O3
```

A navegação futura deve permitir selecionar uma ocorrência no quadro operacional e abrir sua trilha sem abandonar a visão global.

## 9. Impacto de uma decisão humana

Quando o responsável escolhe `P2` enquanto o algoritmo havia indicado `P1`:

```text
ALGORITHM
P1 · score original · rodada N
        ↓
HUMAN OVERRIDE
P2 · decisão humana · rodada N+1
        ↓
RECALCULA RESTANTE
        ↓
NOVO PLANO GLOBAL
```

Devem permanecer registrados:

- `P1` como recomendação original;
- score original de `P1`;
- `P2` como decisão humana;
- motivo da escolha, quando informado;
- impacto nas demais ocorrências;
- nova alocação global resultante.

A escolha humana não altera retroativamente a recomendação algorítmica.

## 10. Impacto de mudança material

Se o estado operacional mudar depois do cálculo:

```text
RODADA VÁLIDA
     ↓
MUDANÇA MATERIAL
     ↓
MATERIALLY_CHANGED
     ↓
VALIDAÇÃO BLOQUEADA
     ↓
NOVO SNAPSHOT
     ↓
NOVO CÁLCULO
```

O evento `MATERIAL_CHANGE` deve identificar o motivo observado, por exemplo:

- disponibilidade alterada;
- ausência alterada;
- elegibilidade alterada;
- conflito temporal criado/removido;
- associação ou validade alterada;
- escopo alterado;
- regra homologada alterada.

Não registrar uma causa que não tenha sido efetivamente observada.

## 11. Segurança contra falsa auditoria

A interface não deve sugerir que um registro sintético seja registro oficial.

Enquanto `GATE-FONTE-SED = RED / BLOCKED`:

- não exibir selo de atribuição oficial;
- não afirmar sincronização com SED;
- não criar identificadores oficiais inferidos;
- não promover recomendação a `OFFICIAL_CONFIRMED`;
- manter a origem sintética explicitamente visível.

## 12. Critérios de aceite para futura implementação no MVP

A implementação da linha do tempo será considerada adequada quando:

1. cada ocorrência puder ser selecionada individualmente;
2. sua primeira recomendação puder ser recuperada;
3. cada recálculo aparecer em ordem cronológica;
4. mudanças materiais aparecerem como eventos próprios;
5. cobertura antes/depois puder ser comparada;
6. professor antes/depois puder ser comparado;
7. score anterior e atual forem preservados quando existirem;
8. uma escolha humana aparecer separada da recomendação algorítmica;
9. a recomendação original não puder ser apagada pelo override;
10. o snapshot de cada rodada puder ser identificado;
11. a validação permanecer bloqueada após mudança material até novo cálculo;
12. o histórico global continuar funcionando independentemente da trilha individual;
13. nenhum dado oficial SED for inventado para preencher lacunas.

## 13. Próximo passo de implementação

O próximo avanço no MVP deve ser a inclusão de um painel **“Linha do tempo da ocorrência”**, alimentado pelo `history` já existente, sem alterar o motor global de alocação.

A implementação deve:

- reutilizar `history`, `originalPlan`, `currentPlan` e `humanChoices`;
- derivar eventos por `occurrence.id`;
- mostrar rodada, snapshot, professor, score, estado e motivo;
- destacar mudanças entre rodadas;
- preservar a distinção algoritmo × humano;
- permanecer 100% sintética até o GATE-FONTE-SED ser fechado.

## 14. Estado do gate

**GATE-FONTE-SED: RED / BLOCKED**

Este documento não autoriza integração com SED. A aquisição e homologação do artefato técnico oficial continuam sendo pré-requisito para qualquer parser, DDL ou integração operacional.

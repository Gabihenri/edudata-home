# 137 — Protocolo de Decisão e Homologação E3 v1

**Data:** 29/09/2026  
**Status:** 🟢 protocolo fechado; aplicação depende do artefato SED real  
**Gate:** não autoriza DDL/parser produtivo

## 1. Finalidade

Complementar a ficha de homologação do primeiro artefato E3 com uma regra objetiva de decisão, evitando que observações parciais sejam tratadas como contrato técnico.

## 2. Estados de decisão

### ACCEPTED
O elemento possui identidade, chave, semântica, relação, temporalidade e proveniência suficientemente comprovadas para uso no estágio correspondente.

### ACCEPTED_WITH_LIMITATION
O elemento é utilizável em staging/harness, mas possui limitação explicitamente registrada que impede sua promoção a produção.

### REVIEW_REQUIRED
Existem evidências conflitantes ou múltiplas interpretações plausíveis.

### BLOCKED
Falta evidência crítica ou existe incompatibilidade que impede uso operacional.

### REJECTED
O elemento foi demonstrado como inadequado para o contrato pretendido.

## 3. Regra de promoção

Um elemento somente pode avançar de observação para contrato quando houver:

1. campo/identificador real observado;
2. semântica comprovada;
3. chave ou mecanismo de identificação comprovado;
4. relacionamento comprovado;
5. vigência comprovada, quando temporal;
6. proveniência preservada;
7. regra de publicação/atualização comprovada, quando aplicável.

Ausência de qualquer requisito crítico impede promoção daquele elemento.

## 4. Matriz de decisão

| Área | Evidência mínima | Sem evidência | Com conflito |
|---|---|---|---|
| Docente | identificador técnico + contexto | BLOCKED | REVIEW_REQUIRED |
| Classe | identificador técnico + escola | BLOCKED | REVIEW_REQUIRED |
| Componente | código/ID + semântica | BLOCKED | REVIEW_REQUIRED |
| Associação | chave + docente/classe/componente | BLOCKED | REVIEW_REQUIRED |
| Grade | chave + horário + contexto | BLOCKED | REVIEW_REQUIRED |
| Associação ↔ Grade | relação formal comprovada | BLOCKED | REVIEW_REQUIRED |
| Vigência | início/fim ou regra equivalente | BLOCKED | REVIEW_REQUIRED |
| Versão | versão/publicação ou mecanismo comprovado | BLOCKED | REVIEW_REQUIRED |
| Proveniência | origem + artefato + linha/registro | BLOCKED | REVIEW_REQUIRED |
| Atualização | regra observável/autorizada | BLOCKED | REVIEW_REQUIRED |

## 5. Regra para ocorrência

Uma ocorrência somente pode ser considerada operacionalmente resolvida quando:

- identidade acadêmica estiver homologada;
- associação estiver homologada;
- Grade estiver homologada;
- relação Associação ↔ Grade estiver homologada;
- calendário/contexto estiver válido;
- ocorrência estiver dentro das vigências relevantes;
- versão consumida estiver publicada;
- proveniência estiver completa;
- nenhuma ambiguidade crítica permanecer.

Caso contrário:

`RESOLVED` não pode ser produzido.

Os estados permitidos são `AMBIGUOUS`, `UNRESOLVED`, `BLOCKED` ou `SOURCE_UNCERTAIN`, conforme a causa.

## 6. Regra para primeira carga real

A primeira carga deve gerar três produtos distintos:

### A. Evidência bruta
Arquivo original, hash e metadados.

### B. Mapa de homologação
Campo observado → conceito E3 → estado → evidência → regra.

### C. Fixture sanitizada
Somente após preservação e análise, com dados minimizados e sem alterar a semântica técnica necessária aos testes.

A fixture não substitui o arquivo original.

## 7. Critérios de saída do Gate E3

O gate somente poderá passar de RED para GREEN quando todos os seguintes estiverem comprovados:

- artefato operacional atual;
- origem autorizada;
- identidade acadêmica;
- IDs técnicos;
- Associação Professor–Classe;
- Grade Horária;
- relação Associação ↔ Grade;
- classe/subgrupo, quando aplicável;
- componente;
- vigência;
- versionamento/publicação;
- cardinalidades reais;
- atualização/alteração de Grade;
- proveniência;
- fixture real sanitizada;
- harness E3 executado com dados derivados da fonte;
- divergências resolvidas ou formalmente delimitadas.

## 8. Regra de segurança

Nenhum resultado de homologação pode ser convertido diretamente em DDL.

Sequência obrigatória:

`E3 → homologação → contrato técnico → modelo físico → harness físico → revisão → DDL controlado`

## 9. Resultado atual

No estado de 29/09/2026:

**GATE E3 = RED/BLOCKED**

Motivo: ainda não há artefato operacional SED autorizado contendo as evidências técnicas necessárias.

O protocolo está pronto para execução assim que a fonte real for fornecida.

## 10. Decisão

Este protocolo é documental e não altera banco, RLS, RPC, parser ou modelo físico.

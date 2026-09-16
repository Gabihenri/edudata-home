# 114 — Ficha de Homologação do Primeiro Artefato E3 v1

**Status:** PREPARADA / AGUARDANDO ARTEFATO E3  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 16/09/2026

## 1. Objetivo

Registrar de forma auditável a primeira análise técnica de um artefato operacional atual da SED destinado à Escala de Substituição.

Esta ficha não presume nomes de campos, IDs, chaves, endpoints ou relações físicas. Todos os elementos técnicos devem ser preenchidos somente a partir do artefato recebido e de evidência de autoridade correspondente.

## 2. Artefato recebido

| Campo | Valor | Evidência |
|---|---|---|
| Tipo | PENDENTE | — |
| Nome original | PENDENTE | — |
| Formato | PENDENTE | — |
| Escola | PENDENTE | — |
| Ano letivo | PENDENTE | — |
| Período de referência | PENDENTE | — |
| Sistema/módulo de origem | PENDENTE | — |
| Data/hora de obtenção | PENDENTE | — |
| Perfil/contexto de acesso | PENDENTE | — |
| Versão declarada | PENDENTE | — |
| Hash do bruto | PENDENTE | — |

## 3. Integridade e preservação

Antes de qualquer transformação:

1. preservar o arquivo original sem alteração;
2. registrar nome, tamanho e formato;
3. calcular hash quando tecnicamente possível;
4. registrar data/hora de aquisição;
5. registrar origem e contexto de acesso;
6. trabalhar sobre uma cópia para análise;
7. nunca substituir o bruto pela versão sanitizada.

## 4. Classificação dos campos

Cada campo crítico deverá receber exatamente um estado:

- `HOMOLOGATED` — sustentado por evidência E3 suficiente;
- `OBSERVED_ONLY` — observado, mas sem evidência suficiente para contrato físico;
- `AMBIGUOUS` — há mais de uma interpretação plausível;
- `REJECTED` — não pode ser usado para integração.

### Matriz de identidade

| Conceito | Campo técnico observado | Estado | Evidência | Observação |
|---|---|---|---|---|
| Professor | PENDENTE | PENDENTE | PENDENTE | Não inferir por nome/CPF/e-mail |
| Turma/classe | PENDENTE | PENDENTE | PENDENTE | Não inferir por descrição |
| Subturma, se houver | PENDENTE | PENDENTE | PENDENTE | Cardinalidade a verificar |
| Componente curricular | PENDENTE | PENDENTE | PENDENTE | Não substituir código por descrição |
| Associação | PENDENTE | PENDENTE | PENDENTE | Chave somente se comprovada |
| Grade/horário | PENDENTE | PENDENTE | PENDENTE | Relação deve ser demonstrada |
| Ocorrência, se existir na fonte | PENDENTE | PENDENTE | PENDENTE | Não confundir com aula derivada |

## 5. Temporalidade

Verificar no artefato e na documentação correspondente:

- data de referência;
- início da vigência;
- fim da vigência;
- versão da grade;
- versão da associação, quando existente;
- data/hora de extração;
- regra de publicação;
- comportamento após alteração;
- relação entre registros antigos e novos.

Se a vigência não puder ser determinada, a relação deve permanecer `AMBIGUOUS`, `SOURCE_UNCERTAIN` ou `BLOCKED`, conforme o contrato aplicável.

## 6. Relacionamentos

A análise deve responder empiricamente:

```text
Professor
   ↕
Associação
   ↕
Classe/Subturma
   ↕
Componente
   ↕
Horário
   ↕
Grade
```

Não criar relacionamento somente porque dois campos possuem valores semelhantes.

Registrar para cada relacionamento:

| Relação | Evidência observada | Cardinalidade | Chave comprovada? | Estado |
|---|---|---|---|---|
| Professor ↔ Associação | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| Associação ↔ Classe | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| Associação ↔ Componente | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| Associação ↔ Horário | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| Horário ↔ Grade | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| Grade ↔ Ocorrência | PENDENTE | PENDENTE | PENDENTE | PENDENTE |

## 7. Multiplicidade e R15/R16

Testar explicitamente:

- mais de um horário para uma associação;
- mais de uma aula do mesmo componente na mesma data;
- múltiplos professores associados;
- associações em substituição;
- ocorrências simultâneas;
- registros que parecem equivalentes mas possuem referências temporais distintas.

Regra: não colapsar registros sem evidência de equivalência.

R15 deve confirmar que ocorrências distintas permanecem distintas.

R16 deve confirmar que múltiplos professores associados permanecem contexto e não são convertidos automaticamente em responsabilidade efetiva.

## 8. Proveniência

Registrar:

```text
fonte
→ artefato
→ lote
→ linha/registro
→ transformação
→ matching
→ validação
→ versão
→ ocorrência
```

Cada transformação deve ser rastreável ao material original.

## 9. Critério de promoção E3

O artefato somente poderá sustentar contrato técnico produtivo se houver evidência suficiente para:

- identidade do professor;
- identidade da turma/subturma;
- identidade do componente;
- identificação da Associação;
- identificação da Grade/horário;
- relacionamento entre as entidades;
- vigência;
- versionamento ou mecanismo equivalente comprovado;
- publicação/autoridade;
- proveniência;
- mecanismo autorizado de atualização.

A ausência de qualquer item crítico mantém o gate bloqueado para o respectivo elemento.

## 10. Resultado da primeira homologação

```text
ARTEFATO E3: PENDENTE
IDENTIDADE DOCENTE: PENDENTE
IDENTIDADE ACADÊMICA: PENDENTE
ASSOCIAÇÃO: PENDENTE
GRADE: PENDENTE
CHAVES: PENDENTE
VIGÊNCIA: PENDENTE
VERSIONAMENTO: PENDENTE
PROVENIÊNCIA: PENDENTE
ATUALIZAÇÃO: PENDENTE
R01–R16: AGUARDANDO RECONCILIAÇÃO
GATE-FONTE-SED: RED/BLOCKED
```

## 11. Proibições permanentes

Enquanto qualquer elemento crítico estiver pendente ou ambíguo:

- não criar parser produtivo;
- não criar endpoint produtivo;
- não criar FK física para entidade SED não homologada;
- não criar DDL produtivo baseado em hipótese;
- não substituir ID oficial por nome, CPF, DI, e-mail ou posição de coluna;
- não usar dados históricos como substituto da fonte operacional atual;
- não promover Agenda Inteligente EDI a Grade oficial;
- não automatizar atribuição oficial.

## 12. Próxima sequência após preenchimento

```text
E3 recebido
  ↓
preservação + hash
  ↓
ficha preenchida
  ↓
classificação de campos
  ↓
homologação de identidade
  ↓
homologação de chaves
  ↓
validação temporal
  ↓
fixture sanitizada
  ↓
reconciliação
  ↓
R01–R16
  ↓
auditoria
  ↓
especificação física
```

Este documento é preparatório e não altera o modelo físico do produto.

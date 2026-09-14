# 109 — Modelo de Homologação Staging do Adapter SED v1

**Data:** 2026-09-14  
**Status:** modelo lógico de homologação — sintético, sem produção  
**Gate:** `GATE-FONTE-SED = RED/BLOCKED`

## 1. Objetivo

Definir a sequência mínima de homologação entre o contrato do Adapter SED e o staging, sem presumir campos, chaves ou identificadores técnicos que ainda não foram fornecidos por um artefato operacional real.

Este documento não define DDL de produção e não transforma dados públicos auxiliares em grade oficial.

## 2. Fronteira de confiança

```text
artefato original
      ↓
SOURCE / BATCH
      ↓
RAW ROW — imutável
      ↓
normalização não destrutiva
      ↓
matching institucional
      ↓
validação estrutural + temporal
      ↓
versão candidata
      ↓
publicação explícita
      ↓
snapshot do motor
```

Nenhum registro pode saltar diretamente de `RAW ROW` para o motor.

## 3. Estados de matching

Cada entidade relevante deve possuir estado independente:

- `resolved` — identidade institucional comprovada;
- `ambiguous` — mais de uma correspondência possível;
- `unresolved` — correspondência não encontrada.

Precedência:

```text
unresolved > ambiguous > resolved
```

`ambiguous` e `unresolved` não são promovidos para publicação.

## 4. Camadas lógicas

### SOURCE

Representa a origem declarada e sua autoridade. Deve preservar módulo/operação, contexto de aquisição, versão quando disponível e evidência de origem.

### BATCH

Representa uma extração/importação específica. Deve permitir identificar organização, escola, período acadêmico, hash e estado de processamento.

### RAW ROW

Mantém a evidência original sem destruição. O payload bruto nunca é substituído pelo normalizado.

### MATCHING

Registra como docente, turma e componente foram relacionados às entidades canônicas. Matching textual/fuzzy não pode produzir publicação automática.

### VERSION

Representa uma versão candidata ou publicada da grade. Nova fonte corrigida cria nova versão; não reescreve a anterior.

### OCCURRENCE

Representa a aula/ocorrência derivada de uma versão validada, com data/recorrência, intervalo temporal e referências institucionais homologadas.

## 5. Regras de promoção

Um registro somente pode avançar quando:

1. fonte é reconhecida;
2. organização/escola são compatíveis;
3. período acadêmico é compatível;
4. docente, turma e componente necessários estão resolvidos;
5. horário é válido;
6. vigência é coerente;
7. não existe conflito/duplicidade incompatível;
8. versão e hash são identificáveis quando exigidos pelo contrato;
9. proveniência permanece recuperável.

A sequência é:

`received → normalized → resolved → validated → published`

Qualquer falha relevante interrompe a promoção.

## 6. Idempotência

Uma repetição do mesmo pacote deve ser reconhecida pela identidade da origem e do conteúdo, sem apagar histórico.

O hash da fonte é evidência de conteúdo; não substitui um identificador oficial de registro quando a fonte fornecer um.

## 7. Versionamento

Uma fonte corrigida ou uma alteração institucional relevante produz nova versão candidata.

```text
V1 published
     ↓ alteração
V2 candidate
     ↓ validação
V2 published
     ↓
V1 permanece histórica
```

Uma nova versão não modifica retroativamente uma rodada de substituição já registrada.

## 8. Validação temporal

Para intervalos:

```text
A.start < B.end AND B.start < A.end
```

define sobreposição.

Intervalos que apenas encostam não são considerados sobrepostos.

Toda ocorrência deve satisfazer:

`end_time > start_time`

A validade da ocorrência também deve ser compatível com a vigência da versão publicada.

## 9. Proveniência mínima

A cadeia auditável deve permitir reconstruir:

```text
source
 → batch
 → raw row
 → normalized row
 → matching
 → version
 → occurrence
 → engine snapshot/run
 → candidate
 → decision
```

A implementação física dessa cadeia depende da arquitetura EIOS/Core homologada e não deve ser inventada neste estágio.

## 10. RLS e segurança

O staging deve ser separado do consumo operacional comum.

A futura implementação deverá garantir least privilege, acesso administrativo auditado e proteção do payload bruto. Nenhuma política de RLS deve ser relaxada para viabilizar testes.

## 11. Matriz de homologação

| Área | Evidência necessária | Resultado possível |
|---|---|---|
| Fonte | origem reconhecida | aprovado/bloqueado |
| Organização | identidade institucional | resolvido/bloqueado |
| Escola | identificador oficial | resolvido/bloqueado |
| Docente | identificador institucional | resolvido/ambíguo/não resolvido |
| Turma | identificador institucional | resolvido/ambíguo/não resolvido |
| Componente | identificador institucional | resolvido/ambíguo/não resolvido |
| Horário | início/fim válidos | aprovado/bloqueado |
| Vigência | período coerente | aprovado/bloqueado |
| Duplicidade | conteúdo/origem compatíveis | idempotente/revisão/bloqueado |
| Versão | hash/publicação identificável | candidata/publicada/bloqueada |
| Proveniência | cadeia recuperável | aprovado/pendente |

## 12. Relação com SED-ADP-01..18

Os casos do contrato do Adapter permanecem a referência de comportamento. O modelo de staging deve permitir representá-los sem transformar um fixture sintético em evidência institucional.

Casos de RLS, Auth, proveniência EIOS e constraints físicas dependentes do Core permanecem condicionados ao ambiente homologado correspondente.

## 13. Critério para receber o primeiro artefato real

Um pequeno recorte atual e autorizado é suficiente para iniciar a homologação. O procedimento será:

1. preservar o original;
2. registrar proveniência e hash;
3. comparar com o dicionário/layout recebido;
4. classificar cada campo como `HOMOLOGATED`, `OBSERVED_ONLY`, `AMBIGUOUS` ou `REJECTED`;
5. homologar identificadores e validade;
6. gerar fixture sanitizado;
7. executar reconciliação temporal;
8. executar R01–R14;
9. somente depois definir o DDL físico necessário.

## 14. Gate

**Arquitetura lógica:** 🟢 definida.  
**Contrato do Adapter:** 🟢 definido.  
**Fixtures sintéticos:** 🟢 disponíveis.  
**Homologação PostgreSQL:** 🟡 preparada conceitualmente.  
**Artefato operacional SED 2026:** 🔴 ausente.  
**DDL de produção:** 🔴 bloqueado.

## 15. Regra permanente

> Nenhum campo, chave, relacionamento ou identificador da SED será inferido para produção a partir de nome, CPF, DI, posição de coluna, tutorial, screenshot ou dataset histórico.

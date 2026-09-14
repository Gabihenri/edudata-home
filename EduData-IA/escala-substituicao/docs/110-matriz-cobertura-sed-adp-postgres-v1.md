# 110 — Matriz de Cobertura SED-ADP × Staging PostgreSQL v1

**Data:** 2026-09-14  
**Status:** auditoria estática de cobertura — sintético, sem produção  
**Gate:** `GATE-FONTE-SED = RED/BLOCKED`

## 1. Objetivo

Registrar, de forma rastreável, quais casos `SED-ADP-01..18` já possuem representação no contrato TypeScript e/ou no harness PostgreSQL sintético, e quais permanecem dependentes de Core, EIOS, RLS, proveniência ou artefato operacional real.

Esta matriz **não transforma ausência de teste em autorização de implementação** e não cria campos técnicos da SED por inferência.

## 2. Referências auditadas

- Contrato do Adapter SED: `docs/46-contrato-adaptador-seduc-v1.md`.
- Auditoria do contrato: `docs/47-auditoria-adaptador-seduc-v1.md`.
- Modelo lógico de homologação: `docs/109-modelo-homologacao-staging-adapter-v1.md`.
- Contrato TypeScript: `tests/adapter-staging-grade.contract.test.ts`.
- Harness PostgreSQL: `tests/adapter-staging-grade.postgres.test.sql`.

O contrato define os 18 comportamentos mínimos do adaptador. O modelo de staging mantém explicitamente a separação entre fonte, lote, linha bruta, matching, versão e ocorrência.

## 3. Legenda

- **🟢 Coberto sinteticamente:** existe asserção executável ou representação direta no harness atual.
- **🟡 Parcial:** existe estrutura relacionada, mas falta uma asserção específica ou a regra depende de camada ainda não materializada.
- **🔴 Bloqueado:** depende de evidência/infraestrutura que não pode ser criada legitimamente nesta fase.
- **⚪ Fora do escopo físico atual:** comportamento deliberadamente reservado para Core/EIOS/RLS/Fonte.

Importante: 🟢 significa **cobertura do contrato sintético**, não homologação da SED.

## 4. Matriz principal

| ID | Comportamento contratual | Camada responsável | TS | PostgreSQL | Estado | Próxima evidência/teste permitido |
|---|---|---|---|---|---|---|
| ADP-01 | pacote válido → resolved | Staging + matching | 🟢 | 🟢 | 🟢 | manter sintético; validar depois com artefato real |
| ADP-02 | pacote repetido → idempotente | Batch/import | 🟢 | 🟢 | 🟢 | comprovar identidade da fonte real |
| ADP-03 | escola inexistente → bloqueado | Core + staging | 🟡 | 🟢 FK | 🟢 sintético | validar contra escola institucional real |
| ADP-04 | docente sem ID → unresolved | Matching | 🟢 conceito | 🟡 | 🟡 | adicionar somente regra comportamental, sem inventar ID SED |
| ADP-05 | turma sem ID → unresolved | Matching | 🟢 conceito | 🟡 | 🟡 | idem |
| ADP-06 | componente sem ID → unresolved | Matching | 🟢 conceito | 🟡 | 🟡 | idem |
| ADP-07 | nome/fuzzy nunca promove | Matching | 🟢 guarda comportamental | ⚪ | 🟢 sintético | manter bloqueio; homologar somente com regra real de matching |
| ADP-08 | horário inválido → rejeitado | Staging | 🟢 | 🟢 | 🟢 | manter regra `end > start` |
| ADP-09 | versão nova preserva anterior | Versionamento | 🟡 | 🟢 | 🟢 sintético | validar semântica de publicação com fonte real |
| ADP-10 | duplicidade incompatível → revisão/bloqueio | Staging + versionamento | 🟢 guarda comportamental | 🟢 guarda sintética | 🟢 sintético | homologar identidade lógica e política real de publicação |
| ADP-11 | mudança de professor → nova evidência/versionamento | Versionamento | 🟢 | 🟢 guarda sintética | 🟢 sintético | validar causalidade com artefato real |
| ADP-12 | alteração de horário → nova evidência/versionamento | Versionamento | 🟢 | 🟢 guarda sintética | 🟢 sintético | validar causalidade com artefato real |
| ADP-13 | ocorrência fora da vigência → bloqueada | Versionamento + ocorrência | ⚪ | 🟢 guarda temporal | 🟢 sintético | validar com ocorrência/versionamento reais após homologação |
| ADP-14 | fonte desconhecida → rejeitada | SOURCE | ⚪ | ⚪ | 🔴 | depende de contrato de autoridade da fonte |
| ADP-15 | raw preservado | RAW ROW | 🟢 | 🟢 | 🟢 | manter imutabilidade como requisito |
| ADP-16 | somente versão publicada alimenta motor | Versionamento → Core | 🟡 | 🟡 | 🟡 | testar promoção/publicação isoladamente; não conectar ao motor ainda |
| ADP-17 | Agenda não é grade oficial | Fonte + integração | ⚪ | ⚪ | 🔴 | validar na integração quando contrato da Agenda estiver homologado |
| ADP-18 | auditoria central registrada | EIOS/Core | ⚪ | ⚪ | 🔴 | homologar ledger existente e RLS; não criar terceiro ledger |

## 5. O que o PostgreSQL já comprova sinteticamente

O harness atual materializa:

1. entidades-base com FKs;
2. matching resolvido;
3. estados `ambiguous` e `unresolved` sem promoção a `resolved`;
4. validade temporal básica;
5. intervalo inválido rejeitado;
6. idempotência por `source_hash` no lote;
7. duplicidade de `source_row_reference` no mesmo lote;
8. referência inválida de turma rejeitada por FK;
9. criação de nova versão;
10. preservação da versão anterior;
11. coerência de vigência;
12. separação `raw_payload`/`normalized_payload`;
13. ausência de conflito temporal no fixture;
14. hashes distintos identificando versões sintéticas distintas;
15. identificação e exclusão de ocorrência fora da vigência, por regra temporal sintética;
16. ADP-10: identificação de conteúdo incompatível para o mesmo slot lógico sintético, sem tratá-lo como idempotência;
17. ADP-11: mudança sintética de professor classificada como nova versão;
18. ADP-12: mudança sintética de horário classificada como nova versão;
19. preservação da regra de idempotência quando o hash da fonte permanece igual.

O harness está deliberadamente isolado no schema `escala_test`, usa UUIDs sintéticos e encerra com `ROLLBACK`. Ele ainda **não foi executado** em PostgreSQL nesta auditoria.

## 6. Lacunas remanescentes

### 6.1 ADP-04..06 — IDs ausentes

A estrutura atual permite estados de matching, mas o banco sintético não reproduz ainda cada ausência de identificador como uma restrição específica.

Isso não autoriza criar colunas chamadas como supostos IDs da SED. O contrato exige identificadores institucionais confirmados, e o modelo de homologação proíbe inferência.

### 6.2 ADP-10 — duplicidade incompatível

O harness agora possui uma guarda comportamental explícita para distinguir uma repetição incompatível de uma repetição idempotente. A guarda usa somente valores sintéticos e **não define a chave lógica real da SED**.

A semântica institucional de identidade e publicação continua pendente do artefato real.

### 6.3 ADP-11/12 — alterações

O contrato TypeScript e o harness PostgreSQL agora possuem guards explícitos para mudança de professor e mudança de horário, classificando ambas como `new_version` no modelo sintético.

Isso fecha a lacuna comportamental da camada sintética, mas não homologa a semântica institucional da SED.

### 6.4 ADP-13 — vigência da ocorrência

A regra temporal possui asserções sintéticas explícitas: a ocorrência fora da vigência é identificada e não pertence ao conjunto publicável.

Isso não substitui a validação com artefato SED real.

### 6.5 ADP-14, ADP-17 e ADP-18

São deliberadamente dependentes de autoridade de fonte, integração com Agenda e infraestrutura de auditoria/EIOS. O modelo atual reconhece essas dependências e não permite preenchê-las por convenção.

## 7. Decisão de engenharia

Não aumentar o DDL sintético com campos específicos da SED apenas para produzir uma aparência de cobertura maior.

A sequência autorizada permanece:

```text
contrato comportamental
→ fixture sintético
→ asserção
→ auditoria
→ artefato SED real
→ homologação de campos/chaves
→ fixture sanitizado real
→ DDL físico somente quando justificado
```

O contrato de produção continua condicionado a arquivo/exportação real, dicionário, identificadores institucionais, regra de publicação, versionamento, matching, testes e RLS/permissionamento.

## 8. Próximos casos seguros

1. revisar ADP-04..06 e decidir se uma guarda comportamental adicional agrega valor sem criar supostos IDs SED;
2. revisar ADP-16 isoladamente, mantendo a fronteira entre versão publicada e consumo pelo Core;
3. manter ADP-14/17/18 bloqueados até as respectivas fontes/camadas serem homologadas;
4. não declarar execução PostgreSQL sem ambiente real de teste;
5. quando chegar o primeiro artefato real, iniciar homologação E3 conforme o protocolo de aquisição.

## 9. Gate atual

**Contrato:** 🟢 definido.  
**Modelo lógico:** 🟢 definido.  
**Cobertura sintética PostgreSQL:** 🟢 ampliada para ADP-10/11/12/13.  
**Execução PostgreSQL:** 🔴 não comprovada nesta etapa.  
**Artefato operacional SED 2026:** 🔴 ausente.  
**DDL de produção:** 🔴 bloqueado.

**Conclusão:** ADP-10, ADP-11, ADP-12 e ADP-13 possuem agora cobertura comportamental sintética explícita. O próximo trabalho seguro é revisão de ADP-04..06/ADP-16 sem inventar semântica SED. A homologação institucional continua bloqueada pela ausência do artefato técnico operacional real.

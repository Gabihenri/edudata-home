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

O contrato define os 18 comportamentos mínimos do adaptador. fileciteturn119file0 O modelo de staging mantém explicitamente a separação entre fonte, lote, linha bruta, matching, versão e ocorrência. fileciteturn151file0

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
| ADP-07 | nome/fuzzy nunca promove | Matching | 🟡 | ⚪ | 🟡 | testar explicitamente bloqueio de fuzzy no contrato, sem matching SED real |
| ADP-08 | horário inválido → rejeitado | Staging | 🟢 | 🟢 | 🟢 | manter regra `end > start` |
| ADP-09 | versão nova preserva anterior | Versionamento | 🟡 | 🟢 | 🟢 sintético | validar semântica de publicação com fonte real |
| ADP-10 | duplicidade incompatível → bloqueado | Staging + versionamento | 🟡 | 🟡 | 🟡 | distinguir idempotência de duplicidade incompatível |
| ADP-11 | mudança de professor → nova evidência/versionamento | Versionamento | ⚪ | ⚪ | 🟡 | fixture sintético específico antes de produção |
| ADP-12 | alteração de horário → nova evidência/versionamento | Versionamento | ⚪ | ⚪ | 🟡 | fixture sintético específico antes de produção |
| ADP-13 | ocorrência fora da vigência → bloqueada | Versionamento + ocorrência | ⚪ | 🟡 | 🟡 | teste temporal explícito no staging |
| ADP-14 | fonte desconhecida → rejeitada | SOURCE | ⚪ | ⚪ | 🔴 | depende de contrato de autoridade da fonte |
| ADP-15 | raw preservado | RAW ROW | 🟢 | 🟢 | 🟢 | manter imutabilidade como requisito |
| ADP-16 | somente versão publicada alimenta motor | Versionamento → Core | 🟡 | 🟡 | 🟡 | testar promoção/publicação isoladamente; não conectar ao motor ainda |
| ADP-17 | Agenda não é grade oficial | Fonte + integração | ⚪ | ⚪ | 🔴 | validar na integração quando contrato da Agenda estiver homologado |
| ADP-18 | auditoria central registrada | EIOS/Core | ⚪ | ⚪ | 🔴 | homologar ledger existente e RLS; não criar terceiro ledger |

Os comportamentos ADP-01..18 são os definidos no contrato original; em particular, o contrato separa idempotência, versionamento, raw, publicação, Agenda e auditoria. fileciteturn133file0 fileciteturn147file0

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
14. hashes distintos identificando versões sintéticas distintas.

O harness está deliberadamente isolado no schema `escala_test`, usa UUIDs sintéticos e encerra com `ROLLBACK`. Ele ainda **não foi executado** em PostgreSQL nesta auditoria. fileciteturn125file0

## 6. Lacunas que não devem ser mascaradas

### 6.1 ADP-04..06 — IDs ausentes

A estrutura atual permite estados de matching, mas o banco sintético não reproduz ainda cada ausência de identificador como uma restrição específica.

Isso não autoriza criar colunas chamadas como supostos IDs da SED. O contrato exige identificadores institucionais confirmados, e o modelo de homologação proíbe inferência. fileciteturn151file0

### 6.2 ADP-07 — fuzzy

O TypeScript possui precedência de matching, mas ainda não existe uma asserção específica demonstrando que uma correspondência textual/fuzzy é rejeitada como mecanismo de publicação.

A próxima alteração segura pode ser apenas comportamental e sintética.

### 6.3 ADP-10 — duplicidade incompatível

O harness já rejeita repetição da mesma referência de linha dentro do lote e trata hash repetido como idempotência. Isso não é suficiente para afirmar que **duas linhas diferentes, porém incompatíveis**, foram corretamente bloqueadas.

Essa distinção deve ser testada separadamente.

### 6.4 ADP-11..12 — alterações

A criação de uma segunda versão está coberta, mas ainda não existe uma prova específica de que a alteração do professor ou do horário seja a causa da criação da nova evidência/versionamento.

### 6.5 ADP-13 — vigência da ocorrência

Existe coerência de intervalo da versão, mas ainda falta uma asserção explícita de ocorrência fora da vigência publicada.

### 6.6 ADP-14, ADP-17 e ADP-18

São deliberadamente dependentes de autoridade de fonte, integração com Agenda e infraestrutura de auditoria/EIOS. O modelo atual reconhece essas dependências e não permite preenchê-las por convenção. fileciteturn143file0

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

O contrato de produção continua condicionado a arquivo/exportação real, dicionário, identificadores institucionais, regra de publicação, versionamento, matching, testes e RLS/permissionamento. fileciteturn134file0

## 8. Próximos casos seguros

A ordem recomendada para continuar o trabalho sem tocar na produção é:

1. criar teste sintético explícito para **ADP-07**;
2. separar **ADP-10** de idempotência;
3. criar cenários sintéticos para **ADP-11/12**;
4. criar validação explícita de **ADP-13**;
5. depois revisar a cobertura novamente;
6. manter ADP-14/17/18 bloqueados até as respectivas fontes/camadas serem homologadas.

## 9. Gate atual

**Contrato:** 🟢 definido.  
**Modelo lógico:** 🟢 definido.  
**Cobertura sintética PostgreSQL:** 🟡 parcial.  
**Execução PostgreSQL:** 🔴 não comprovada nesta etapa.  
**Artefato operacional SED 2026:** 🔴 ausente.  
**DDL de produção:** 🔴 bloqueado.

**Conclusão:** a lacuna agora está mensurada por caso, sem confundir cobertura sintética com homologação institucional.

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
| ADP-04 | docente sem ID → blocked | Matching | 🟢 guarda comportamental | 🟡 | 🟢 sintético | validar somente após confirmar identificador institucional real |
| ADP-05 | turma sem ID → blocked | Matching | 🟢 guarda comportamental | 🟡 | 🟢 sintético | validar somente após confirmar identificador institucional real |
| ADP-06 | componente sem ID → blocked | Matching | 🟢 guarda comportamental | 🟡 | 🟢 sintético | validar somente após confirmar identificador institucional real |
| ADP-07 | nome/fuzzy nunca promove | Matching | 🟢 guarda comportamental | ⚪ | 🟢 sintético | manter bloqueio; homologar somente com regra real de matching |
| ADP-08 | horário inválido → rejeitado | Staging | 🟢 | 🟢 | 🟢 | manter regra `end > start` |
| ADP-09 | versão nova preserva anterior | Versionamento | 🟡 | 🟢 | 🟢 sintético | validar semântica de publicação com fonte real |
| ADP-10 | duplicidade incompatível → bloqueado/revisão | Staging + versionamento | 🟡 | 🟢 guarda comportamental | 🟢 sintético | homologar identidade lógica somente com artefato real |
| ADP-11 | mudança de professor → nova evidência/versionamento | Versionamento | 🟢 guarda comportamental | 🟢 guarda sintética | 🟢 sintético | validar causalidade com versão real |
| ADP-12 | alteração de horário → nova evidência/versionamento | Versionamento | 🟢 guarda comportamental | 🟢 guarda sintética | 🟢 sintético | validar causalidade com versão real |
| ADP-13 | ocorrência fora da vigência → bloqueada | Versionamento + ocorrência | ⚪ | 🟢 guarda temporal | 🟢 sintético | validar com ocorrência/versionamento reais após homologação |
| ADP-14 | fonte desconhecida → rejeitada | SOURCE | ⚪ | ⚪ | 🔴 | depende de contrato de autoridade da fonte |
| ADP-15 | raw preservado | RAW ROW | 🟢 | 🟢 | 🟢 | manter imutabilidade como requisito |
| ADP-16 | somente versão publicada alimenta motor | Versionamento → Core | 🟡 | 🟡 | 🟡 | testar promoção/publicação isoladamente; não conectar ao motor ainda |
| ADP-17 | Agenda não é grade oficial | Fonte + integração | ⚪ | ⚪ | 🔴 | validar na integração quando contrato da Agenda estiver homologado |
| ADP-18 | auditoria central registrada | EIOS/Core | ⚪ | ⚪ | 🔴 | homologar ledger existente e RLS; não criar terceiro ledger |

## 5. Cobertura sintética atual

O contrato TypeScript possui guards específicos para ausência de identidade de docente, turma e componente. O harness PostgreSQL mantém os estados de matching `ambiguous` e `unresolved`, mas ainda não cria restrições físicas específicas para ausência de identificador institucional, porque o identificador SED real ainda não foi homologado.

O harness PostgreSQL também cobre sinteticamente duplicidade incompatível (ADP-10), mudança de professor/horário (ADP-11/12) e vigência temporal de ocorrência (ADP-13). Essas asserções são comportamentais e não representam o contrato físico da SED.

## 6. Lacunas remanescentes

### 6.1 ADP-04..06 — PostgreSQL

A guarda comportamental foi fechada no TypeScript, mas o banco sintético não reproduz ausência de identificador como uma coluna/restrição específica. Essa escolha é deliberada: criar um suposto `sed_teacher_id`, `sed_class_id` ou equivalente sem evidência seria inferência indevida.

### 6.2 ADP-16 — publicação → motor

Ainda falta demonstrar, em harness isolado, que somente uma versão efetivamente publicada pode alimentar a camada seguinte. A semântica de publicação institucional permanece dependente do artefato real.

### 6.3 ADP-14, ADP-17 e ADP-18

Continuam deliberadamente bloqueados por dependência de autoridade de fonte, integração com Agenda e infraestrutura de auditoria/EIOS.

## 7. Decisão de engenharia

Não aumentar o DDL sintético com campos específicos da SED apenas para produzir aparência de cobertura maior.

Sequência autorizada:

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

## 8. Próximos casos seguros

1. ADP-16 — isolar a regra `validated/published → consumível pelo motor`, sem integração produtiva.
2. Revisar cobertura após essa guarda.
3. Manter ADP-14/17/18 bloqueados.
4. Quando chegar o primeiro artefato real, iniciar homologação E3 conforme o protocolo de aquisição.

## 9. Gate atual

**Contrato:** 🟢 definido.  
**Modelo lógico:** 🟢 definido.  
**Cobertura sintética PostgreSQL:** 🟢 ampliada.  
**Execução PostgreSQL:** 🔴 não comprovada nesta etapa.  
**Artefato operacional SED 2026:** 🔴 ausente.  
**DDL de produção:** 🔴 bloqueado.

**Conclusão:** ADP-04..06 possuem guards comportamentais no TypeScript; ADP-10..13 possuem cobertura sintética ampliada. O próximo avanço seguro é ADP-16, sem conexão ao motor de produção e sem criar chaves SED por inferência.
# 33 — Contrato de Staging da Grade Oficial v1

**Data:** 2026-09-09  
**Status:** 🟡 CONTRATO CANDIDATO — SEM DDL DE PRODUÇÃO

## 1. Objetivo

Definir a camada de entrada da grade oficial antes da canonização e publicação. O staging preserva a fonte original e impede que uma importação incompleta ou ambígua alimente diretamente o motor da Escala.

## 2. Princípio

O staging é uma **camada de evidência de importação**, não uma fonte operacional do motor.

Fluxo obrigatório:

```text
Fonte externa
   ↓
Lote de importação
   ↓
Registros brutos
   ↓
Normalização não destrutiva
   ↓
Matching turma/componente
   ↓
Homologação
   ↓
Publicação de versão
   ↓
Ocorrências oficiais
```

## 3. Entidades candidatas

### `official_schedule_import_batches`

Representa um lote de importação.

Campos mínimos:

- `id uuid`;
- `organization_id uuid`;
- `school_id uuid`;
- `school_year_id uuid`;
- `source_system text`;
- `source_version text` ou identificador equivalente;
- `source_filename text` quando aplicável;
- `source_hash text`;
- `imported_at timestamptz`;
- `imported_by uuid`;
- `status text`;
- `metadata jsonb`;
- timestamps.

Estados sugeridos: `received`, `parsed`, `normalized`, `matching`, `homologation`, `published`, `rejected`, `cancelled`.

### `official_schedule_staging_rows`

Preserva cada registro recebido da fonte.

Campos mínimos:

- `id uuid`;
- `batch_id uuid`;
- `source_record_id text`;
- `source_row_number integer` quando houver;
- `raw_payload jsonb`;
- `normalized_payload jsonb`;
- `class_external_id text`;
- `component_external_code text`;
- `teacher_external_id text`;
- `date_or_recurrence jsonb`;
- `start_time time`;
- `end_time time`;
- `shift text`;
- `matching_status text`;
- `class_canonical_id uuid`;
- `component_canonical_id uuid`;
- `teacher_canonical_id uuid`;
- `matching_method text`;
- `matching_evidence jsonb`;
- `validation_status text`;
- `validated_by uuid`;
- `validated_at timestamptz`;
- `rejection_reason text`;
- timestamps.

## 4. Regras de preservação

1. `raw_payload` é imutável após recebimento.
2. Normalização gera dados derivados; nunca destrói o original.
3. O mesmo lote deve ser identificável por hash/origem para permitir idempotência.
4. Uma nova importação não sobrescreve silenciosamente um lote anterior.
5. Registros rejeitados permanecem auditáveis.
6. Um registro `ambiguous` não pode receber UUID canônico automaticamente.

## 5. Matching

### Turma

1. `class_external_id` oficial;
2. vínculo previamente homologado;
3. chave composta homologada;
4. exceção manual auditada.

### Componente

1. `component_external_code` oficial;
2. identificador curricular previamente homologado;
3. chave composta homologada;
4. exceção manual auditada.

### Docente

O docente somente pode ser canonizado por identificador institucional homologado ou vínculo acadêmico/Auth explicitamente validado. Nome, e-mail, posição da planilha ou similaridade textual não são chaves suficientes.

## 6. Estados de matching

- `resolved` — correspondência determinística/homologada;
- `ambiguous` — mais de uma correspondência possível;
- `unresolved` — nenhuma correspondência segura;
- `rejected` — registro inválido ou incompatível.

Somente `resolved` pode avançar para homologação de publicação.

## 7. Validações temporais e semânticas

Antes da publicação, cada linha deve satisfazer:

- escola e organização coerentes;
- ano letivo compatível;
- turma canônica compatível com escola/ano;
- componente compatível com o contexto acadêmico;
- docente canônico e vínculo válido quando exigido pela fonte;
- `start_time < end_time`;
- data/recorrência dentro da vigência;
- nenhuma ocorrência impossível por regra da fonte.

Conflitos de horário entre docentes e ocorrências serão tratados na camada de grade publicada e posteriormente consumidos pelo motor da Escala.

## 8. Homologação

A homologação é uma decisão explícita. Deve registrar:

- lote;
- registros afetados;
- validador;
- data/hora;
- resultado;
- justificativa quando houver exceção;
- evidências de matching;
- versão resultante.

Não há publicação automática somente porque o parser terminou sem erro.

## 9. Publicação

Uma publicação cria uma nova versão oficial. A versão deve apontar para o lote homologado e possuir estado controlado, por exemplo:

`draft → validated → published → superseded`

Somente uma versão `published` pode alimentar o motor da Escala.

A substituição de uma versão publicada por outra preserva ambas. A versão anterior torna-se `superseded`; não é apagada.

## 10. Idempotência

O sistema deve reconhecer reprocessamento do mesmo conteúdo por `source_hash` e contexto institucional. O reprocessamento pode gerar novo lote técnico, mas não pode criar uma segunda publicação equivalente sem identificação de versão.

## 11. Gate

Este documento define contrato lógico/físico candidato, mas **não autoriza DDL**. Antes da criação das tabelas devem ser homologados:

1. formato real da fonte oficial;
2. identificadores reais de turma, componente e docente;
3. política de publicação;
4. vínculo docente canônico;
5. RLS e permissões Escala;
6. harness PostgreSQL completo.

**Resultado:** contrato aprovado para auditoria; produção permanece bloqueada.

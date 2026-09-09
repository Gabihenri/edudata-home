# 21 — Contrato do Adaptador e Staging da Grade v1

**Data:** 2026-09-09  
**Status:** 🟡 CONTRATO DEFINIDO — DDL DE PRODUÇÃO BLOQUEADO

## 1. Objetivo

Definir o contrato técnico do primeiro adaptador de grade da Escala Inteligente de Substituição, sem assumir fornecedor, formato ou tabela externa específica.

O adaptador transforma uma fonte homologada em registros normalizados de staging. Ele **não publica grade**, não cria vagas e não decide substituições.

## 2. Princípios

1. Preservar o dado bruto.
2. Normalizar sem destruir a origem.
3. Separar normalização de matching.
4. Não inferir identidade por nome/e-mail.
5. Não publicar registros ambíguos ou não resolvidos.
6. Manter hash e referência da fonte.
7. Tornar reimportações idênticas detectáveis.
8. Permitir reprodução histórica.
9. Manter a decisão administrativa fora do adaptador.
10. Não usar Agenda como substituta da grade oficial.

## 3. Pipeline

```text
Arquivo/API homologada
        ↓
leitura segura
        ↓
validação estrutural
        ↓
normalização
        ↓
resolução de escola
        ↓
resolução de docente
        ↓
resolução de turma
        ↓
resolução de componente
        ↓
validação temporal
        ↓
staging
        ↓
revisão de exceções
        ↓
validação do lote
        ↓
versão candidata
        ↓
publicação controlada
```

Nenhuma etapa de matching deve alterar silenciosamente o payload bruto.

## 4. Contrato de entrada canônico

O adaptador deve aceitar, no mínimo, os seguintes campos sem exigir que a fonte use exatamente esses nomes:

| Campo canônico | Obrigatório | Finalidade |
|---|---:|---|
| `organization_external_id` | Sim | identificar rede/organização na fonte |
| `school_external_id` | Sim | identificar escola na fonte |
| `school_inep_code` | Preferencial | resolver escola por INEP |
| `teacher_external_id` | Sim* | identificar docente |
| `class_external_id` | Sim* | identificar turma |
| `component_external_id` | Sim* | identificar componente |
| `academic_year` | Sim | ano letivo |
| `academic_period_external_id` | Não | período, quando disponível |
| `weekday` | Condicional | recorrência semanal |
| `scheduled_date` | Condicional | ocorrência concreta |
| `start_time` | Sim | início |
| `end_time` | Sim | fim |
| `shift` | Preferencial | turno |
| `valid_from` | Sim | início da validade |
| `valid_until` | Não | fim da validade |
| `source_row_reference` | Sim | rastreabilidade |
| `raw_payload` | Sim | reprodução |

`*` Se a fonte não fornecer identificador estável, o registro deve ser aceito apenas em staging como exceção; não pode ser publicado automaticamente.

## 5. Normalização

### 5.1 Texto

- remover BOM;
- remover espaços laterais;
- preservar valor original;
- normalizar Unicode quando necessário;
- padronizar valores vazios/nulos.

### 5.2 Identificadores

- preservar identificador bruto;
- gerar representação normalizada;
- nunca remover zeros significativos de códigos;
- códigos oficiais devem ser comparados de forma determinística.

### 5.3 INEP

Para escola:

```text
entrada → somente dígitos → exatamente 8 dígitos → lookup
```

Falha de formato não deve ser corrigida por aproximação.

### 5.4 Datas e horários

Datas devem convergir para `YYYY-MM-DD` e horários para tipo temporal compatível com PostgreSQL.

Regra obrigatória:

```text
end_time > start_time
```

Intervalos inválidos são rejeitados.

## 6. Matching determinístico

### Escola

Prioridade:

1. `school_inep_code`;
2. identificador externo previamente associado;
3. identificador institucional homologado;
4. exceção.

### Docente

Prioridade:

1. identificador institucional externo homologado;
2. vínculo Auth ↔ `teacher_profiles` previamente validado;
3. associação manual previamente auditada;
4. exceção.

Nome, e-mail ou similaridade textual **não podem produzir publicação automática**.

### Turma

Prioridade:

1. `class_external_id + school + academic_year`;
2. chave composta homologada;
3. exceção.

Nome isolado não é chave.

### Componente

Prioridade:

1. `component_external_id + contexto acadêmico`;
2. código curricular oficial homologado;
3. chave composta homologada;
4. exceção.

Descrição textual isolada não é chave de publicação.

## 7. Estados de matching

Cada entidade resolvida deve carregar estado independente:

- `resolved` — uma correspondência comprovada;
- `ambiguous` — mais de uma correspondência possível;
- `unresolved` — nenhuma correspondência confiável.

O estado global do registro é o pior estado entre as entidades obrigatórias.

```text
resolved + resolved + resolved + resolved = resolved
qualquer ambiguous sem resolução = ambiguous
qualquer unresolved obrigatório = unresolved
```

Somente `resolved` pode seguir para validação de publicação.

## 8. Contrato de staging

Cada linha deve preservar:

```text
import_batch_id
source_row_reference
raw_payload
normalized_payload
organization_match
school_match
teacher_match
class_match
component_match
matching_status
matching_errors
structural_status
temporal_status
source_hash
created_at
```

Os objetos `*_match` devem registrar pelo menos:

```text
external_id
canonical_id
status
method
confidence
review_required
reviewed_by
reviewed_at
```

`confidence` é informativo e não substitui uma regra determinística.

## 9. Validações

### Estruturais

Bloquear quando houver:

- campos obrigatórios ausentes;
- tipos inválidos;
- horário inválido;
- data inválida;
- identificador malformado;
- payload ilegível.

### Semânticas

Bloquear quando houver:

- escola fora da organização;
- docente fora da escola/escopo;
- turma incompatível com escola/ano;
- componente incompatível com contexto;
- período fora do ano letivo;
- validade invertida;
- duplicidade incompatível;
- ocorrência impossível.

### Temporais

Conflito entre intervalos:

```text
A.start_time < B.end_time
AND
B.start_time < A.end_time
```

Para docente, sobreposição incompatível deve impedir publicação daquela ocorrência.

## 10. Idempotência

O lote deve possuir hash calculado sobre uma representação canônica da fonte.

Uma reimportação com:

```text
mesma fonte
+ mesmo escopo
+ mesmo período
+ mesmo conteúdo
```

deve ser reconhecida como equivalente, sem apagar a execução anterior.

Uma fonte corrigida gera novo hash e novo lote/versão.

## 11. Fixture sintética mínima

A suíte de homologação deve conter pelo menos:

| Caso | Escola | Docente | Turma | Componente | Resultado |
|---|---|---|---|---|---|
| F01 | único | único | único | único | `resolved` |
| F02 | único | 2 possíveis | único | único | `ambiguous` |
| F03 | único | inexistente | único | único | `unresolved` |
| F04 | inválida | único | único | único | rejeitado |
| F05 | único | único | único | único | horário inválido |
| F06 | único | único | único | único | sobreposição |
| F07 | único | único | único | único | duplicidade |
| F08 | único | único | único | único | reimportação idêntica |
| F09 | único | único | único | único | fonte corrigida → novo hash |
| F10 | único | único | único | único | validade fora do ano |

Os fixtures devem usar identificadores fictícios e não conter dados reais de alunos ou docentes.

## 12. Resultado esperado dos fixtures

O teste deve demonstrar:

```text
F01 → publicável após validações
F02 → revisão obrigatória
F03 → bloqueado
F04 → bloqueado
F05 → bloqueado
F06 → bloqueado
F07 → bloqueado/revisão conforme regra
F08 → idempotente, sem apagar histórico
F09 → nova execução/versionamento
F10 → bloqueado
```

## 13. Segurança

O adaptador deve operar em contexto técnico controlado.

O arquivo bruto e o staging devem ser protegidos por Storage privado e/ou RLS adequado.

Usuário professor não recebe acesso geral ao staging.

Gestor acessa exceções somente dentro de escopo e permissões Escala.

Nenhum usuário comum pode alterar o payload bruto após ingestão.

## 14. Auditoria do contrato

### ADP-AUD-01 — Separação bruto/normalizado
**Severidade:** HIGH  
**Status:** APROVADO NO DESENHO  
**Evidência:** `raw_payload` permanece separado de `normalized_payload`.

### ADP-AUD-02 — Matching determinístico
**Severidade:** CRITICAL  
**Status:** APROVADO COMO REGRA / A TESTAR  
**Evidência:** hierarquia explícita por entidade; fuzzy matching não publica.

### ADP-AUD-03 — Ambiguidade
**Severidade:** CRITICAL  
**Status:** APROVADO COMO REGRA / A TESTAR  
**Evidência:** `ambiguous` exige revisão.

### ADP-AUD-04 — Integridade temporal
**Severidade:** CRITICAL  
**Status:** APROVADO COMO REGRA / A TESTAR  
**Evidência:** intervalos concretos e regra formal de sobreposição.

### ADP-AUD-05 — Idempotência
**Severidade:** HIGH  
**Status:** DESENHADO / A TESTAR NO POSTGRESQL  
**Evidência:** hash canônico por lote.

### ADP-AUD-06 — Proveniência
**Severidade:** HIGH  
**Status:** APROVADO COMO REGRA / A HOMOLOGAR  
**Evidência:** lote, linha, payload bruto e hash preservados.

### ADP-AUD-07 — Segurança
**Severidade:** HIGH  
**Status:** DESENHADO / A HOMOLOGAR  
**Evidência:** staging fora do acesso comum; RLS/Storage ainda pendentes de implementação e teste.

### ADP-AUD-08 — Dados reais
**Severidade:** HIGH  
**Status:** BLOQUEADO  
**Regra:** homologação inicial utiliza exclusivamente fixture sintética.

## 15. Gate de produção

Este contrato **não libera DDL de produção**.

Antes da implementação física devem ser concluídos:

1. fonte real homologada;
2. identificadores externos reais;
3. identidade docente/Auth;
4. entidade canônica de turma;
5. entidade canônica de componente;
6. RLS Escala;
7. Storage/proveniência;
8. testes de idempotência;
9. testes de integridade composta;
10. integração EIOS Governance.

## 16. Decisão final

**Contrato do adaptador:** APROVADO COMO BASE.  
**Staging:** APROVADO COMO DESENHO.  
**Fixture sintética:** OBRIGATÓRIA.  
**Fuzzy matching para publicação:** PROIBIDO.  
**Dados reais:** AINDA NÃO HOMOLOGADOS.  
**DDL de produção:** NÃO LIBERADO.

### Próximo gate

Implementar a suíte de testes sintéticos do contrato e auditar seus resultados antes de qualquer publicação ou migration produtiva.

# 23 — Modelo de Homologação PostgreSQL do Adaptador/Staging v1

**Data:** 2026-09-09  
**Status:** 🟡 MODELO DE HOMOLOGAÇÃO — NÃO EXECUTAR EM PRODUÇÃO  
**Escopo:** PostgreSQL isolado/local para validar o contrato do adaptador antes de qualquer DDL produtivo.

## 1. Objetivo

Transformar os contratos dos documentos 21 e 22 em uma estratégia de homologação de banco reproduzível.

A homologação deve testar comportamento de PostgreSQL sem depender das tabelas ainda não homologadas do Core e sem utilizar dados reais.

O modelo deve ser executado apenas em banco local/efêmero ou ambiente de desenvolvimento isolado.

## 2. Evidência da infraestrutura atual

O repositório já possui histórico de workflow para testes de banco com Supabase CLI, incluindo `supabase start` e `supabase test db`. Entretanto, a auditoria atual não encontrou uma suíte `supabase/tests` correspondente na árvore atual, nem `supabase/config.toml` comprovado no branch principal.

O `package.json` atual também não possui runner TypeScript de testes; portanto, esta etapa não adiciona dependências à aplicação. O teste de banco deverá ser tratado como infraestrutura de homologação quando o ambiente local Supabase for formalmente preparado.

## 3. Regra de isolamento

O harness deve usar exclusivamente:

- tabelas temporárias ou schema de teste;
- UUIDs sintéticos;
- códigos fictícios;
- hashes sintéticos;
- nenhuma linha de `public` usada pela aplicação em produção;
- nenhuma alteração persistente no banco remoto.

Não executar este harness diretamente no projeto de produção `EduData IA`.

## 4. Estrutura sintética do harness

O banco de teste deve representar somente os contratos necessários:

```text
organizations_test
schools_test
teachers_test
classes_test
components_test
import_batches_test
import_rows_test
schedule_versions_test
schedule_entries_test
schedule_occurrences_test
```

Essas tabelas são simuladores de homologação. Elas não definem o Core oficial e não devem ser copiadas para produção automaticamente.

## 5. Constraints mínimas a simular

### 5.1 Integridade temporal

```sql
CHECK (end_time > start_time)
```

### 5.2 Validade

```sql
CHECK (valid_until IS NULL OR valid_until >= valid_from)
```

### 5.3 Matching

Vocabulário:

```text
resolved
ambiguous
unresolved
```

Uma linha publicável deve satisfazer:

```text
teacher = resolved
class = resolved
component = resolved
structural = valid
temporal = valid
```

### 5.4 Escopo institucional

Cada professor, turma e componente usado na ocorrência deve pertencer ao mesmo escopo da escola/organização do registro.

No harness, isso deve ser testado por consultas negativas e por constraints/triggers quando necessário.

## 6. Testes F01–F10

| ID | Inserção | Resultado obrigatório |
|---|---|---|
| F01 | todos os matches resolvidos | publicável |
| F02 | dois matches possíveis para docente | revisão |
| F03 | docente não resolvido | bloqueado |
| F04 | escola inválida | bloqueado |
| F05 | `end_time <= start_time` | rejeitado |
| F06 | dois intervalos sobrepostos | conflito |
| F07 | chave funcional duplicada | rejeitado/revisão |
| F08 | mesmo `source_hash` + escopo + período | idempotente |
| F09 | conteúdo corrigido, novo hash | nova versão |
| F10 | validade fora do ano letivo | rejeitado |

## 7. Teste de sobreposição

Para professor, aplicar:

```sql
SELECT EXISTS (
  SELECT 1
  FROM schedule_occurrences_test a
  JOIN schedule_occurrences_test b
    ON a.id < b.id
   AND a.teacher_id = b.teacher_id
   AND a.scheduled_date = b.scheduled_date
   AND a.start_time < b.end_time
   AND b.start_time < a.end_time
);
```

Casos obrigatórios:

- `08:00–09:00` × `08:59–10:00` → conflito;
- `08:00–09:00` × `09:00–10:00` → sem conflito;
- `10:00–11:00` × `08:00–10:00` → sem conflito.

## 8. Teste de idempotência

O teste deve verificar a chave lógica:

```text
source_hash
+ organization_id
+ school_id
+ school_year_id
+ período de importação
```

Duas importações com a mesma combinação devem produzir:

```text
primeira → processada
segunda  → reconhecida como equivalente
```

A segunda nunca deve apagar ou substituir a primeira.

Uma fonte alterada deve possuir hash diferente e resultar em novo lote/versionamento.

## 9. Teste de publicação versionada

Fluxo:

```text
received
  ↓
processing
  ↓
validated
  ↓
published
```

Apenas uma versão `published` pode ser consumida pelo motor para o mesmo escopo e vigência, respeitando a regra institucional de vigência.

Uma versão `draft`, `rejected` ou `revoked` não pode ser fonte de ocorrência produtiva.

A publicação deve ser atômica: falha em qualquer etapa impede que uma versão parcialmente criada fique utilizável.

## 10. Teste de proveniência

O harness deve conseguir reconstruir:

```text
source_hash
  ↓
import_batch
  ↓
import_row
  ↓
schedule_version
  ↓
schedule_entry
  ↓
schedule_occurrence
```

A relação deve ser verificável por IDs e não somente por texto livre.

Para a futura integração EIOS, devem ser reservadas referências a:

```text
run_id
correlation_id
provenance_id
actor_id
```

## 11. Testes de segurança — segunda camada

RLS real não deve ser simulada com simples colunas de escopo.

Depois que as entidades e permissões Escala forem materializadas, deverão existir testes negativos para:

1. professor sem permissão tentando consultar candidatos;
2. gestor sem escopo tentando acessar outra escola;
3. usuário de outra organização tentando consultar staging;
4. usuário sem permissão tentando publicar;
5. usuário sem permissão tentando confirmar substituição;
6. tentativa de alterar payload bruto;
7. tentativa de apagar registro de auditoria.

Esses testes devem usar o mecanismo real de Auth/RLS em ambiente isolado.

## 12. PostgreSQL + pgTAP

O padrão recomendado para a camada de banco é pgTAP, porque permite testar estrutura, constraints, funções, integridade e RLS. A documentação oficial do Supabase também recomenda pgTAP para testes de banco e RLS.

No entanto, a auditoria atual encontrou **nenhuma extensão `pgtap` instalada no projeto remoto**. Portanto, não se deve executar `CREATE EXTENSION` ou qualquer DDL de teste no banco de produção para resolver essa ausência.

Quando o ambiente local estiver disponível, o teste poderá seguir o padrão:

```text
BEGIN
  instalar/usar pgTAP no ambiente de teste
  criar fixtures
  executar assertions
ROLLBACK
```

## 13. Testes de integridade composta

Devem existir casos em que somente um componente do escopo esteja incorreto:

```text
organização correta + escola errada
organização correta + professor de outra escola
escola correta + turma de outro ano
escola correta + componente incompatível
versão correta + occurrence fora da validade
```

Todos devem resultar em falha ou bloqueio explícito.

## 14. Teste de concorrência

Ainda não deve ser executado no projeto remoto.

No ambiente isolado, simular duas transações tentando publicar a mesma combinação:

```text
T1 → valida lote/hash
T2 → valida lote/hash
T1 → publica
T2 → tenta publicar
```

Resultado obrigatório: somente uma publicação efetiva; a segunda deve ser reconhecida como conflito/idempotência, sem duplicar versão.

## 15. Teste de reprocessamento

Executar:

```text
run-001 → versão V1
run-002 → mesma entrada/hash
run-003 → fonte corrigida → V2
```

Resultado:

- `run-001` permanece histórico;
- `run-002` não apaga `run-001`;
- `run-003` referencia V2;
- V1 permanece recuperável;
- nenhuma execução altera retroativamente uma decisão anterior.

## 16. Critério de aprovação

A homologação física somente poderá ser marcada como aprovada quando houver evidência de:

- F01–F10 passando;
- constraints temporais funcionando;
- integridade composta funcionando;
- hash/idempotência funcionando;
- publicação transacional funcionando;
- histórico preservado;
- provenance reconstruível;
- RLS negativa funcionando;
- concorrência controlada;
- reprocessamento sem destruição histórica.

Qualquer falha Critical ou High mantém o gate fechado.

## 17. Auditoria da etapa

| ID | Achado | Severidade | Status |
|---|---|---|---|
| PG-AUD-01 | banco remoto não possui entidades candidatas da grade | Critical | Aberto |
| PG-AUD-02 | `pgtap` não está instalado no remoto | High | Confirmado |
| PG-AUD-03 | ambiente local Supabase não está comprovado no branch | High | Aberto |
| PG-AUD-04 | RLS Escala ainda não materializado | Critical | Aberto |
| PG-AUD-05 | identidade docente ainda não fechada | Critical | Aberto |
| PG-AUD-06 | turma/componente canônicos ainda não existem | Critical | Aberto |
| PG-AUD-07 | publicação/idempotência física ainda não implementadas | High | Aberto |
| PG-AUD-08 | provenance EIOS ainda não integrado à Escala | Medium | Aberto |
| PG-AUD-09 | nenhum DDL de produção executado nesta etapa | — | Confirmado |

## 18. Decisão

**Modelo de homologação:** APROVADO COMO DESENHO.

**Execução remota:** NÃO AUTORIZADA.

**DDL de produção:** CONTINUA BLOQUEADO.

A etapa seguinte deverá preparar o ambiente de banco de teste de forma reprodutível, preferencialmente local/efêmera, e somente então executar o harness físico.

Regra permanente:

```text
Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar
```

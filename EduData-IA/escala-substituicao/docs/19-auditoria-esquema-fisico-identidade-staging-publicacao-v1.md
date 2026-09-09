# 19 — Auditoria do Esquema Físico de Identidade, Staging e Publicação v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — DDL DE PRODUÇÃO BLOQUEADO

## 1. Escopo

Auditoria do documento 18 contra o Core físico conhecido do projeto `EduData IA` (`ihchzfndmdwtoabttkil`) e contra as decisões registradas nos documentos 11–17.

Nenhum DDL de produção foi executado.

## 2. Resultado executivo

O esquema candidato está coerente com a arquitetura definida e elimina dependências das tabelas legadas ausentes.

Entretanto, a auditoria mantém bloqueios críticos porque ainda não existe evidência física suficiente para:

1. fechar a identidade Auth ↔ `teacher_profiles`;
2. confirmar a origem canônica de turma;
3. confirmar a origem canônica de componente curricular;
4. homologar as chaves de staging/publicação no Core real;
5. materializar e testar as permissões `escala.*`;
6. homologar a integração com EIOS Governance.

## 3. Evidências utilizadas

O Core físico previamente auditado contém `organizations`, `schools`, `school_years`, `academic_periods`, `teacher_profiles`, `organization_members` e estruturas `identity_*`/`eios_governance_*`.

`teacher_profiles` possui `id`, `school_id` e `organization_id`, mas não possui `user_id`.

`organization_members` possui `user_id`, porém a auditoria anterior encontrou zero registros, impossibilitando provar a associação por amostragem.

Não foram encontradas as tabelas legadas `schedules`, `classes`, `subjects`, `knowledge_areas`, `availability`, `substitutions` e `audit_logs`.

Portanto, o esquema 18 está corretamente desenhado sem FK para essas tabelas ausentes.

## 4. Auditoria por entidade

### PHY-AUD-08 — Identidade docente
**Severidade:** CRITICAL  
**Status:** ABERTO

`academic_teacher_identity_links` é tecnicamente adequada como relação explícita, mas sua criação ainda deve ser condicionada à confirmação de que não existe vínculo Auth já materializado em outra estrutura.

**Decisão:** manter entidade condicional. Não executar até concluir auditoria de identidade.

### PHY-AUD-09 — Turma oficial
**Severidade:** CRITICAL  
**Status:** ABERTO

`academic_classes` é semanticamente necessária porque `agenda_classes` não representa, por si só, a identidade versionada da turma oficial.

**Decisão:** aprovada como desenho, dependente de validação de origem externa/importação e chaves institucionais.

### PHY-AUD-10 — Componente curricular
**Severidade:** CRITICAL  
**Status:** ABERTO

`academic_components` é necessária porque não existe tabela física canônica `subjects`/`knowledge_areas` comprovada.

**Decisão:** aprovada como desenho; `curriculum_node_ref` permanece sem FK até existir entidade física curricular homologada.

### PHY-AUD-11 — Import batch
**Severidade:** HIGH  
**Status:** DEFINIDO / A HOMOLOGAR

O lote preserva hash, origem, operador, contadores e status.

**Risco residual:** a política de armazenamento do arquivo bruto ainda precisa ser definida entre referência externa e Storage privado.

### PHY-AUD-12 — Staging rows
**Severidade:** HIGH  
**Status:** DEFINIDO / A HOMOLOGAR

O staging preserva payload bruto, payload normalizado, matching e erros.

**Decisão:** adequado para auditoria e reprodução, desde que RLS impeça exposição a usuários comuns.

### PHY-AUD-13 — Publicação versionada
**Severidade:** CRITICAL  
**Status:** DEFINIDO / BLOQUEADO PARA EXECUÇÃO

O modelo exige `draft → validated → published → superseded/revoked` e impede consumo de versões não publicadas.

**Decisão:** regra aprovada.

### PHY-AUD-14 — Integridade composta
**Severidade:** HIGH  
**Status:** ABERTO

FKs simples não garantem sozinhas que `school_id`, `organization_id`, `school_year_id`, professor e turma pertençam ao mesmo escopo.

**Ação obrigatória:** definir constraints, triggers ou funções transacionais comprováveis antes da migration.

### PHY-AUD-15 — RLS
**Severidade:** HIGH  
**Status:** ABERTO

A estrutura `identity_product_permissions` e `identity_responsibility_scopes` existe, mas o produto Escala ainda não possui permissões materializadas e testadas.

**Ação:** criar matriz de permissões, políticas e testes negativos antes da liberação.

### PHY-AUD-16 — Governance
**Severidade:** MEDIUM  
**Status:** ABERTO

As estruturas EIOS Governance existem, mas a compatibilidade das funções/policies com o novo produto não foi homologada.

**Ação:** definir o contrato de integração e testar escrita append-only e consulta autorizada.

### PHY-AUD-17 — Idempotência
**Severidade:** HIGH  
**Status:** DEFINIDO / A VALIDAR

Hash + escopo + período permitem detectar reimportação idêntica, mas a regra física de unicidade e o comportamento de reprocessamento precisam ser testados em PostgreSQL.

## 5. Auditoria de segurança

### Professor

Não deve acessar staging, candidatos, scores ou decisões de outros usuários por simples pertencimento à organização.

### Gestor

Pode acessar vagas/candidatos somente quando possuir permissão Escala e escopo de responsabilidade compatível.

### Diretor

Pode confirmar decisões somente dentro da escola/escopo autorizado.

### Auditor

Pode consultar a trilha somente com permissão de auditoria.

### Administrador técnico

Não recebe acesso automático a conteúdo pedagógico ou decisões privadas apenas por possuir papel técnico de plataforma.

## 6. Auditoria temporal

O esquema preserva `start_time`, `end_time`, `valid_from`, `valid_until` e data concreta da ocorrência.

A regra de conflito permanece:

`A.start < B.end AND B.start < A.end`.

A confirmação deve revalidar a versão da grade, ocorrência, elegibilidade e conflitos imediatamente antes da decisão.

## 7. Auditoria de proveniência

O desenho permite reconstruir:

```text
fonte
 ↓
import_batch
 ↓
staging row
 ↓
grade version
 ↓
entry
 ↓
occurrence
 ↓
engine run
 ↓
candidate
 ↓
decisão humana
```

Isso atende ao requisito de reprodução histórica, desde que as referências de provenance sejam efetivamente persistidas e protegidas contra alteração posterior.

## 8. Gate de DDL

**NÃO LIBERADO.**

Bloqueadores restantes:

- CRITICAL: identidade docente;
- CRITICAL: turma oficial;
- CRITICAL: componente curricular;
- CRITICAL: publicação física ainda não homologada;
- HIGH: integridade composta;
- HIGH: RLS/permissões Escala;
- HIGH: idempotência física;
- MEDIUM: integração EIOS Governance.

## 9. Próxima etapa

A próxima etapa não deve ser executar a migration.

Deve ser a **auditoria de origem dos dados da grade**, identificando concretamente de onde virão:

- docentes;
- turmas;
- componentes;
- horários;
- períodos de validade;
- identificadores externos.

Depois disso, será possível fechar as chaves naturais, os matching keys e a primeira migration real sem criar dependências artificiais.

## 10. Decisão final

**Modelo físico:** APROVADO COMO CANDIDATO.  
**Auditoria:** CONCLUÍDA COM BLOQUEIOS REGISTRADOS.  
**DDL de produção:** NÃO LIBERADO.  
**Próximo gate:** auditoria da origem real dos dados da grade e definição dos identificadores externos/canonização.

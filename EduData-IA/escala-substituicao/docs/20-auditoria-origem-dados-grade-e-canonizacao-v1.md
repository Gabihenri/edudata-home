# 20 — Auditoria da Origem dos Dados da Grade e Canonização v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — DDL DE PRODUÇÃO BLOQUEADO

## 1. Objetivo

Auditar a origem real atualmente disponível no repositório e no Core físico para determinar de onde a Escala poderá obter, com rastreabilidade, docentes, turmas, componentes curriculares, horários, validade e identificadores externos.

A regra permanece: **não inventar uma fonte oficial nem transformar estruturas da Agenda em grade institucional por conveniência técnica**.

## 2. Evidências auditadas

### 2.1 Repositório

A busca no repositório `Gabihenri/edudata-home` não encontrou implementação existente de importação de grade/horário escolar institucional, nem parser específico de CSV/XLSX para horários, turmas e componentes.

Foi encontrada uma importação operacional de `school_registry` por CSV. O script exige cabeçalho conhecido, normaliza Código INEP, texto, UF e coordenadas, processa em lotes e realiza `upsert` por `inep_code`. Esse padrão é útil como referência de engenharia de importação, mas **não constitui fonte de grade**.

O `package.json` expõe atualmente apenas `import:school-registry` como script de importação de dados dessa natureza.

### 2.2 Core físico

No projeto Supabase `EduData IA` (`ihchzfndmdwtoabttkil`) foram confirmadas estruturas para:

- `organizations`;
- `schools`;
- `school_registry`;
- `school_years`;
- `academic_periods`;
- `teacher_profiles`;
- estruturas `identity_*` e `eios_governance_*`;
- estruturas operacionais da Agenda, incluindo `agenda_classes`, `agenda_lessons` e `agenda_schedule_templates`.

Não foram encontradas estruturas físicas canônicas para `schedules`, `classes`, `subjects` ou `knowledge_areas`.

Também não foi localizada uma tabela de grade oficial publicada/versionada.

## 3. Auditoria semântica das fontes existentes

| Fonte | Pode ser fonte oficial da grade? | Uso permitido pela Escala |
|---|---|---|
| `school_registry` | Não | Identidade/metadata da escola, especialmente INEP |
| `schools` | Não | Identidade institucional da escola |
| `teacher_profiles` | Parcial | Identidade de domínio docente e dados de qualificação; vínculo Auth ainda precisa ser provado |
| `school_years` | Não isoladamente | Âncora do ano letivo |
| `academic_periods` | Não isoladamente | Âncora temporal acadêmica |
| `agenda_classes` | **Não** | Contexto operacional da Agenda |
| `agenda_lessons` | **Não** | Planejamento/aula e contexto temporal; pode fornecer impedimentos/contexto explícito |
| `agenda_schedule_templates` | **Não** | Automação de agenda pessoal/operacional |
| CSV externo de grade | **Sim, após homologação** | Fonte de importação/staging |
| Sistema institucional externo | **Sim, após homologação** | Fonte oficial ou fonte de importação, conforme contrato |

A migration da Agenda confirma que `agenda_classes` possui `name`, `school_year`, `grade`, `subject`, `school_id` e `teacher_id`, mas sua semântica e origem são próprias da Agenda; não há versão institucional de grade nessa estrutura.

## 4. Resultado da auditoria de origem

**Não foi encontrada, no estado atual do repositório/Core, uma fonte real de grade escolar institucional já integrada à plataforma.**

Portanto, o próximo componente arquitetural deve ser um **adaptador de fonte de grade**, e não uma migration que suponha a existência de uma tabela externa inexistente.

A primeira implementação deverá aceitar uma fonte homologada por importação, preferencialmente CSV/XLSX ou integração estruturada futura, mantendo o arquivo/origem original e uma representação normalizada em staging.

## 5. Identificadores externos

### 5.1 Escola

A chave externa mais sólida já comprovada é o **Código INEP**, presente em `school_registry.inep_code` e em `schools.inep_code`.

Regra de canonização:

1. normalizar para dígitos;
2. exigir 8 dígitos;
3. localizar `school_id` por `inep_code`;
4. se houver ausência ou duplicidade, marcar como exceção e impedir publicação automática.

### 5.2 Docente

Não existe ainda um identificador externo de grade comprovado.

`teacher_profiles.id` é identidade de domínio, mas não deve ser tratado automaticamente como `auth.users.id`. Nome/e-mail não podem ser usados isoladamente para inferência de identidade.

Chaves preferenciais, em ordem:

1. identificador institucional único do docente fornecido pela fonte;
2. identificador estável já associado a uma relação Auth ↔ perfil homologada;
3. vínculo previamente validado por gestor;
4. nunca publicar por simples aproximação de nome/e-mail.

### 5.3 Turma

Não existe identificador oficial de turma comprovado.

A fonte deverá fornecer, idealmente:

- código institucional da turma;
- nome da turma;
- etapa/ano/série;
- turno;
- ano letivo;
- escola;
- validade.

Nome da turma sozinho não é chave suficiente.

### 5.4 Componente curricular

Não existe entidade física canônica `subjects`/`knowledge_areas` comprovada.

A fonte deverá fornecer, idealmente:

- código do componente;
- descrição oficial;
- área;
- etapa;
- carga horária, quando disponível;
- identificador curricular/referência da rede, quando disponível.

Descrição textual pode participar do matching, mas não deve ser a única chave de publicação quando houver código oficial.

### 5.5 Horário

Cada registro da grade deve permitir identificar, no mínimo:

- dia da semana ou data concreta;
- início;
- fim;
- turno/período;
- turma;
- componente;
- docente;
- validade.

Para o motor de substituição, a ocorrência concreta deverá resultar em `scheduled_date + start_time + end_time`.

## 6. Canonização e matching

O importador deve separar claramente **normalização** de **matching**.

### Etapa A — normalização

- remover BOM e espaços laterais;
- normalizar Unicode quando aplicável;
- padronizar identificadores;
- normalizar UF;
- converter horários para formato temporal válido;
- normalizar datas;
- preservar valor bruto original.

### Etapa B — matching determinístico

O matching deve seguir uma hierarquia explícita:

**Escola:** INEP → identificador institucional homologado → exceção.

**Docente:** ID institucional homologado → vínculo previamente validado → exceção.

**Turma:** código institucional + escola + ano letivo → chave composta homologada → exceção.

**Componente:** código curricular oficial + contexto acadêmico → chave homologada → exceção.

Nunca usar fuzzy matching como critério automático de publicação.

### Estados obrigatórios

- `resolved` — correspondência única e comprovada;
- `ambiguous` — mais de uma correspondência possível;
- `unresolved` — nenhuma correspondência confiável.

Somente registros `resolved`, estruturalmente válidos e dentro do escopo podem entrar em uma versão publicável.

## 7. Contrato mínimo do adaptador de grade

O adaptador deverá produzir um payload intermediário equivalente a:

```text
source
source_file / source_reference
source_row_reference
organization_external_id
school_external_id
teacher_external_id
class_external_id
component_external_id
academic_year
academic_period_external_id
weekday/date
start_time
end_time
shift
valid_from
valid_until
raw_payload
normalized_payload
matching_status
matching_errors
source_hash
```

O adaptador não publica diretamente na grade oficial. Ele apenas entrega dados normalizados ao staging.

## 8. Regras de qualidade antes da publicação

A publicação deve ser bloqueada quando houver:

1. escola não resolvida;
2. docente não resolvido;
3. turma não resolvida;
4. componente não resolvido;
5. horário inválido (`end <= start`);
6. duplicidade incompatível;
7. conflito de escopo organização/escola;
8. validade inconsistente;
9. versão sem origem/rastreabilidade;
10. ausência de responsável pela publicação.

Também deve ser verificada a integridade composta entre organização, escola, ano letivo, turma, docente e componente.

## 9. Identidade docente — decisão de auditoria

A auditoria não encontrou evidência suficiente para eliminar a necessidade de `academic_teacher_identity_links`.

**Decisão:** manter a entidade como **condicional, porém altamente provável**, até que seja comprovado um vínculo Auth ↔ `teacher_profiles` em estrutura existente.

Isso evita dois erros:

- assumir que `teacher_profiles.id` é automaticamente um usuário autenticado;
- criar duplicação de identidade dentro da Escala.

## 10. Fonte inicial recomendada

Como ainda não existe integração institucional de grade comprovada, a arquitetura deve começar por um **importador de fonte oficial homologada**, sem fixar antecipadamente um fornecedor ou sistema específico.

O primeiro contrato de entrada deve ser suficientemente explícito para receber:

- CSV;
- XLSX;
- exportação de sistema escolar;
- integração API futura.

Todos devem convergir para o mesmo staging e para o mesmo contrato de publicação.

## 11. Auditoria de segurança e governança

O arquivo bruto e o staging podem conter dados institucionais e docentes e devem permanecer protegidos por RLS e/ou Storage privado.

Professor comum não deve acessar staging bruto nem resultados de matching de outros docentes.

Gestor somente poderá revisar exceções dentro do escopo de responsabilidade e das permissões Escala.

A publicação deve gerar registro de responsável, versão, hash da fonte, data/hora e resultado da validação.

A decisão administrativa de substituir permanece humana; o motor apenas recomenda.

## 12. Achados da auditoria

### ORIG-AUD-01 — Fonte oficial inexistente no Core atual
**Severidade:** CRITICAL  
**Status:** ABERTO  
**Evidência:** não foi localizada tabela física versionada de grade nem integração de horário no repositório/Core.

### ORIG-AUD-02 — Identificador docente externo não homologado
**Severidade:** CRITICAL  
**Status:** ABERTO  
**Evidência:** `teacher_profiles` não possui `user_id` e não foi comprovado identificador institucional externo de grade.

### ORIG-AUD-03 — Identificador oficial de turma não homologado
**Severidade:** CRITICAL  
**Status:** ABERTO

### ORIG-AUD-04 — Identificador curricular não homologado
**Severidade:** CRITICAL  
**Status:** ABERTO

### ORIG-AUD-05 — Padrão de importação reutilizável
**Severidade:** LOW  
**Status:** APROVADO COMO REFERÊNCIA  
**Evidência:** importador de `school_registry` com validação de cabeçalho, normalização e processamento em lotes.

### ORIG-AUD-06 — Agenda não deve ser promovida a fonte oficial
**Severidade:** HIGH  
**Status:** APROVADO / REGRA PERMANENTE

### ORIG-AUD-07 — Fuzzy matching automático
**Severidade:** HIGH  
**Status:** BLOQUEADO  
**Regra:** aproximação textual pode auxiliar revisão, mas nunca publicar automaticamente uma correspondência ambígua.

### ORIG-AUD-08 — Proveniência do arquivo bruto
**Severidade:** HIGH  
**Status:** ABERTO  
**Ação:** definir Storage privado ou referência externa imutável antes da implementação do importador.

## 13. Gate de implementação

A próxima implementação poderá ser iniciada somente para **staging/adaptador**, sem publicar grade e sem criar FKs dependentes de entidades ainda não homologadas.

Antes do primeiro DDL de produção da grade, deverão estar fechados:

- fonte homologada;
- identificador docente;
- identificador de turma;
- identificador curricular;
- regra de canonização;
- vínculo Auth quando necessário;
- integridade composta;
- RLS e permissões `escala.*`;
- política de Storage/proveniência;
- publicação transacional;
- integração de governance/auditoria;
- testes de reprodução histórica.

## 14. Decisão final

**Origem real de grade encontrada:** NÃO.  
**Importador de referência encontrado:** SIM, apenas para `school_registry`.  
**Agenda como fonte oficial:** REJEITADA.  
**Adaptador de fonte:** APROVADO COMO PRÓXIMA CAMADA.  
**Canonização:** CONTRATO DEFINIDO.  
**Identidade docente:** AINDA BLOQUEADA.  
**DDL de grade em produção:** NÃO LIBERADO.

### Próximo passo técnico

Construir e auditar o **contrato de staging/adaptador de grade**, com fixture sintética para testar normalização, matching `resolved/ambiguous/unresolved`, rejeição de conflitos temporais, hash/idempotência e rastreabilidade — sem utilizar dados reais de docentes ou alunos e sem executar DDL de produção.

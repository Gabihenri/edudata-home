# 17 — Auditoria de Identidade Docente e Contrato de Importação da Grade v1

**Data:** 2026-09-09  
**Produto:** Escala Inteligente de Substituição  
**Status:** 🟡 AUDITORIA CONCLUÍDA — DDL DE PRODUÇÃO AINDA BLOQUEADO

## 1. Objetivo

Fechar duas dependências críticas antes da criação física do núcleo da Escala:

1. identidade canônica do docente e seu vínculo com autenticação/autorização;
2. contrato operacional para importar, validar, versionar e publicar a grade oficial.

Regra permanente: **sempre com auditoria**. A existência de uma coluna ou de um registro não é considerada prova suficiente de identidade sem evidência de vínculo semântico.

## 2. Evidência física do Core

Auditoria read-only realizada no projeto Supabase `EduData IA` (`ihchzfndmdwtoabttkil`) em 09/09/2026.

### 2.1 `teacher_profiles`

A tabela existe fisicamente e possui `id uuid`, `name`, `email`, `school_id`, `organization_id`, `knowledge_area`, `teaching_stage`, `subjects`, `professional_registration` e demais atributos profissionais.

**Achado:** não existe `user_id` em `teacher_profiles`. Portanto, não foi comprovado que `teacher_profiles.id = auth.users.id`.

### 2.2 `organization_members`

A tabela existe fisicamente e possui `user_id`, `organization_id`, `school_id`, `role`, `status`, escopo hierárquico, responsabilidades e permissões institucionais.

A consulta física realizada retornou **0 registros** em `organization_members` no momento da auditoria. Portanto, não há dados reais suficientes para provar, por amostragem, a associação entre um perfil docente e um usuário autenticado.

### 2.3 `users` / `identity_users`

As tabelas `public.users` e `public.identity_users` não foram encontradas na auditoria física anterior. O vínculo de autenticação deve, portanto, ser tratado como dependência explícita e não inferido por nome ou e-mail.

## 3. Decisão de identidade docente

### 3.1 O que está aprovado

`teacher_profiles.id` é reconhecido como **identificador do perfil docente no domínio profissional atual**, porque o registro possui escola e organização.

### 3.2 O que permanece bloqueado

Não está aprovado utilizar `teacher_profiles.id` como substituto de `auth.uid()`.

Também é proibido estabelecer identidade por:

- nome;
- e-mail isolado;
- posição na lista de professores;
- correspondência aproximada.

### 3.3 Contrato recomendado

A Escala deve trabalhar com duas identidades relacionadas:

```text
Auth / identidade institucional
        ↓ vínculo explícito
teacher_profiles.id
        ↓
identidade docente acadêmica
```

Até que o vínculo seja comprovado, o modelo físico deve prever uma relação explícita e auditável, denominada provisoriamente `academic_teacher_identity_links`, contendo no mínimo:

- `id uuid`;
- `organization_id uuid`;
- `school_id uuid`;
- `teacher_profile_id uuid`;
- `auth_user_id uuid`;
- `status` (`pending`, `active`, `revoked`);
- `valid_from`;
- `valid_until`;
- `source`;
- `verified_by`;
- `verified_at`;
- `metadata`;
- timestamps.

A relação deve impedir mais de um vínculo ativo para a mesma identidade no mesmo escopo quando essa unicidade for semanticamente aplicável.

## 4. RBAC não deve ser duplicado

A autorização permanece centralizada no Core por `identity_roles`, `organization_members`, `identity_responsibility_scopes` e `identity_product_permissions`.

A Escala deve apenas materializar seu produto/permissões, por exemplo:

- `escala.view_vacancies`;
- `escala.view_candidates`;
- `escala.view_explanations`;
- `escala.run_engine`;
- `escala.rerun_engine`;
- `escala.confirm_substitution`;
- `escala.override_decision`;
- `escala.view_audit`.

Nenhuma política da Escala deve conceder acesso a colegas apenas porque pertencem à mesma organização.

## 5. Auditoria do padrão de importação existente

O repositório já possui um importador de cadastro escolar por CSV. O script `src/scripts/import-school-registry.ts` exige cabeçalho conhecido, normaliza dados, valida código INEP/coordenadas e processa registros em lotes; o `package.json` expõe `import:school-registry`. Isso comprova a existência de um padrão técnico de importação, mas **não** constitui o contrato da grade oficial.

Para a grade, o padrão deve ser mais rigoroso porque os dados alimentarão decisões operacionais de substituição.

## 6. Contrato de importação da grade oficial

### 6.1 Fontes aceitas

O MVP deve aceitar inicialmente:

1. CSV;
2. XLSX, quando o pipeline de leitura estiver homologado;
3. API ou integração institucional, quando disponível;
4. entrada manual somente para correção/resolução controlada, nunca como mecanismo silencioso de alteração da publicação.

### 6.2 Unidade de importação

Cada importação deve possuir um identificador de lote (`import_batch_id`) e registrar:

- organização;
- escola;
- ano letivo;
- período de validade;
- origem;
- nome do arquivo ou referência externa;
- hash do conteúdo;
- data/hora de recebimento;
- operador/responsável;
- quantidade de linhas;
- quantidade válida;
- quantidade inválida;
- quantidade ambígua;
- quantidade não resolvida;
- resultado da validação.

### 6.3 Preservação da fonte

O dado bruto da importação deve ser preservado ou referenciado de forma reproduzível. A transformação para o modelo canônico não pode destruir a evidência original.

O pipeline deve seguir:

```text
Fonte
  ↓
Staging bruto
  ↓
Normalização
  ↓
Matching
  ↓
Validação estrutural
  ↓
Validação semântica
  ↓
Versão candidata
  ↓
Revisão/publicação
  ↓
Versão oficial publicada
```

## 7. Matching obrigatório

Cada referência externa de docente, turma e componente deve produzir explicitamente um estado:

- `resolved` — correspondência inequívoca;
- `ambiguous` — existem múltiplas possibilidades;
- `unresolved` — nenhuma correspondência segura.

Somente `resolved` pode alimentar automaticamente a grade publicada.

`ambiguous` e `unresolved` exigem resolução humana autorizada ou ficam fora da publicação.

É proibido usar similaridade textual de nome como decisão final de identidade.

## 8. Validações antes da publicação

A publicação deve bloquear a versão quando houver:

- escola inexistente ou incompatível com a organização;
- ano letivo inexistente/inativo;
- turma não resolvida;
- componente curricular não resolvido;
- docente não resolvido;
- intervalo com `end_time <= start_time`;
- ocorrência duplicada incompatível;
- sobreposição impossível para a mesma obrigação docente/turma quando a regra institucional a proibir;
- validade temporal inconsistente;
- ausência de responsável pela publicação;
- hash ou origem ausente;
- falha de integridade referencial.

Validações de conflito temporal devem usar intervalos concretos, não apenas dia/horário nominal.

## 9. Versionamento e publicação

A grade nunca deve ser atualizada silenciosamente.

Cada publicação deve criar uma nova `official_schedule_version`, contendo no mínimo:

- organização/escola;
- ano letivo;
- número ou identificador da versão;
- `valid_from` / `valid_until`;
- status (`draft`, `validated`, `published`, `superseded`, `revoked`);
- origem;
- hash;
- criado por;
- validado por;
- publicado por;
- timestamps.

Somente uma versão explicitamente `published` e validada pode ser consumida pelo motor de substituição.

Uma correção gera nova versão. A versão anterior permanece histórica e não deve ser apagada para esconder a alteração.

## 10. Integração com o motor da Escala

Cada execução do motor deve registrar a versão exata da grade consumida.

A cadeia mínima de proveniência será:

```text
import_batch
   ↓
official_schedule_version
   ↓
official_schedule_occurrence
   ↓
substitution_vacancy
   ↓
engine_run
   ↓
candidates / ranking
   ↓
human decision
```

Isso permite reproduzir por que determinada substituição foi recomendada em uma data passada.

## 11. Auditoria de segurança

### AUD-IDENT-08 — Identidade Auth ↔ docente
**Severidade:** CRITICAL  
**Status:** ABERTO  
**Evidência:** `teacher_profiles` não possui `user_id`; `organization_members` está sem registros no momento da auditoria.  
**Ação:** comprovar vínculo ou materializar `academic_teacher_identity_links`.

### AUD-IMPORT-01 — Staging e rastreabilidade
**Severidade:** HIGH  
**Status:** ABERTO  
**Ação:** criar contrato físico de lote/staging e preservar origem/hash.

### AUD-IMPORT-02 — Matching determinístico
**Severidade:** CRITICAL  
**Status:** ABERTO  
**Ação:** impedir publicação automática de `ambiguous`/`unresolved`.

### AUD-IMPORT-03 — Publicação versionada
**Severidade:** CRITICAL  
**Status:** ABERTO  
**Ação:** somente versão publicada e validada pode alimentar produção.

### AUD-IMPORT-04 — Integridade temporal
**Severidade:** HIGH  
**Status:** ABERTO  
**Ação:** validar intervalos, duplicidades, validade e conflitos antes da publicação.

### AUD-IMPORT-05 — RBAC da Escala
**Severidade:** HIGH  
**Status:** ABERTO  
**Ação:** materializar permissões `escala.*` no Core e testar escopo.

### AUD-IMPORT-06 — Reprodução histórica
**Severidade:** HIGH  
**Status:** ABERTO  
**Ação:** engine run deve referenciar versão da grade, regras e entradas utilizadas.

## 12. Critérios de liberação para DDL

O DDL de produção continua bloqueado até que exista evidência de:

1. identidade docente ↔ Auth comprovada ou relação explícita homologada;
2. modelo físico de turma oficial;
3. modelo físico de componente curricular canônico;
4. staging/import batch com hash e origem;
5. matching com estados `resolved/ambiguous/unresolved`;
6. validação e publicação transacional;
7. versionamento da grade;
8. permissões `escala.*` materializadas;
9. RLS testada para professor, gestor, diretor e auditor;
10. integração com EIOS governance/provenance definida;
11. testes de reprodução histórica e conflito temporal;
12. auditoria final sem achados Critical/High abertos.

## 13. Resultado

**Identidade docente:** ainda não comprovada como identidade de autenticação. A relação explícita é a solução segura de contingência até prova em contrário.

**Importação:** o repositório possui padrão técnico de importação CSV, mas a grade exige um pipeline próprio, versionado, auditável e com publicação controlada.

**Decisão:** avançar na especificação e nos testes de contrato, mas **não executar DDL de produção ainda**.

Próximo gate técnico: definir o esquema físico de `academic_teacher_identity_links`, `academic_classes`, `academic_components` e o conjunto de staging/publicação da grade; depois executar auditoria estrutural e somente então preparar a primeira migration real.
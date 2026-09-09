# 39 — Auditoria do Catálogo de Permissões e da Carga Docente v1

**Data:** 2026-09-09  
**Status:** 🔴 GATE BLOQUEADO  
**Produto:** Escala Inteligente de Substituição

## 1. Objetivo

Auditar as duas dependências críticas identificadas na auditoria 38 antes de qualquer DDL da ponte `academic_teacher_identity_links`:

1. existência de permissões centrais para o produto Escala;
2. existência e origem operacional dos perfis em `teacher_profiles`.

A auditoria foi realizada sem alteração de dados e sem DDL de produção.

## 2. Evidência física do catálogo de produtos

Consulta direta ao Core retornou os seguintes `product_code`:

- `academy`
- `agenda_edi`
- `analytics`
- `backoffice`
- `experience_manager`
- `professor_digital`
- `sgpa`

**Não foi encontrado `escala` nem código equivalente de substituição.**

### PERM-AUD-01 — produto Escala ausente

**Severidade:** Critical  
**Estado:** ABERTO

A autorização central existe, mas o produto Escala ainda não está representado no catálogo físico de `identity_product_permissions`.

**Consequência:** não é seguro criar policies da ponte referenciando permissões Escala que ainda não foram homologadas no catálogo.

**Decisão:** não inserir permissões automaticamente nesta etapa. A inclusão deverá ser uma mudança explícita do Core de identidade, acompanhada de matriz de papéis e auditoria.

## 3. Evidência física de `teacher_profiles`

A estrutura física atual de `teacher_profiles` contém, entre outros campos:

- `id` UUID;
- `name`;
- `email`;
- `school_id`;
- `organization_id`;
- `role`;
- `knowledge_area`;
- `teaching_stage`;
- `subjects`;
- `professional_registration`;
- `onboarding_completed`.

A auditoria física anterior encontrou **0 registros** na tabela.

### TEACH-AUD-01 — perfil docente sem dados operacionais

**Severidade:** Critical  
**Estado:** ABERTO

Sem registros reais, não é possível comprovar:

- como o docente institucional é criado;
- qual sistema fornece seu identificador;
- como organização e escola são atribuídas;
- se um mesmo docente pode possuir mais de uma escola;
- quais campos são confiáveis para matching;
- como a carga é atualizada sem perda histórica.

**Consequência:** não há base factual para homologar ainda a ponte Auth ↔ docente.

## 4. Evidência histórica não reutilizável diretamente

O arquivo legado `database/03_users_profiles.sql` definia `teacher_profiles.user_id` e uma FK para `users.id`.

Essa relação pertence ao modelo legado e não deve ser restaurada automaticamente no Core atual.

A arquitetura atual usa `user_profiles.user_id` como identidade de usuário e mantém `teacher_profiles` sem FK Auth.

### TEACH-AUD-02 — legado identificado

**Severidade:** High  
**Estado:** FECHADO COMO DECISÃO

O legado é tratado apenas como evidência histórica de uma estratégia anterior. Ele não é fonte canônica para a implementação atual.

## 5. Provisionamento de usuário não equivale a cadastro docente

A migration de perfil padrão cria `user_profiles` para usuários Auth e utiliza `professor` como perfil funcional inicial quando não há outro perfil válido.

Isso não cria um `teacher_profile` nem estabelece vínculo acadêmico.

### TEACH-AUD-03 — separação de conceitos

**Severidade:** Critical  
**Estado:** FECHADO COMO REGRA

```text
Auth user
   ≠
user_profile
   ≠
teacher_profile
```

Um usuário poder possuir perfil funcional `professor` não constitui prova suficiente de que ele representa um docente presente na grade oficial.

## 6. Fonte de carga docente ainda não homologada

A pesquisa no repositório não encontrou, nesta auditoria, uma fonte atual e comprovada que preencha `teacher_profiles` com identidade acadêmica institucional apta a alimentar a Escala.

O antigo modelo de usuários não deve ser reativado apenas para resolver essa lacuna.

### TEACH-AUD-04 — fonte de identidade docente

**Severidade:** Critical  
**Estado:** ABERTO

Antes da ponte física, deve ser definido um contrato de carga/homologação de docentes contendo, no mínimo:

- identificador institucional do docente, quando disponível;
- organização;
- escola;
- nome para exibição;
- componente/área, quando disponível;
- origem;
- identificador do sistema de origem;
- versão/lote da carga;
- vigência;
- estado do registro;
- responsável pela homologação;
- proveniência.

## 7. Política de matching

Fica reiterada a regra:

### Pode ser evidência

- identificador institucional homologado;
- referência Auth explicitamente validada;
- registro de origem;
- associação previamente homologada.

### Não pode ativar automaticamente

- nome;
- e-mail;
- combinação aproximada de nome + e-mail;
- cargo textual;
- escola isolada;
- posição em arquivo;
- similaridade/fuzzy matching.

Quando a origem não fornecer identificador confiável, o registro deverá entrar em fila de homologação manual.

## 8. Permissões necessárias para Escala

A arquitetura já definiu permissões operacionais candidatas:

```text
escala.view_vacancies
escala.view_candidates
escala.view_explanations
escala.run_engine
escala.rerun_engine
escala.confirm_substitution
escala.override_decision
escala.view_audit
```

Para o fluxo de identidade docente, é necessária adicionalmente uma permissão administrativa específica:

```text
escala.manage_teacher_identity_links
```

### PERM-AUD-02 — matriz de papéis ainda não homologada

**Severidade:** Critical  
**Estado:** ABERTO

Ainda não existe evidência física de que essas permissões estejam cadastradas nem de quais papéis podem executá-las.

A implementação futura deve definir explicitamente, no catálogo central:

| Capacidade | Professor | Coordenador | Direção/Admin institucional | Regional | Plataforma |
|---|---:|---:|---:|---:|---:|
| consultar próprio vínculo | permitido conforme escopo | permitido | permitido | permitido | não por padrão |
| criar pendência | não | conforme escopo | sim | conforme escopo | não por padrão |
| homologar vínculo | não | conforme delegação | sim | conforme escopo | não por padrão |
| revogar vínculo | não | conforme delegação | sim | conforme escopo | não por padrão |
| alterar vigência | não | conforme delegação | sim | conforme escopo | não por padrão |
| auditar | não | conforme permissão | sim | sim | sim, sem conteúdo privado automático |

A tabela acima é uma proposta de contrato e **não constitui autorização física ainda**.

## 9. Multi-escola

Como `teacher_profiles` está vazio, não há evidência operacional para validar multi-escola.

A decisão permanece:

- não aplicar unicidade global sobre `auth_user_id`;
- permitir múltiplos vínculos somente em contextos institucionais compatíveis;
- exigir homologação explícita para vínculo adicional quando necessário;
- preservar vigência e proveniência.

### MULTI-AUD-01

**Severidade:** High  
**Estado:** ABERTO

A política definitiva de multi-escola depende da fonte real de docentes e da regra institucional de lotação/atuação.

## 10. Fluxo administrativo proposto

O fluxo seguro passa a ser:

```text
Fonte institucional de docentes
          ↓
Carga/staging
          ↓
Validação estrutural
          ↓
Matching determinístico
          ↓
resolved / ambiguous / unresolved
          ↓
Homologação administrativa
          ↓
academic_teacher_identity_links
          ↓
active + vigência
          ↓
grade oficial
          ↓
Escala
```

Nenhum estágio posterior poderá promover automaticamente um registro sem identidade homologada.

## 11. Auditoria e governança

A homologação deve gerar evento em `identity_audit_logs` contendo, no mínimo:

- ator Auth;
- ação;
- organização/escola;
- identidade Auth envolvida;
- `teacher_profile_id` envolvido;
- estado anterior/posterior;
- origem;
- evidência;
- timestamp;
- justificativa quando aplicável.

Não será criado um terceiro ledger.

Quando a homologação integrar uma decisão operacional da Escala, a relação com `eios_governance_*` poderá ser registrada conforme o contrato de governança já existente.

## 12. Gate de segurança

| Achado | Severidade | Estado |
|---|---|---|
| autorização central existente | High | 🟢 |
| produto `escala` no catálogo | Critical | 🔴 |
| permissões `escala.*` homologadas | Critical | 🔴 |
| permissão de homologação docente | Critical | 🔴 |
| `teacher_profiles` com dados reais | Critical | 🔴 |
| fonte de carga docente | Critical | 🔴 |
| matching sem fuzzy | Critical | 🟢 |
| separação Auth/UserProfile/TeacherProfile | Critical | 🟢 |
| multi-escola | High | 🟡 |
| ledger central | High | 🟢 |

## 13. Próxima etapa autorizada

O próximo avanço **não é DDL**.

A etapa segura é especificar o **Contrato de Carga e Homologação de Docentes v1**, contemplando:

1. fonte de origem;
2. staging;
3. identificador institucional;
4. matching;
5. fila de exceções;
6. homologação manual;
7. vigência;
8. multi-escola;
9. integração com `teacher_profiles`;
10. integração posterior com `academic_teacher_identity_links`;
11. permissões administrativas;
12. auditoria.

Somente após esse contrato e sua auditoria será possível decidir se a próxima implementação deve ser staging docente, catálogo de permissões ou ponte de identidade.

**Conclusão:** a auditoria confirmou que a Escala possui a infraestrutura central de identidade necessária, mas ainda não possui nem o catálogo físico do produto Escala nem uma carga docente operacional comprovada. O gate permanece 🔴 e o DDL de produção continua bloqueado.
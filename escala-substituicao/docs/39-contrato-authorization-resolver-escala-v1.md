# Escala Inteligente EDI — Contrato do Authorization Resolver v1

**Status:** ESPECIFICAÇÃO — PRONTA PARA HOMOLOGAÇÃO  
**Produto:** Escala Inteligente EDI  
**Arquitetura:** Framework EDI → EIOS → Core Compartilhado → Escala Inteligente EDI  
**Gate:** GATE-FONTE-SED permanece RED/BLOCKED  
**Regra:** este documento não cria DDL, funções, policies ou permissões físicas.

## 1. Objetivo

Formalizar o resolvedor de autorização contextual da Escala Inteligente EDI antes de qualquer implementação física de RLS ou RPC.

O Resolver deve responder se um ator autenticado pode executar uma operação sobre um recurso da Escala em determinado contexto institucional, usando exclusivamente o Core Compartilhado como fonte canônica de identidade, membership, papel, produto, permissão e escopo.

O Resolver não substitui RLS. Ele fornece a decisão semântica que deverá ser aplicada por RPCs e políticas físicas.

## 2. Fonte canônica

A cadeia de decisão é:

`auth.uid()`
→ `user_profiles`
→ `organization_members`
→ papel canônico do Core
→ `identity_product_permissions`
→ `identity_responsibility_scopes`
→ contexto organização/escola
→ recurso da Escala
→ operação
→ auditoria/justificativa.

É proibido usar como fonte de autorização:

- `user_metadata.role`;
- `raw_user_meta_data`;
- nomes ou cargos informais enviados pelo cliente;
- `getCurrentUserRole()`;
- `requireUserRole()`;
- `AuthorizationService.can()` quando não delegar ao Core;
- existência isolada de permissão sem membership/escopo;
- relação nominal entre professor e recurso;
- inferência por escola, equipe ou cargo sem escopo válido.

## 3. Entrada canônica

O Resolver recebe:

- `actor_user_id`: usuário autenticado;
- `organization_id`: organização do contexto;
- `school_id`: escola do contexto, quando aplicável;
- `operation`: operação Escala;
- `resource_type`: tipo do recurso;
- `resource_id`: identificador do recurso, quando aplicável;
- `target_user_id`: alvo da operação, quando aplicável;
- `justification`: justificativa textual quando exigida.

A data/hora efetiva deve ser obtida do banco no momento da decisão para validar vigência de membership e escopo.

## 4. Saída canônica

O resultado deve conter, no mínimo:

- `allowed`;
- `denial_code`;
- `actor_user_id`;
- `organization_id`;
- `school_id`;
- `membership_id`;
- `role_code`;
- `product_code`;
- `operation`;
- `scope_id`;
- `scope_type`;
- `permission_level`;
- `resource_type`;
- `resource_id`;
- `requires_audit`;
- `requires_justification`.

Quando a autorização for negada, `denial_code` deve ser determinístico e não revelar dados institucionais desnecessários.

## 5. Ordem de resolução

A ordem obrigatória é:

1. autenticação válida;
2. ator identificado;
3. organização existente;
4. escola existente, quando exigida;
5. escola pertencente à organização;
6. membership ativa e vigente;
7. papel canônico do Core;
8. produto Escala concedido e ativo;
9. operação concedida ao papel;
10. escopo existente, ativo e vigente quando a operação exigir gestão;
11. compatibilidade do escopo com organização/escola/recurso;
12. ownership/assignment quando a operação exigir;
13. justificativa, quando obrigatória;
14. requisito de auditoria;
15. retorno da decisão.

Falhar em qualquer etapa encerra a resolução sem fallback permissivo.

## 6. Códigos de negação

Catálogo obrigatório:

- `AUTH_REQUIRED`
- `ACTOR_NOT_FOUND`
- `RESOURCE_NOT_FOUND`
- `ORG_CONTEXT_INVALID`
- `SCHOOL_CONTEXT_INVALID`
- `SCHOOL_ORG_MISMATCH`
- `MEMBERSHIP_NOT_FOUND`
- `MEMBERSHIP_INACTIVE`
- `MEMBERSHIP_NOT_YET_VALID`
- `MEMBERSHIP_EXPIRED`
- `PRODUCT_NOT_GRANTED`
- `OPERATION_NOT_GRANTED`
- `SCOPE_NOT_FOUND`
- `SCOPE_WRONG_ORGANIZATION`
- `SCOPE_WRONG_SCHOOL`
- `SCOPE_INACTIVE`
- `SCOPE_EXPIRED`
- `SCOPE_INSUFFICIENT_LEVEL`
- `RESOURCE_NOT_OWNED`
- `RESOURCE_NOT_ASSIGNED`
- `JUSTIFICATION_REQUIRED`
- `AUDIT_REQUIRED`
- `AUTHORIZATION_CONTEXT_INVALID`

Não criar códigos equivalentes com semântica duplicada sem revisão do contrato.

## 7. Operações Escala

Operações canônicas:

- `escala.view_vacancies`
- `escala.view_candidates`
- `escala.view_explanations`
- `escala.run_engine`
- `escala.rerun_engine`
- `escala.confirm_substitution`
- `escala.override_decision`
- `escala.view_audit`
- `escala.manage_teacher_identity_links`

A existência do código da operação não concede acesso. A operação somente é autorizada após produto + papel + permissão + contexto + escopo + regras do recurso.

## 8. Regras por perfil

### Teacher

Pode consultar somente recursos próprios ou explicitamente atribuídos dentro do contexto autorizado:

- vagas;
- candidatos;
- explicações.

Não recebe automaticamente:

- execução do motor;
- reexecução;
- confirmação;
- override;
- homologação de identidade docente;
- auditoria administrativa.

### Coordinator

Dentro do escopo institucional válido:

- visualizar;
- executar;
- reexecutar;
- confirmar;
- consultar auditoria conforme permissão.

Não recebe override ou homologação de identidade automaticamente.

### Vice-principal

Dentro do escopo válido:

- visualizar;
- executar;
- reexecutar;
- confirmar;
- override quando explicitamente concedido.

### Principal

Pode receber, mediante permissão e escopo explícitos:

- operações administrativas;
- override;
- homologação de identidade docente;
- auditoria.

Cargo superior fora da organização ou fora do escopo não herda autorização.

## 9. Escopo

O escopo deve ser compatível simultaneamente com:

- organização;
- escola, quando definida;
- vigência temporal;
- estado ativo;
- nível de permissão necessário.

Um escopo de outra organização não autoriza a organização corrente.

Um escopo de outra escola não autoriza automaticamente a escola corrente.

Escopo expirado, revogado ou inativo deve negar a operação.

Permissão de nível `view` não substitui escopo de gestão.

## 10. Ownership e assignment

Para operações de gestão ou consulta restrita, o Resolver deve validar a relação do ator com o recurso.

Para professor, a visualização de vaga/candidato/explicação não pode ser inferida apenas pela membership escolar.

A autorização deve depender de ownership/assignment explícito ou regra de escopo formalmente prevista.

Não usar nome do professor, e-mail, CPF, componente curricular ou coincidência temporal como substituto de assignment.

## 11. Justificativa e auditoria

Operações sensíveis devem exigir justificativa quando o contrato determinar, especialmente:

`escala.override_decision`

e

`escala.manage_teacher_identity_links`.

A ausência de justificativa válida produz:

`JUSTIFICATION_REQUIRED`

Operações marcadas como auditáveis devem gerar registro no mecanismo central de governança do EIOS, sem criar ledger paralelo da Escala.

A autorização e o registro de auditoria devem participar da mesma unidade transacional quando a operação modificar estado.

## 12. RPC direta

Nenhuma RPC operacional da Escala pode executar mutação antes de chamar a autorização canônica.

É proibido:

1. confiar apenas no cliente;
2. aceitar um `role` enviado pelo frontend;
3. aceitar `organization_id` ou `school_id` sem validar pertencimento;
4. usar somente `TO authenticated`;
5. executar mutação e verificar autorização depois;
6. criar caminho administrativo alternativo que ignore o Resolver.

A RPC deve falhar fechada quando o Resolver negar.

## 13. Integração com RLS

RLS permanece segunda barreira, não substituto do Resolver.

Modelo:

`Cliente → RPC/API → Authorization Resolver → mutação → EIOS Governance`

e, em paralelo:

`RLS → limite físico das linhas acessíveis`.

Uma policy não deve conceder acesso simplesmente porque o usuário está autenticado.

As policies devem respeitar a mesma semântica institucional do Core e não criar RBAC paralelo.

## 14. Multi-organização

Um mesmo usuário pode possuir memberships em organizações distintas.

A decisão deve ser sempre contextual.

O papel exercido em `ORG_A` não é herdado para `ORG_B`.

O contexto institucional deve ser resolvido pela membership ativa correspondente à organização solicitada.

## 15. Identidade docente

O Resolver não pode transformar automaticamente:

`auth.uid() → teacher_profile_id`

sem uma ponte homologada.

A relação futura deve usar `academic_teacher_identity_links`, com:

- organização;
- escola;
- teacher_profile;
- auth_user;
- estado;
- vigência;
- origem;
- verificador;
- timestamp de verificação;
- proveniência.

O motor da Escala opera com `teacher_profile_id`, não com `auth_user_id`.

## 16. Casos negativos obrigatórios

O Resolver deve negar:

- usuário não autenticado;
- ator inexistente;
- membership inexistente;
- membership inativa;
- membership futura;
- membership expirada;
- produto Escala ausente;
- operação não concedida;
- escopo ausente para operação de gestão;
- escopo de outra organização;
- escopo de outra escola;
- escopo expirado;
- escopo revogado;
- recurso inexistente;
- recurso fora do ownership/assignment;
- override sem justificativa;
- chamada RPC direta sem autorização.

## 17. Casos positivos obrigatórios

O Resolver deve permitir, quando todos os requisitos estiverem satisfeitos:

- professor consultando recurso explicitamente atribuído;
- coordenador executando motor dentro do escopo;
- coordenador confirmando substituição dentro do escopo;
- principal realizando override com permissão, escopo e justificativa;
- usuário com memberships válidas em duas organizações operando no contexto correto.

## 18. Correspondência com os harnesses

AUTH-07–AUTH-20 validam o contrato sintético.

R03/R15/R16 validam invariantes de dados operacionais.

CHAIN-01/CHAIN-02 validam estados e histórico.

CONC-01–CONC-10 definem o contrato de concorrência.

AT-01–AT-05 definem o contrato de atomicidade.

Nenhum desses harnesses, isoladamente, libera produção.

## 19. Gate de implementação

A implementação física somente poderá avançar quando:

- este contrato estiver homologado;
- GATE-FONTE-SED estiver resolvido para E3;
- `academic_teacher_identity_links` estiver fisicamente definido e homologado;
- permissões Escala estiverem definidas no Core;
- Resolver físico estiver implementado;
- RLS físico estiver implementado;
- PostgreSQL real validar as operações críticas;
- auditoria EIOS estiver integrada à autorização Escala;
- não houver Critical/High aberto no caminho de produção da Escala.

## 20. Decisão desta especificação

**Estado:** READY FOR IMPLEMENTATION REVIEW.

**Não autorizado por este documento:**

- DDL de produção;
- criação de tabelas `escala.*`;
- inserção de `product_code='escala'`;
- criação de policies Escala;
- criação de RPC produtiva;
- importação de E3;
- inferência de relação SED.

A próxima etapa física, após os gates externos, é implementar o Resolver usando exclusivamente o Core compartilhado e validá-lo com os casos AUTH-07–AUTH-20 e RLS correspondente.

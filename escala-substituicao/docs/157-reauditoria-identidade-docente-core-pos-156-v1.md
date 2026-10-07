# 157 — Reauditoria da Identidade Docente no Core após 156 v1

**Data:** 07/10/2026  
**Status:** 🔴 PONTE AUTH ↔ DOCENTE AUSENTE

## Verificação física

Foram rechecadas as estruturas:

- `user_profiles`;
- `organization_members`;
- `teacher_profiles`;
- `identity_responsibility_scopes`;
- existência de `academic_teacher_identity_links`.

Resultado:

- `teacher_profiles`: sem dados operacionais;
- `organization_members`: sem dados operacionais;
- `identity_responsibility_scopes`: sem dados operacionais;
- `academic_teacher_identity_links`: tabela física não existe;
- `teacher_profiles`: não possui coluna canônica `user_id` ou `auth_user_id`.

## Decisão de identidade

O vínculo futuro deverá seguir explicitamente:

`auth.users`
→ `user_profiles`
→ `organization_members`
→ vínculo acadêmico homologado
→ `teacher_profiles`

O motor da Escala continuará usando `teacher_profile_id`, não `auth_user_id`.

## Proibições mantidas

Não realizar correspondência por:

- nome;
- e-mail;
- CPF;
- fuzzy matching;
- coincidência de UUID;
- Agenda;
- coincidência temporal;
- histórico não homologado.

## Consequência

A identidade docente permanece um gate de integração.

O próximo passo autorizado, quando houver dados reais, é:

1. identificar o professor no artefato SED;
2. identificar o usuário institucional correspondente;
3. comprovar organização e escola;
4. registrar a homologação;
5. manter proveniência e responsável;
6. ativar o vínculo somente após validação;
7. executar o harness de isolamento e autorização contra o Core real.

Não criar a ponte física agora sem os dados e a homologação necessários.

Nenhuma alteração de produção foi realizada.

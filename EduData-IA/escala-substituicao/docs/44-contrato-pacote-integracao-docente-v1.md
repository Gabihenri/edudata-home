# 44 — Contrato do Pacote de Integração Docente v1

**Data:** 2026-09-09  
**Status:** definido — sem alteração de produção.

## Objetivo

Consolidar o que precisa estar disponível para transformar a especificação de carga/homologação docente em integração segura com o Core, sem criar dados fictícios nem reativar o modelo legado.

## Pacote mínimo de entrada

A integração somente pode ser iniciada quando houver, para cada escola/contexto:

1. organização canônica;
2. escola canônica;
3. período/ano letivo aplicável;
4. fonte institucional identificada;
5. versão/hash da fonte;
6. identificador institucional estável do docente;
7. nome oficial da fonte apenas como atributo, nunca como chave de matching;
8. situação funcional/operacional, quando fornecida;
9. vigência do vínculo;
10. responsável pela publicação/validação da carga.

## Fluxo de promoção

```text
Fonte institucional
      ↓
Import batch
      ↓
Raw rows imutáveis
      ↓
Normalização
      ↓
Matching por ID institucional
      ↓
resolved / ambiguous / unresolved / rejected
      ↓
Fila de exceções
      ↓
Homologação autorizada
      ↓
teacher_profiles
      ↓
academic_teacher_identity_links
      ↓
Grade oficial
      ↓
Motor de substituição
```

## Regras de promoção

### Criar/atualizar `teacher_profiles`

Permitido somente quando:

- o identificador institucional foi validado;
- organização e escola foram resolvidas;
- a linha não está ambígua;
- a fonte está em estado válido/publicável;
- a operação é idempotente;
- alterações preservam proveniência e histórico.

### Criar vínculo Auth ↔ docente

Permitido somente quando:

- o `auth_user_id` foi explicitamente identificado;
- o usuário possui membership institucional compatível;
- o `teacher_profile_id` pertence à mesma organização/escola;
- o vínculo foi homologado por ator autorizado;
- a vigência é válida;
- não existe sobreposição temporal;
- a decisão foi auditada.

**Nome, e-mail ou similaridade textual nunca promovem automaticamente um vínculo.**

## Multi-escola

Um mesmo docente pode possuir vínculos independentes em escolas distintas. Cada vínculo deve carregar organização, escola e vigência próprias.

A autorização de atuação também é contextual: acesso a uma escola não implica acesso às demais.

## Atualização e desligamento

A fonte nova nunca deve apagar silenciosamente um docente histórico.

- alteração → nova evidência/versionamento;
- desligamento → status/vigência encerrada;
- correção → nova versão, preservando origem anterior;
- revogação de identidade → histórico preservado.

## Critério de rejeição automática

A linha deve ser encaminhada para exceção quando houver:

- identificador ausente;
- identificador duplicado no mesmo contexto;
- organização/escola incompatível;
- múltiplos candidatos canônicos;
- Auth incompatível;
- vigência conflitante;
- fonte não validada;
- tentativa de matching por nome/e-mail/fuzzy.

## Auditoria obrigatória

Cada promoção, rejeição, correção, homologação, revogação e reativação deve possuir evidência de:

- ator;
- timestamp;
- organização/escola;
- origem e versão da fonte;
- estado anterior;
- estado posterior;
- motivo;
- identificadores envolvidos;
- referência de proveniência.

O registro deve utilizar `identity_audit_logs` e os mecanismos EIOS existentes, sem criar terceiro ledger.

## Gate de entrada em produção

Todos os itens abaixo devem estar verdes:

- [ ] fonte institucional real homologada;
- [ ] identificador institucional confirmado;
- [ ] amostra real carregada em staging;
- [ ] matching auditado;
- [ ] fila de exceções validada;
- [ ] ator de homologação autorizado;
- [ ] permissões `escala` publicadas no catálogo central;
- [ ] RLS da ponte homologada;
- [ ] Auth ↔ docente validado com dados reais;
- [ ] harness DOC executado;
- [ ] harness AUTH executado;
- [ ] auditoria final aprovada.

Até então, **nenhuma DDL operacional da Escala deve ser aplicada em produção**.

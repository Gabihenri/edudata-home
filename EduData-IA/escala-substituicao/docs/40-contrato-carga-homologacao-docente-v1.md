# 40 — Contrato de Carga e Homologação de Docentes v1

**Data:** 2026-09-09  
**Status:** 🟡 CONTRATO DEFINIDO — NÃO EXECUTAR DDL  
**Produto:** Escala Inteligente de Substituição

## 1. Objetivo

Definir o contrato seguro para transformar uma fonte institucional de docentes em identidades acadêmicas utilizáveis pela Escala, preservando origem, evitando inferência indevida e separando:

```text
identidade Auth
≠
perfil funcional
≠
identidade acadêmica docente
```

O contrato prepara a futura integração com `teacher_profiles` e `academic_teacher_identity_links` sem alterar a produção.

## 2. Princípios

1. A fonte institucional é a autoridade sobre a existência/lotação acadêmica do docente.
2. Auth é autoridade sobre autenticação, não sobre lotação acadêmica.
3. `user_profiles.role = professor` não prova que o usuário consta como docente na grade.
4. Nome e e-mail podem auxiliar revisão, mas nunca promovem automaticamente um vínculo para `active`.
5. Todo dado importado deve preservar a origem original.
6. Nenhuma carga pode apagar silenciosamente uma identidade existente.
7. Correções devem gerar nova evidência/versionamento quando alterarem interpretação histórica.
8. Dados ambíguos ou não resolvidos permanecem fora do motor.
9. Homologação humana é obrigatória quando não existir identificador institucional confiável.
10. Toda homologação deve ser auditável no ledger central de identidade.

## 3. Fluxo canônico

```text
Fonte institucional
      ↓
Lote de importação
      ↓
Staging bruto/imutável
      ↓
Normalização não destrutiva
      ↓
Validação estrutural
      ↓
Matching determinístico
      ↓
resolved / ambiguous / unresolved / rejected
      ↓
Homologação administrativa
      ↓
teacher_profiles
      ↓
academic_teacher_identity_links
      ↓
grade oficial
      ↓
motor da Escala
```

## 4. Fonte institucional

A fonte poderá ser arquivo, sistema da rede ou outro mecanismo oficialmente reconhecido pela instituição.

O contrato da fonte deve fornecer, quando disponíveis:

- identificador institucional do docente;
- nome oficial;
- escola;
- organização/rede;
- matrícula/registro profissional institucional, quando aplicável;
- situação funcional;
- área/componente;
- vigência;
- identificador da turma ou grade quando a relação existir;
- versão do arquivo/sistema;
- data de extração;
- responsável pela emissão.

**Nenhuma fonte específica é considerada homologada enquanto não houver evidência real de sua estrutura e autoridade institucional.**

## 5. Lote de importação

Cada carga deve possuir identidade própria e ser reprocessável de forma idempotente.

Campos conceituais mínimos:

| Campo | Regra |
|---|---|
| `id` | UUID |
| `organization_id` | contexto institucional |
| `school_id` | quando a carga for escolar |
| `source_system` | obrigatório |
| `source_version` | quando disponível |
| `source_hash` | obrigatório para idempotência |
| `filename` | quando aplicável |
| `imported_at` | obrigatório |
| `imported_by` | ator responsável |
| `status` | recebido/processado/validado/rejeitado |
| `metadata` | contexto adicional |

A mesma fonte, versão e contexto não devem produzir carga duplicada silenciosa.

## 6. Registro de staging docente

Cada linha deve preservar:

- `source_record_id`;
- número da linha/origem;
- payload bruto;
- payload normalizado;
- identificador institucional externo;
- nome original;
- e-mail original, se fornecido;
- organização/escola de origem;
- situação funcional;
- vigência;
- campos acadêmicos disponíveis;
- estado de matching;
- identidade canônica encontrada, quando houver;
- método/evidência do matching;
- estado de validação;
- motivo de rejeição;
- timestamps.

### Regra de imutabilidade

O payload bruto nunca deve ser sobrescrito pela normalização.

```text
raw_payload → imutável
normalized_payload → derivado/reprocessável
```

## 7. Estados de matching

### `resolved`

Identidade institucional determinada de forma inequívoca por chave homologada.

### `ambiguous`

Existem múltiplas correspondências plausíveis ou conflito entre fontes.

### `unresolved`

Não foi encontrada identidade canônica suficiente.

### `rejected`

Registro inválido, incompatível ou expressamente descartado por regra institucional.

Somente `resolved` pode seguir automaticamente para homologação técnica. `ambiguous` e `unresolved` exigem revisão.

## 8. Ordem de matching

A ordem determinística será:

1. identificador institucional docente homologado;
2. identificador canônico previamente mapeado;
3. associação institucional previamente validada;
4. exceção manual explicitamente registrada.

Não utilizar automaticamente:

- nome isolado;
- e-mail isolado;
- nome + e-mail aproximados;
- cargo textual;
- escola isolada;
- posição no arquivo;
- similaridade/fuzzy matching.

## 9. Criação/atualização de `teacher_profiles`

`teacher_profiles` representa a identidade acadêmica de domínio.

Uma carga institucional poderá criar ou atualizar um perfil somente após validação da identidade acadêmica.

### Criação

Permitida quando a fonte fornece evidência suficiente de que se trata de um docente institucional ainda não canonizado.

### Atualização

Campos derivados da fonte podem ser atualizados de forma controlada, preservando:

- origem;
- vigência;
- identificador externo;
- histórico necessário para reprodução.

A atualização não deve alterar retroativamente uma substituição já confirmada.

### Auth

A existência de um usuário Auth correspondente não é requisito para criar a identidade acadêmica institucional em staging/canonização.

O vínculo Auth → docente é uma etapa posterior e explícita.

## 10. Homologação Auth ↔ docente

Quando houver usuário autenticado correspondente, o processo deverá apresentar ao responsável:

```text
Identidade Auth
      ↕
evidência institucional
      ↕
teacher_profile
```

A ativação de `academic_teacher_identity_links` exige:

- Auth comprovado;
- docente canônico comprovado;
- organização compatível;
- escola compatível;
- vigência compatível;
- evidência de origem;
- homologador autorizado;
- timestamp;
- auditoria.

Sem esses requisitos, o vínculo permanece `pending`.

## 11. Multi-escola

A mesma pessoa pode atuar em mais de uma escola quando isso for institucionalmente legítimo.

O contrato não estabelece unicidade global de Auth nem de pessoa.

Cada vínculo deve ser contextualizado por:

- organização;
- escola;
- período de validade;
- situação funcional;
- fonte;
- autorização.

Um segundo vínculo não deve ser criado automaticamente apenas porque o mesmo nome/e-mail aparece em outra escola.

## 12. Fila de exceções

A plataforma deverá produzir uma fila operacional para registros:

- `ambiguous`;
- `unresolved`;
- conflitos entre fontes;
- conflitos de organização/escola;
- conflito temporal;
- tentativa de reutilização de identidade incompatível.

Cada exceção deve possuir:

- motivo;
- evidências;
- estado;
- responsável;
- decisão;
- data/hora;
- justificativa;
- referência à origem.

A resolução manual deve ser reproduzível e auditável.

## 13. Permissões administrativas

A homologação deverá usar o Core central de identidade.

Permissão candidata:

```text
escala.manage_teacher_identity_links
```

Ela não deve ser implementada como RBAC independente.

A autorização deverá combinar:

```text
auth.uid()
+ membership ativo
+ organização
+ escola/escopo
+ acesso ao produto Escala
+ permissão específica
+ responsabilidade administrativa, quando aplicável
```

## 14. Auditoria

Toda operação relevante deverá produzir evento em `identity_audit_logs`:

- importação;
- canonização;
- criação de perfil;
- alteração de identidade acadêmica;
- proposta de vínculo;
- homologação;
- revogação;
- alteração de vigência;
- resolução de exceção.

O evento deve permitir reconstruir:

```text
quem → fez o quê → sobre qual identidade → em qual contexto → baseado em qual evidência → quando
```

Não criar um ledger específico da Escala para substituir o ledger central.

## 15. Idempotência

A mesma carga não deve produzir duplicação quando reapresentada.

Chave lógica de idempotência mínima:

```text
source_hash
+ organization_id
+ school_id
+ source_system
```

Quando a fonte possuir versão/ID oficial, ele deverá complementar a chave.

Reprocessamento deve preservar o lote anterior e registrar o novo processamento quando houver alteração efetiva.

## 16. Versionamento e histórico

Uma mudança institucional não deve apagar a interpretação anterior.

Exemplo:

```text
Fonte v1
  ↓
docente lotado na Escola A
  ↓
Vínculo histórico

Fonte v2
  ↓
docente transferido para Escola B
  ↓
nova vigência
```

O motor deverá consultar a identidade vigente na data da ocorrência.

## 17. Integração com grade oficial

A grade oficial poderá referenciar o docente somente quando a identidade acadêmica estiver resolvida.

Fluxo:

```text
staging docente
      ↓
teacher_profile
      ↓
identidade Auth (quando existente)
      ↓
grade official teacher reference
      ↓
occurrence
```

Registros não resolvidos não podem alimentar automaticamente o motor de substituição.

## 18. Segurança

O staging pode conter dados pessoais e institucionais. Portanto:

- acesso deve seguir escopo institucional;
- não expor staging a professores comuns;
- não usar dados de staging como catálogo público;
- não permitir edição direta do payload bruto;
- toda operação administrativa deve ser auditável;
- exportações devem obedecer às permissões centrais.

## 19. Testes obrigatórios

| ID | Cenário | Resultado |
|---|---|---|
| DOC-01 | lote idêntico reapresentado | idempotente |
| DOC-02 | identificador institucional único | `resolved` |
| DOC-03 | nome apenas | `unresolved`/revisão |
| DOC-04 | e-mail apenas | `unresolved`/revisão |
| DOC-05 | múltiplos candidatos | `ambiguous` |
| DOC-06 | organização incompatível | rejeitado/bloqueado |
| DOC-07 | escola incompatível | rejeitado/bloqueado |
| DOC-08 | Auth sem docente institucional | não ativa vínculo |
| DOC-09 | docente sem Auth | pode permanecer acadêmico |
| DOC-10 | homologação válida | vínculo `active` |
| DOC-11 | homologador não autorizado | bloqueado |
| DOC-12 | vigência sobreposta incompatível | bloqueado |
| DOC-13 | segundo vínculo multi-escola legítimo | permitido conforme política |
| DOC-14 | fuzzy matching | nunca ativa automaticamente |
| DOC-15 | revogação | histórico preservado |
| DOC-16 | correção de fonte | nova evidência/versionamento |
| DOC-17 | payload bruto | preservado |
| DOC-18 | auditoria | evento central registrado |
| DOC-19 | reprodução histórica | identidade correta por data |
| DOC-20 | registro rejeitado | não chega à grade/motor |

## 20. Critérios de aceite

O contrato será considerado implementável somente quando houver:

1. fonte real identificada e autorizada;
2. formato/estrutura da fonte documentados;
3. identificador institucional definido;
4. estratégia de carga/staging homologada;
5. matching determinístico implementado;
6. fila de exceções definida;
7. processo administrativo de homologação definido;
8. permissão central Escala homologada;
9. RLS revisada;
10. auditoria integrada;
11. testes DOC-01..20 executados em ambiente isolado;
12. política multi-escola formalmente validada.

## 21. Auditoria do contrato

| ID | Achado | Severidade | Estado |
|---|---|---|---|
| DOC-AUD-01 | separação Auth/usuário/docente | Critical | 🟢 Fechado |
| DOC-AUD-02 | preservação da origem | Critical | 🟢 Fechado |
| DOC-AUD-03 | matching sem fuzzy | Critical | 🟢 Fechado |
| DOC-AUD-04 | homologação humana | Critical | 🟢 Definido |
| DOC-AUD-05 | autorização central | Critical | 🟡 Pendente catálogo |
| DOC-AUD-06 | RLS staging | High | 🟡 A homologar |
| DOC-AUD-07 | fonte real | Critical | 🔴 Aberto |
| DOC-AUD-08 | identificador institucional | Critical | 🔴 Aberto |
| DOC-AUD-09 | multi-escola | High | 🟡 Aberto |
| DOC-AUD-10 | auditoria central | High | 🟢 Definido |
| DOC-AUD-11 | idempotência | High | 🟢 Definido |
| DOC-AUD-12 | reprodução histórica | High | 🟢 Definido |

## 22. Gate

**Resultado: 🔴 BLOQUEADO PARA PRODUÇÃO.**

O contrato está suficientemente definido para permitir o próximo artefato de engenharia em isolamento, mas não há evidência real da fonte institucional de docentes nem do catálogo de permissões Escala.

### Próximo avanço seguro

Criar um **harness PostgreSQL isolado da carga/homologação docente**, cobrindo DOC-01..DOC-20, incluindo staging imutável, matching determinístico, fila de exceções, vigência, multi-escola, homologação, revogação, idempotência e auditoria simulada.

Nenhum teste deve tocar o schema produtivo.

**Regra mantida: Critical aberto → DDL de produção bloqueado.**
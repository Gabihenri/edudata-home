# 125 — Auditoria E3: DI do Contrato como Evidência de Identidade Acadêmica v1

Data: 2026-09-28
Status: REGRA DE IDENTIDADE REFINADA / IMPLEMENTAÇÃO FÍSICA BLOQUEADA

## 1. Evidência oficial

Artigo oficial da SED atualizado em 23/02/2026 informa que, quando um professor possui mais de um DI, é necessário verificar se o DI que está em Funcionário e ativo é o mesmo DI utilizado na Atribuição. Quando há divergência, a orientação é refazer a associação do professor para que as turmas apareçam corretamente.

Fonte:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-07774/pt-br

## 2. Consequência

O DI não deve ser tratado apenas como dado cadastral decorativo.

A evidência oficial demonstra que existe uma relação operacional entre:

IDENTIDADE FUNCIONAL
→ DI ativo
→ ATRIBUIÇÃO
→ ASSOCIAÇÃO
→ TURMAS DISPONÍVEIS

Logo, uma futura ingestão E3 precisa preservar a referência funcional usada pela fonte.

## 3. Regra para homologação

Se o artefato SED trouxer DI, ele deverá ser preservado como identificador de origem.

Não será permitido:

- substituir DI por nome;
- substituir DI por e-mail;
- escolher arbitrariamente entre DIs;
- inferir que dois registros com mesmo nome representam o mesmo docente;
- usar CPF como substituto automático de uma chave de atribuição;
- resolver divergência de DI por fuzzy matching.

Quando houver múltiplos DIs, a reconciliação deverá produzir estado explícito:

RESOLVED
AMBIGUOUS
UNRESOLVED
BLOCKED
SOURCE_UNCERTAIN

## 4. Multi-escola

A mesma fonte oficial informa que, quando um professor possui aulas atribuídas em mais de uma escola, a plataforma permite selecionar a escola a ser visualizada.

Isso reforça que:

DOCENTE ≠ ESCOLA

e que a identidade acadêmica deve ser contextualizada por unidade e atribuição.

Fonte:
https://atendimento.educacao.sp.gov.br/knowledgebase/article/SED-07774/pt-br

## 5. Impacto na ponte Core × SED

A ponte conceitual passa a exigir:

auth identity
→ Core user
→ vínculo docente homologado
→ identificador funcional/origem SED
→ contexto escolar
→ atribuição/associação
→ classe/componente/grade

O DI, quando fornecido pelo artefato oficial, deve permanecer como dado de proveniência da fonte e não ser convertido automaticamente em auth_user_id ou teacher_profile_id.

## 6. Nova regra para o motor

O motor não poderá usar somente:

teacher_profile_id + school_id

para declarar que uma pessoa possui determinada aula.

Será necessário que a responsabilidade acadêmica esteja homologada no contexto temporal correto.

## 7. Novo teste conceitual recomendado

Fixture futura:

DOCENTE A
- DI 100
- DI 200

Fonte Funcionário:
- DI 100 ativo

Fonte Atribuição:
- DI 200

Resultado obrigatório:

SOURCE_UNCERTAIN / BLOCKED

Nunca:

MATCHED_BY_NAME

Outro cenário:

DI 100 ativo
DI 100 na Atribuição
escola X
vigência válida

Resultado:

IDENTITY_ASSIGNMENT_CANDIDATE_VALID

após validação das demais relações.

## 8. Estado E3

| Elemento | Estado |
|---|---|
| Identidade funcional | 🟢 |
| DI como evidência de origem | 🟢 |
| Relação DI ↔ Atribuição | 🟢 |
| Multi-escola | 🟢 |
| Vigência | 🟢 |
| Associação | 🟢 |
| Grade/horário | 🟢 semântico |
| IDs técnicos completos | 🔴 |
| Artefato operacional | 🔴 |
| Relação Associação ↔ Grade | 🔴 |
| Parser | 🔴 |
| DDL | 🔴 |

## 9. Conclusão

Esta rodada acrescenta uma regra objetiva à homologação E3:

Quando a fonte fornecer DI, a coerência entre DI ativo e DI utilizado na atribuição deve ser verificada antes de considerar a responsabilidade docente resolvida.

Essa regra reduz risco de associar uma aula ao docente errado em situações de múltiplos contratos/DI.

Nenhuma alteração de produção foi realizada.

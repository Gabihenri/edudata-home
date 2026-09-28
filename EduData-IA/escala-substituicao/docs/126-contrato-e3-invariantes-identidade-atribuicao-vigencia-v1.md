# 126 — Contrato E3: Invariantes de Identidade, Atribuição e Vigência v1

Data: 2026-09-28
Status: CONTRATO TESTÁVEL / SEM ALTERAÇÃO DE PRODUÇÃO

## 1. Objetivo

Consolidar em invariantes testáveis as evidências oficiais já auditadas para a camada E3 da Escala Inteligente EDI.

O contrato não cria modelo físico e não presume nomes de tabelas, IDs ou APIs da SED.

## 2. Invariantes

### E3-I01 — DI coerente

Se a fonte fornecer DI ativo e DI da Atribuição, ambos devem ser iguais para a responsabilidade ser considerada resolvida.

Divergência:
SOURCE_UNCERTAIN ou BLOCKED.

### E3-I02 — DI ausente

Se a fonte exigir DI para identificar a atribuição e o DI não estiver presente ou não puder ser reconciliado, a responsabilidade não pode ser homologada por nome.

Resultado:
UNRESOLVED ou BLOCKED.

### E3-I03 — Escola contextual

Uma atribuição pertence a um contexto escolar explícito.

A ausência de escola não pode ser preenchida por:
- escola do usuário;
- escola do teacher_profile;
- escola de uma associação histórica;
- proximidade geográfica.

### E3-I04 — Multi-escola

Um mesmo docente pode possuir contextos válidos em mais de uma escola.

Portanto:
teacher_profile_id não é suficiente para identificar uma responsabilidade de aula.

### E3-I05 — Vigência

A responsabilidade somente é válida se a data/hora da ocorrência estiver dentro da vigência homologada da associação/atribuição.

Fora da vigência:
BLOCKED ou SOURCE_UNCERTAIN.

### E3-I06 — Associação ≠ ocorrência

A existência de associação professor-classe não cria automaticamente uma ocorrência operacional.

É necessário calendário + grade/horário + vigência + proveniência compatíveis.

### E3-I07 — Grade ≠ Associação

A existência de Grade Horária não cria responsabilidade docente.

A Grade deve ser relacionada à associação/atribuição por evidência técnica.

### E3-I08 — Identidade não é inferência

Nome, e-mail, CPF, turma, horário ou coincidência temporal não podem criar vínculo técnico quando a fonte oficial não fornecer a chave.

### E3-I09 — Substituição não retroage

Uma recomendação ou decisão de substituição não altera retrospectivamente a responsabilidade original.

A responsabilidade temporária deve possuir seu próprio contexto e vigência.

### E3-I10 — Concomitância

Quando a fonte indicar situação de substituições concomitantes ou múltiplas associações, o motor deve bloquear a resolução automática até que a regra oficial seja conhecida e validada.

### E3-I11 — Proveniência

Cada responsabilidade homologada deve preservar fonte, versão/extração e referência técnica disponíveis na origem.

### E3-I12 — Falha fechada

Qualquer conflito relevante entre identidade, escola, vigência, associação, grade ou proveniência produz estado não-operacional.

Não existe fallback silencioso.

## 3. Matriz de resultado

| Situação | Resultado |
|---|---|
| DI coerente + escola + vigência + relações homologadas | RESOLVED |
| DI divergente | SOURCE_UNCERTAIN |
| DI ausente quando obrigatório | UNRESOLVED |
| escola ausente | BLOCKED |
| fora da vigência | BLOCKED |
| associação sem grade relacionada | BLOCKED |
| grade sem associação | BLOCKED |
| múltiplos DIs sem reconciliação | SOURCE_UNCERTAIN |
| múltiplas escolas com contexto válido | RESOLVED por contexto |
| concomitância não resolvida | BLOCKED |
| proveniência ausente | BLOCKED |
| apenas nome/e-mail coincidente | BLOCKED |

## 4. Preparação para testes

Cada invariante deverá posteriormente possuir:
- fixture;
- entrada;
- pré-condições;
- resultado esperado;
- evidência de fonte;
- resultado observado;
- rastreabilidade.

Os testes poderão ser executados inicialmente em harness isolado.

Somente depois do artefato E3 real será possível transformar os fixtures em testes contra dados reais.

## 5. Proibição

Este contrato não autoriza:
- criação de tabelas produtivas;
- criação de parser produtivo;
- importação de dados inventados;
- criação de IDs sintéticos apresentados como IDs SED;
- inferência de associação ↔ grade.

## 6. Conclusão

O E3 passa a ter uma camada formal de invariantes de identidade, contexto escolar, vigência, associação, grade, substituição e proveniência.

Isso permite continuar o desenvolvimento seguro do motor enquanto o artefato técnico oficial permanece pendente.

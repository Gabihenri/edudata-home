# Auditoria da Suite de Testes do Adaptador/Staging da Grade v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — CONTRATO TESTÁVEL, HOMOLOGAÇÃO DE PRODUÇÃO BLOQUEADA

## 1. Objetivo

Auditar a primeira suíte sintética derivada do contrato `21-contrato-adaptador-staging-grade-v1.md`, sem executar DDL, sem acessar dados reais e sem publicar qualquer grade.

## 2. Evidência de implementação

Arquivo criado:

`EduData-IA/escala-substituicao/tests/adapter-staging-grade.contract.test.ts`

Commit de implementação:

`dd79703ba80d4bcec58b21809c83e01f85999185`

A suíte é deliberadamente autocontida e usa `node:assert/strict`. A auditoria prévia de `package.json` confirmou que o repositório não possui atualmente Vitest, Jest, Mocha ou script de testes configurado; os scripts existentes são `dev`, `build`, `start` e `import:school-registry`.

## 3. Matriz dos fixtures

| Fixture | Cenário | Resultado esperado | Cobertura |
|---|---|---|---|
| F01 | correspondências resolvidas e estrutura válida | publishable | caminho feliz |
| F02 | correspondência ambígua | review | não publicação automática |
| F03 | entidade não resolvida | blocked | bloqueio de identidade |
| F04 | escola inválida | blocked | integridade estrutural |
| F05 | horário inválido | blocked | integridade temporal |
| F06 | sobreposição | blocked | conflito temporal |
| F07 | duplicidade | review | controle de duplicação |
| F08 | mesma origem/hash | idempotent | reimportação sem apagar histórico |
| F09 | fonte corrigida/hash diferente | new_version | nova versão/histórico |
| F10 | validade fora do período acadêmico | blocked | integridade de validade |

## 4. Testes de regra

A suíte também verifica:

- precedência de `unresolved` sobre `ambiguous` e `resolved`;
- precedência de `ambiguous` sobre `resolved`;
- regra de interseção temporal `A.start < B.end AND B.start < A.end`;
- intervalos encostados sem sobreposição;
- ordenação temporal básica por timestamp ISO;
- classificação determinística dos dez fixtures.

## 5. Achados da auditoria

### ADP-TEST-01 — cobertura sintética dos F01–F10
**Severidade:** High  
**Status:** FECHADO

Os dez cenários previstos no contrato possuem representação explícita e resultado esperado verificável.

### ADP-TEST-02 — matching determinístico
**Severidade:** Critical  
**Status:** FECHADO NO NÍVEL DE CONTRATO

A suíte comprova a precedência dos estados de matching. Ela ainda não comprova a resolução contra entidades reais, pois as entidades canônicas de turma/componente e o vínculo docente/Auth continuam bloqueados pela auditoria de Core.

### ADP-TEST-03 — ambiguidade não publica
**Severidade:** Critical  
**Status:** FECHADO NO NÍVEL DE CONTRATO

`ambiguous` produz `review`; `unresolved` produz `blocked`. Não existe fallback fuzzy no fixture.

### ADP-TEST-04 — integridade temporal
**Severidade:** Critical  
**Status:** FECHADO NO NÍVEL DE CONTRATO

Sobreposição e intervalos inválidos são classificados como bloqueados. A regra coincide com o contrato do adaptador.

### ADP-TEST-05 — idempotência
**Severidade:** High  
**Status:** PARCIAL

O fixture F08 verifica semanticamente o comportamento esperado de uma reimportação idêntica. Ainda falta homologação contra PostgreSQL com chave/hash canônico, escopo institucional e período acadêmico.

### ADP-TEST-06 — versionamento
**Severidade:** High  
**Status:** PARCIAL

F09 verifica que uma fonte corrigida representa nova versão. A persistência transacional e a publicação exclusiva de uma versão validada continuam pendentes de DDL e testes de banco.

### ADP-TEST-07 — proveniência
**Severidade:** High  
**Status:** ABERTO

A suíte atual valida o contrato comportamental, mas ainda não persiste nem verifica a cadeia `source → batch → row → version → entry → occurrence → engine run → candidate → decision`.

### ADP-TEST-08 — execução automatizada
**Severidade:** Medium  
**Status:** ABERTO

O repositório não possui runner de testes configurado. O artefato foi mantido sem introduzir nova dependência ou alterar a arquitetura. A execução CI deverá ser definida somente após escolha explícita do padrão de testes do repositório.

### ADP-TEST-09 — dados reais
**Severidade:** High  
**Status:** BLOQUEADO

Não há fonte institucional real de grade homologada. A auditoria permanece sintética por decisão de segurança e integridade.

## 6. Auditoria de segurança

- Nenhum dado real foi incluído nos fixtures.
- Nenhuma tabela foi criada ou alterada.
- Nenhum DDL de produção foi executado.
- Nenhuma regra de RLS foi relaxada.
- A suíte não contém nomes, e-mails ou identificadores reais de docentes/alunos.
- O artefato não implementa publicação nem decisão administrativa.

## 7. Limites conhecidos

Esta suíte não substitui:

1. teste de PostgreSQL/RLS;
2. teste de constraints e FKs;
3. teste de concorrência/idempotência transacional;
4. teste de importação de CSV/XLSX real homologado;
5. teste de vínculo docente/Auth;
6. teste de entidades canônicas `academic_classes` e `academic_components`;
7. teste de publicação/versionamento real;
8. teste EIOS Governance e auditoria append-only.

## 8. Gate atual

**NÃO LIBERAR DDL DE PRODUÇÃO.**

A suíte fecha a primeira camada de testes determinísticos do contrato do adaptador, mas não elimina os bloqueios já identificados nas auditorias anteriores: identidade docente, turma oficial, componente curricular, fonte oficial da grade, RLS, integridade composta, governança e persistência de idempotência/proveniência.

## 9. Próximo avanço autorizado

Transformar os contratos sintéticos em um **modelo de homologação de banco**, ainda sem produção: definir casos SQL reproduzíveis para staging, matching, hash/idempotência, versionamento, constraints temporais e RLS, mantendo os testes isolados até que as entidades canônicas sejam formalmente aprovadas.

## 10. Regra permanente

`Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar`

A existência desta suíte **não** significa que a grade esteja pronta para alimentar o motor de substituição.

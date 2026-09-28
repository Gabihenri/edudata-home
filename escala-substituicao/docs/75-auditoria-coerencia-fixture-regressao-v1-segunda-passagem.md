# 75 — Auditoria de coerência da fixture e regressão V1 — segunda passagem

## Status

**VERDE CONCEITUAL / AMARELO DE EXECUÇÃO**

A segunda passagem confirma que a fixture `escola-sintetica-v1.json` foi ajustada para resolver os principais conflitos apontados na auditoria 74. O teste de regressão também foi atualizado para refletir os novos contratos.

## Verificações

### 1. Titular fora do conjunto de candidatos

A função `eligible()` agora exige:

`teacherId !== occurrence.teacher_id`

**Resultado:** coerente com a regra de que o titular ausente não pode substituir a própria aula.

### 2. C02 — conflito temporal

A fixture mantém `teacher-s08` como titular de `occ-s02` e como atribuição simultânea.

O teste verifica sua exclusão e espera `teacher-s01` como candidato.

**Resultado:** coerente.

### 3. C03/C04 — otimização global

A fixture foi reorganizada para permitir uma solução global de cobertura 4.

O greedy local prioriza Física com `teacher-s09`; isso consome o único candidato de Química e produz cobertura 3.

A busca global pode reservar `teacher-s09` para Química e distribuir Física/Matemática entre outros docentes, atingindo cobertura 4.

**Resultado:** o cenário agora representa corretamente a diferença entre otimização local e global.

### 4. C05 — sem cobertura

C05 passou a declarar explicitamente os professores a bloquear e o teste remove temporariamente `seg-p1` da disponibilidade deles.

A mutação é restaurada ao final.

**Resultado:** cenário reproduzível sem alterar permanentemente a fixture.

### 5. C06 — override humano

`teacher-s02` está disponível em `seg-p1` e não possui mais compromisso conflitante nesse período.

O teste verifica sua elegibilidade antes do override e recalcula as vagas restantes excluindo o docente já utilizado.

**Resultado:** coerente com o princípio de que override humano não viola restrições duras.

### 6. C07 — mudança material

A disponibilidade de `teacher-s02` é alterada temporariamente e o conjunto de candidatos é comparado antes/depois.

**Resultado:** representa mudança material de estado e permite validar invalidação/recalculo de rodada em camada posterior.

### 7. C08 — determinismo

Duas execuções da mesma busca global devem produzir objetos idênticos.

O desempate usa assinatura lexicográfica determinística.

**Resultado:** contrato preservado.

## Auditoria adicional

A fixture continua com:

- `official: false`;
- 12 professores;
- 6 turmas;
- 7 períodos;
- IDs sintéticos;
- ausência → ocorrência;
- vaga → ausência/ocorrência;
- regras explícitas de cobertura, determinismo e override.

Não foi identificada necessidade de alterar arquitetura, SED ou banco.

## Limitação de execução

A execução real do arquivo Node contra o repositório não pôde ser concluída neste ambiente porque o runtime externo não conseguiu resolver o host do GitHub.

Portanto, **não declarar PASS de execução** apenas com base na inspeção estática.

A inspeção estática indica que os cenários C01–C08 estão agora coerentes e prontos para execução em runtime.

## Próximo passo

Executar `regression-fixture-v1.mjs` em ambiente Node com acesso ao repositório.

Somente após PASS real:

1. consolidar relatório de regressão;
2. executar contratos MO-01–MO-16;
3. auditar memória operacional;
4. avançar para a especificação física futura.

Nenhum DDL, RLS, integração SED ou alteração produtiva deve ser antecipado.

## Gates

- Fixture sintética: **GREEN**
- Coerência C01–C08: **GREEN por inspeção estática**
- Execução C01–C08: **PENDING**
- Memória Operacional EDI: **GREEN conceitual / execução PENDING**
- GATE-FONTE-SED: **RED/BLOCKED**

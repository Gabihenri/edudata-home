# Escala de Substituição — Fechamento de Evidência Agregada PostgreSQL v1

## Resultado

Foi realizada uma rodada de verificação agregada dos contratos sintéticos, produzindo múltiplas asserções em um único result set por domínio. Isso elimina a limitação anterior de observar somente a última linha dos scripts originais.

### Alocação global
- PASS_GLOBAL_MAX_COVERAGE
- PASS_HARD_CONSTRAINT_FILTER
- PASS_PARTIAL_UNCOVERED
- PASS_HUMAN_VALIDATION_GATE

### Reprodutibilidade
- PASS_GLOBAL_PLAN_REPRODUCIBILITY
- PASS_DETERMINISTIC_SIGNATURE_RULE

### Governança / override
- PASS_OVERRIDE_PRESERVES_ORIGINAL_PLAN
- PASS_ALGORITHM_RECORD_IMMUTABLE
- PASS_HUMAN_DECISION_SEPARATE
- PASS_AUDIT_RECONSTRUCTION

### Reexecução
- PASS_MATERIAL_CHANGE_DETECTION
- PASS_REEXECUTION_REQUIRED
- PASS_UNCHANGED_CAN_VALIDATE

### Estados de mudança
- PASS_CHANGE_STATE_MATRIX
- PASS_CONFIRMATION_BLOCKED_ON_CHANGE
- PASS_REEXECUTION_SAFETY_GATE

### Persistência de rodada
- PASS_ROUND_1_IMMUTABLE
- PASS_OVERRIDE_STORED_SEPARATELY
- PASS_HISTORICAL_ROUNDS_RECONSTRUCTIBLE
- PASS_INVALIDATION_CREATES_NEW_HISTORICAL_ROUND
- PASS_ROUND_VERSION_PART_OF_IDENTITY

## Interpretação

As verificações agregadas acima fecham a evidência comportamental dos contratos sintéticos correspondentes. A evidência de execução direta anterior permanece registrada separadamente.

Isso permite avançar para o fechamento da matriz R01–R16, mas ainda com uma distinção importante: os testes agregados são verificações dos contratos lógicos dos harnesses; não constituem homologação da SED nem validação do schema produtivo.

## Estado

- Motor sintético: avanço técnico confirmado.
- Evidência comportamental: consolidada nos domínios acima.
- R01–R16: **prontos para mapeamento final de cobertura/assertion → requisito**.
- GATE-FONTE-SED: **RED/BLOCKED**.
- DDL/integração oficial SED: continua bloqueado até E3 homologado.

## Próxima etapa

Construir a matriz final R01–R16, relacionando cada requisito ao harness, asserções observáveis, evidência e eventual lacuna residual. Nenhuma alteração de produção é necessária para essa etapa.

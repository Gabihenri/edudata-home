# Contrato de Persistência de Rodada da Escala — v1

**Projeto:** Escala de Substituição  
**Status:** OPERACIONAL / PREPARAÇÃO PARA PERSISTÊNCIA  
**Gate:** GATE-FONTE-SED = RED / BLOCKED  
**Data:** 2026-09-11

## 1. Objetivo

Definir o contrato mínimo para persistir uma rodada de cálculo da escala sem transformar o protótipo sintético em atribuição oficial e sem perder a rastreabilidade da decisão.

A persistência deve permitir reconstruir:

`snapshot → cálculo → recomendação → alteração humana → resultado → validação`

## 2. Princípio central

Uma rodada é um registro histórico imutável da decisão computacional naquele contexto operacional.

Nenhuma nova rodada deve sobrescrever uma rodada anterior.

Alterações posteriores geram nova rodada ou evento de invalidação.

## 3. Identidade da rodada

Cada rodada deve possuir, no mínimo:

- `round_id`: identificador único da rodada;
- `round_version`: versão sequencial dentro do contexto operacional;
- `snapshot_id`: referência ao snapshot utilizado;
- `algorithm_version`: versão do algoritmo;
- `rule_version`: versão das regras aplicadas;
- `created_at`: instante do cálculo;
- `temporal_reference`: referência temporal da escala;
- `status`: estado da rodada;
- `plan_signature`: assinatura determinística do plano.

IDs técnicos só poderão ser definidos para produção depois da homologação da fonte oficial. Nenhum CPF, DI, nome, posição de linha ou chave inferida deve ser promovido a identificador oficial.

## 4. Conteúdo mínimo da rodada

### 4.1 Contexto

- origem dos dados;
- proveniência;
- integridade/hash quando disponível;
- completude do snapshot;
- unidade/contexto operacional;
- período de validade.

### 4.2 Ocorrências

Para cada ocorrência:

- identificador da ocorrência;
- horário;
- turma/classe;
- componente curricular;
- situação de cobertura;
- candidato indicado;
- score utilizado;
- fatores efetivamente utilizados;
- candidatos elegíveis;
- candidatos rejeitados;
- códigos de rejeição;
- conflito evitado, quando aplicável.

### 4.3 Decisão humana

Quando houver intervenção:

- escolha algorítmica original;
- escolha humana;
- instante da intervenção;
- responsável pela intervenção;
- motivo informado, quando disponível;
- impacto no restante do plano;
- status `HUMAN_OVERRIDDEN`.

A decisão humana nunca deve apagar a recomendação original.

## 5. Estados

Estados mínimos:

- `CALCULATED`
- `HUMAN_VALIDATION_REQUIRED`
- `HUMAN_OVERRIDDEN`
- `STALE`
- `INVALIDATED`
- `CONFIRMED`
- `OFFICIAL_PENDING`
- `OFFICIAL_CONFIRMED`

`OFFICIAL_CONFIRMED` não pode ser produzido pelo motor de recomendação sintético.

## 6. Invalidação

Uma rodada deve ser considerada desatualizada quando ocorrer alteração material em qualquer elemento que possa modificar a alocação, incluindo:

- ocorrência;
- ausência;
- disponibilidade;
- elegibilidade;
- conflito temporal;
- escopo/unidade;
- associação oficial;
- validade temporal;
- regra;
- fonte ou snapshot.

A invalidação deve preservar:

- rodada afetada;
- snapshot anterior;
- motivo;
- instante;
- estado anterior;
- referência à nova rodada, quando existente.

## 7. Reconstrução por ocorrência

A persistência deve permitir consultar uma ocorrência e reconstruir sua sequência:

1. ocorrência criada/identificada;
2. rodada calculada;
3. recomendação original;
4. mudança material, se houver;
5. nova rodada;
6. intervenção humana, se houver;
7. resultado atual;
8. estado de validação.

A consulta não deve depender exclusivamente do estado atual da escala.

## 8. Integridade

O sistema deve rejeitar ou sinalizar:

- rodada sem snapshot;
- rodada sem versão do algoritmo;
- resultado sem ocorrência correspondente;
- `HUMAN_OVERRIDDEN` sem recomendação original;
- confirmação de rodada invalidada;
- duas escolhas incompatíveis para o mesmo professor no mesmo intervalo;
- alteração retroativa de rodada histórica.

## 9. Auditoria

Uma auditoria deve conseguir responder:

> Qual era o estado da operação quando a decisão foi calculada, por que o professor foi escolhido, quais alternativas existiam, o que mudou depois e quem alterou a decisão?

Se alguma dessas respostas depender de inferência ou de dados atuais diferentes do snapshot original, a reconstrução deve ser marcada como incompleta.

## 10. Relação com o motor global

O contrato de persistência não altera a função de otimização.

O motor continua obedecendo à ordem:

1. maximizar cobertura;
2. maximizar qualidade entre soluções com mesma cobertura;
3. aplicar critérios secundários somente quando homologados;
4. desempatar deterministicamente.

Hard constraints continuam sendo aplicadas antes do score.

## 11. Relação com a fonte SED

Este contrato é preparado para receber dados oficiais, mas não pressupõe o formato da SED.

Enquanto `GATE-FONTE-SED = RED / BLOCKED`:

- não criar parser produtivo;
- não criar chaves oficiais inferidas;
- não declarar integração homologada;
- não tratar dados sintéticos como dados operacionais reais.

## 12. Critérios de aceite

A persistência estará conceitualmente pronta quando for possível:

- salvar uma rodada sem sobrescrever outra;
- recuperar um plano exatamente como calculado;
- recuperar a recomendação original após override;
- identificar o snapshot usado;
- identificar versão do algoritmo e das regras;
- reconstruir a linha do tempo de uma ocorrência;
- marcar rodada como inválida após mudança material;
- impedir confirmação de rodada stale/inválida;
- produzir assinatura determinística para comparação.

## 13. Próximo passo de implementação

Implementar primeiro em ambiente sintético/harness, sem depender da homologação SED.

A persistência de produção somente deve ser definida depois que o artefato técnico oficial da SED for adquirido, preservado, mapeado e homologado conforme o protocolo de aquisição vigente.

# Escala de Substituição — Especificação de Comportamento do Motor de Alocação Global v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Finalidade

Definir o comportamento observável que qualquer futura implementação do motor da Escala de Substituição deverá preservar. A especificação é independente da tecnologia e não depende de IDs, schema, parser ou endpoint da SED.

O motor recebe um conjunto de ocorrências descobertas e candidatos sintéticos/normalizados e produz uma recomendação global de cobertura, mantendo a decisão final sob responsabilidade humana.

## 2. Entrada conceitual

Cada ocorrência deve possuir, no mínimo:

- identificador lógico da ocorrência;
- intervalo temporal;
- unidade/escopo operacional;
- componente/atividade da ocorrência;
- estado de cobertura.

Cada candidato deve possuir, no mínimo:

- identificador lógico;
- elegibilidade/habilitação;
- disponibilidade no intervalo;
- vínculo/escopo aplicável;
- atributos de continuidade e qualidade somente quando houver evidência homologada.

Nenhum identificador lógico desta especificação pode ser interpretado como ID interno real da SED.

## 3. Pipeline obrigatório

```text
ocorrências descobertas
        ↓
normalização temporal/escopo
        ↓
filtragem por restrições duras
        ↓
construção das combinações possíveis
        ↓
otimização global
        ↓
explicação da solução
        ↓
validação humana
        ↓
indicação operacional autorizada
```

## 4. Restrições duras

Uma combinação é inválida quando viola qualquer uma destas condições:

1. candidato inelegível;
2. candidato indisponível;
3. conflito temporal incompatível;
4. escopo/unidade incompatível;
5. vínculo ou requisito obrigatório não comprovado;
6. regra oficial homologada que proíba a combinação.

Pontuação **nunca** pode compensar uma restrição dura.

## 5. Objetivo lexicográfico

A comparação entre planos deve obedecer à seguinte ordem:

1. **maximizar quantidade de ocorrências cobertas**;
2. entre planos com mesma cobertura, **maximizar qualidade total**;
3. aplicar critérios secundários somente quando homologados;
4. resolver empate restante por assinatura determinística.

Portanto, uma solução que cobre três ocorrências com qualidade menor é superior a uma solução que cobre duas com qualidade maior.

## 6. Resultado parcial

Quando a cobertura total for impossível, o motor não deve fabricar uma atribuição. Deve retornar:

- ocorrências cobertas;
- ocorrências `uncovered`;
- motivo de impossibilidade;
- candidatos eliminados e respectivas restrições;
- alternativas disponíveis, quando existirem.

Reason codes devem ser estáveis e legíveis, por exemplo:

- `NO_ELIGIBLE_AVAILABLE_TEACHER`;
- `TEMPORAL_CONFLICT`;
- `OUT_OF_SCOPE`;
- `HARD_CONSTRAINT_BLOCKED`.

Os códigos acima são contratos conceituais do harness, não códigos oficiais da SED.

## 7. Determinismo

Para o mesmo snapshot de entrada e o mesmo conjunto de regras, a solução deve ser reproduzível.

A assinatura determinística deve ordenar logicamente as escolhas por ocorrência e usar o identificador lógico do candidato como último desempate.

A implementação futura deverá registrar, no mínimo:

- snapshot de entrada;
- versão do conjunto de regras;
- assinatura do plano;
- pontuação;
- ocorrências uncovered;
- reason codes;
- estado de validação humana.

## 8. Explicabilidade

Para cada escolha, a interface futura deverá permitir responder:

**Por que este professor foi recomendado?**

A resposta deve apresentar, de forma auditável:

- score/qualidade utilizada;
- critérios que contribuíram;
- candidatos alternativos;
- conflitos evitados;
- restrições que eliminaram candidatos;
- referência temporal do cálculo;
- regra/snapshot utilizado.

A explicação não deve expor dados desnecessários ou transformar recomendação em atribuição automática.

## 9. Validação humana

O motor produz **RECOMENDAÇÃO**, não decisão administrativa final.

Todo resultado deverá permanecer em estado equivalente a:

`HUMAN_VALIDATION_REQUIRED`

até que a pessoa autorizada confirme, altere ou rejeite a recomendação.

Qualquer override humano deve preservar o plano algorítmico original para auditoria.

## 10. Casos obrigatórios de regressão

O comportamento deve permanecer válido nos seguintes cenários:

- três ocorrências simultâneas para dois candidatos;
- empate de pontuação;
- candidato de maior score bloqueado por conflito temporal;
- candidato inelegível com score superior;
- candidato indisponível com score superior;
- ausência total de candidatos válidos;
- resultado parcial;
- mudança de pesos sem violação das restrições duras.

Os casos estão representados no harness sintético `tests/global-allocation-v1.sql` e no conjunto adversarial `tests/global-allocation-adversarial-v1.sql`.

## 11. Limites de integração

Esta especificação **não autoriza**:

- inferir IDs da SED;
- usar CPF/DI como chave interna sem homologação;
- criar DDL de produção;
- criar parser de exportação não homologado;
- consumir endpoint não documentado/autorizado;
- tratar Agenda como fonte oficial da grade;
- realizar atribuição automática em nome da gestão.

## 12. Critério de evolução para produção

A implementação produtiva só poderá substituir os identificadores e fixtures sintéticos quando o GATE-FONTE-SED fornecer artefato técnico vigente, estrutura verificável, identificadores homologados, regras de vigência e evidência de autoridade da fonte.

Até lá, o contrato desta especificação é deliberadamente estável, tecnológico-agnóstico e seguro para evolução do protótipo.
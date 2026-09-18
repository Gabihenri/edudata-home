# Memória Operacional EDI — Escala ↔ Agenda v1

**Status:** GREEN conceitual / sem alteração produtiva  
**Escopo:** Escala de Substituição + Agenda Inteligente EDI  
**Gate SED:** permanece RED/BLOCKED para integração oficial.

## 1. Objetivo
Definir como a experiência operacional produzida pela Escala de Substituição pode gerar conhecimento reutilizável pela Agenda Inteligente EDI, sem transformar recomendações em atribuições automáticas.

A Escala resolve uma necessidade operacional imediata. A Agenda utiliza os resultados consolidados para melhorar planejamento, prevenção, acompanhamento e antecipação.

## 2. Princípio
> A experiência operacional gera conhecimento; o conhecimento melhora o planejamento; a decisão permanece humana.

Nenhum aprendizado deve, sozinho, produzir atribuição oficial de professor.

## 3. Ciclo EDI ampliado
Planejar → Registrar → Identificar ausência → Avaliar cobertura → Decidir → Evidenciar → Analisar → Aprender → Antecipar → Planejar novamente.

A Escala atua principalmente na identificação, avaliação e decisão de cobertura. A Agenda incorpora conhecimento derivado no planejamento e na antecipação.

## 4. Eventos que podem gerar conhecimento
Somente eventos operacionais suficientemente estruturados devem alimentar a memória:
- ausência registrada;
- vaga criada;
- candidatos elegíveis;
- recomendação produzida;
- escala validada humanamente;
- override humano;
- alteração material do estado;
- vaga sem cobertura;
- rodada recalculada;
- substituição efetivamente confirmada, quando houver registro oficial;
- tempo de resolução;
- recorrência de ocorrência ou conflito.

Uma recomendação não validada não deve ser tratada como substituição efetiva.

## 5. Tipos de conhecimento
### 5.1 Padrão temporal
Identificar recorrência por dia, período, turno e contexto.

Exemplo: `seg-p1 → frequência elevada de ocorrências de cobertura`.

Não significa causalidade.

### 5.2 Conflito operacional
Registrar compromissos, aulas atribuídas ou outras restrições que frequentemente reduzem candidatos.

### 5.3 Cobertura
Registrar quantidade de vagas, cobertura obtida e situações sem cobertura.

### 5.4 Decisão humana
Registrar quando o profissional escolhe alternativa diferente da recomendação.

O override é evidência de decisão, não erro do profissional.

### 5.5 Recorrência
Detectar padrões repetidos ao longo de rodadas, respeitando janela temporal e qualidade dos dados.

### 5.6 Conhecimento antecipatório
Quando houver evidência suficiente, a Agenda pode apresentar alerta ou sugestão preventiva.

Exemplo: `Há compromisso cadastrado no período e historicamente esse contexto exige reorganização de cobertura.`

A mensagem deve ser apresentada como apoio, não como decisão.

## 6. Separação entre fato, inferência e sugestão
Cada item da memória deve possuir natureza explícita:
- `FACT` — fato operacional registrado;
- `PATTERN` — padrão estatístico derivado;
- `INSIGHT` — interpretação operacional derivada;
- `SUGGESTION` — sugestão apresentada ao profissional.

O sistema não deve apresentar `PATTERN`, `INSIGHT` ou `SUGGESTION` como fato.

## 7. Contrato conceitual mínimo
```text
OperationalLearningEvent
- id
- institution_id
- source_product
- source_event_id
- event_type
- occurred_at
- effective_date
- period_key
- teacher_id (quando autorizado)
- class_id (quando autorizado)
- subject
- outcome
- decision_origin
- evidence_reference
- snapshot_reference
- confidence
- created_at
```

### Tipos de `event_type`
`ABSENCE_RECORDED`  
`VACANCY_CREATED`  
`RECOMMENDATION_GENERATED`  
`HUMAN_OVERRIDE`  
`SUBSTITUTION_VALIDATED`  
`VACANCY_UNCOVERED`  
`STATE_CHANGED`  
`ROUND_RECALCULATED`

## 8. Regras de qualidade
1. Não aprender de estado inválido ou snapshot stale.
2. Não considerar recomendação como execução efetiva.
3. Não misturar dados sintéticos com memória operacional real.
4. Preservar origem e referência do evento.
5. Permitir auditoria da cadeia evento → análise → sugestão.
6. Não usar inferência como restrição dura do motor.
7. Aprendizado não altera silenciosamente scores oficiais.
8. Mudanças de regra devem possuir versão.
9. Conhecimento derivado deve possuir janela temporal.
10. Resultados devem ser reproduzíveis a partir dos eventos considerados.

## 9. Relação com a Agenda Inteligente EDI
A Agenda pode consumir conhecimento em quatro momentos:
### Antes
Antecipar conflitos e necessidades de organização.
### Durante
Exibir contexto relevante para a decisão do profissional.
### Depois
Registrar resultado e alimentar análise.
### Próximo ciclo
Reutilizar conhecimento consolidado para planejamento futuro.

## 10. Guardrail fundamental
A memória operacional não pode criar um circuito automático:

`histórico → professor favorito → atribuição automática`.

O fluxo permitido é:

`histórico → conhecimento contextual → sugestão → decisão humana → registro`.

## 11. Privacidade e governança
A implementação futura deve respeitar:
- menor privilégio;
- escopo institucional;
- finalidade definida;
- rastreabilidade;
- separação entre dados pessoais e métricas agregadas quando possível;
- retenção e versionamento compatíveis com a governança da plataforma.

IDs de professor, turma e instituição só devem circular quando necessários ao contexto autorizado.

## 12. Métricas futuras
Indicadores possíveis:
- taxa de cobertura;
- taxa de vagas descobertas;
- tempo de resolução;
- frequência de override;
- recorrência de conflitos;
- estabilidade das soluções;
- distribuição temporal das ocorrências;
- distância entre recomendação e decisão humana.

Essas métricas não devem ser convertidas automaticamente em avaliação de desempenho docente.

## 13. Relação com a Escala
A Escala continua sendo o sistema operacional da decisão de cobertura.

A memória é uma camada de conhecimento transversal:

```text
Escala
  ↓
Eventos operacionais
  ↓
Memória Operacional EDI
  ↓
Análise / padrões
  ↓
Agenda Inteligente EDI
  ↓
Planejamento e antecipação
  ↓
Nova operação
  ↓
Novos eventos
```

## 14. Gate de implementação
Nenhuma tabela produtiva ou alteração de schema deve ser criada somente com base neste documento.

A implementação física deve ocorrer após:
1. auditoria do modelo atual da Agenda;
2. identificação dos eventos já persistidos;
3. definição do contrato de integração;
4. revisão de RLS;
5. definição de retenção/versionamento;
6. testes de regressão;
7. aprovação da arquitetura.

## 15. Próximo artefato
O próximo avanço técnico autorizado é uma **matriz de eventos Escala × Agenda**, identificando:
- evento de origem;
- dado mínimo;
- destino;
- finalidade;
- nível de confiança;
- possibilidade de agregação;
- impacto na Agenda;
- requisito de auditoria;
- requisito de RLS.

Este documento é conceitual e não autoriza integração produtiva por si só.
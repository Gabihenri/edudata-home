# Matriz de Eventos — Escala × Agenda EDI v1

**Status:** GREEN conceitual / sem alteração produtiva  
**Relacionamento:** Documento 71 — Memória Operacional EDI  
**Gate SED:** RED/BLOCKED para integração oficial.

## 1. Finalidade
Definir quais eventos da Escala de Substituição podem alimentar a Agenda Inteligente EDI, qual informação mínima atravessa a fronteira e quais controles devem ser aplicados.

A matriz não autoriza DDL, API, alteração de RLS ou sincronização produtiva.

## 2. Matriz principal

| Evento Escala | Natureza | Dado mínimo | Destino | Finalidade | Confiança | Agregável | Auditoria | RLS |
|---|---|---|---|---|---|---|---|---|---|
| ABSENCE_RECORDED | FACT | ocorrência, data/período, motivo | Memória EDI | registrar ocorrência | alta se fonte validada | sim | obrigatória | institucional |
| VACANCY_CREATED | FACT | vaga, ocorrência, estado | Memória EDI | medir necessidade | alta | sim | obrigatória | institucional |
| RECOMMENDATION_GENERATED | FACT | rodada, snapshot, candidato recomendado | Memória EDI | reconstruir decisão | alta | parcialmente | obrigatória | institucional |
| HUMAN_OVERRIDE | FACT | rodada, vaga, decisão humana | Memória EDI | estudar divergência decisão/recomendação | alta | sim | obrigatória | institucional + função |
| SUBSTITUTION_VALIDATED | FACT | vaga, professor, validação, data/hora | Agenda/Histórico | registrar resultado confirmado | alta somente após validação | sim | obrigatória | institucional + função |
| VACANCY_UNCOVERED | FACT | vaga, rodada, motivo | Memória EDI | identificar dificuldade de cobertura | alta | sim | obrigatória | institucional |
| STATE_CHANGED | FACT | snapshot, tipo de alteração | Memória EDI | explicar invalidação/reprocessamento | alta | sim | obrigatória | institucional + função |
| ROUND_RECALCULATED | FACT | rodada anterior/nova, snapshot, resultado | Memória EDI | medir estabilidade | alta | sim | obrigatória | institucional |
| PADRÃO TEMPORAL | PATTERN | janela, período, frequência | Agenda Analytics | antecipação | depende da amostra | sim | derivação obrigatória | institucional |
| CONFLITO RECORRENTE | PATTERN | contexto, frequência, janela | Agenda Analytics | prevenção | depende da amostra | sim | derivação obrigatória | institucional |
| INSIGHT OPERACIONAL | INSIGHT | padrão + evidências | Agenda | apoio ao planejamento | derivada | sim | cadeia de evidências | institucional |
| SUGGESTION | SUGGESTION | insight + contexto atual | Agenda | apresentar ação possível | derivada | não | decisão/apresentação | institucional + função |

## 3. Regras de fronteira
Somente informação necessária para contexto operacional, análise, auditoria, aprendizagem e antecipação pode atravessar.

Não devem atravessar automaticamente: score como verdade absoluta; preferência informal por determinado professor; inferência sobre desempenho docente; recomendação stale; dados sintéticos; identificadores SED não homologados; decisão tratada como atribuição oficial.

## 4. Confiança
A confiança representa a confiabilidade do conhecimento operacional, não uma avaliação do professor.

- HIGH — evento confirmado e rastreável;
- MEDIUM — derivação estatística suficiente, mas sujeita a revisão;
- LOW — evidência insuficiente para uso antecipatório.

LOW pode permanecer armazenado para pesquisa, mas não deve gerar alerta operacional.

## 5. Agregação
Sempre que possível, a Agenda deve receber conhecimento agregado em vez de exposição desnecessária de dados individuais.

Exemplo: em vez de registrar um professor individualmente quando a finalidade não exige isso, usar a frequência de necessidades de cobertura por período e janela.

A granularidade individual somente permanece quando necessária ao contexto autorizado.

## 6. Override humano
O override deve responder a: em quais contextos a decisão humana divergiu da recomendação?

Não deve ser usado para criar um ranking permanente de docentes.

## 7. Aprendizagem temporal
Todo padrão deve possuir janela de observação, quantidade de eventos, data da última atualização, versão da regra de derivação e referência aos eventos utilizados.

Padrões antigos não devem ser tratados automaticamente como realidade atual.

## 8. Antecipação na Agenda
Três níveis conceituais:

- Informativo: há histórico de ocorrências neste período.
- Contextual: o contexto atual apresenta características semelhantes a ocorrências anteriores.
- Sugestivo: considere revisar a organização deste período antes do início das aulas.

A Agenda não deve apresentar automaticamente qual professor deve substituir.

## 9. Cadeia de proveniência
Todo insight deve ser rastreável:

`Evento → Rodada → Snapshot → Agregação → Padrão → Insight → Sugestão`

Se a cadeia não puder ser reconstruída, o item não deve ser considerado conhecimento auditável.

## 10. RLS e governança
Manter isolamento institucional, menor privilégio, acesso por função, separação entre contexto individual e agregado, trilha de auditoria e nenhuma ampliação automática de visibilidade entre docentes.

A existência de um evento não concede acesso ao seu conteúdo.

## 11. Regras para a Agenda
A Agenda pode consultar padrões autorizados, apresentar contexto, registrar sugestão exibida, registrar decisão do profissional e alimentar novos eventos.

A Agenda não pode transformar sugestão em atribuição, alterar silenciosamente a escala, alterar score oficial, substituir validação humana ou usar histórico como restrição dura sem regra homologada.

## 12. Critérios para liberar um padrão para antecipação
1. quantidade mínima de eventos definida;
2. janela temporal definida;
3. ausência de inconsistência relevante;
4. origem dos eventos conhecida;
5. regra de derivação versionada;
6. auditoria disponível;
7. escopo de acesso validado;
8. possibilidade de explicar a sugestão ao profissional.

## 13. Testes necessários
- evento sem origem válida → rejeitado;
- snapshot stale → não gera aprendizagem operacional;
- fixture sintética → não entra na memória real;
- override → registrado sem ranking docente;
- vaga descoberta → gera conhecimento de cobertura;
- padrão insuficiente → não gera sugestão;
- padrão antigo → perde confiança conforme regra definida;
- instituição A → não acessa memória da instituição B;
- sugestão → nunca executa atribuição;
- decisão humana → permanece rastreável.

## 14. Estado da implementação
- contrato conceitual: GREEN;
- matriz de eventos: GREEN;
- integração física: NÃO INICIADA;
- DDL: BLOQUEADO;
- API: BLOQUEADA;
- alteração de RLS: BLOQUEADA;
- fonte SED oficial: RED/BLOCKED;
- fixture sintética: permitida apenas para testes.

## 15. Próximo passo
O próximo artefato será a especificação de testes de contrato da Memória Operacional EDI, antes de qualquer tabela produtiva.

Objetivo: provar que Escala → evento → memória → padrão → sugestão é auditável, determinístico, institucionalmente isolado e incapaz de executar uma atribuição sem decisão humana.
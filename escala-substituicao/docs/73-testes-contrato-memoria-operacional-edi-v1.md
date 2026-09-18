# Testes de Contrato — Memória Operacional EDI v1

**Status:** GREEN conceitual / sem alteração produtiva  
**Base:** Documentos 71 e 72  
**Gate SED:** RED/BLOCKED.

## 1. Objetivo
Provar que o fluxo Escala → evento → memória → padrão → sugestão mantém proveniência, determinismo, isolamento institucional e decisão humana obrigatória.

## 2. Contrato de entrada
Todo evento deve possuir, no mínimo:
- `id` único;
- `institution_id`;
- `source_product`;
- `source_event_id`;
- `event_type` permitido;
- `occurred_at`;
- `decision_origin` quando aplicável;
- referência de snapshot quando o evento depender de uma rodada.

Evento sem origem rastreável deve ser rejeitado.

## 3. Casos de teste

| ID | Cenário | Resultado esperado |
|---|---|---|
| MO-01 | evento válido | aceito e rastreável |
| MO-02 | evento sem `source_event_id` | rejeitado |
| MO-03 | tipo de evento desconhecido | rejeitado |
| MO-04 | snapshot stale | não alimenta conhecimento operacional |
| MO-05 | fixture sintética | não entra na memória real |
| MO-06 | override humano | registrado como decisão humana |
| MO-07 | recomendação não validada | não tratada como substituição efetiva |
| MO-08 | vaga sem cobertura | gera evento de cobertura descoberta |
| MO-09 | padrão com amostra insuficiente | não gera sugestão |
| MO-10 | padrão antigo | confiança recalculada pela janela temporal |
| MO-11 | instituição A consulta B | acesso negado |
| MO-12 | sugestão apresentada | nenhuma atribuição automática |
| MO-13 | decisão humana posterior | preserva cadeia de auditoria |
| MO-14 | mesma entrada duas vezes | resultado idempotente conforme chave definida |
| MO-15 | mesma janela/regras | derivação determinística |
| MO-16 | alteração da regra | nova versão do conhecimento |

## 4. Testes de proveniência
Para cada `PATTERN`, `INSIGHT` ou `SUGGESTION`, deve ser possível reconstruir:

`evento(s) → rodada → snapshot → regra → derivação → resultado`.

Se qualquer elo obrigatório estiver ausente, o resultado deve ser marcado como não auditável e não liberado para antecipação.

## 5. Testes temporais
Verificar:
- eventos futuros não entram em janela passada;
- eventos fora da janela não influenciam o padrão;
- padrões expiram ou perdem confiança conforme regra definida;
- reprocessamento da mesma janela produz o mesmo resultado;
- alteração da janela produz novo resultado versionado.

## 6. Testes de decisão humana
### MO-06
Quando o profissional escolhe candidato diferente do recomendado:
- registrar a recomendação original;
- registrar a decisão humana;
- preservar o snapshot correspondente;
- não classificar automaticamente a divergência como erro;
- permitir análise posterior.

### MO-12
Uma sugestão da Agenda deve terminar em estado como:
`PRESENTED`, `ACCEPTED`, `DISMISSED` ou equivalente homologado.

Nenhum desses estados deve significar atribuição oficial sem registro específico de validação.

## 7. Testes de isolamento
Para qualquer consulta:

`request.institution_id === record.institution_id`

deve ser requisito mínimo, complementado pelas regras de função e menor privilégio.

Um usuário de uma instituição não deve obter eventos, padrões ou insights de outra instituição apenas por conhecer um identificador.

## 8. Testes de dados sintéticos
Eventos provenientes de `escola-sintetica-v1` devem carregar marcador de ambiente não oficial.

Qualquer tentativa de persistir esses eventos na memória operacional real deve ser bloqueada pelo contrato de ambiente.

## 9. Teste de sugestão segura
Entrada:
- padrão válido;
- contexto atual compatível;
- confiança suficiente.

Saída permitida:
`SUGGESTION`.

Saída proibida:
`ASSIGNMENT_CREATED` sem ação humana explicitamente registrada.

## 10. Teste de alteração material
Quando o snapshot utilizado por uma recomendação se torna stale:
- a recomendação histórica permanece preservada;
- nenhum novo conhecimento de execução deve ser inferido daquela recomendação como se ainda estivesse válida;
- o evento de invalidação permanece auditável;
- nova rodada pode gerar novos eventos.

## 11. Determinismo
Para entrada, janela, regras e versão idênticas:

`derive(input, rules, window) === derive(input, rules, window)`.

Qualquer mudança relevante deve produzir versão ou referência distinta.

## 12. Idempotência
Reprocessar o mesmo evento com a mesma identidade não deve criar duplicação semântica.

A futura implementação deve definir uma chave idempotente, conceitualmente baseada em:
`institution_id + source_product + source_event_id + event_type`.

## 13. Critérios de aprovação
A camada será considerada pronta para implementação física somente quando:
- todos os testes críticos passarem;
- a proveniência for reconstruível;
- o isolamento institucional estiver comprovado;
- dados sintéticos estiverem isolados;
- recomendações stale estiverem protegidas;
- sugestão não puder virar atribuição automaticamente;
- regras estiverem versionadas;
- comportamento determinístico estiver comprovado.

## 14. Bloqueios atuais
Este documento não autoriza:
- criação de tabela;
- criação de API;
- alteração de RLS;
- alteração da Agenda;
- conexão com SED;
- ingestão de dados reais.

## 15. Próximo passo
Executar os testes conceituais sobre a fixture sintética e, depois, criar uma implementação isolada de contrato sem conexão produtiva.

Somente após essa validação será avaliada a integração física com a Agenda Inteligente EDI.
# Fluxo Operacional MVP — Escala Inteligente de Substituição

## 1. Objetivo

Definir o fluxo operacional mínimo para transformar uma ausência confirmada em uma recomendação de substituição auditável e pronta para validação da gestão.

## 2. Fluxo principal

```text
Ausência confirmada
        ↓
Identificar aulas afetadas
        ↓
Gerar vagas
        ↓
Carregar docentes disponíveis
        ↓
Aplicar impedimentos
        ↓
Gerar candidatos elegíveis
        ↓
Pontuar e ordenar
        ↓
Verificar conflitos globais
        ↓
Gerar recomendação
        ↓
Validação da gestão
        ↓
Escala confirmada / não alocada
        ↓
Auditoria
```

## 3. Etapa 1 — Ausência

A operação começa somente quando a ausência estiver registrada e em estado válido para processamento.

Entradas:

- docente ausente;
- data;
- intervalo de tempo;
- motivo/categoria;
- confirmação da ocorrência.

Saída: conjunto de aulas potencialmente afetadas.

## 4. Etapa 2 — Identificação das vagas

Para cada aula do docente dentro do intervalo da ausência:

1. localizar o horário oficial;
2. verificar data e período;
3. criar ou atualizar a vaga correspondente;
4. impedir duplicação da mesma vaga.

Uma vaga deve representar uma aula específica, não apenas o intervalo da ausência.

## 5. Etapa 3 — Universo de docentes

O motor consulta docentes da mesma instituição que possam operacionalmente assumir a aula.

A consulta deve considerar inicialmente:

- vínculo/status ativo;
- disponibilidade no período;
- agenda e compromissos conhecidos;
- horário oficial;
- qualificações/disciplinas;
- limites institucionais.

## 6. Etapa 4 — Filtros eliminatórios

Antes de pontuar, eliminar candidatos incompatíveis.

### Bloqueios obrigatórios

- já possui aula no mesmo horário;
- possui compromisso bloqueante no período;
- está explicitamente indisponível;
- não atende requisito mínimo configurado;
- atingiu limite operacional configurado;
- possui impedimento administrativo válido.

O sistema deve guardar o motivo da eliminação quando isso for relevante para explicabilidade e auditoria.

## 7. Etapa 5 — Pontuação

Somente candidatos elegíveis recebem score.

Exemplo conceitual:

```text
score =
  aderência à disciplina
+ aderência à área
+ disponibilidade preferencial
+ continuidade pedagógica
+ equilíbrio de substituições
+ preferência institucional
```

Os pesos devem ser configuráveis e versionados. O MVP não deve depender de inteligência artificial para o cálculo inicial; regras determinísticas e explicáveis são suficientes.

## 8. Etapa 6 — Conflitos globais

A recomendação de cada vaga não deve ser tratada isoladamente quando o mesmo docente aparece como melhor candidato para duas ou mais vagas simultâneas.

O motor deve:

1. identificar candidatos compartilhados;
2. comparar as vagas afetadas;
3. preservar as restrições obrigatórias;
4. aplicar os critérios de desempate previamente definidos;
5. evitar dupla alocação;
6. deixar para validação humana os casos que permanecerem ambíguos.

## 9. Etapa 7 — Resultado

Cada vaga deve terminar em um estado explícito:

- `recommended` — existe recomendação do motor;
- `pending_validation` — aguarda decisão autorizada;
- `confirmed` — substituição confirmada;
- `unallocated` — não foi encontrada solução elegível;
- `blocked` — processamento impedido por regra/dado inconsistente.

## 10. Interface de gestão

A primeira interface operacional deve apresentar:

### Para cada vaga

- turma;
- disciplina;
- horário;
- docente ausente;
- melhor candidato;
- score;
- critérios que justificam a recomendação;
- alternativas elegíveis;
- candidatos bloqueados e motivo resumido;
- ação de confirmar;
- ação de rejeitar/alterar;
- justificativa quando necessária.

### Visão geral

- total de vagas;
- vagas recomendadas;
- vagas confirmadas;
- vagas não alocadas;
- conflitos pendentes;
- dados inconsistentes.

## 11. Regra de decisão humana

O sistema não deve considerar uma recomendação como substituição efetivada.

A efetivação ocorre somente após ação de usuário autorizado.

```text
Motor → recomenda
Gestão → valida
Sistema → registra
```

## 12. Casos sem solução

Quando não houver candidato elegível:

- registrar `unallocated`;
- informar que nenhuma solução atende às regras vigentes;
- preservar os motivos de bloqueio relevantes;
- permitir decisão manual conforme as permissões institucionais;
- registrar a decisão manual e sua justificativa.

## 13. Casos de exceção

Devem ser tratados explicitamente:

- horário oficial ausente;
- ausência sem aulas correspondentes;
- disponibilidade desatualizada;
- professor sem qualificação cadastrada;
- dois candidatos empatados;
- candidato recomendado para múltiplas vagas;
- alteração da ausência após geração da escala;
- alteração do horário após recomendação;
- cancelamento de uma substituição já confirmada.

Nenhuma dessas situações deve resultar em alocação silenciosa.

## 14. Critério de sucesso do MVP

O MVP será considerado funcional quando conseguir, para uma instituição:

1. cadastrar/importar docentes;
2. carregar horário;
3. registrar disponibilidade/impedimentos;
4. registrar ausência;
5. gerar vagas;
6. eliminar candidatos incompatíveis;
7. ranquear candidatos elegíveis;
8. explicar o ranking;
9. permitir confirmação humana;
10. registrar histórico da decisão.

## 15. Próximo passo técnico

Após este fluxo, a próxima etapa é transformar o modelo lógico em **schema físico Supabase/PostgreSQL**, incluindo chaves, índices, enums, constraints, RLS e estrutura preparada para integração posterior com o Core/EIOS e a Agenda Inteligente EDI.
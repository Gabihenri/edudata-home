# Roadmap — Escala de Substituição

## Fase 1 — Concepção e fundação

- definição do posicionamento como produto EduData IA;
- especificação das regras de elegibilidade;
- definição do modelo de dados necessário;
- desenho do motor de priorização;
- auditoria física do Core e reconciliação com o SQL legado;
- contrato de identidade acadêmica;
- contrato da fonte oficial da grade;
- modelo da grade oficial versionada;
- matriz de integração Core × EIOS × Agenda × Escala.

**Status:** arquitetura consolidada; DDL de produção ainda bloqueado por identidade acadêmica, turma, componente curricular e fonte oficial de grade.

## Fase 2 — MVP

- cadastro/contexto da ausência;
- consulta da grade oficial publicada;
- materialização/consulta de ocorrências temporais;
- consulta de horários e compromissos;
- filtragem de conflitos;
- lista de professores elegíveis;
- critérios de priorização;
- registro da decisão;
- auditoria completa do ciclo.

## Fase 3 — Inteligência operacional

- recomendações explicáveis;
- otimização de múltiplas substituições;
- indicadores de cobertura;
- histórico e análise de padrões;
- integração mais profunda com o EIOS;
- reprocessamento versionado e comparação de cenários.

## Fase 4 — Ecossistema

- integração com Agenda Inteligente EDI;
- integração com demais serviços compartilhados da EduData IA;
- evolução para gestão institucional de substituições;
- importação de grades de diferentes fontes institucionais;
- observabilidade e governança operacional.

## Regra de avanço

Cada fase deve seguir:

```text
Definir
  ↓
Implementar
  ↓
Auditar
  ↓
Corrigir
  ↓
Validar
  ↓
Registrar
  ↓
Avançar
```

Nenhuma migration de produção será executada enquanto houver achado crítico aberto relacionado a identidade, integridade, temporalidade, RLS, proveniência ou decisão administrativa.

# Escala de Substituição — Regras do Motor v1

## 1. Classificação das regras

As regras são divididas em três níveis:

- **Obrigatórias:** eliminam candidatos incompatíveis.
- **Preferenciais:** aumentam ou reduzem a pontuação.
- **Institucionais:** configuráveis pela escola/rede dentro dos limites do sistema.

## 2. Ordem de processamento

1. identificar aulas vagas;
2. construir universo de docentes elegíveis;
3. aplicar regras obrigatórias;
4. calcular pontuação dos candidatos restantes;
5. ordenar candidatos;
6. detectar conflitos entre recomendações;
7. gerar proposta de escala;
8. submeter à validação humana;
9. registrar decisão e justificativa.

## 3. Regras obrigatórias iniciais

### R01 — Conflito de horário
Um docente não pode ser alocado a duas aulas simultâneas.

### R02 — Disponibilidade
Um docente indisponível no período da aula não pode ser recomendado.

### R03 — Habilitação/aderência mínima
Quando a política institucional exigir habilitação específica, candidatos que não atendam ao requisito são eliminados.

### R04 — Limites configurados
Respeitar limites de substituições/carga definidos pela instituição e pelas regras administrativas aplicáveis.

### R05 — Integridade temporal
Aula e ausência devem pertencer a uma data/período coerente. Registros inconsistentes devem ser sinalizados antes da alocação.

## 4. Critérios preferenciais iniciais

A pontuação deve ser transparente e parametrizável. Uma primeira versão pode considerar:

- componente curricular compatível;
- mesma área de conhecimento;
- disponibilidade declarada como preferencial;
- continuidade com a turma;
- equilíbrio da quantidade de substituições;
- menor deslocamento entre aulas, quando houver dados confiáveis;
- preferências institucionais.

O peso de cada critério não deve ficar embutido de forma opaca na interface.

## 5. Situações especiais

### Nenhum candidato
A aula deve permanecer como **não alocada**, com indicação clara do motivo.

### Um único candidato
Apresentar recomendação com os critérios atendidos e permitir confirmação humana.

### Múltiplos candidatos
Apresentar ranking e justificativas.

### Empate
Apresentar os candidatos empatados e aplicar somente critérios de desempate previamente configurados.

### Conflito global
Se a escolha local de uma aula prejudicar a cobertura de outras aulas, o motor deve avaliar o conjunto antes de produzir a escala final.

## 6. Segurança e governança

O motor não deve ampliar permissões de acesso. Dados de docentes, horários e ausências devem ser filtrados pelas autorizações institucionais existentes.

A recomendação não constitui, por si só, ato administrativo. A confirmação deve ser registrada pelo usuário autorizado.

## 7. Resultado esperado

Cada aula vaga deve terminar em um dos estados:

- `recomendada`
- `confirmada`
- `não_alocada`
- `bloqueada_por_regra`
- `pendente_de_validacao`

O sistema deve preservar a diferença entre **recomendação automática** e **decisão humana**.

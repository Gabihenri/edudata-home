# Escala de Substituição — Arquitetura Funcional

## 1. Objetivo

Definir uma arquitetura funcional para apoiar a gestão de substituições docentes, transformando dados de disponibilidade, horários, ausências, habilitações e regras institucionais em sugestões de alocação auditáveis.

## 2. Princípio central

O sistema deve **calcular e recomendar**. A decisão final permanece com a gestão responsável.

Fluxo:

**Dados → Validação → Regras → Candidatos → Pontuação → Alocação → Validação humana → Registro**

## 3. Entidades principais

### Docente
- identificação
- vínculo e perfil
- componentes curriculares habilitados
- áreas de conhecimento
- disponibilidade
- restrições
- carga/limites aplicáveis

### Aula
- data
- horário
- turma
- componente curricular
- professor titular
- sala/local
- características específicas

### Ausência
- docente ausente
- período
- aulas afetadas
- motivo/status administrativo quando aplicável

### Candidato à substituição
Relação entre uma aula vaga e um docente potencialmente disponível.

### Alocação
Registro da decisão final, contendo origem, responsável, data/hora e justificativas.

## 4. Pipeline do motor

### 4.1 Normalização
Consolidar horários, docentes, aulas, ausências e disponibilidades em uma representação única.

### 4.2 Restrições duras
Eliminar candidatos que violem regras obrigatórias, como:
- conflito de horário;
- indisponibilidade explícita;
- incompatibilidade de habilitação quando exigida;
- limites institucionais aplicáveis;
- impedimentos administrativos configurados.

### 4.3 Pontuação
Entre os candidatos válidos, calcular uma pontuação explicável considerando, conforme configuração institucional:
- aderência ao componente;
- aderência à área;
- proximidade de horário;
- continuidade pedagógica;
- distribuição equilibrada de substituições;
- preferências/regras institucionais.

### 4.4 Alocação
Selecionar a melhor combinação possível sem criar conflitos. Quando houver empate ou baixa confiança, apresentar alternativas à gestão.

## 5. Explicabilidade

Toda recomendação deve responder:

1. Por que este docente foi considerado?
2. Quais candidatos foram descartados?
3. Qual regra ou critério determinou a escolha?
4. Existem alternativas?
5. Quem confirmou a alocação?

## 6. Auditoria

Nenhuma substituição confirmada deve ser sobrescrita silenciosamente. Alterações devem preservar histórico, autor, data/hora e motivo.

## 7. Integração futura

A arquitetura deve permitir integração com o Core Compartilhado/EIOS e, posteriormente, com módulos da Agenda Inteligente EDI, sem duplicar regras de identidade, instituição, autorização ou auditoria.

## 8. MVP

O primeiro MVP deve priorizar:

1. cadastro/importação de docentes;
2. cadastro/importação de horários;
3. registro de ausências;
4. identificação das aulas vagas;
5. geração de candidatos;
6. aplicação de restrições;
7. ranking explicável;
8. confirmação manual;
9. histórico das substituições;
10. exportação/visualização da escala.

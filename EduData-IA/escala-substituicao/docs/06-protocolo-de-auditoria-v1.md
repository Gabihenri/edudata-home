# Protocolo de Auditoria v1 — Escala Inteligente de Substituição

## 1. Diretriz permanente

A Escala Inteligente de Substituição deve avançar sempre com auditoria.

Nenhuma evolução de arquitetura, modelo de dados, regra, motor, interface ou integração deve ser considerada concluída sem verificar seus impactos funcionais, de segurança, dados, rastreabilidade e operação.

**Princípio:** construir → verificar → registrar → corrigir → avançar.

## 2. Auditoria como etapa do ciclo de desenvolvimento

Toda etapa do projeto deve passar pelo seguinte ciclo:

```text
Definição
   ↓
Implementação
   ↓
Auditoria técnica
   ↓
Auditoria funcional
   ↓
Auditoria de segurança/dados
   ↓
Correção de achados
   ↓
Validação
   ↓
Registro da versão
```

Quando um achado impedir a operação segura ou correta, o avanço funcional deve ser bloqueado até sua resolução ou decisão formal de exceção.

## 3. Dimensões obrigatórias

### A. Auditoria funcional

Verificar:

- se o comportamento implementado corresponde às regras aprovadas;
- se ausências produzem exatamente as vagas esperadas;
- se candidatos inelegíveis são eliminados;
- se candidatos elegíveis são pontuados de forma reproduzível;
- se conflitos globais são detectados;
- se a decisão humana permanece separada da recomendação automática;
- se os estados das substituições são coerentes.

### B. Auditoria de dados

Verificar:

- origem de cada dado;
- instituição associada;
- integridade das chaves;
- duplicidades;
- dados obrigatórios ausentes;
- consistência temporal;
- versão do horário;
- versão das regras;
- proveniência dos resultados derivados.

### C. Auditoria do motor

Verificar:

- regras eliminatórias aplicadas antes da pontuação;
- pesos e critérios utilizados;
- determinismo do resultado para a mesma entrada/versionamento;
- justificativa de cada recomendação;
- justificativa dos principais descartes;
- tratamento de empate;
- prevenção de dupla alocação;
- comportamento quando não existe solução.

### D. Auditoria de segurança

Verificar:

- RLS;
- escopo por instituição;
- permissões por função;
- exposição mínima de dados docentes;
- proteção do histórico de auditoria;
- impossibilidade de um usuário comum alterar decisão confirmada sem permissão;
- ausência de vazamento entre instituições.

### E. Auditoria operacional

Verificar:

- tempo de processamento;
- falhas e reprocessamento;
- idempotência;
- observabilidade;
- mensagens de erro;
- recuperação após falha;
- consistência entre recomendação exibida e registro persistido.

### F. Auditoria de governança

Verificar:

- quem pode gerar recomendação;
- quem pode confirmar;
- quem pode rejeitar/alterar;
- quem pode consultar histórico;
- quem pode alterar regras;
- se toda ação administrativa relevante deixa registro.

## 4. Matriz mínima de auditoria

| ID | Verificação | Critério de aprovação |
|---|---|---|
| AUD-01 | Escopo institucional | Nenhum dado operacional cruza instituições |
| AUD-02 | Conflito de horário | Docente ocupado nunca é elegível |
| AUD-03 | Indisponibilidade | Bloqueios válidos são respeitados |
| AUD-04 | Qualificação | Requisito obrigatório é aplicado |
| AUD-05 | Limite | Limites configurados são respeitados |
| AUD-06 | Explicabilidade | Toda recomendação possui critérios identificáveis |
| AUD-07 | Não alocação | Ausência de candidato produz estado explícito |
| AUD-08 | Conflito global | Não existe dupla alocação simultânea |
| AUD-09 | Decisão humana | Recomendação não equivale a confirmação |
| AUD-10 | Auditoria | Ações relevantes possuem ator e timestamp |
| AUD-11 | Idempotência | Reprocessamento não cria duplicidade indevida |
| AUD-12 | Versionamento | Resultado identifica versão do motor/regras |
| AUD-13 | RLS | Acesso respeita autorização institucional |
| AUD-14 | Integridade | Relações e estados permanecem consistentes |
| AUD-15 | Recuperação | Falhas não deixam escala parcialmente inconsistente |

## 5. Auditoria de cada alteração

Para cada mudança relevante, registrar:

- objetivo da alteração;
- arquivos/tabelas afetados;
- regra ou requisito relacionado;
- riscos identificados;
- verificações executadas;
- achados;
- correções realizadas;
- resultado da auditoria;
- commit/versão correspondente.

## 6. Classificação de achados

### Crítico

Compromete segurança, integridade dos dados, isolamento institucional ou pode gerar uma substituição incorreta de forma silenciosa.

**Ação:** bloquear avanço.

### Alto

Compromete regra essencial, explicabilidade ou confiabilidade operacional.

**Ação:** corrigir antes da entrega da funcionalidade afetada.

### Médio

Afeta qualidade, usabilidade, observabilidade ou manutenção sem comprometer diretamente a decisão.

**Ação:** registrar e priorizar.

### Baixo

Melhoria sem impacto relevante na operação atual.

**Ação:** backlog técnico.

## 7. Evidência de auditoria

A auditoria não deve ser apenas uma declaração textual. Sempre que possível, deve produzir evidência verificável:

- teste automatizado;
- consulta de consistência;
- comparação de resultados;
- revisão de schema;
- verificação de RLS;
- inspeção de logs;
- revisão de diff/commit;
- caso de teste reproduzível.

## 8. Auditoria do modelo de dados

Antes de criar o schema físico, verificar especialmente:

1. quais entidades já existem no Core/EIOS;
2. quais entidades realmente precisam existir no módulo;
3. quais relações devem usar referências externas;
4. quais campos podem conter informação pessoal;
5. quais campos precisam de índices;
6. quais constraints impedem estados inválidos;
7. quais tabelas precisam de RLS;
8. como serão preservados dados históricos;
9. como versões de regras e motor serão identificadas;
10. como reprocessamentos serão diferenciados.

## 9. Auditoria antes de produção

Nenhum MVP deve ser considerado pronto sem verificar, no mínimo:

- fluxo completo ausência → vaga → candidato → recomendação → confirmação;
- cenário sem candidatos;
- cenário com um candidato;
- cenário com múltiplos candidatos;
- empate;
- conflito entre vagas;
- docente ocupado;
- docente indisponível;
- alteração/cancelamento da ausência;
- alteração do horário;
- reprocessamento;
- acesso de usuário sem permissão;
- acesso de usuário de outra instituição;
- preservação da auditoria após alteração de estado.

## 10. Regra permanente para o projeto

A partir deste documento, **auditoria passa a ser uma etapa obrigatória de todas as próximas fases da Escala Inteligente de Substituição**.

O projeto não deve apenas perguntar “funciona?”. Deve responder também:

> **Funciona corretamente, com segurança, explicabilidade, rastreabilidade e possibilidade de reconstruir por que a decisão foi tomada?**

Somente então a etapa pode ser considerada concluída.
# 79 — Auditoria: evidência TCE sobre associação, grade e vigência

**Data:** 2026-09-11  
**Status:** GREEN — evidência estrutural/operacional; GATE-FONTE-SED permanece RED/BLOCKED

## Objetivo

Aprofundar a evidência independente disponível sobre a relação entre Associação do Professor à Classe, Grade Horária, vigência e ausência/substituição, sem transformar achados históricos em contrato técnico atual da SED.

## Fonte primária

Tribunal de Contas do Estado de São Paulo — TC-021570.989.23-6, fiscalização operacional sobre planejamento do quadro docente.

O relatório informa que a fiscalização recebeu da SEDUC histórico da Associação do Professor à Classe, tratado como banco de dados do módulo específico da Secretaria Escolar Digital, e o cruzou com informações de Grade Horária e dados de ausência/carga eventual.

## Evidências consolidadas

1. A Associação do Professor à Classe registra professores que foram ou são responsáveis por determinada disciplina, turma e escola, incluindo atribuições iniciais e atribuições realizadas durante o ano.
2. O histórico de associação é temporal: a fiscalização precisou reconstruir, a partir dos registros, quem efetivamente era responsável pela turma em cada dia letivo.
3. Associação em substituição registra uma relação diferente da associação titular/livre e não deve ser interpretada simplesmente como presença efetiva em sala.
4. O relatório distingue associação em substituição de aula eventual. A aula eventual pode suprir ausências esporádicas e não transforma necessariamente o eventual no responsável pela disciplina/turma.
5. Para relacionar ausência a aula afetada, a fiscalização utilizou conjuntamente Associação do Professor à Classe e Grade Horária registrada na SED.
6. Registros sem informação de horário na Grade Horária foram excluídos de determinadas análises, demonstrando que o horário é requisito operacional para determinar quais aulas foram afetadas por uma ausência.
7. O relatório também registra limitações de qualidade e finalidade dos dados da SED, reforçando a necessidade de preservar proveniência e não assumir que um registro administrativo isolado representa execução efetiva em sala.

## Implicação para a Escala

A cadeia operacional permanece:

`grade oficial → ocorrência temporal → associação vigente → ausência → necessidade de cobertura → substituição/eventual → validação`

A Escala deve manter separadas, no mínimo:

- associação docente à classe;
- horário/grade;
- ocorrência de aula;
- ausência;
- substituição formal;
- eventual/cobertura esporádica.

## Limite da evidência

O relatório do TCE é evidência forte da estrutura e do uso dos dados pela fiscalização, mas não fornece autorização para reproduzir o contrato físico atual da SED nem substitui o dicionário vigente. Não foram inferidos nomes de campos, IDs, chaves ou endpoints.

## Decisão

- Evidência estrutural: **GREEN**.
- Evidência de integração operacional atual: **RED/BLOCKED**.
- Não criar parser, DDL de produção ou reconciliação automática com base nesses achados.
- Continuar buscando o artefato vigente autorizado da Associação do Professor à Classe/Grade Horária e seu dicionário.

## Referências

- TCE-SP, TC-021570.989.23-6, especialmente metodologia e análise da Associação do Professor à Classe e Grade Horária.
- Portal de Atendimento SEDUC-SP, artigos sobre associação em substituição, aulas em substituição e substituição no PEI.
- Dados Abertos da Educação, conjunto histórico anonimizado de Associação do Professor à Classe.

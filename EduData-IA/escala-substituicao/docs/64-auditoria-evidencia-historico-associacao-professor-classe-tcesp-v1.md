# 64 — Auditoria de evidência: histórico da Associação do Professor à Classe — TCESP v1

**Produto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** AMARELO / evidência complementar; gate operacional permanece RED

## 1. Objetivo

Reavaliar a força da evidência oficial sobre a natureza do módulo **Associação do Professor à Classe**, buscando confirmação independente sobre sua função no processo de atribuição, histórico de associações, substituições e vínculo professor–disciplina–turma–escola.

## 2. Evidência oficial encontrada

O Tribunal de Contas do Estado de São Paulo (TCESP), em relatório de fiscalização operacional sobre planejamento do quadro docente, descreve a **Associação do Professor à Classe** como um banco de dados da SEDUC hospedado em módulo específico da Secretaria Escolar Digital.

O relatório afirma que esse histórico registra professores que foram ou são responsáveis por determinada **disciplina**, de determinada **turma**, de determinada **escola**. Também descreve o registro como resultado final do processo de atribuição de aulas, abrangendo tanto a atribuição inicial quanto atribuições durante o ano, inclusive situações em que um docente deixa a sala de aula e outro é atribuído em substituição.

Fonte oficial: TCESP, Diretoria de Contas do Governador, processo TC-021570.989.23-6, relatório de fiscalização operacional — Planejamento do Quadro Docente.

## 3. O que esta evidência confirma

### 3.1 Confirmado

- A Associação do Professor à Classe é um registro operacional da SEDUC relacionado à atribuição docente.
- O domínio registrado inclui, no mínimo, as dimensões professor, disciplina, turma e escola.
- O histórico possui relevância temporal, pois registra associações ao longo do processo de atribuição e mudanças decorrentes de afastamentos/substituições.
- O histórico pode distinguir associação permanente/titular e associação em substituição, segundo a descrição do TCESP.
- A fonte é institucionalmente relevante e independente da documentação tutorial da SEDUC.

### 3.2 Não confirmado

A evidência **não** permite afirmar:

- qual é o identificador técnico/canônico do professor no banco;
- qual é o identificador técnico/canônico da turma;
- qual é o identificador técnico/canônico da disciplina/componente;
- se CPF é chave técnica atual;
- se DI é chave técnica atual;
- quais são os nomes exatos e tipos dos campos físicos;
- qual é o layout atual do Excel gerado pela SED;
- qual é o endpoint/API usado pela interface;
- qual é a estrutura atual do dicionário XLS publicado em Dados Abertos;
- se o arquivo anonimizado de Dados Abertos preserva os mesmos identificadores do ambiente operacional.

## 4. Relação com as evidências anteriores

Esta evidência reforça as auditorias anteriores:

- `61-auditoria-evidencia-identidade-operacional-sed-v1.md`: CPF permanece apenas como atributo operacional historicamente evidenciado, não como chave canônica homologada.
- `62-auditoria-dicionario-associacao-professor-classe-v1.md`: o dicionário oficial XLS foi localizado no catálogo, mas o arquivo direto retornou HTTP 403 e seu conteúdo não foi homologado.
- `63-auditoria-interface-exportacao-associacao-professor-classe-v1.md`: a interface SED possui exportação Excel/PDF da lista de associação, mas isso ainda não entrega o arquivo gerado nem seu layout técnico.

## 5. Impacto no modelo da Escala

A evidência do TCESP fortalece a decisão arquitetural de tratar a **Associação do Professor à Classe** como fonte operacional relevante para reconstrução/homologação da identidade acadêmica e da situação de atribuição docente.

Ela também reforça a separação entre:

`Fonte SED → staging bruto → normalização → resolução de identidade → homologação → publicação no Core`

Nenhum identificador inferido por nome, e-mail, CPF, posição de linha ou semântica aproximada deve ser promovido automaticamente a chave canônica.

## 6. Gate

### Fonte funcional da associação docente
**GREEN/forte evidência:** a função operacional e histórica do módulo está confirmada por fonte oficial SEDUC/SEDUC Portal e por fiscalização oficial do TCESP.

### Artefato técnico atual
**RED:** ainda falta obter e homologar um artefato técnico atual — preferencialmente o Excel efetivamente gerado pela SED ou o dicionário técnico correspondente — com seus cabeçalhos, identificadores, tipos e regras de validade.

### API/exportação automatizada
**RED:** a existência do botão de exportação na interface não prova endpoint público nem contrato automatizável.

### Identidade docente canônica
**RED:** nenhum campo atual foi homologado como identificador técnico canônico do docente.

### Produção
**RED/BLOCKED:** não criar DDL produtivo, parser definitivo ou publicação canônica com base apenas nesta evidência.

## 7. Próximo passo objetivo

Continuar a busca exclusivamente por evidência oficial de:

1. arquivo Excel real produzido pela SED na funcionalidade de Associação do Professor à Classe;
2. documentação oficial que reproduza o layout/cabeçalhos desse arquivo;
3. dicionário técnico acessível do recurso oficial de Dados Abertos;
4. documentação/API pública que descreva a consulta/exportação;
5. identificadores técnicos de professor, turma e componente/disciplina e respectivas regras de validade.

Somente após a homologação desses elementos deve ser fechado o contrato técnico do adaptador e iniciada a implementação de parser/ingestão.

## 8. Conclusão

A evidência do TCESP é um avanço relevante: confirma que a Associação do Professor à Classe é o registro operacional/histórico de atribuição professor–disciplina–turma–escola e que contempla substituições ao longo do tempo.

Ela **não fecha o gate técnico**. O bloqueio permanece exclusivamente na camada de artefato físico atual, identificadores, layout e mecanismo de exportação/API.

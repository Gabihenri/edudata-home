# 106 — Protocolo de Aquisição do Artefato Técnico SED v1

**Status:** OPERACIONAL / PRONTO PARA AQUISIÇÃO  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Definir o pacote mínimo que deve ser obtido de uma fonte oficial da SED antes de qualquer parser, DDL produtivo ou sincronização.

## 2. Pacote mínimo exigido

### A. Artefato operacional atual

Deve representar a Associação e/ou Grade utilizadas operacionalmente no período alvo, preferencialmente em exportação autorizada, arquivo institucional, API documentada ou outro meio técnico oficial.

Um recorte pequeno e representativo pode iniciar a homologação. Não é necessário obter a base integral da escola na primeira etapa, desde que o recorte preserve contexto suficiente para verificar identidade, relacionamento e temporalidade.

### B. Dicionário/estrutura

Deve permitir identificar:

- nome técnico dos campos;
- tipo/formato;
- obrigatoriedade;
- cardinalidade;
- domínio/códigos;
- relacionamento entre registros;
- regras de vigência;
- versão do artefato.

### C. Identidade

Deve esclarecer, sem inferência:

- identificador técnico do docente;
- identificador técnico da turma/subturma;
- identificador técnico do componente/disciplina;
- identificador da associação;
- identificador ou chave da ocorrência/grade, quando existente.

CPF/DI somente poderá ser usado como chave de integração se a fonte oficial declarar essa função.

### D. Temporalidade

Deve ser possível determinar:

- período de referência;
- início/fim de vigência;
- versão da grade;
- momento de extração;
- comportamento diante de alteração de grade;
- relação entre associação ativa e grade vigente.

### E. Proveniência

Registrar:

- órgão/sistema responsável;
- URL ou localização oficial;
- módulo e operação/tela de origem;
- perfil/contexto de acesso, quando aplicável;
- escola e ano letivo;
- data/hora de obtenção;
- versão;
- hash do artefato bruto, quando tecnicamente possível;
- autorização ou contexto de acesso;
- evidência documental que sustenta sua autoridade.

## 3. Níveis de evidência

Para evitar promoção indevida de documentação para contrato técnico, classificar a evidência recebida:

- **E1 — documental:** regra ou semântica sustentada por documentação oficial;
- **E2 — observável:** estrutura ou comportamento observado em tela/relatório/tutorial oficial;
- **E3 — técnico atual:** artefato operacional atual acompanhado de estrutura/dicionário ou evidência técnica suficiente para homologação.

E1 e E2 podem orientar o modelo e a reconciliação, mas não autorizam, isoladamente, parser produtivo ou definição de chave técnica.

E3 é o nível necessário para promover campos críticos a **HOMOLOGATED**.

## 4. Recorte mínimo recomendado para a primeira homologação

Quando a fonte permitir, priorizar um recorte real e atual contendo, no mínimo:

- uma escola;
- ano letivo 2026;
- uma turma/subturma;
- um componente curricular;
- um professor associado;
- um ou mais horários;
- a vigência correspondente;
- uma substituição, se disponível.

Preferir XLSX/CSV. PDF oficial também pode ser aceito como evidência inicial de estrutura observável, mas não como prova automática de chave técnica.

O recorte deve ser preservado sem alteração antes de qualquer sanitização.

## 5. O que não é suficiente

Não desbloqueiam o gate, isoladamente:

- screenshot da interface;
- tutorial funcional;
- dataset histórico anonimizado;
- dicionário sem o artefato correspondente;
- nomes de campos observados na tela;
- CPF/DI encontrados em documentos;
- endpoint descoberto por inspeção não autorizada;
- suposição de que API do portal de Dados Abertos seja a API operacional da SED;
- arquivo atual sem contexto de origem, vigência ou autoridade suficiente.

Essas evidências podem sustentar semântica, mas não contrato técnico produtivo.

## 6. Procedimento de homologação

Quando o pacote chegar:

1. congelar o artefato bruto;
2. registrar proveniência;
3. comparar artefato e dicionário;
4. verificar versão e vigência;
5. classificar cada campo como `HOMOLOGATED`, `OBSERVED_ONLY`, `AMBIGUOUS` ou `REJECTED`;
6. homologar identificadores;
7. documentar cardinalidades e regras;
8. construir fixture sanitizada;
9. executar R01–R14 no ambiente sintético/regressivo disponível;
10. testar reconciliação temporal;
11. somente então autorizar especificação física.

## 7. Critério de desbloqueio

O **GATE-FONTE-SED** somente passa para GREEN quando houver evidência suficiente para todos os seguintes pontos:

- fonte operacional atual;
- estrutura verificável;
- identidade docente homologada;
- identidade de turma homologada;
- identidade de componente homologada;
- associação e semântica confirmadas;
- vigência/versionamento confirmados;
- relação grade → ocorrência confirmada;
- proveniência registrada;
- contrato de atualização conhecido.

## 8. Regra de não inferência

Se qualquer campo crítico permanecer ambíguo, a implementação deve permanecer bloqueada. A ausência de informação técnica é tratada como uma condição explícita do sistema, não como convite para heurística.

## 9. Estado atual

O projeto possui motor, contratos, explicabilidade, snapshot, reexecução e regressão sintética preparados. A documentação oficial e os materiais operacionais já sustentam o modelo funcional e temporal, mas ainda não substituem o artefato técnico operacional atual.

O próximo avanço externo depende da obtenção do pacote técnico homologável descrito neste documento. Um primeiro recorte real já é suficiente para iniciar a matriz campo → significado → evidência → confiança → status, sem exigir a base integral.

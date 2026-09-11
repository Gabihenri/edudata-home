# 106 — Protocolo de Aquisição do Artefato Técnico SED v1

**Status:** OPERACIONAL / PRONTO PARA AQUISIÇÃO  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Definir o pacote mínimo que deve ser obtido de uma fonte oficial da SED antes de qualquer parser, DDL produtivo ou sincronização.

## 2. Pacote mínimo exigido

### A. Artefato operacional atual

Deve representar a Associação e/ou Grade utilizadas operacionalmente no período alvo, preferencialmente em exportação autorizada, arquivo institucional, API documentada ou outro meio técnico oficial.

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
- data/hora de obtenção;
- versão;
- hash do artefato bruto, quando tecnicamente possível;
- autorização ou contexto de acesso;
- evidência documental que sustenta sua autoridade.

## 3. O que não é suficiente

Não desbloqueiam o gate, isoladamente:

- screenshot da interface;
- tutorial funcional;
- dataset histórico anonimizado;
- dicionário sem o artefato correspondente;
- nomes de campos observados na tela;
- CPF/DI encontrados em documentos;
- endpoint descoberto por inspeção não autorizada;
- suposição de que API do portal de Dados Abertos seja a API operacional da SED.

Essas evidências podem sustentar semântica, mas não contrato técnico produtivo.

## 4. Procedimento de homologação

Quando o pacote chegar:

1. congelar o artefato bruto;
2. registrar proveniência;
3. comparar artefato e dicionário;
4. verificar versão e vigência;
5. homologar identificadores;
6. documentar cardinalidades e regras;
7. construir fixture sanitizada;
8. executar R01–R12;
9. testar reconciliação temporal;
10. somente então autorizar especificação física.

## 5. Critério de desbloqueio

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

## 6. Regra de não inferência

Se qualquer campo crítico permanecer ambíguo, a implementação deve permanecer bloqueada. A ausência de informação técnica é tratada como uma condição explícita do sistema, não como convite para heurística.

## 7. Estado atual

O projeto possui motor, contratos, explicabilidade, snapshot, reexecução e regressão sintética preparados. O próximo avanço externo depende exclusivamente da obtenção do pacote técnico homologável descrito neste documento.

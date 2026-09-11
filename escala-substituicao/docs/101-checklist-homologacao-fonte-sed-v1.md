# 101 — Checklist de Homologação da Fonte SED v1

**Projeto:** Escala de Substituição  
**Status:** GATE-FONTE-SED RED/BLOCKED  
**Data:** 2026-09-10

## 1. Objetivo

Transformar o GATE-FONTE-SED em um checklist operacional verificável, evitando que evidência funcional ou observação de interface seja promovida indevidamente a contrato técnico de integração.

## 2. Evidências obrigatórias

| Item | Evidência necessária | Estado |
|---|---|---|
| Artefato técnico | exportação, arquivo, documentação técnica ou resposta oficial verificável da fonte operacional | PENDENTE |
| Estrutura | campos, tipos, cardinalidade e relacionamento documentados | PENDENTE |
| Identidade docente | regra oficial para identificar professor/DI/CPF no contexto operacional | PENDENTE |
| Identidade da turma | regra oficial para identificar turma/subturma | PENDENTE |
| Identidade do componente | regra oficial para identificar disciplina/componente | PENDENTE |
| Associação | chave/identidade e semântica da associação professor-classe | PENDENTE |
| Vigência | regra de início/fim e versão temporal | PENDENTE |
| Grade/ocorrência | regra que permita derivar ocorrência operacional a partir da grade oficial | PENDENTE |
| Proveniência | origem, versão, extração e autoridade do artefato | PENDENTE |
| Atualização | periodicidade, janela de atualização e comportamento de alterações | PENDENTE |

## 3. O que já pode ser usado

Podem continuar sendo utilizados como evidência conceitual/harness-safe:

- documentação funcional oficial;
- telas e formulários oficiais observados;
- tutoriais históricos;
- dados abertos históricos/anônimos;
- cenários sintéticos;
- contratos comportamentais do motor;
- testes de regressão sem identificadores reais.

Esses elementos não autorizam parser, DDL produtivo, sincronização automática ou reconciliação por identificador não homologado.

## 4. Critérios de abertura do gate

O gate somente poderá mudar de `RED/BLOCKED` para estado de homologação técnica quando houver evidência verificável para todos os pontos críticos:

1. artefato técnico real da fonte operacional;
2. especificação/dicionário correspondente;
3. identificadores oficiais de professor, turma e componente;
4. regra de vigência e versionamento;
5. autoridade da fonte e contexto temporal;
6. possibilidade de reconstruir a proveniência da captura;
7. contrato de atualização/reconciliação.

## 5. Regras negativas

Enquanto qualquer item crítico estiver pendente:

- não inferir ID por nome, e-mail, CPF, posição da linha ou combinação heurística;
- não tratar dados abertos anonimizados como chave operacional;
- não tratar a Agenda como fonte oficial da grade;
- não consumir endpoint não documentado;
- não criar DDL produtivo a partir de campos apenas observados na UI;
- não promover recomendação do motor para atribuição oficial automaticamente.

## 6. Próximo artefato necessário

O próximo passo técnico prioritário é obter da fonte autorizada um artefato operacional atual que permita confrontar a matriz observável da Associação/Grade com o contrato técnico real.

Após sua obtenção, o processo deverá ser:

`artefato → identificação → dicionário → vigência → autoridade → reconciliação → parser → harness com fixture real sanitizada → homologação → integração`

Nenhuma etapa posterior deve ser antecipada sem evidência suficiente.

## 7. Relação com a regressão

A bateria R01–R12 permanece válida como proteção comportamental. PASS dos harnesses sintéticos demonstra somente consistência do modelo interno; não abre o GATE-FONTE-SED.

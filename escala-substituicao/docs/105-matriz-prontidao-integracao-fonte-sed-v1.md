# 105 — Matriz de Prontidão para Integração da Fonte SED v1

**Projeto:** Escala de Substituição  
**Status:** PREPARAÇÃO / GATE-FONTE-SED RED-BLOCKED  
**Data:** 2026-09-10

## 1. Objetivo

Definir exatamente o que estará pronto para implementação assim que o artefato técnico oficial da Associação/Grade for disponibilizado, sem antecipar decisões dependentes de homologação.

## 2. Matriz

| Camada | Preparada | Evidência necessária para liberar | Estado |
|---|---:|---|---|
| Modelo conceitual | Sim | contratos 55, 83–100 | PRONTO |
| Alocação global | Sim | harnesses R01–R12 | PRONTO |
| Explicabilidade | Sim | contrato de recomendação | PRONTO |
| Snapshot/reexecução | Sim | contratos de estado e rodada | PRONTO |
| Regras de segurança | Sim | invariantes de regressão | PRONTO |
| Identidade docente | Parcial | regra oficial de identificação | BLOQUEADO |
| Identidade turma | Parcial | chave oficial da turma/subturma | BLOQUEADO |
| Identidade componente | Parcial | chave oficial do componente | BLOQUEADO |
| Associação | Parcial | contrato técnico atual | BLOQUEADO |
| Grade | Parcial | artefato técnico + versionamento | BLOQUEADO |
| Parser | Não | fonte técnica homologada | NÃO INICIAR |
| DDL produtivo | Não | modelo físico homologado | NÃO INICIAR |
| Sincronização | Não | contrato de atualização/API/exportação | NÃO INICIAR |

## 3. Princípio de prontidão

A arquitetura comportamental pode continuar evoluindo independentemente da fonte técnica. A implementação de integração somente começa quando os itens bloqueados tiverem evidência suficiente.

Nenhuma lacuna deve ser preenchida por inferência.

## 4. Sequência após desbloqueio

Quando o artefato oficial estiver disponível:

1. preservar o artefato bruto e sua proveniência;
2. identificar versão, data e autoridade;
3. confrontar o dicionário com o conteúdo real;
4. homologar chaves e cardinalidades;
5. definir fixture sanitizada de teste;
6. implementar parser mínimo;
7. executar regressão contra a fixture;
8. validar vigência e reconciliação temporal;
9. só então especificar DDL e persistência produtiva;
10. posteriormente habilitar sincronização autorizada.

## 5. Critério de segurança

O fato de a interface SED exibir determinado campo não significa que exista uma coluna, chave ou endpoint com o mesmo nome. Observação de UI permanece evidência semântica até existir confirmação técnica.

Da mesma forma, dados abertos históricos ou anonimizados podem orientar estrutura e semântica, mas não podem ser promovidos a identidade operacional atual sem homologação.

## 6. Relação com o motor

O motor de alocação permanece independente da tecnologia da fonte. Seu contrato é:

`fonte homologada → snapshot → elegibilidade/disponibilidade → alocação global → explicação → validação humana → resultado operacional`

Se a fonte estiver incompleta, incerta ou desatualizada, o snapshot deve impedir confirmação conforme os contratos de reexecução.

## 7. Estado atual

**Arquitetura comportamental:** pronta para receber uma fonte homologada.  
**Integração técnica:** não autorizada.  
**GATE-FONTE-SED:** RED/BLOCKED.

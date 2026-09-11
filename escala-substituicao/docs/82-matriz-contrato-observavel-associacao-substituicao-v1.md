# Matriz 82 — Contrato observável Associação × Substituição

**Data:** 2026-09-11  
**Status:** PROVISÓRIO — observação de interface/processo, não contrato técnico.

| Domínio | Evidência observável | Confiança | Homologação técnica |
|---|---|---|---|
| Identidade docente | Professor / DI / CPF em diferentes telas | alta | pendente |
| Unidade | Diretoria / Escola | alta | pendente |
| Estrutura da aula | Tipo de Ensino / Turma / Sub Turma / Disciplina | alta | pendente |
| Associação | Tipo de Atribuição / Fase da Atribuição | alta | pendente |
| Vigência | Início / Fim da Vigência | alta | pendente |
| Regime especial | Suplementar — Docente atuando no PEI | alta | pendente |
| Substituição de associação | Atribuição de Aula em Substituição | alta | pendente |
| Operação de presença | Data / Diretoria / Escola / Tipo | alta | pendente |
| Seleção da ocorrência | Turno / Disciplina / Turma | alta | pendente |
| Designação | Substituto por CPF/DI | alta | pendente |
| Correção operacional | Exclusão de indicação incorreta | alta | pendente |

## Regra de uso

Esta matriz pode orientar fixtures e testes de domínio, mas não autoriza:

- criação de colunas SQL com estes nomes;
- definição de chaves técnicas;
- parser de export real;
- integração direta com endpoints não documentados;
- reconciliação por CPF/DI sem regra oficial de identidade.

## Resultado

A evidência disponível já permite testar a separação entre **estado estrutural da associação** e **evento operacional de substituição**. O próximo artefato autorizado deverá ser comparado linha a linha com esta matriz.

**GATE-FONTE-SED: RED/BLOCKED.**

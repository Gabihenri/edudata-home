# 139 — Auditoria de Localização Documental e Integridade do Gate Escala v1

**Data:** 29/09/2026  
**Status:** 🟠 DIVERGÊNCIA DOCUMENTAL DE CAMINHO IDENTIFICADA  
**Gate produtivo:** permanece 🔴 BLOQUEADO por E3/SED e Core operacional.

## 1. Objetivo

Verificar se os documentos usados pela matriz consolidada de gates estão fisicamente presentes no caminho atualmente adotado pelo módulo Escala Inteligente EDI.

## 2. Evidências verificadas

A matriz consolidada atual está em:

`escala-substituicao/docs/115-matriz-consolidada-gates-escala-v1.md`

Nesse documento, a seção de cobertura afirma que os documentos 133–138 foram verificados fisicamente no repositório.

Na árvore atual de `main`, o caminho `escala-substituicao/docs/` contém os documentos 100–115 e a documentação posterior correspondente ao módulo.

Entretanto, verificações diretas encontraram:

- `escala-substituicao/docs/133-auditoria-e3-harness-v4-vigencia-v1.md`: não localizado no caminho atual;
- `EduData-IA/escala-substituicao/docs/133-auditoria-e3-harness-v4-vigencia-v1.md`: localizado em referência histórica do repositório;
- `EduData-IA/escala-substituicao/docs/138-auditoria-coerencia-documental-e3-v1.md`: localizado no `main`;
- `escala-substituicao/tests/regression-v2-r03-r15-r16.postgres.test.sql`: localizado no caminho atual.

## 3. Interpretação

A divergência indica que houve mudança ou coexistência histórica de raízes documentais:

`EduData-IA/escala-substituicao/`

e

`escala-substituicao/`

Isso não constitui evidência de duas arquiteturas produtivas nem autoriza mover, duplicar ou apagar arquivos automaticamente.

O risco é documental: uma matriz pode declarar como "fisicamente verificado" um artefato que atualmente está em outra raiz, em referência histórica, ou não está disponível no caminho atual.

## 4. Regra de precedência

Até a reconciliação dos caminhos:

1. arquivos presentes em `main` no caminho atual têm precedência operacional;
2. arquivos encontrados somente em commits históricos não devem ser tratados como artefatos atuais;
3. documentos históricos podem continuar sendo usados para reconstrução da evolução, mas devem ser identificados como históricos;
4. nenhum harness histórico deve ser promovido automaticamente para evidência atual;
5. nenhuma exclusão ou movimentação de documentação deve ocorrer sem confirmar a origem e o destino canônicos.

## 5. Impacto nos gates

A divergência não altera os resultados já obtidos nos harnesses executados em PostgreSQL nem libera qualquer integração produtiva.

O gate E3 continua:

**RED / BLOCKED**

porque a fonte operacional SED autorizada continua ausente.

O Core operacional, Resolver físico, RLS Escala, governança física e concorrência multi-sessão continuam nos estados definidos pela matriz consolidada.

## 6. Próxima ação segura

Reconciliar documentalmente a raiz canônica do módulo e atualizar a matriz consolidada para distinguir:

- documento presente no `main`;
- documento presente apenas em histórico;
- documento ausente;
- documento duplicado em duas raízes.

Somente depois dessa reconciliação deve-se considerar qualquer movimentação ou exclusão de arquivos.

## 7. Conclusão

Foi identificada uma inconsistência real de localização documental, sem evidência de alteração arquitetural ou de liberação indevida de produção.

**Resultado:** 🟠 pendência documental de integridade; gates produtivos permanecem inalterados.

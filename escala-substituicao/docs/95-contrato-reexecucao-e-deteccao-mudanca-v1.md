# Escala de Substituição — Contrato de Reexecução e Detecção de Mudança v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Uma recomendação pode deixar de ser válida enquanto ainda está aguardando confirmação. A Escala precisa detectar quando a fotografia que sustentou a decisão mudou e impedir confirmação silenciosa de um plano obsoleto.

## 2. Comparação

Conceitualmente:

```text
snapshot da rodada
        ↓
estado atual observado
        ↓
comparação
        ↓
SEM MUDANÇA ──→ pode continuar validação
        │
        └── MUDANÇA MATERIAL ──→ invalidar confirmação direta
                                      ↓
                                  nova rodada
```

## 3. Mudança material

Uma mudança é material quando pode alterar cobertura, elegibilidade, disponibilidade, conflito ou qualquer restrição/critério utilizado pelo plano.

Exemplos conceituais:

- ocorrência adicionada/removida/alterada;
- ausência alterada;
- candidato tornou-se indisponível;
- candidato tornou-se disponível;
- elegibilidade ou escopo aplicável mudou;
- vigência relevante mudou;
- regra utilizada no cálculo foi alterada.

A lista definitiva dependerá das fontes e regras homologadas.

## 4. Assinatura de estado

Cada rodada deve possuir uma assinatura das entradas relevantes. O estado atual pode ser comparado com essa assinatura para detectar alteração sem depender de comparação visual manual.

A assinatura é conceito interno e não deve ser confundida com identificador oficial da SED.

## 5. Resultado da comparação

Estados conceituais:

- `UNCHANGED` — nenhuma alteração material detectada;
- `MATERIALLY_CHANGED` — plano pode não ser mais válido;
- `SOURCE_UNCERTAIN` — não foi possível confirmar o estado atual;
- `COMPARISON_FAILED` — falha técnica na verificação.

## 6. Regra de confirmação

Somente `UNCHANGED` permite continuidade normal da validação.

`MATERIALLY_CHANGED` deve exigir nova rodada antes da confirmação, salvo política administrativa futura explicitamente homologada.

`SOURCE_UNCERTAIN` e `COMPARISON_FAILED` devem impedir confirmação automática.

## 7. Experiência do gestor

A mensagem deve ser operacional e direta:

> **A situação mudou. A recomendação precisa ser recalculada.**

Em seguida, mostrar o que mudou em linguagem resumida, sem exigir que o usuário reconstrua manualmente o problema.

## 8. Histórico

A rodada anterior permanece preservada. A nova rodada referencia a anterior para permitir auditoria e comparação.

## 9. Segurança

A detecção de mudança não deve ampliar permissões nem expor dados além do escopo autorizado. Comparações devem respeitar minimização e controle de acesso.

## 10. Limites

Contrato conceitual. Não define mecanismo físico de hash, tabela, endpoint, parser ou identificadores SED. Não autoriza integração produtiva enquanto o GATE-FONTE-SED permanecer bloqueado.
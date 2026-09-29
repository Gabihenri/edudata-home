# 140 — Auditoria de Presença da Faixa Documental 117–138 v1

**Data:** 29/09/2026  
**Status:** 🟠 FAIXA DOCUMENTAL PARCIALMENTE PRESENTE NA RAIZ CANÔNICA  
**Gate produtivo:** 🔴 permanece bloqueado por E3/SED e Core operacional.

## 1. Objetivo

Após a auditoria 139, foi realizada uma verificação adicional da raiz canônica:

`escala-substituicao/docs/`

O objetivo foi determinar se os documentos numerados 117–138 estão atualmente disponíveis nessa raiz, distinguindo ausência atual de existência histórica.

## 2. Resultado observável

Na listagem atualmente recuperada da raiz canônica, foram encontrados:

- 116 — auditoria E3 evidência pública;
- 116 — auditoria de reexecução de fixture v2;
- 139 — auditoria de localização documental.

A consulta de diretório não apresentou, na página recuperada, a faixa completa 117–138.

Também houve timeout em uma tentativa de busca ampla no GitHub. Portanto, **não é seguro concluir, somente com essa consulta, que todos os documentos 117–138 foram apagados do repositório**.

## 3. Evidência já confirmada

O documento 138 foi anteriormente localizado em:

`EduData-IA/escala-substituicao/docs/138-auditoria-coerencia-documental-e3-v1.md`

O documento 133 também foi localizado anteriormente em referência histórica sob:

`EduData-IA/escala-substituicao/docs/133-auditoria-e3-harness-v4-vigencia-v1.md`

O harness R03/R15/R16 está confirmado na raiz atual:

`escala-substituicao/tests/regression-v2-r03-r15-r16.postgres.test.sql`

## 4. Interpretação

Neste momento existem três estados que não devem ser confundidos:

1. **Presente na raiz canônica atual**;
2. **Localizado em raiz histórica ou referência histórica**;
3. **Não confirmado por consulta atual**.

A auditoria não autoriza assumir que o estado 3 significa exclusão.

## 5. Impacto

Nenhum gate comportamental validado anteriormente é invalidado por esta divergência documental.

Também não há fundamento para:

- mover arquivos automaticamente;
- duplicar documentos;
- apagar documentos históricos;
- alterar contratos técnicos;
- alterar DDL;
- criar parser;
- criar RLS produtivo;
- promover harness sintético a fonte operacional.

## 6. Ação segura

A próxima reconciliação deve usar a árvore/commits do repositório para estabelecer, para cada documento 117–138:

`CURRENT_CANONICAL | HISTORICAL | DUPLICATE | NOT_CONFIRMED`

Somente após essa classificação a matriz consolidada poderá afirmar cobertura física atual da faixa.

## 7. Conclusão

A documentação comportamental e os gates continuam válidos conforme as evidências já executadas.

A pendência identificada agora é de **integridade/localização documental**, não de lógica do motor.

O gate produtivo permanece:

**🟠 PRONTO NO COMPORTAMENTO / 🔴 BLOQUEADO NA INTEGRAÇÃO PRODUTIVA.**

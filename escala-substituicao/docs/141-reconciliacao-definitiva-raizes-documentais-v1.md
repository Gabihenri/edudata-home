# 141 — Reconciliação Definitiva de Raízes Documentais Escala v1

**Data:** 29/09/2026  
**Status:** 🟢 DIVERGÊNCIA DOCUMENTAL EXPLICADA / 🟠 RAIZ CANÔNICA AINDA REQUER LIMPEZA CONTROLADA  
**Gate produtivo:** 🔴 E3/SED e Core operacional continuam bloqueados.

## 1. Evidência decisiva

Foi consultada a árvore Git do commit `45edde53ce1a8a6e222edcfa14fd63353f6ad6ab`, que antecede as atualizações recentes da matriz consolidada.

Nesse estado do repositório, os documentos 117–138 foram encontrados fisicamente sob:

`EduData-IA/escala-substituicao/docs/`

Isso confirma que a sequência documental não foi simplesmente inventada pela matriz nem perdida sem histórico.

## 2. O que ocorreu

Existem duas raízes documentais na evolução do projeto:

- raiz histórica: `EduData-IA/escala-substituicao/`;
- raiz atualmente adotada: `escala-substituicao/`.

A matriz consolidada passou a ser mantida na raiz atual, enquanto parte da documentação E3 permaneceu na raiz histórica.

Portanto, a inconsistência identificada nas auditorias 139–140 é de **localização/reorganização documental**, não de ausência histórica dos documentos.

## 3. Documentos comprovados na raiz histórica no commit-base

Foram localizados:

117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 129, 130, 131, 132, 133, 134, 135, 136, 137 e 138.

O item 128 não foi localizado pela filtragem de nomes em `docs/`, o que é compatível com seu caráter de harness/teste e deve ser reconciliado no diretório de testes, não presumido como documento.

## 4. Conclusão documental

A matriz anterior estava correta ao afirmar que a documentação 133–138 existia no repositório no momento da auditoria, mas a formulação “verificados fisicamente no repositório” podia induzir a leitura de que todos estavam na mesma raiz canônica.

A interpretação correta é:

**existência histórica no repositório: CONFIRMADA;  
presença atual na raiz canônica: NÃO CONFIRMADA para toda a faixa;  
duplicação automática: NÃO autorizada;  
exclusão automática: NÃO autorizada.**

## 5. Próxima ação segura

A limpeza deve ser controlada:

1. identificar quais arquivos 117–138 já possuem equivalente atual na raiz `escala-substituicao/`;
2. comparar conteúdo/SHA quando houver equivalentes;
3. preservar documentos que contenham histórico único;
4. mover somente após comprovar equivalência e destino canônico;
5. atualizar referências internas;
6. só então considerar remoção da raiz histórica, se for desejável e comprovadamente segura.

Nenhuma movimentação foi realizada nesta auditoria.

## 6. Impacto técnico

Nenhum gate comportamental é invalidado.

Continuam válidos:

- harnesses PostgreSQL já executados;
- contratos de identidade;
- contratos de ocorrência;
- regras HARD;
- ranking;
- alocação global;
- persistência;
- autorização;
- governança contratual.

Continuam bloqueados:

- fonte SED operacional;
- parser produtivo;
- DDL acadêmico oficial;
- Resolver físico contra Core operacional;
- RLS produtiva Escala;
- governança física Escala;
- concorrência multi-sessão real;
- engine ponta a ponta.

## 7. Estado

**Documentação histórica E3: 🟢 comprovadamente existente.**  
**Organização da documentação na raiz canônica: 🟠 pendente de reconciliação controlada.**  
**Integração produtiva: 🔴 bloqueada.**

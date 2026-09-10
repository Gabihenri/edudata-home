# 66 — Auditoria do layout histórico de exportação da Associação do Professor à Classe v1

**Produto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** AMARELO — evidência estrutural forte, mas histórica

## 1. Objetivo

Registrar a primeira evidência documental que expõe o conteúdo efetivamente apresentado na **Lista de Associação** e, portanto, fornece um antecedente concreto do layout de exportação Excel/PDF do módulo Associação do Professor à Classe.

## 2. Evidência

Tutorial oficial/veiculado institucionalmente da Plataforma SED, versão 2019.03.222, orienta que após pesquisar as associações cadastradas é possível gerar arquivo em Excel e PDF. A mesma documentação informa que o módulo está vinculado ao sistema de Matriz Curricular e que, para o cadastro, a matriz deve estar homologada e o quadro de aulas gerado.

Fonte: Tutorial “Associação do Professor na Classe”, versão 2019.03.222.

## 3. Layout observado

A representação documental da Lista de Associação apresenta as seguintes colunas:

1. `Professor`
2. `CPF Professor`
3. `DI`
4. `Tipo de Atribuição`
5. `Fase`
6. `Escola`
7. `Tipo de Ensino`
8. `Substituição`
9. `Turma`
10. `Qtde Aulas`
11. `Disciplina`

A evidência é particularmente importante porque deixa de ser apenas a existência do botão **Gerar Excel**: existe também uma amostra documental do conjunto de campos que compunha a lista exportável/consultável.

## 4. O que pode ser inferido com segurança

### Confirmado como estrutura histórica

- O módulo possui uma lista de associações consultável.
- A lista historicamente expunha professor, CPF do professor e DI.
- A lista historicamente expunha escola, tipo de ensino, turma e disciplina.
- A lista historicamente expunha situação de atribuição/substituição.
- A lista historicamente expunha quantidade de aulas.
- A interface possuía exportação para Excel e PDF.
- O módulo tinha relação explícita com a matriz curricular homologada e com o quadro de aulas.

### Não pode ser promovido a contrato atual

A versão 2019 não prova que:

- os mesmos nomes de colunas permaneçam em 2025/2026;
- os mesmos campos existam no Excel atual;
- CPF seja identificador técnico canônico;
- DI seja identificador técnico canônico;
- `Qtde Aulas` seja suficiente para reconstruir uma grade horária;
- a exportação atual preserve identificadores internos;
- exista endpoint/API público para geração do arquivo.

## 5. Relação com a evidência atual

A documentação de 2025 localizada anteriormente mostra a interface atual da SED com os botões **Escolher Colunas**, **Imprimir**, **Gerar Excel** e **Gerar PDF**. Portanto, existe continuidade funcional da capacidade de exportação.

A documentação atual também mostra CPF como campo de pesquisa/cadastro e DI na tela de associação. Entretanto, o conteúdo exato do Excel atual continua não homologado.

## 6. Consequência para o adaptador SED

Este achado permite definir um **layout histórico de referência**, útil para:

- comparação com futuros arquivos reais;
- criação de testes de detecção de mudança de layout;
- identificação de campos candidatos a mapeamento;
- validação de regressão do parser.

Não permite ainda criar o parser produtivo.

O contrato deve continuar exigindo uma etapa de reconhecimento da versão do arquivo:

`arquivo bruto → identificação de layout/versão → validação estrutural → normalização → resolução de identidade → homologação`

## 7. Impacto nos identificadores

A presença histórica simultânea de `CPF Professor` e `DI` é uma evidência importante para o problema de identidade, mas não resolve qual identificador é a chave técnica.

A regra permanece:

- CPF = atributo de matching potencial, nunca chave canônica por inferência;
- DI = atributo/identificador candidato que precisa de documentação técnica atual;
- nome = não usar como chave;
- posição da linha = nunca usar como chave;
- somente identificador oficialmente homologado pode alimentar a identidade acadêmica canônica.

## 8. Gate atualizado

| Controle | Estado |
|---|---|
| Existência de exportação | 🟢 forte, atual + histórica |
| Estrutura histórica da lista | 🟢 confirmada |
| Campos históricos de identidade | 🟢 CPF + DI documentados |
| Layout 2025/2026 do Excel | 🔴 não obtido |
| Dicionário técnico atual | 🔴 não homologado |
| Significado técnico de DI | 🔴 não homologado |
| Chave canônica docente | 🔴 não homologada |
| API/exportação automatizada | 🔴 não homologada |
| Parser produtivo | 🔴 bloqueado |
| DDL produtivo | 🔴 bloqueado |

## 9. Próximo passo

A busca deve continuar pelo artefato atual, priorizando:

1. arquivo Excel real exportado pela SED em 2025/2026;
2. documentação oficial que apresente os cabeçalhos atuais;
3. dicionário XLS atual;
4. documentação técnica que explique DI e demais identificadores;
5. eventual documentação pública do mecanismo de exportação.

## 10. Conclusão

Este é um avanço real sobre o estado anterior: agora existe uma **amostra documental concreta do layout de exportação histórico**, incluindo os campos de identidade e atribuição relevantes para a Escala.

Ela fortalece o desenho do adaptador, mas não autoriza assumir que o layout atual seja idêntico ao de 2019. O gate técnico permanece RED até a homologação do artefato 2025/2026.

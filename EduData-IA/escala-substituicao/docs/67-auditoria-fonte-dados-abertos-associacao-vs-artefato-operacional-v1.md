# 67 — Auditoria: Dados Abertos da Associação versus artefato operacional SED v1

**Produto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** RED / bloqueio técnico mantido

## 1. Novo achado

A consulta atual do catálogo oficial de Dados Abertos SP confirma que o conjunto **Associação do Professor à Classe** é descrito como **base anonimizada** e possui quatro recursos publicados: um dicionário XLS e arquivos CSV referentes a 2021, 2020 e 2019.

O catálogo registra atualização de metadados em 2 de fevereiro de 2026, porém os recursos identificados continuam explicitamente rotulados como 2019–2021. Portanto, a data de atualização do catálogo **não pode ser interpretada como evidência de que os dados operacionais atuais da SED foram publicados ou atualizados em 2026**.

## 2. Evidência do catálogo

Dataset:
- identificador: `50b6947e-3cc6-4b2e-9654-323edafb0fd1`
- título: Associação do Professor à Classe
- descrição: base anonimizada de Associação de Professores às Classes
- recursos: dicionário XLS, 2021 CSV, 2020 CSV, 2019 CSV
- recurso do dicionário: `a4a95fd5-cf5d-4988-b2b5-48522d589046`
- formato do dicionário: XLS
- `datastore active`: false
- recurso sem visualização (`Has views: false`)

O arquivo do dicionário foi localizado no catálogo, mas seu conteúdo não está disponível para inspeção no fluxo atual; o link direto anteriormente retornou HTTP 403.

## 3. Consequência para a Escala

A base de Dados Abertos é útil como **evidência auxiliar histórica e estrutural**, mas não deve ser tratada como fonte operacional corrente da associação docente.

A separação necessária é:

```text
SED operacional atual
        ↓
artefato/exportação oficial atual
        ↓
staging bruto
        ↓
normalização
        ↓
homologação
        ↓
Core canônico da Escala
```

versus:

```text
Dados Abertos anonimizado 2019–2021
        ↓
evidência auxiliar / teste histórico
        ✕ não substitui a fonte operacional atual
```

## 4. Evidência adicional do TCESP

O relatório oficial TC-021570.989.23-6 demonstra que, para a fiscalização, a SEDUC forneceu dados de Associação do Professor à Classe e Grade Horária suficientes para análise em larga escala. O trabalho menciona uma base inicial de 273.267 turmas e 136.143.018 aulas, além de tratamento de dados requisitados à SEDUC.

Isso demonstra que existe um **artefato operacional suficientemente estruturado para extração e análise institucional**, mas o relatório não publica o esquema físico, nomes dos campos, identificadores técnicos ou contrato de API.

Portanto, a evidência reforça a existência do artefato, mas não autoriza inferir seu layout.

## 5. API do Portal de Dados Abertos

O manual oficial do Portal informa que o portal utiliza CKAN e disponibiliza API pública para conjuntos de dados e recursos, embora determinadas operações exijam autenticação.

Isso permite continuar a investigação pelo catálogo/API, mas não altera o gate: a API do **catálogo** não é automaticamente uma API da **SED operacional**.

## 6. Estado dos campos

| Campo/conceito | Estado |
|---|---|
| Professor | confirmado conceitualmente |
| CPF do professor | documentado em interfaces/tutoriais históricos; não canônico |
| DI | documentado em interfaces/tutoriais históricos; significado técnico atual não homologado |
| Escola | confirmado conceitualmente |
| Turma | confirmado conceitualmente |
| Disciplina | confirmado conceitualmente |
| Vigência | confirmada conceitualmente |
| Substituição | confirmada conceitualmente |
| Quantidade de aulas | documentada historicamente |
| Identificador técnico do professor | não homologado |
| Identificador técnico da turma | não homologado |
| Identificador técnico do componente | não homologado |
| Layout atual do Excel SED | não obtido |
| API operacional SED | não identificada |

## 7. Decisão

Não utilizar os CSVs 2019–2021 como fonte corrente para o motor de substituição.

Eles podem futuramente ser usados para:
- testes de regressão histórica;
- validação de semântica de campos;
- testes de anonimização;
- comparação de versões do modelo;
- construção de fixtures sintéticas, sem promover seus IDs a chaves canônicas.

## 8. Próximo passo

Prioridade máxima permanece:

1. obter um Excel real produzido pela funcionalidade **Gerar Excel** da SED atual;
2. obter o dicionário técnico atual, se acessível;
3. comparar ambos com o layout histórico documentado;
4. identificar IDs e regras de vigência;
5. somente então fechar o parser e o contrato físico de ingestão.

## 9. Gate

**Gate funcional:** GREEN.  
**Gate histórico/estrutural:** GREEN.  
**Gate fonte operacional atual:** RED.  
**Gate identificadores técnicos:** RED.  
**Gate parser:** RED.  
**Gate DDL produtivo:** RED/BLOCKED.

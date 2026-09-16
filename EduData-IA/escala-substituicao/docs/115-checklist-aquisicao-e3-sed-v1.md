# 115 — Checklist de Aquisição do Artefato E3 SED v1

**Status:** PRONTO PARA AQUISIÇÃO AUTORIZADA  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 16/09/2026

## 1. Objetivo

Fornecer um procedimento curto e operacional para obter, por perfil autorizado, o primeiro artefato técnico atual da SED necessário à homologação da Escala de Substituição.

Este documento não presume endpoint, API, formato de exportação, ID ou chave física.

## 2. Artefatos prioritários

Solicitar, preferencialmente para uma escola e o ano letivo de 2026:

1. **Relatório Grade Horária**;
2. **Consulta/Relatório da Associação do Professor à Classe**.

Se a SED oferecer exportação, preservar o formato original, preferencialmente XLSX/CSV. PDF pode ser preservado como evidência inicial, mas não comprova sozinho uma chave técnica.

## 3. Contexto mínimo a registrar

Para cada arquivo recebido registrar:

- escola/unidade;
- ano letivo;
- perfil que realizou a consulta/exportação, quando permitido;
- módulo/tela/relatório de origem;
- filtros utilizados;
- data e hora da obtenção;
- formato original;
- nome original do arquivo;
- versão ou referência exibida pela fonte, se houver;
- contexto/autorização da obtenção.

Não alterar o arquivo original antes da preservação.

## 4. Recorte mínimo recomendado

Um primeiro recorte é suficiente para iniciar a homologação se preservar contexto suficiente para verificar:

- pelo menos um professor;
- uma turma/subturma;
- um componente curricular;
- um horário;
- uma associação;
- a relação com a Grade;
- a referência temporal/vigência, quando disponibilizada.

Se houver substituição ou alteração de Grade no recorte, preservá-la, pois ela é particularmente útil para testar temporalidade.

## 5. O que observar sem interpretar

Na primeira inspeção, apenas registrar o que efetivamente aparece:

- cabeçalhos;
- códigos/identificadores;
- descrições;
- datas;
- horários;
- status;
- campos de vigência;
- campos de versão;
- chaves ou referências cruzadas;
- quantidade de registros;
- duplicidades aparentes;
- relações entre relatório e Associação.

Não converter nomes em IDs canônicos por semelhança.

## 6. Preservação

Antes da sanitização ou transformação:

```text
ARQUIVO ORIGINAL
      ↓
identificação
      ↓
hash
      ↓
proveniência
      ↓
cópia de trabalho
      ↓
sanificação, se necessária
```

O original deve permanecer imutável.

## 7. Homologação posterior

Depois da aquisição, preencher a ficha do documento 114 para cada campo relevante:

```text
campo
→ significado observado
→ evidência
→ confiança
→ status
```

Classificação permitida:

- `HOMOLOGATED`;
- `OBSERVED_ONLY`;
- `AMBIGUOUS`;
- `REJECTED`.

Um campo crítico só pode ser promovido a `HOMOLOGATED` com evidência E3 suficiente.

## 8. Campos críticos

A análise deve procurar, sem presumir nomenclatura:

1. identidade do professor;
2. identidade da turma/subturma;
3. identidade do componente;
4. identidade da Associação;
5. identidade da Grade/horário, se existente;
6. chave de relacionamento Associação ↔ Grade;
7. vigência;
8. versionamento;
9. publicação/status;
10. escola/ano letivo;
11. origem/proveniência.

## 9. Teste de multiplicidade

O primeiro artefato deve ser examinado para verificar se existem:

- múltiplos horários para a mesma Associação;
- múltiplas ocorrências do mesmo componente;
- múltiplos professores associados;
- aulas em substituição;
- alterações de Grade.

Esses casos alimentam diretamente R15 e R16, sem colapsar registros.

## 10. Não fazer

Até a homologação do E3, não:

- criar parser produtivo;
- criar endpoint de integração presumido;
- definir FK física para identidade SED;
- substituir ID por nome, CPF, e-mail ou posição de coluna;
- tratar Agenda Inteligente EDI como Grade oficial;
- usar relatório de frequência para reconstruir Grade histórica;
- promover dado histórico/anônimo a fonte operacional atual;
- publicar ocorrência oficial;
- automatizar atribuição oficial.

## 11. Sequência após recebimento

```text
E3 real
  ↓
preservação + hash
  ↓
ficha 114
  ↓
mapa de campos
  ↓
IDs/chaves
  ↓
cardinalidades
  ↓
vigência/versionamento
  ↓
fixture sanitizada
  ↓
reconciliação temporal
  ↓
R01–R16
  ↓
especificação física
  ↓
DDL somente após autorização
```

## 12. Critério de desbloqueio

O recebimento do arquivo **não** desbloqueia automaticamente o gate.

O `GATE-FONTE-SED` somente poderá avançar após a homologação dos elementos críticos previstos no protocolo 106 e na ficha 114.

Até lá:

**GATE-FONTE-SED = RED/BLOCKED.**

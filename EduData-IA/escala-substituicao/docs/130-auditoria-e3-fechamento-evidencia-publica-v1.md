# 130 — Auditoria E3 — Fechamento da Evidência Pública e Próximo Gate v1

Data: 2026-09-28
Status: EVIDÊNCIA SEMÂNTICA REFORÇADA / GATE OPERACIONAL AINDA BLOQUEADO

## 1. Evidências oficiais verificadas

A documentação pública atual da SED reforça que:

- os horários utilizados nos registros são derivados da Aba 1 da Associação do Professor à Classe e da Grade Horária;
- a ausência de Grade Horária pode disponibilizar horários incorretos para lançamento;
- a associação do professor à turma precisa possuir vigência ativa para habilitar os módulos de frequência/registro;
- associação, horário e Grade são componentes distintos do cadastro operacional;
- existem situações específicas de associação em mais de uma escola;
- existem situações específicas de "Substituições concomitantes";
- para docentes com mais de um DI, a própria SED orienta verificar se o DI ativo em Funcionário coincide com o DI usado na Atribuição, e refazer a associação quando houver divergência.

Fontes públicas verificadas em 28/09/2026:
- SED-11257 — cadastro de horário das aulas no Diário de Classe.
- SED-07774 — DI, atribuição, múltiplas escolas e coerência da associação.
- Catálogo oficial de artigos SED — associação, vigência, substituições concomitantes e cadastro de horário.

## 2. O que essas fontes comprovam

Com segurança, podemos manter como invariantes de integração:

1. Associação do professor à classe não deve ser tratada como simples texto descritivo.
2. Vigência da associação é operacionalmente relevante.
3. Grade/horário é necessário para determinar os horários operacionais de registro.
4. Associação em outra escola precisa permanecer contextualizada.
5. DI pode ser identificador operacional relevante quando fornecido pela fonte autorizada.
6. Divergência de DI não deve ser resolvida por nome, e-mail, CPF ou similar.
7. Substituição concomitante é uma condição que precisa de tratamento explícito e não deve ser resolvida por inferência.
8. A ocorrência do motor deve ser derivada de dados homologados, não simplesmente de uma tela de Agenda ou de uma associação histórica.

## 3. O que as fontes públicas NÃO comprovam

Ainda não foram obtidos:

- ID técnico da Associação;
- ID técnico da Grade;
- chave técnica do horário;
- chave técnica de Classe/Subgrupo;
- chave técnica do componente;
- chave técnica da relação Associação ↔ Grade;
- layout autorizado de exportação XLSX/CSV;
- cardinalidades oficiais completas;
- mecanismo oficial de versionamento/exportação;
- endpoint/API autorizado para extração;
- comportamento técnico completo das alterações de Grade para fins de ingestão;
- artefato operacional atual que permita construir parser determinístico.

## 4. Decisão de engenharia

Não criar ainda:

- tabela física de ocorrência SED;
- parser de produção;
- importador definitivo;
- DDL de integração SED;
- chave artificial Associação↔Grade;
- mapeamento DI → teacher_profile_id;
- inferência de responsabilidade docente;
- integração direta com Agenda.

O bloqueio E3 permanece válido.

## 5. Próximo gate objetivo

Para sair do bloqueio E3, basta obter pelo menos um artefato operacional autorizado contendo, de forma verificável:

### A. Associação Professor–Classe
- identificador técnico da associação;
- professor/DI;
- escola;
- classe;
- componente;
- início e fim da vigência;
- status;
- origem/versão.

### B. Grade Horária
- identificador técnico da Grade;
- escola;
- classe/contexto;
- componente ou referência equivalente;
- dia;
- início;
- fim;
- vigência/versão;
- status.

### C. Relação entre A e B
A relação precisa ser observável no próprio artefato ou em fonte complementar autorizada. Não será criada por coincidência de nomes, horários ou datas.

## 6. Critério de desbloqueio

E3 somente muda para VERDE quando houver:

artefato original
→ hash/proveniência
→ inventário de campos
→ identificação das chaves
→ cardinalidades observadas
→ relação Associação × Grade comprovada
→ vigência comprovada
→ fixture sanitizada
→ harness E3 executado em PostgreSQL
→ resultado reproduzível.

## 7. Estado atual

Arquitetura: GREEN
Contrato E3: GREEN
Harness E3: GREEN — validação estática
Execução PostgreSQL real do harness: PENDING
Evidência pública SED: GREEN para semântica
Artefato operacional E3: RED
IDs técnicos: RED
Relação Associação × Grade: RED
Parser: RED
DDL de produção: RED
Motor de produção: RED

Nenhuma alteração de produção foi realizada.

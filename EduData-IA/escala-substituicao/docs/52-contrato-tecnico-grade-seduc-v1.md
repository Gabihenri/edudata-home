# 52 — Contrato Técnico da Grade SEDUC v1

**Produto:** Escala Inteligente de Substituição — EduData IA  
**Data:** 2026-09-09  
**Status:** contrato técnico de integração; sem DDL produtivo

## 1. Evidência consolidada

A documentação oficial da SEDUC-SP confirma que o Diário de Classe utiliza os horários cadastrados na Associação do Professor à Classe e Grade Horária. A ausência desse cadastro altera o comportamento do registro de frequência/aulas. A documentação também identifica a Associação do Professor à Classe como módulo dependente do ecossistema SED.

Além disso, materiais oficiais e técnicos da SED mostram uma estrutura operacional em etapas, distinguindo:

1. cadastro dos horários de aulas;
2. associação professor–turma;
3. associação do professor aos horários da turma;
4. ATPC;
5. consulta das associações.

A evidência histórica consultada descreve explicitamente a associação professor–turma e, em seguida, a distribuição do professor nos intervalos da grade. Isso é evidência estrutural, não autorização para copiar o modelo legado para o banco da Escala.

## 2. Modelo canônico da Escala

A Escala deverá reconstruir somente a informação necessária ao motor:

```text
organization
  ↓
school
  ↓
academic_year / academic_period
  ↓
official_schedule_version
  ↓
official_schedule_occurrence
  ├── teacher_profile
  ├── academic_class
  ├── academic_component
  ├── weekday/date
  ├── start_time
  ├── end_time
  ├── shift
  └── validity
```

## 3. Regra de origem

A fonte primária esperada para ocorrências é a informação operacional da SED relativa à Associação do Professor à Classe e Grade Horária.

As seguintes fontes não podem ser promovidas automaticamente a fonte primária:

- Agenda EDI;
- `agenda_schedule_templates`;
- `agenda_lessons`;
- base pública de servidores;
- qualquer planilha criada manualmente sem proveniência oficial;
- modelos históricos do repositório.

## 4. Campos mínimos exigidos para publicação

Uma ocorrência somente poderá ser publicada para consumo do motor quando houver evidência determinística de:

- organização;
- escola;
- ano letivo/período;
- professor;
- turma;
- componente curricular;
- dia/data ou regra de recorrência;
- início;
- término;
- turno, quando aplicável;
- vigência;
- versão da fonte;
- origem/proveniência.

## 5. Identificadores

Nenhum identificador será inferido por texto.

### Professor

Deve utilizar identificador institucional homologado e posteriormente relacionado a `teacher_profiles`.

### Escola

Deve utilizar identificador institucional homologado para `schools.id`.

### Turma

Deve utilizar identificador oficial da classe/turma ou chave externa homologada.

### Componente

Deve utilizar código/identificador oficial ou catálogo curricular homologado.

### Proibições

Não utilizar:

- nome do professor;
- e-mail;
- CPF como chave interna permanente sem contrato explícito de finalidade;
- nome da turma isolado;
- posição da turma na tela/planilha;
- combinação textual arbitrária;
- fuzzy matching.

## 6. Versionamento

A grade deve ser tratada como dado temporal.

Uma alteração da grade não deve sobrescrever silenciosamente uma versão anterior. O processo deve preservar:

- versão recebida;
- data de importação;
- publicação;
- período de validade;
- versão anterior/sucessora;
- origem;
- responsável pela homologação, quando aplicável.

Somente versão explicitamente publicada e validada poderá alimentar o motor.

## 7. Associação professor–turma

A associação é uma relação de domínio própria e não deve ser reduzida a uma simples propriedade textual da ocorrência.

A publicação deve permitir reconstruir:

```text
Professor X
  → Classe Y
  → Componente Z
  → Horário H
  → Vigência V
```

Isso é especialmente importante para substituições: a ausência do professor não cria uma aula nova; cria uma vaga sobre uma obrigação oficial já existente.

## 8. Grade × substituição

O motor deverá consumir a grade publicada para identificar a obrigação afetada:

```text
grade publicada
      ↓
ocorrência oficial
      ↓
ausência validada
      ↓
vaga de substituição
      ↓
candidatos elegíveis
      ↓
recomendação
      ↓
validação humana
```

Nunca criar uma vaga somente porque existe uma ausência sem localizar a ocorrência oficial correspondente.

## 9. Casos especiais

A fonte pode conter situações como:

- professor em mais de uma escola;
- substituição já cadastrada;
- alteração de professor;
- mudança de dia/horário;
- mais de um professor associado a determinados componentes;
- alterações com vigência futura;
- associações temporárias.

Esses casos devem ser preservados como dados de origem e resolvidos pelo contrato de homologação, não por heurística do motor.

## 10. Critérios de rejeição

Uma ocorrência deve ser rejeitada ou permanecer em exceção quando houver:

- professor não identificado;
- turma não identificada;
- componente não identificado;
- escola incompatível;
- horário inválido;
- início >= término;
- vigência incompatível;
- associação ambígua;
- versão não publicada;
- origem desconhecida;
- conflito estrutural não resolvido.

## 11. Auditoria obrigatória

Cada publicação deve ser capaz de responder:

1. Qual fonte originou a ocorrência?
2. Qual versão da grade foi utilizada?
3. Qual professor foi homologado?
4. Qual turma foi homologada?
5. Qual componente foi homologado?
6. Qual vigência estava ativa?
7. Quem/qual processo publicou a versão?
8. Qual regra permitiu a promoção?
9. Qual decisão foi utilizada pelo motor posteriormente?

## 12. O que ainda não está comprovado

Apesar da origem operacional estar comprovada, ainda não foi localizado um artefato técnico público que permita afirmar os nomes exatos dos campos/API/exportação utilizados atualmente pela SED para:

- ID do professor;
- ID da turma;
- ID do componente;
- ID da associação;
- vigência;
- exportação da grade.

Portanto, este documento é um **contrato-alvo**, e não uma especificação de parser.

## 13. Gate

**🔴 BLOQUEADO para DDL e integração produtiva.**

Condições ainda necessárias:

1. artefato técnico real da grade;
2. amostra real anonimizada ou ambiente autorizado de homologação;
3. identificadores técnicos comprovados;
4. contrato de vigência/versionamento validado;
5. homologação docente;
6. homologação turma/componente;
7. RLS;
8. permissões `escala.*`;
9. harness executado em PostgreSQL real;
10. auditoria final sem achados críticos.

## 14. Decisão

A arquitetura da Escala está suficientemente madura para receber um **adaptador de grade**, mas ainda não existe evidência suficiente para implementar um parser contra a SED real.

A próxima implementação segura é um harness do adaptador usando fixture sintética que reproduza a estrutura comprovada, mantendo todos os campos externos parametrizados até que o artefato técnico real seja obtido.

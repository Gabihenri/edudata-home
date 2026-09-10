# 50 — Auditoria das Fontes SEDUC para Grade e Identidade — v1

**Produto:** Escala Inteligente de Substituição — EduData IA  
**Data:** 2026-09-09  
**Status do gate:** 🔴 BLOQUEADO para DDL/produção

## 1. Objetivo

Reavaliar, com evidência oficial SEDUC-SP, a separação entre fontes de identidade funcional, carga/atribuição, turmas e grade horária. O objetivo é impedir que uma base auxiliar seja promovida indevidamente a fonte operacional do motor de substituição.

## 2. Evidências oficiais

### 2.1 Bases de dados abertas catalogadas

O Plano de Dados Abertos 2025–2027 da SEDUC-SP cataloga explicitamente:

- **Servidores ativos**;
- **Turmas (classes ativas e encerradas)**;
- **Carga horária de professores**;
- **Profissionais: cargos e vínculos**.

O plano determina que as bases catalogadas sejam publicadas nos canais oficiais de transparência ativa, incluindo o Dados Abertos da Educação. Isso comprova a existência institucional dos domínios de dados, mas não comprova, isoladamente, que qualquer uma dessas bases seja a fonte operacional da grade.

Fonte oficial: Plano de Dados Abertos SEDUC-SP 2025–2027.

### 2.2 Associação do professor à classe

O Portal de Atendimento da SEDUC-SP mantém documentação específica para **Associação do Professor à Classe**, incluindo associação em mais de uma escola, edição do cadastro de horário do professor à classe e situações de aulas em substituição.

Isso demonstra que a relação docente–classe e seu horário são conceitos operacionais próprios da SED, distintos do simples cadastro funcional de servidores.

### 2.3 Sala do Futuro / Grade Horária

A documentação oficial informa que, para que as informações das turmas estejam corretamente refletidas na Sala do Futuro Professor, devem estar ajustados, entre outros elementos:

1. homologação da matriz curricular;
2. atribuição dos professores às turmas;
3. homologação do calendário escolar;
4. **cadastro da grade horária**.

Portanto, a grade horária é uma etapa operacional própria e depende da associação dos professores às turmas.

## 3. Classificação das fontes

| Fonte/domínio | Papel na Escala | Status |
|---|---|---|
| Servidores ativos | identidade funcional/contexto institucional | 🟢 auxiliar comprovada |
| Profissionais: cargos e vínculos | vínculo/categoria funcional | 🟡 auxiliar candidata |
| Carga horária de professores | atribuição/carga docente | 🟡 candidata, ainda não homologada |
| Turmas | identidade/estrutura de classes | 🟡 candidata, ainda não homologada |
| Associação Professor–Classe | relação docente ↔ classe | 🟢 conceito operacional comprovado |
| Grade Horária | horários/ocorrências | 🟢 conceito operacional comprovado; artefato técnico ainda não obtido |
| Agenda EDI | planejamento/registro operacional | 🔴 não é fonte da grade |

## 4. Achados de auditoria

### GRADE-AUD-01 — Separação entre servidor e grade

**🟢 FECHADO**

O cadastro funcional de servidores não contém, por definição arquitetural, informação suficiente para representar ocorrências de aulas. Não pode alimentar diretamente o motor.

### GRADE-AUD-02 — Domínio de carga docente existente

**🟢 FECHADO como existência institucional; 🟡 aberto para integração**

A SEDUC cataloga a base de Carga horária de professores. A existência está comprovada, mas ainda faltam o recurso técnico atual, dicionário/colunas e identificadores necessários para homologação.

### GRADE-AUD-03 — Domínio de turmas existente

**🟢 FECHADO como existência institucional; 🟡 aberto para integração**

A SEDUC cataloga Turmas (classes ativas e encerradas). Ainda não foi homologado o identificador técnico da turma para integração com `academic_classes`.

### GRADE-AUD-04 — Associação docente–classe

**🟢 FECHADO**

A documentação oficial do Portal de Atendimento comprova a existência operacional da associação do professor à classe, inclusive cadastro de horário e situações de substituição.

### GRADE-AUD-05 — Grade horária como requisito operacional

**🟢 FECHADO**

A documentação da Sala do Futuro estabelece o cadastro da Grade Horária como requisito para que a informação das turmas seja refletida corretamente para o professor.

### GRADE-AUD-06 — Artefato técnico da grade

**🔴 ABERTO — CRÍTICO**

Ainda não foi obtido um export/API/arquivo técnico oficial que permita ingestão determinística das ocorrências da grade, contendo identificadores de escola, turma, componente, docente e horário.

Não é permitido construir o parser por suposição de colunas.

### GRADE-AUD-07 — Identificador oficial da turma

**🔴 ABERTO — CRÍTICO**

O identificador técnico canônico da classe/turma ainda não foi homologado.

### GRADE-AUD-08 — Identificador oficial do componente

**🔴 ABERTO — CRÍTICO**

O identificador técnico canônico do componente curricular ainda não foi homologado.

### GRADE-AUD-09 — Identificador oficial do docente

**🔴 ABERTO — CRÍTICO**

A existência da fonte funcional foi comprovada, mas o campo técnico que deve ser utilizado como identificador institucional canônico ainda precisa ser confirmado pelo dicionário/arquivo real.

### GRADE-AUD-10 — Versionamento

**🟢 FECHADO como requisito arquitetural**

A Escala deverá preservar versões da grade e suas vigências. Uma alteração posterior não pode apagar a versão utilizada para uma decisão de substituição histórica.

## 5. Decisão arquitetural atual

A hierarquia fica formalizada:

```text
SEDUC/CGRH — identidade funcional
        ↓
identidade docente homologada
        ↓
SEDUC — atribuição / Associação Professor–Classe
        ↓
SEDUC — Grade Horária oficial
        ↓
occurrences versionadas
        ↓
Ausência
        ↓
Motor de Substituição
```

As bases abertas de servidores, carga horária e turmas podem apoiar a homologação e reconciliação, mas nenhuma delas será elevada automaticamente à condição de grade operacional.

## 6. Bloqueios críticos restantes

1. artefato técnico oficial da grade;
2. identificador oficial de docente;
3. identificador oficial de turma;
4. identificador oficial de componente;
5. amostra real para staging;
6. vínculo Auth ↔ docente;
7. catálogo de permissões `escala.*`;
8. RLS da integração;
9. execução real dos harnesses PostgreSQL.

## 7. Próximo passo seguro

A próxima etapa deve buscar especificamente o **artefato técnico da Associação Professor–Classe / Grade Horária**, e não continuar modelando a partir de bases abertas genéricas.

A busca deve priorizar, nesta ordem:

1. export oficial da SED;
2. documentação técnica/API oficial;
3. relatório oficial de associação/grade;
4. somente depois, bases abertas auxiliares.

Enquanto esse artefato não for comprovado, permanece proibida a criação de `official_schedule_occurrences` em produção e qualquer execução do motor sobre dados reais.

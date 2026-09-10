# 48 — Auditoria da Fonte Docente SEDUC v2

**Produto:** Escala Inteligente de Substituição — EduData IA  
**Data:** 2026-09-09  
**Status do gate:** 🔴 BLOQUEADO para DDL/produção

## 1. Objetivo

Reavaliar a fonte oficial de dados funcionais de servidores da SEDUC-SP como possível fonte auxiliar para a identidade acadêmica docente da Escala, sem confundi-la com a grade oficial.

## 2. Evidência oficial encontrada

A SEDUC-SP mantém o conjunto **Servidores ativos por Unidade**, sob responsabilidade da Coordenadoria de Gestão de Recursos Humanos (CGRH), no portal Dados Abertos da Educação:

https://dados.educacao.sp.gov.br/dataset/servidores-ativos-por-unidade

A página informa:

- descrição: cadastro funcional anonimizado de funcionários ativos;
- atualização mais recente consultada: 2026-09-03;
- recursos mensais, incluindo **Base Servidores Ativos 0826.csv**;
- recurso **Dicionário de Dados Servidores Ativos**;
- publicação original em 2020-03-10;
- órgão responsável: CGRH.

## 3. Classificação arquitetural

A fonte é considerada **fonte funcional auxiliar oficial** para o domínio de pessoas/servidores.

Ela NÃO é considerada fonte oficial da grade horária e NÃO pode alimentar diretamente o motor de substituição com ocorrências de aulas.

Hierarquia mantida:

```text
Fonte funcional SEDUC/CGRH
        ↓
identidade funcional / contexto institucional
        ↓
teacher_profiles / homologação docente
        ↓
ponte Auth ↔ docente, quando homologada
        ↓
fonte oficial da grade
        ↓
occurrences
        ↓
motor de substituição
```

## 4. Achados

### SED-DOC-AUD-01 — Fonte institucional oficial

**Status: 🟢 FECHADO**

Foi localizada fonte oficial mantida pela SEDUC-SP/CGRH para servidores ativos por unidade.

### SED-DOC-AUD-02 — Série temporal atual

**Status: 🟢 FECHADO**

A fonte possui recursos mensais de 2026, incluindo 08/2026, permitindo tratar atualização e validade temporal como propriedades do processo de ingestão.

### SED-DOC-AUD-03 — Dicionário oficial disponível

**Status: 🟢 FECHADO**

Existe recurso específico de dicionário de dados. A existência do dicionário é comprovada, porém seus campos não foram incorporados ao modelo até que o conteúdo técnico seja obtido e validado.

### SED-DOC-AUD-04 — Identificador docente homologado

**Status: 🔴 ABERTO — CRÍTICO**

Ainda não foi comprovado qual campo do arquivo deve ser adotado como identificador institucional canônico do docente para integração com `teacher_profiles`.

Não é permitido inferir esse identificador por nome, e-mail, cargo, posição da linha ou combinação textual.

### SED-DOC-AUD-05 — Vínculo com unidade escolar

**Status: 🟡 ABERTO — ALTO**

A fonte é explicitamente organizada por unidade, mas o campo técnico que permite mapear de forma determinística a unidade para `schools.id` ainda precisa ser homologado a partir do dicionário/arquivo real.

### SED-DOC-AUD-06 — Fonte não equivale à grade

**Status: 🟢 FECHADO**

A distinção permanece obrigatória. A própria documentação da SEDUC trata o cadastro de horário/grade como informação registrada no contexto de Associação do Professor à Classe e Grade Horária/Diário de Classe. Portanto, o cadastro funcional não substitui a grade operacional.

### SED-DOC-AUD-07 — Bases de carga horária e turmas

**Status: 🟡 ABERTO — ALTO**

O Plano de Dados Abertos 2025–2027 da SEDUC-SP cataloga as bases **Carga horária de professores** e **Turmas (classes ativas e encerradas)**. Isso confirma a existência institucional dessas bases no ecossistema de dados abertos, mas ainda não comprova que seus recursos atuais estejam disponíveis, completos ou sejam a fonte operacional da grade necessária à Escala.

Fonte: Plano de Dados Abertos SEDUC-SP 2025–2027.

### SED-DOC-AUD-08 — Dados pessoais

**Status: 🟢 FECHADO**

A descrição oficial caracteriza a base como anonimizada. A Escala não deve depender de CPF ou outro dado pessoal sensível para matching operacional. O identificador institucional deverá ser utilizado somente após homologação de seu significado e escopo.

### SED-DOC-AUD-09 — Idempotência

**Status: 🟢 DEFINIDO**

Cada carga deve preservar fonte, versão/referência temporal, hash do arquivo e contexto institucional. Reprocessamento do mesmo artefato não pode produzir duplicação lógica.

### SED-DOC-AUD-10 — Histórico

**Status: 🟢 DEFINIDO**

A série mensal reforça a necessidade de preservar origem e vigência. Atualização não deve apagar silenciosamente o histórico de identidade funcional já homologado.

## 5. Relação com a fonte da grade

A documentação oficial da SEDUC-SP estabelece que o horário/grade registrado no Diário de Classe decorre da associação do professor à classe e da grade horária. Alterações de grade também possuem efeitos temporais no ambiente operacional.

Assim, o desenho da Escala permanece:

- **CGRH / Servidores ativos:** fonte funcional auxiliar para identificação e contexto do docente;
- **Carga horária de professores:** candidata a fonte auxiliar para atribuição/carga, ainda não homologada;
- **Turmas:** candidata a fonte auxiliar para identidade de classes, ainda não homologada;
- **Associação Professor–Classe / Grade Horária / fonte operacional correspondente:** fonte primária a ser comprovada para ocorrências;
- **Agenda EDI:** planejamento/registro operacional, nunca substituto automático da grade oficial.

## 6. Bloqueios atuais

1. Identificador institucional docente ainda não homologado.
2. Campo determinístico de unidade escolar ainda não homologado.
3. Amostra real da fonte ainda não incorporada ao staging da Escala.
4. Fonte operacional da grade ainda não obtida com seus identificadores técnicos.
5. Identificadores oficiais de turma e componente ainda não homologados.
6. Ponte Auth ↔ `teacher_profiles` ainda não homologada.
7. Permissões do produto `escala` ainda ausentes do catálogo central.
8. RLS da futura ponte docente ainda não homologado.
9. Harness PostgreSQL ainda não executado em ambiente PostgreSQL real.

## 7. Decisão de auditoria

**A fonte SEDUC/CGRH está aprovada como fonte funcional auxiliar para a próxima etapa de especificação do adaptador docente, mas não está aprovada para publicação de dados em produção.**

Não executar DDL produtivo.

Não restaurar `teacher_profiles.user_id` do modelo legado.

Não fazer matching por nome, e-mail ou fuzzy.

Não utilizar Agenda como grade oficial.

## 8. Próximo passo seguro

Especificar o contrato técnico do adaptador docente SEDUC v2 com:

1. campos obrigatórios e campos proibidos;
2. identificação institucional determinística;
3. resolução de escola/unidade;
4. estados resolved/ambiguous/unresolved/rejected;
5. idempotência e versionamento;
6. promoção para `teacher_profiles`;
7. fila de exceções;
8. vínculo posterior Auth ↔ docente;
9. integração com `identity_audit_logs`;
10. critérios objetivos para liberação do gate.

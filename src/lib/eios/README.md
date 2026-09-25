# EIOS — Educational Intelligence Operating System

Esta pasta representa o patrimônio tecnológico central da EduData IA: o **Educational Intelligence Operating System (EIOS)**. O EIOS concentra capacidades compartilhadas de inteligência educacional que podem ser utilizadas por diferentes produtos sem duplicação de lógica.

## Papel na arquitetura

A arquitetura oficial da plataforma segue:

**Framework EDI → EIOS → Core Compartilhado → Produtos → Clientes**

O Framework EDI permanece como fundamento científico, metodológico e pedagógico. O EIOS transforma esses princípios em capacidades tecnológicas reutilizáveis. Produtos como Professor Digital, Agenda Inteligente EDI, Academy, Analytics e SGPA devem consumir essas capacidades, em vez de desenvolver núcleos inteligentes paralelos.

## Estrutura atual

O diretório já contém domínios e capacidades em evolução, incluindo:

- `academic/` — capacidades relacionadas ao contexto acadêmico;
- `context/` — composição e gestão de contexto para operações inteligentes;
- `core/` — fundamentos internos do EIOS e capacidades de governança;
- `curriculum/` — conhecimento e contexto curricular;
- `decision-intelligence/` — apoio estruturado à tomada de decisão;
- `events/` — eventos relevantes para integração e evolução do ecossistema;
- `evidence-intelligence/` — tratamento de evidências como fonte de inteligência;
- `governance/` — regras e capacidades de governança;
- `identity/` — identidade e contexto dos sujeitos e entidades do ecossistema;
- `knowledge-graph/` — representação de relações de conhecimento;
- `profile/` — capacidades relacionadas a perfis inteligentes;
- `semantic/` — recursos semânticos compartilhados.

Também existem arquivos e integrações em migração progressiva a partir dos engines anteriormente desenvolvidos na plataforma.

## Regra arquitetural

Antes de implementar uma nova funcionalidade, deve-se responder:

> **A funcionalidade pertence ao produto ou pertence ao EIOS?**

Se representar inteligência reutilizável, deve evoluir no EIOS. Se representar uma experiência, fluxo ou interface específica de um produto, deve permanecer no produto e consumir capacidades compartilhadas.

## Regra de evolução

O EIOS deve evoluir progressivamente a partir do código existente. Não se deve apagar ou recriar engines já implementados sem auditoria arquitetural. A estratégia oficial é **mapear → integrar → migrar → evoluir**, preservando o patrimônio tecnológico da EduData IA.

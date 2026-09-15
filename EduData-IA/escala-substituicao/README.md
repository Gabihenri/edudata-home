# EduData IA — Escala de Substituição

Produto do ecossistema EduData IA dedicado à gestão inteligente de ausências, substituições e alocação docente.

## Objetivo

Apoiar a escola na identificação rápida de professores elegíveis para substituição, reduzindo conflitos de horário e tornando a decisão mais consistente, rastreável e orientada por dados.

A pergunta operacional central é:

> **Quem pode cobrir esta aula agora, sem criar outro problema?**

## Princípio operacional

Um professor ocupado em aula, formação, ATPCA, reunião, apoio presencial ou outro compromisso incompatível não deve ser sugerido como substituto naquele período.

Restrições obrigatórias são aplicadas antes da pontuação. A alocação é global quando existem múltiplas faltas simultâneas: primeiro maximiza-se a cobertura possível; entre soluções com a mesma cobertura, maximiza-se a qualidade; os desempates são determinísticos.

## Fluxo operacional

```text
Grade oficial → Ocorrência → Ausência → Vaga → Candidatos
→ Elegibilidade → Ranking/Alocação → Validação humana → Substituição efetiva
```

O sistema distingue ocorrência oficial, ausência, vaga/necessidade operacional, candidato e substituição efetivamente indicada.

## Arquitetura e estado atual

O produto está estruturado para operar como unidade especializada da EduData IA, integrada conceitualmente ao EIOS, Core Compartilhado e Agenda Inteligente EDI.

Já estão consolidados no repositório:

- contrato do adaptador de Grade/SED e modelo de staging;
- modelo de homologação com separação entre artefato bruto, normalização, matching, versão e publicação;
- motor conceitual de alocação global com restrições duras antes do score;
- explicabilidade da recomendação e preservação de decisão humana;
- snapshots imutáveis, rodadas de cálculo, invalidação por mudança material e reconstrução histórica;
- suíte de regressão R01–R14 e fixtures sintéticos;
- guards comportamentais TypeScript e harnesses PostgreSQL sintéticos isolados;
- matriz de reconciliação entre entidades físicas do Core e as entidades acadêmicas que ainda dependem de homologação SED.

Esses artefatos estruturam e protegem o comportamento esperado, mas **não representam homologação da fonte operacional SED nem execução comprovada em PostgreSQL**.

## Fonte oficial e Gate-FONTE-SED

A Grade Horária operacional e a Associação do Professor à Classe continuam dependentes de um **artefato técnico SED atual e verificável**.

O gate permanece:

**GATE-FONTE-SED = RED / BLOCKED**

Não são utilizados como substitutos da fonte oficial:

- dados históricos ou anonimizados;
- IDs inferidos por nome, CPF, posição ou descrição;
- tutoriais e telas históricas como contrato técnico;
- Agenda Inteligente EDI como Grade oficial;
- parser, API ou DDL de produção baseado em inferência.

O próximo desbloqueio técnico exige, preferencialmente, uma exportação atual autorizada em XLSX/CSV da Associação e/ou Grade Horária, acompanhada de contexto de aquisição e, quando disponível, dicionário/layout e regras de identificação, vigência e publicação.

## Próximo passo autorizado

Quando o artefato técnico E3 estiver disponível:

```text
Artefato SED → preservação/hash → dicionário → IDs/chaves
→ vigência/versionamento → matching → fixture sanitizado
→ reconciliação temporal → R01–R14 → especificação física/DDL
```

Até esse desbloqueio, o trabalho permanece concentrado em contratos, modelagem, auditoria, fixtures e preparação segura da integração, sem promover dados sintéticos ou históricos a dados oficiais.

## Estrutura de trabalho

- `docs/` — especificação funcional, contratos, auditorias e decisões
- `roadmap/` — evolução planejada do produto
- `tests/` — regressões, fixtures e harnesses sintéticos
- `mvp/` — protótipo operacional sintético
- `screenshots/` — referências visuais e protótipos

## Integração com o ecossistema

O produto será desenvolvido como uma unidade especializada da EduData IA, preparada para integração com o EIOS, Core Compartilhado e Agenda Inteligente EDI.

A integração preserva a separação entre identidade institucional do Core e identidade acadêmica SED: entidades como escola, usuário e perfil docente podem ser reutilizadas, enquanto professor, classe, componente, associação e Grade oficial somente serão vinculados após homologação da fonte.

## Regra de avanço

```text
Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar
```

Nenhuma etapa crítica de produção deve avançar enquanto a evidência necessária não estiver disponível.

## Status

**Fase: fundação técnica e homologação preparatória.**

**Estado de integração SED: bloqueado até obtenção e homologação de artefato técnico operacional atual.**

**Produção física/DDL: bloqueada por dependência da fonte e identidade acadêmica homologadas.**

Powered by EduData IA.

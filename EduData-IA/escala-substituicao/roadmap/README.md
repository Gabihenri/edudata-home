# Roadmap — Escala de Substituição

## Estado atual

O projeto já ultrapassou a etapa de concepção inicial e possui arquitetura, contratos, modelo operacional, motor sintético de alocação global, suíte de regressão **R01–R16**, modelo de snapshots/rodadas, contrato de staging e matriz de reconciliação entre o Core e a fonte acadêmica SED.

O principal bloqueio atual é externo ao motor: **GATE-FONTE-SED = RED/BLOCKED**. Ainda não foi homologado um artefato técnico operacional atual da SED que permita confirmar as identidades acadêmicas, a Associação do Professor à Classe, a Grade Horária, suas chaves, vigências, versionamento e semântica de publicação.

Portanto:

- desenvolvimento conceitual e sintético: avançado;
- contratos e regras: consolidados;
- reconciliação Core × Grade SED: documentada;
- testes sintéticos R01–R16: estruturados;
- execução PostgreSQL dos harnesses: não comprovada;
- integração operacional SED: bloqueada;
- DDL de produção: bloqueado;
- atribuição oficial automática: não permitida.

## Fase 1 — Concepção e fundação

- definição do posicionamento como produto EduData IA;
- especificação das regras de elegibilidade;
- definição do modelo de dados necessário;
- desenho do motor de priorização;
- auditoria física do Core e reconciliação com o SQL legado;
- contrato de identidade acadêmica;
- contrato da fonte oficial da grade;
- modelo da grade oficial versionada;
- matriz de integração Core × EIOS × Agenda × Escala;
- contrato de snapshot e estados de validade;
- contrato de persistência das rodadas;
- contrato de explicabilidade e validação humana;
- modelo de staging e homologação do adaptador;
- matriz de reconciliação Core × SED.

**Status:** concluída no âmbito documental, arquitetural e sintético. A homologação operacional permanece bloqueada pela ausência do artefato técnico E3 atual da SED.

## Fase 2 — MVP operacional

- aquisição autorizada do artefato atual da Associação do Professor à Classe e/ou Grade Horária;
- preservação do arquivo original e registro de proveniência/hash;
- dicionário/layout e classificação dos campos;
- homologação das identidades oficiais de professor, turma e componente curricular;
- homologação das chaves de associação e relações entre Associação e Grade;
- validação de vigência, temporalidade e versionamento;
- criação de fixture real sanitizado;
- reconciliação temporal entre grade, associação e ocorrência;
- cadastro/contexto da ausência;
- consulta da grade oficial publicada;
- materialização/consulta de ocorrências temporais;
- consulta de horários e compromissos;
- filtragem de conflitos;
- lista de professores elegíveis;
- critérios de priorização;
- registro da decisão;
- auditoria completa do ciclo.

**Gate de entrada:** nenhum parser ou DDL de produção deve ser criado com base em inferência. A fase só avança para integração física após a homologação do artefato E3.

## Fase 3 — Inteligência operacional

- recomendações explicáveis;
- otimização de múltiplas substituições;
- indicadores de cobertura;
- histórico e análise de padrões;
- integração mais profunda com o EIOS;
- reprocessamento versionado e comparação de cenários;
- preservação do plano algorítmico original diante de override humano;
- análise de impacto após alterações materiais.

A alocação deve permanecer lexicográfica:

```text
1. maximizar cobertura
2. maximizar qualidade entre soluções de mesma cobertura
3. aplicar critérios secundários somente quando homologados
4. desempate determinístico
```

Restrições duras são aplicadas antes do score e nunca podem ser violadas por uma pontuação maior.

## Fase 4 — Ecossistema

- integração com Agenda Inteligente EDI;
- integração com demais serviços compartilhados da EduData IA;
- evolução para gestão institucional de substituições;
- importação de grades de diferentes fontes institucionais por adaptadores homologados;
- observabilidade e governança operacional.

A Agenda Inteligente EDI permanece como contexto operacional e não substitui a Grade Horária oficial da SED.

## Próximo marco objetivo

O próximo avanço material é a entrada de um **artefato técnico operacional atual da SED (E3)**, preferencialmente XLSX/CSV de Associação do Professor à Classe, Grade Horária ou Relatório Grade Horária, acompanhado do contexto de aquisição e, quando disponível, dicionário/layout.

Sequência após o recebimento:

```text
Artefato E3
  ↓
Preservação + hash + proveniência
  ↓
Dicionário e mapa de campos
  ↓
Homologação de IDs/chaves
  ↓
Validação de vigência/versionamento
  ↓
Fixture sanitizado
  ↓
Reconciliação temporal
  ↓
R01–R16
  ↓
Especificação física
  ↓
DDL de produção
```

Até esse ponto, dados históricos, tutoriais, nomes, CPF, posição de coluna, e-mail ou outras aproximações não podem substituir a identidade oficial da SED.

## Regra de avanço

Cada fase deve seguir:

```text
Definir
  ↓
Implementar
  ↓
Auditar
  ↓
Corrigir
  ↓
Validar
  ↓
Registrar
  ↓
Avançar
```

Nenhuma migration de produção será executada enquanto houver achado crítico aberto relacionado a identidade, integridade, temporalidade, RLS, proveniência ou decisão administrativa.

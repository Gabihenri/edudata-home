# Auditoria 74 — Artefato Excel, integração e protocolo SED — v1

**Projeto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** RED/BLOCKED para integração técnica

## 1. Objetivo

Avançar a investigação do GATE-FONTE-SED procurando: (a) documentação oficial atual que reproduza a exportação da tela Associação do Professor à Classe; (b) evidência de IDs técnicos; (c) documentação oficial de integração/API; e (d) exemplos reais de arquivos/exportações.

## 2. Evidência oficial sobre o layout/exportação

Foi localizada documentação oficial da SEDUC-SP de 2025, publicada em arquivo da infraestrutura oficial `midiasstoragesec.blob.core.windows.net`, intitulada **ASSOCIAÇÃO EXPANSÃO NOVO ENSINO MÉDIO - NOTURNO**.

A peça reproduz a tela **Associação do Professor à Classe**, com **Ano Letivo 2025**, e confirma a presença de `Escolher Colunas`, `Imprimir`, `Gerar Excel` e `Gerar PDF` na Lista de Associação.

**Limite:** o material reproduz a interface, mas não disponibiliza o arquivo XLSX/CSV efetivamente gerado nem um dicionário de dados do Excel. Portanto, não homologa o layout técnico da exportação.

## 3. Evidência histórica do conteúdo da exportação

Foi localizada peça oficial da SEDUC-SP/SED de tutorial da Associação do Professor na Classe que mostra a Lista de Associação e afirma que os registros podem ser gerados em Excel/PDF.

O exemplo histórico apresenta as colunas:

- Professor
- CPF Professor
- DI
- Tipo de Atribuição
- Fase
- Escola
- Tipo de Ensino
- Substituição
- Turma
- Qtde Aulas
- Disciplina

O documento é útil como evidência histórica de estrutura funcional, mas **não deve ser tratado como layout vigente 2025/2026**.

## 4. Evidência oficial atual sobre integração/API

A documentação oficial de integração da Secretaria Digital demonstra que a SEDUC mantém APIs REST documentadas para módulos do ambiente SED.

Foi localizada, entre outras, a especificação **NCA048 — Integração — NCAAPI — ConsultaTurmaClasse**, que informa serviço REST para consulta de turmas/classes, com dados como turno, horários, tipo de ensino, série, turma, capacidade, sala e dias da semana. A documentação também explicita autenticação por Bearer Token e os ambientes de produção/homologação.

Também foram localizadas especificações de serviços como `EscolasPorMunicipio`, `UnidadesPorEscola` e `ConsultaEscolasNominais`, com códigos identificadores de diretoria/escola em seus contratos.

### Interpretação correta

Essas APIs comprovam que existe infraestrutura formal de integração na SED e que alguns módulos possuem contratos técnicos documentados. **Não comprovam que a Associação do Professor à Classe/Grade Horária possua API pública equivalente, nem que os identificadores desses serviços sejam os IDs canônicos da Associação.**

Nenhum endpoint da Associação Professor–Classe foi localizado nesta rodada.

## 5. Evidência sobre autenticação

O Portal de Atendimento informa que, desde 01/07/2025, o acesso de servidores e educadores à SED passou a ocorrer exclusivamente via gov.br, no nível bronze.

Essa informação é relevante para o protocolo operacional, mas não constitui contrato de autenticação máquina-a-máquina para integração da Escala.

## 6. Evidência sobre associação, horário e vigência

Documentação oficial atual confirma que:

- a turma precisa estar associada na SED para aparecer no Diário de Classe;
- a associação precisa estar com vigência ativa;
- a associação ocorre em duas dimensões operacionais: turma/professor e horários;
- os horários utilizados no Diário de Classe são os cadastrados na Aba 1 da Associação do Professor à Classe e Grade Horária.

Essas evidências reforçam o domínio funcional já consolidado, mas não revelam as chaves técnicas internas.

## 7. Resultado da investigação de IDs

### Confirmado

Existem identificadores técnicos em APIs documentadas da SED para outros domínios, por exemplo:

- código identificador da escola (CIE);
- código identificador da diretoria estadual;
- código DNE do município.

### Não confirmado

Permanece sem homologação:

- ID técnico canônico do docente para a Associação;
- ID técnico da turma/classe utilizado pela Associação;
- ID técnico do componente/disciplina utilizado pela Associação;
- ID técnico da associação professor-classe-horário;
- chave estável de reconciliação entre exportações da Associação e demais módulos.

Não é permitido transferir ou inferir esses IDs a partir de APIs de outro módulo.

## 8. Conclusão sobre a existência de artefato público

Nesta rodada foram encontradas três classes de evidência oficial:

1. **2025:** reprodução atual da tela Associação com botão `Gerar Excel`, sem o arquivo exportado;
2. **histórica:** tutorial com exemplo de conteúdo da Lista de Associação e indicação de exportação Excel/PDF;
3. **integração:** APIs REST documentadas de outros módulos da SED, demonstrando infraestrutura técnica formal, mas sem contrato identificado para Associação do Professor à Classe.

Não foi localizado um artefato público verificável que permita homologar o **XLSX atual da Associação 2025/2026**, seus cabeçalhos completos, tipos, IDs ou chave de reconciliação.

## 9. Protocolo para obtenção legítima do artefato real

O próximo passo deve ser a obtenção de uma exportação real por usuário autorizado, sem contornar autenticação ou mecanismos de segurança.

### Procedimento mínimo

1. Usuário autorizado acessa a SED por seu fluxo oficial de autenticação.
2. Acessa `Recursos Humanos → Associação do Professor à Classe`.
3. Realiza uma pesquisa que produza registros reais, respeitando as permissões do perfil.
4. Usa `Gerar Excel` pela própria interface.
5. Preserva o arquivo original sem edição.
6. Registra, quando permitido: data/hora, ano letivo, escola/DE, filtros utilizados e perfil responsável pela exportação.
7. Calcula SHA-256 do arquivo original.
8. Entrega o artefato ao projeto por canal autorizado, removendo dados pessoais que não sejam necessários ao teste quando isso puder ser feito sem alterar a estrutura do arquivo.

### Não fazer

- não automatizar login;
- não capturar tokens/cookies;
- não explorar endpoints internos não documentados;
- não contornar controles de acesso;
- não usar dados pessoais para descobrir chaves por inferência.

## 10. Auditoria que será executada quando o XLSX chegar

Antes de qualquer parser definitivo:

1. inventário dos cabeçalhos;
2. nome e número das planilhas;
3. tipos e formatos;
4. linhas de cabeçalho/metadados;
5. cardinalidade;
6. duplicidades;
7. campos de vigência;
8. campos de associação/substituição;
9. IDs explícitos e estabilidade aparente;
10. relação com professor, turma e componente;
11. comparação entre duas exportações, se possível;
12. hash e cadeia de custódia;
13. classificação de cada campo: confirmado / observado / inferido / desconhecido;
14. decisão de homologação do contrato.

## 11. Gate

**GATE-FONTE-SED: RED/BLOCKED.**

A investigação aumentou a evidência sobre o domínio, a interface de exportação e a existência de infraestrutura formal de APIs, mas ainda não existe evidência suficiente para liberar parser definitivo, DDL de produção, matching por CPF/DI ou sincronização automática.

## 12. Próximo passo

A missão técnica passa de busca documental ampla para **obtenção legítima do artefato operacional real**. Em paralelo, a documentação pública de integração continuará sendo tratada como fonte auxiliar para entender contratos adjacentes, sem promover seus IDs para o domínio da Associação.

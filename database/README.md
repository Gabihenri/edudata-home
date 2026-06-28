# EduData IA Database

> Plataforma Oficial de Persistência de Dados da EduData IA

---

# Visão Geral

O banco de dados da EduData IA constitui a camada central de persistência do ecossistema EDI (Educação, Dados e Inteligência).

Sua função não é apenas armazenar informações, mas estruturar o conhecimento institucional da plataforma, permitindo que todos os módulos compartilhem um único modelo de dados consistente, seguro e escalável.

Toda decisão arquitetural desta camada busca garantir:

- Integridade dos dados;
- Escalabilidade nacional;
- Multi-organização (Multi-Tenant);
- Segurança por Row Level Security (RLS);
- Auditoria completa;
- Integração com Inteligência Artificial;
- Evolução contínua da plataforma.

---

# Filosofia da Modelagem

A modelagem do banco segue os princípios do Framework EDI.

O conhecimento sempre antecede a implementação.

A estrutura foi projetada para que diferentes produtos da EduData IA utilizem a mesma base de dados, evitando duplicidade de informações e garantindo consistência entre os módulos.

Os dados pertencem à organização e não ao produto.

Assim, Professor Digital, Agenda Inteligente EDI, Analytics, SGPA, Academy e futuros módulos compartilham a mesma infraestrutura de persistência.

---

# Arquitetura

A estrutura está organizada em módulos.

```
00_setup.sql
01_organizations.sql
02_schools.sql
03_users_profiles.sql
04_academic_structure.sql
05_agenda.sql
06_pedagogical_actions.sql
07_evidence_ledger.sql
08_substitutions.sql
09_intelligence.sql
10_governance.sql
11_indexes.sql
12_rls.sql
```

Cada arquivo representa uma responsabilidade específica da plataforma.

---

# Organização dos Módulos

## 00_setup

Responsável pela configuração inicial do PostgreSQL.

Inclui:

- extensões;
- funções auxiliares;
- configuração inicial.

---

## 01_organizations

Camada responsável pelas organizações.

Representa:

- escolas;
- secretarias;
- diretorias;
- universidades;
- instituições.

Toda informação da plataforma pertence a uma organização.

---

## 02_schools

Cadastro oficial das unidades escolares.

Integra:

- Base INEP;
- cadastro manual;
- escolas particulares;
- futuras integrações governamentais.

Esta tabela é compartilhada por todos os produtos da EduData IA.

---

## 03_users_profiles

Camada de identidade.

Representa:

- usuários;
- professores;
- coordenadores;
- diretores;
- supervisores;
- administradores.

A autenticação é independente da modelagem.

---

## 04_academic_structure

Estrutura acadêmica.

Inclui:

- áreas do conhecimento;
- disciplinas;
- anos letivos;
- turmas.

Serve como base para Agenda, Diário, Planejamento e Analytics.

---

## 05_agenda

Agenda Inteligente EDI.

Responsável pelos eventos pedagógicos.

Inclui:

- reuniões;
- aulas;
- planejamentos;
- formações;
- calendário institucional.

---

## 06_pedagogical_actions

Representa as ações pedagógicas.

Inclui:

- planejamento;
- metodologias;
- objetivos;
- avaliações;
- execução.

É um dos pilares do Professor Digital.

---

## 07_evidence_ledger

Camada de evidências.

Armazena:

- evidências;
- anexos;
- validações;
- categorias.

Será utilizada por:

- Professor Digital;
- Analytics;
- Governança.

---

## 08_substitutions

Gerencia:

- disponibilidade;
- substituições;
- compatibilidade docente.

Futuramente receberá apoio da IA institucional.

---

## 09_intelligence

Camada de Inteligência.

Inclui:

- indicadores;
- EDI Score;
- notificações;
- insights produzidos por IA.

É a principal interface entre os dados e os mecanismos analíticos da plataforma.

---

## 10_governance

Camada de governança.

Responsável por:

- auditoria;
- configurações;
- feature flags;
- rastreabilidade.

Todo evento crítico da plataforma deve ser registrado nesta camada.

---

## 11_indexes

Centraliza todos os índices do banco.

Objetivos:

- performance;
- escalabilidade;
- otimização de consultas.

---

## 12_rls

Implementa Row Level Security.

Garantindo isolamento entre organizações e segurança no acesso aos dados.

---

# Multi-Tenant

A EduData IA utiliza arquitetura Multi-Tenant.

Cada organização possui isolamento lógico dos seus dados.

A separação ocorre através das políticas de segurança implementadas via PostgreSQL Row Level Security (RLS).

---

# Segurança

A plataforma adota:

- PostgreSQL RLS;
- autenticação externa (Supabase Auth);
- auditoria;
- criptografia de credenciais;
- isolamento por organização.

---

# Inteligência Artificial

Este banco foi preparado para suportar:

- IA Institucional;
- mecanismos RAG;
- embeddings;
- Knowledge Graph;
- busca semântica;
- recomendações inteligentes;
- indicadores automáticos.

A IA não substitui o banco de dados.

Ela utiliza esta estrutura como fonte oficial de conhecimento.

---

# Princípios

Todo novo módulo deverá respeitar:

- consistência dos dados;
- reutilização das entidades existentes;
- ausência de duplicidade;
- versionamento controlado;
- compatibilidade com o ecossistema EDI.

---

# Governança

Alterações estruturais deverão ocorrer exclusivamente através de migrations versionadas.

Nenhuma alteração deve ser realizada diretamente em produção.

Toda evolução deverá preservar compatibilidade com versões anteriores sempre que possível.

---

# Projeto Phoenix

Este banco de dados faz parte da arquitetura oficial da Release 1.0 do Projeto Phoenix.

Ele constitui a fundação técnica sobre a qual será construída toda a Plataforma EduData IA.

---

**EduData IA**

**Framework EDI — Educação, Dados e Inteligência**

Versão 1.0

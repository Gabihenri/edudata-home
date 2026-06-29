# EduData IA - Services

> Camada de Regras de Negócio da Plataforma EduData IA.

---

# Objetivo

A pasta `services` concentra toda a lógica de negócio da plataforma.

Ela é responsável por transformar as requisições da API em operações de domínio, utilizando os repositories para acesso ao banco de dados e retornando objetos compatíveis com os schemas da aplicação.

Nenhum Router deve acessar diretamente o banco de dados.

Toda regra de negócio deve ser implementada nesta camada.

---

# Arquitetura

```
HTTP Request
        │
        ▼
Router
        │
        ▼
Schema
        │
        ▼
Service
        │
        ▼
Repository
        │
        ▼
Database
```

O Service representa o núcleo funcional da plataforma.

---

# Responsabilidades

Cada Service deverá:

- validar regras de negócio;
- coordenar operações entre múltiplos repositories;
- controlar transações;
- integrar IA institucional;
- integrar serviços externos;
- gerar indicadores;
- executar validações de domínio;
- retornar objetos compatíveis com os Schemas.

---

# Não pertence ao Service

Os Services NÃO devem:

- executar SQL diretamente;
- acessar Supabase diretamente;
- acessar PostgreSQL diretamente;
- construir respostas HTTP;
- conhecer detalhes do Frontend.

Estas responsabilidades pertencem respectivamente aos:

- Repository
- Router

---

# Estrutura

```
services/

organization_service.py

school_service.py

user_service.py

agenda_service.py

pedagogical_action_service.py

evidence_service.py

substitution_service.py

analytics_service.py

notification_service.py

ai_service.py
```

Cada módulo possui um Service próprio.

---

# Organização

Todos os Services devem seguir o mesmo padrão.

Exemplo:

```
class SchoolService

create()

update()

delete()

find_by_id()

search()

list()

activate()

deactivate()
```

Cada método deve possuir responsabilidade única.

---

# Integrações

Os Services poderão integrar:

- Supabase
- PostgreSQL
- Claude
- OpenAI
- Google Drive
- Google Calendar
- Gmail
- Microsoft 365
- Power BI
- n8n
- APIs Institucionais

Sempre através de adaptadores próprios.

---

# Inteligência Artificial

A IA Institucional será utilizada exclusivamente através dos Services.

Nenhum Router poderá chamar modelos de IA diretamente.

Exemplos:

- recomendações;
- classificação automática;
- análise de evidências;
- geração de insights;
- resumos;
- busca semântica;
- agentes especializados.

---

# Princípios

Cada Service deve:

- ser pequeno;
- ser reutilizável;
- possuir baixa dependência;
- possuir alta coesão;
- ser facilmente testável.

---

# Testes

Cada Service deverá possuir testes unitários próprios.

A lógica de negócio nunca deverá depender do Framework Web.

---

# Projeto Phoenix

Esta camada representa o coração funcional da Plataforma EduData IA.

Toda regra institucional deverá ser implementada nesta pasta antes de ser disponibilizada pela API.

---

**EduData IA**

**Framework EDI — Educação, Dados e Inteligência**

Versão 1.0

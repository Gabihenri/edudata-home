# EduData IA - Schemas

> Camada de contratos da API da Plataforma EduData IA.

---

# Objetivo

Esta pasta contém todos os Schemas (Pydantic) utilizados pela API.

Os Schemas representam o contrato oficial entre o Backend e qualquer consumidor da API.

Eles definem:

- validação dos dados;
- serialização;
- desserialização;
- documentação automática do OpenAPI;
- tipagem da aplicação.

Nenhuma regra de negócio deve existir nesta camada.

---

# Fluxo da Arquitetura

A arquitetura da API segue o fluxo abaixo:

```
HTTP Request
        │
        ▼
Router
        │
        ▼
Schema (Request)
        │
        ▼
Service
        │
        ▼
Repository
        │
        ▼
Database
        │
        ▼
Repository
        │
        ▼
Service
        │
        ▼
Schema (Response)
        │
        ▼
HTTP Response
```

Os Schemas são responsáveis exclusivamente pelo transporte de dados.

---

# Estrutura

```
schemas/

organization.py
school.py
user.py

(...)
```

Cada módulo da plataforma possui seu próprio Schema.

Exemplo:

```
agenda.py

pedagogical_action.py

evidence.py

notification.py

analytics.py
```

---

# Convenção de Nomes

Cada entidade deverá possuir, sempre que possível:

```
EntityCreate

EntityUpdate

EntityResponse

EntityList

EntityDetail
```

Exemplo:

```
SchoolCreate

SchoolUpdate

SchoolResponse

SchoolList

SchoolDetail
```

---

# Responsabilidades

Os Schemas devem:

- validar entrada;
- validar saída;
- documentar automaticamente a API;
- padronizar respostas;
- impedir dados inválidos.

Os Schemas NÃO devem:

- acessar banco;
- executar consultas;
- possuir regras de negócio;
- chamar APIs externas;
- acessar IA.

---

# Versionamento

Os Schemas devem manter compatibilidade sempre que possível.

Alterações incompatíveis deverão gerar uma nova versão da API.

Exemplo:

```
/api/v1/

/api/v2/
```

---

# Integração

Esta camada é utilizada por:

- Routers
- Services
- OpenAPI
- Swagger
- Testes

---

# Padrão de Desenvolvimento

Todo novo módulo deverá possuir seu Schema correspondente antes da implementação da camada Service.

A sequência oficial da Engenharia é:

1. Database
2. Models
3. Schemas
4. Services
5. Routers
6. Frontend

---

# Projeto Phoenix

Este diretório faz parte da arquitetura oficial da Release 1.0 da Plataforma EduData IA.

Todos os contratos da API devem ser definidos nesta camada antes da implementação das regras de negócio.

---

**EduData IA**

**Framework EDI — Educação, Dados e Inteligência**

Versão 1.0

# Contrato do Core EIOS

**Projeto:** EduData IA Platform  
**Componente tecnológico:** EIOS — Educational Intelligence Operating System  
**Status:** Contrato arquitetural oficial  
**Versão:** 1.0  
**Aplicação inicial:** Agenda Inteligente EDI  
**Abrangência:** Todos os produtos atuais e futuros da EduData IA Platform

---

## 1. Finalidade

Este documento define o contrato oficial do Core Compartilhado do EIOS.

O contrato estabelece:

- quais capacidades pertencem ao núcleo tecnológico da plataforma;
- quais entidades e serviços podem ser reutilizados pelos produtos;
- quais responsabilidades permanecem nos produtos especializados;
- quais regras de segurança e governança são obrigatórias;
- quais estruturas não podem ser duplicadas;
- como uma nova funcionalidade deve integrar-se ao ecossistema.

Este documento não altera a arquitetura oficial da EduData IA.

---

## 2. Arquitetura oficial

A hierarquia permanente da plataforma é:

```text
Framework EDI
        ↓
EIOS — Educational Intelligence Operating System
        ↓
Core Compartilhado
        ↓
Produtos Especializados
        ↓
Usuários e organizações
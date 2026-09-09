# 31 — Auditoria da Especificação Física de Turmas e Componentes v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — DDL DE PRODUÇÃO BLOQUEADO
**Artefato auditado:** `docs/30-especificacao-fisica-academic-classes-components-v1.md`

## 1. Escopo

Auditar se o modelo físico candidato preserva as decisões anteriores, evita duplicação do Core/Agenda, mantém integridade institucional e não transforma dados de importação em identidade canônica sem homologação.

## 2. Matriz de achados

### CLASS-PHY-01 — dependências físicas comprovadas
**High — ABERTO**

O modelo referencia `organizations`, `schools` e `school_years`, mas a criação física ainda depende da reconciliação final dessas chaves e da política composta escola/organização/ano. A especificação corretamente não cria tabelas compartilhadas alternativas.

**Ação:** comprovar constraints e chaves no PostgreSQL antes do DDL.

### CLASS-PHY-02 — unicidade do identificador externo
**High — DEFINIDO**

A regra `(school_id, school_year_id, official_external_id)` é adequada como identidade contextual quando o identificador externo é fornecido. A ausência do identificador não autoriza unicidade por nome.

**Resultado:** regra aceita; implementação deve usar índice único parcial.

### CLASS-PHY-03 — coerência escola/organização/ano
**High — ABERTO**

FKs isoladas não garantem que escola, organização e ano pertençam ao mesmo contexto institucional.

**Ação:** testar constraint composta ou função/trigger de validação no harness antes de produção.

### CLASS-PHY-04 — temporalidade
**Medium — DEFINIDO**

A especificação separa identidade estável de publicação temporal da grade e preserva `valid_from/valid_until`.

**Resultado:** adequado; deve ser testado contra intervalos inválidos e sobreposição quando a política final exigir exclusão temporal.

### COMP-PHY-01 — escopo do catálogo de componentes
**High — ABERTO**

Ainda não foi comprovado se `official_code` é global ou institucional.

**Ação:** não fixar UNIQUE global até homologação da fonte oficial.

### COMP-PHY-02 — componente sem código oficial
**Medium — DEFINIDO**

Componente sem código não pode ser canonizado por nome isolado. Matching composto homologado ou exceção manual auditada é necessário.

**Resultado:** regra aceita.

### COMP-PHY-03 — referência EIOS
**Medium — BLOQUEADO CORRETAMENTE**

A especificação não inventa FK para uma tabela EIOS não comprovada.

**Resultado:** manter referência sem FK física até evidência do catálogo canônico.

### INT-PHY-01 — separação staging/canônico
**High — DEFINIDO**

Matching ocorre em staging e somente estado `resolved` homologado pode alimentar publicação.

**Resultado:** adequado.

### SEC-PHY-01 — RLS
**High — BLOQUEADO CORRETAMENTE**

Não foi criado RBAC paralelo nem policy especulativa. A integração com Identity deve ser comprovada antes da policy final.

**Resultado:** adequado.

### AUD-PHY-01 — rastreabilidade
**High — DEFINIDO**

Proveniência, origem, validador e timestamp são preservados. A decisão de publicação permanece separada da identidade acadêmica.

**Resultado:** adequado.

## 3. Testes necessários

O harness PostgreSQL deve provar pelo menos:

- classe válida;
- duplicidade do identificador externo no mesmo contexto;
- mesmo identificador em escolas distintas;
- escola pertencente a organização diferente;
- ano letivo incompatível;
- validade invertida;
- componente válido;
- código duplicado conforme escopo do catálogo;
- componente global versus institucional;
- tentativa de matching por nome isolado;
- estados `resolved`, `ambiguous`, `unresolved`, `rejected`;
- preservação de histórico;
- promoção somente de registro homologado;
- ausência de dependência física inventada do EIOS.

## 4. Resultado da auditoria

**Não foram encontrados defeitos críticos no contrato candidato.** Há dependências High que precisam de evidência física e de fonte oficial antes da execução.

### Gate

**DDL de produção: BLOQUEADO.**

O próximo artefato é o harness PostgreSQL isolado para transformar os requisitos em provas executáveis. Se a infraestrutura PostgreSQL local/CI não estiver disponível, a execução deverá permanecer explicitamente pendente; não se deve declarar testes executados por inspeção textual.

## 5. Registro

Fluxo mantido:

**Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar**

Commit da especificação: `a41c02401863914d09f406edc9aec7c8b8442ef7`.

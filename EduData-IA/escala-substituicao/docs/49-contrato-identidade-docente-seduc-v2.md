# 49 — Contrato do Adaptador de Identidade Docente SEDUC v2

**Produto:** Escala Inteligente de Substituição — EduData IA  
**Data:** 2026-09-09  
**Status:** contrato técnico para homologação; sem DDL produtivo

## 1. Objetivo

Definir como uma fonte oficial funcional da SEDUC-SP/CGRH poderá alimentar a identidade acadêmica docente da Escala sem criar identidade artificial, sem restaurar o modelo legado e sem promover registros ambíguos.

Fonte de referência:

https://dados.educacao.sp.gov.br/dataset/servidores-ativos-por-unidade

## 2. Fluxo obrigatório

```text
Arquivo oficial SEDUC/CGRH
        ↓
Import Batch
        ↓
Raw Rows imutáveis
        ↓
Normalização não destrutiva
        ↓
Matching determinístico
        ↓
resolved / ambiguous / unresolved / rejected
        ↓
Fila de exceções
        ↓
Homologação autorizada
        ↓
teacher_profiles
        ↓
academic_teacher_identity_links
        ↓
Grade oficial
```

## 3. Princípio fundamental

A fonte funcional identifica o servidor dentro do contexto institucional. Ela não autoriza, por si só, a criação de uma identidade Auth nem a associação automática entre Auth e `teacher_profiles`.

São relações distintas:

```text
servidor funcional SEDUC
        ≠
teacher_profiles
        ≠
auth.users
```

A promoção entre essas camadas exige evidência e autorização específicas.

## 4. Campos mínimos do staging

O adaptador deve preservar, no mínimo:

- `batch_id`;
- `source_record_id`;
- número da linha original;
- payload bruto imutável;
- payload normalizado;
- identificador institucional docente, quando comprovado;
- identificador da unidade, quando comprovado;
- cargo/categoria, quando disponível;
- situação funcional, quando disponível;
- datas de vigência, quando disponíveis;
- hash da fonte;
- referência temporal da carga;
- estado de matching;
- método/evidência do matching;
- identificadores canônicos, somente quando resolvido;
- estado de validação;
- responsável e data da homologação;
- motivo de rejeição, quando aplicável;
- metadados/proveniência.

O nome exato das colunas do CSV não deve ser assumido antes da validação do dicionário oficial.

## 5. Regras de matching

### 5.1 Permitido

1. identificador institucional oficial homologado → `teacher_profiles.id`;
2. identificador institucional da unidade homologado → `schools.id`;
3. contexto institucional compatível;
4. validade temporal compatível;
5. fonte e versão válidas;
6. resultado único e determinístico.

### 5.2 Proibido

- nome isolado;
- e-mail;
- fuzzy matching;
- cargo como identificador;
- posição na planilha;
- combinação textual não homologada;
- associação automática por escola apenas;
- inferência de Auth pelo registro funcional.

## 6. Estados de resolução

| Estado | Pode receber ID canônico? | Pode promover? |
|---|---:|---:|
| `resolved` | Sim | Sim, após validação |
| `ambiguous` | Não | Não |
| `unresolved` | Não | Não |
| `rejected` | Não | Não |

Nenhum estado diferente de `resolved` pode alimentar `teacher_profiles` como identidade canônica.

## 7. Promoção para teacher_profiles

Uma linha somente pode ser promovida quando todos os requisitos forem satisfeitos:

- identificador institucional comprovado;
- organização e escola resolvidas;
- matching único;
- fonte válida e publicável;
- carga idempotente;
- proveniência preservada;
- ausência de conflito temporal;
- registro auditável da decisão.

Atualizações não devem apagar silenciosamente atributos históricos.

## 8. Vínculo Auth ↔ docente

A criação de `academic_teacher_identity_links` ocorre em etapa posterior e independente.

Requisitos mínimos:

- `auth_user_id` explícito;
- associação ativa à organização;
- contexto escolar compatível;
- homologador autorizado;
- período válido;
- ausência de sobreposição temporal;
- evidência de homologação;
- evento em `identity_audit_logs`.

Não haverá matching automático entre servidor funcional e Auth.

## 9. Multi-escola

O mesmo Auth pode possuir vínculos docentes válidos em mais de uma escola, desde que cada vínculo tenha contexto institucional e período próprios.

Não criar unicidade global de `auth_user_id`.

O contexto ativo deverá ser determinado pela organização/escola e pelas permissões vigentes.

## 10. Idempotência

A identidade da carga deve considerar pelo menos:

```text
source_hash + organization_id + school_id + source_version/reference_period
```

Reimportação do mesmo artefato deve ser reconhecida como a mesma carga lógica, sem duplicar docentes.

## 11. Histórico

Correções e mudanças funcionais devem preservar:

- origem;
- versão da fonte;
- período de validade;
- decisão de homologação;
- responsável;
- timestamp;
- estado anterior quando houver alteração.

Nunca executar atualização destrutiva que elimine a capacidade de reconstruir a decisão usada pelo motor.

## 12. Auditoria

A integração deverá utilizar `identity_audit_logs` como ledger central de identidade/acesso. O domínio Escala pode manter metadados de execução e proveniência, mas não deve criar um segundo ledger concorrente.

Eventos mínimos:

- importação recebida;
- linha resolvida;
- linha ambígua;
- exceção criada;
- homologação;
- rejeição;
- alteração de vínculo;
- revogação;
- reprocessamento.

## 13. Critérios de homologação do adaptador

O adaptador somente poderá avançar para integração produtiva quando houver:

1. dicionário oficial validado;
2. identificador docente homologado;
3. identificador de unidade homologado;
4. amostra real disponível;
5. teste de idempotência;
6. teste de ambiguidade;
7. teste de unidade inexistente;
8. teste de alteração histórica;
9. fila de exceções;
10. homologador autorizado;
11. permissões `escala` no catálogo central;
12. RLS revisado;
13. ponte Auth ↔ docente homologada;
14. fonte oficial da grade homologada separadamente;
15. harness PostgreSQL executado em PostgreSQL real;
16. auditoria final sem achados críticos abertos.

## 14. Gate atual

**🔴 BLOQUEADO.**

Este contrato permite avançar na especificação e nos testes isolados, mas não autoriza:

- DDL produtivo;
- carga real em `teacher_profiles`;
- criação automática de vínculos Auth;
- alimentação do motor com a base funcional;
- substituição da grade oficial pela base de servidores.

## 15. Decisão

A fonte **Servidores ativos por Unidade** é aceita como candidata oficial para o componente funcional da identidade docente, condicionada à homologação de seus campos técnicos. A próxima evidência necessária é o conteúdo real do dicionário/arquivo e, separadamente, a fonte técnica da grade operacional.

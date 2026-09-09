# 28 — Auditoria do Harness de Identidade Docente v1

**Data:** 2026-09-09  
**Status:** 🟡 HARNESS DEFINIDO — EXECUÇÃO LOCAL PENDENTE — DDL DE PRODUÇÃO BLOQUEADO

## 1. Objetivo

Transformar os testes conceituais ID-01..ID-10 da ponte `academic_teacher_identity_links` em testes físicos reproduzíveis, sem executar DDL no Supabase de produção.

## 2. Artefato

Arquivo:
`tests/identity-teacher-link.postgres.test.sql`

Commit:
`85e85a4a96d38de9435ae41661f471d057dc8f27`

O harness cria somente objetos temporários em `escala_identity_test`, executa os cenários e termina com `ROLLBACK`.

## 3. Cobertura

- **ID-01:** vínculo válido com autenticação, perfil docente e escopo compatíveis.
- **ID-02:** Auth inexistente bloqueado por FK.
- **ID-03:** perfil docente inexistente bloqueado por FK.
- **ID-04:** organização incompatível bloqueada por trigger de integridade.
- **ID-05:** escola incompatível bloqueada por trigger de integridade.
- **ID-06:** sobreposição temporal de vínculos ativos bloqueada.
- **ID-07:** revogação preserva o registro histórico.
- **ID-08:** reativação exige nova vigência e homologação.
- **ID-09:** fuzzy matching não integra o modelo físico.
- **ID-10:** dados de vigência/status permitem reprodução temporal.

## 4. Auditoria técnica

### Fechado no contrato/harness

- FKs estruturais para Auth de teste e perfil docente.
- Integridade organização/escola/perfil.
- Período temporal válido.
- Bloqueio de sobreposição ativa.
- Revogação sem exclusão física.
- Reativação explícita.
- Ausência deliberada de mecanismo de fuzzy matching.

### Pendente

1. Executar o SQL em PostgreSQL/Supabase local isolado.
2. Verificar resultado efetivo dos 10 cenários.
3. Acrescentar testes RLS usando `auth.uid()` quando o ambiente isolado reproduzir o modelo de autorização.
4. Testar auditoria em `identity_audit_logs`.
5. Validar a política de atuação multi-escola antes da definição final de unicidade.

## 5. Limitação importante

O harness não constitui prova de que o vínculo físico deve ser aplicado em produção. Ele prova apenas que o contrato proposto pode ser testado de forma determinística.

O projeto remoto `EduData IA` não recebeu DDL, migration, dados de teste ou alteração de RLS nesta etapa.

## 6. Gate

**DDL de produção: BLOQUEADO.**

Para fechar a identidade docente ainda são necessários:

- execução do harness isolado;
- decisão homologada sobre multi-escola;
- RLS por produto + escopo;
- integração com `identity_product_permissions`;
- auditoria/governança;
- reprodução histórica.

Somente após esses pontos será seguro avançar para a homologação física de `academic_classes` e `academic_components`.

## 7. Regra permanente

```text
Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar
```

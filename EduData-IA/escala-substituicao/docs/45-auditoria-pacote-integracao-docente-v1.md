# 45 — Auditoria do Pacote de Integração Docente v1

**Data:** 2026-09-09  
**Status:** concluída.

## Evidências usadas

A auditoria foi confrontada com o estado físico previamente verificado no projeto Supabase `EduData IA` e com os contratos anteriores da Escala.

## Matriz

| ID | Controle | Resultado | Achado |
|---|---|---|---|
| INT-DOC-01 | organização/escola canônicas | 🟢 | Core já possui as entidades-base |
| INT-DOC-02 | fonte institucional | 🔴 | fonte real ainda não fornecida/homologada |
| INT-DOC-03 | identificador institucional | 🔴 | campo oficial ainda não confirmado |
| INT-DOC-04 | staging imutável | 🟢 | contrato e harness definidos |
| INT-DOC-05 | matching determinístico | 🟢 | ID institucional obrigatório |
| INT-DOC-06 | matching por nome/e-mail | 🟢 | explicitamente proibido |
| INT-DOC-07 | estados de exceção | 🟢 | quatro estados definidos |
| INT-DOC-08 | `teacher_profiles` | 🔴 | tabela existe, mas possui 0 registros |
| INT-DOC-09 | ponte Auth-docente | 🔴 | relação canônica ainda não homologada |
| INT-DOC-10 | multi-escola | 🟡 | regra definida, dados reais ausentes |
| INT-DOC-11 | permissões Escala | 🔴 | `product_code=escala` ausente no catálogo atual |
| INT-DOC-12 | RLS | 🔴 | futura ponte ainda não homologada |
| INT-DOC-13 | auditoria | 🟢 | ledger central definido |
| INT-DOC-14 | histórico | 🟢 | versionamento/revogação definidos |
| INT-DOC-15 | promoção segura | 🟢 | gates documentados e testáveis |

## Conclusão

O pacote de integração está **tecnicamente definido**, mas a integração real ainda não está liberada.

Os bloqueios não devem ser mascarados por DDL. O próximo avanço legítimo depende de evidência institucional real para a fonte de docentes e de homologação do catálogo de permissões e da ponte de identidade.

## Gate

**VERMELHO — produção bloqueada.**

Não houve alteração de dados produtivos nesta auditoria.

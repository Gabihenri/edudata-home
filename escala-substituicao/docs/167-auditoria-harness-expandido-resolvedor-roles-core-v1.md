# 167 — Auditoria do Harness Expandido do Resolvedor Canônico de Roles v1

**Data:** 2026-10-08
**Status:** 🟢 matriz expandida reproduzida em PostgreSQL real; 🔴 resolvedor físico ainda não implementado

## Resultado
O harness expandido H11–H24 contém 14 casos.

- 12 casos exigem resolução determinística e foram representados com resultado canônico esperado.
- 2 casos exigem fail closed: membership suspensa e role desconhecido.
- Plataforma homologada prevalece quando presente.
- super_admin prevalece sobre platform_admin.
- conflito entre profile e membership não permite elevação pela profile.
- alias de plataforma não homologado não eleva privilégio.

## Evidência física
A reprodução foi executada como consulta de controle em PostgreSQL real no projeto Supabase `ihchzfndmdwtoabttkil`. O resultado da matriz foi 14/14 coerente com os estados esperados: 12 resoluções e 2 bloqueios.

## Limitação
Os casos continuam sintéticos. Como o Core operacional não possui memberships, scopes e teacher_profiles reais suficientes para esta validação, não há autorização para criar ou alterar o resolvedor físico.

## Próximo gate
Adicionar controles específicos para múltiplas memberships no mesmo ator, organização diferente, escola diferente, janela temporal, hierarchy_level e desempate por updated_at/created_at; depois criar uma matriz de regressão dos consumidores `can_access_identity_product`, Agenda, Calendário e Support.
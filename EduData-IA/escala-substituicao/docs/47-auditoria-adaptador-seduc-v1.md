# 47 — Auditoria do Contrato do Adaptador SED v1

**Data:** 2026-09-09  
**Status:** auditoria concluída — sem alteração de produção.

## 1. Evidências externas verificadas

A documentação oficial da SEDUC-SP confirma que os horários usados no Diário de Classe são os cadastrados na Associação do Professor à Classe e Grade Horária. citeturn1view1

A SEDUC-SP também documenta alteração da grade durante o ano e a regra de atualização do Diário de Classe, demonstrando que vigência/versionamento são requisitos reais. citeturn1view2

A atribuição de classes e aulas de 2026 abrange docentes, escolas e UREs, confirmando que vínculo/atribuição institucional é domínio próprio. citeturn1view3

O conjunto oficial “Servidores ativos por Unidade” é mantido pela CGRH/SEDUC e fornece contexto funcional por unidade, mas não foi considerado equivalente à grade horária. citeturn1view0

O Plano de Dados Abertos da SEDUC-SP lista bases de carga horária de professores, profissionais/cargos e vínculos e turmas, reforçando a existência de camadas públicas relacionadas, mas não substitui a confirmação da exportação operacional da grade. citeturn0search36turn0search38

## 2. Matriz de auditoria

| ID | Controle | Resultado | Estado |
|---|---|---|---|
| SED-AUD-01 | fonte institucional identificada | evidência SED/SEDUC | 🟢 |
| SED-AUD-02 | grade distinta da Agenda | preservado | 🟢 |
| SED-AUD-03 | versionamento | exigido pela alteração de grade | 🟢 |
| SED-AUD-04 | fonte pública funcional auxiliar | confirmada | 🟢 |
| SED-AUD-05 | grade operacional exportável | ainda não comprovada | 🔴 |
| SED-AUD-06 | identificador docente oficial | ainda não confirmado | 🔴 |
| SED-AUD-07 | identificador turma oficial | ainda não confirmado | 🔴 |
| SED-AUD-08 | identificador componente oficial | ainda não confirmado | 🔴 |
| SED-AUD-09 | dicionário real de campos | ausente | 🔴 |
| SED-AUD-10 | staging não destrutivo | definido | 🟢 |
| SED-AUD-11 | matching sem fuzzy | definido | 🟢 |
| SED-AUD-12 | idempotência | definida | 🟢 |
| SED-AUD-13 | exceções | definidas | 🟢 |
| SED-AUD-14 | auditoria central | definida | 🟢 |
| SED-AUD-15 | RLS staging | ainda não homologada | 🟡 |

## 3. Achado principal

**SED-AUD-05 — CRITICAL:** já temos confirmação documental de que a SED possui a grade horária institucional, mas ainda não temos o artefato técnico necessário para ingestão: exportação real, endpoint autorizado ou arquivo acompanhado de dicionário de campos.

Portanto, não é seguro escrever um parser específico supondo nomes de colunas.

## 4. Consequência arquitetural

O contrato do adaptador está aprovado como interface, mas a implementação deve permanecer desacoplada da estrutura concreta até que uma amostra real seja disponibilizada.

Isso evita:

- acoplamento a layout imaginado;
- criação de chaves artificiais;
- inferência por nome/e-mail;
- uso indevido de dados públicos auxiliares como grade;
- migração prematura do Core.

## 5. Gate

**🟢 Contrato:** aprovado.

**🟢 Evidência institucional:** suficiente para confirmar a existência do domínio de grade.

**🔴 Implementação do parser:** bloqueada pela ausência do artefato real.

**🔴 DDL de produção:** continua bloqueado pelos achados anteriores de identidade, permissões e RLS.

## 6. Próximo avanço seguro

Construir o **harness do adaptador SED**, totalmente isolado, usando um fixture sintético explicitamente marcado como `synthetic` e cobrindo SED-ADP-01..18. O fixture não poderá ser tratado como dado institucional real nem alimentar `teacher_profiles`, grade ou motor.

Em paralelo, manter como requisito de integração a obtenção de uma exportação oficial real e seu dicionário de campos.

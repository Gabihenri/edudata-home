# 133 — Auditoria E3 Harness v4 — Vigência e Fronteiras

**Data:** 29/09/2026  
**Status:** 🟢 HARNESS SINTÉTICO VALIDADO EM POSTGRESQL REAL  
**Gate E3 técnico:** 🔴 BLOQUEADO por ausência do artefato operacional SED.

## Resultado

O harness v4 amplia o conjunto E3 de 18 para **22 invariantes**.

Execução em PostgreSQL real:

- 22 casos;
- 22 PASS;
- 0 FAIL.

## Novos controles

H19 — ocorrência exatamente no início da vigência aceita.

H20 — ocorrência exatamente no fim da vigência aceita.

H21 — ocorrência no dia imediatamente posterior ao fim da vigência é bloqueada.

H22 — Grade com início posterior à ocorrência bloqueia a resolução.

Esses controles eliminam uma lacuna anterior: testar apenas datas internas dos intervalos não comprovava o comportamento nas fronteiras.

## Cobertura consolidada

O harness agora cobre:

- coerência DI ativo × DI da atribuição;
- DI ausente;
- múltiplos contextos DI;
- escola ausente;
- proveniência;
- concorrência não resolvida;
- tentativa de inferência;
- Associação ausente;
- Grade ausente;
- homologação da ocorrência;
- substituição temporal;
- vigência da Associação;
- vigência da Grade;
- múltiplas associações no mesmo contexto;
- limites inclusivos de vigência;
- ocorrência fora da vigência.

## Limitação

Os identificadores são deliberadamente sintéticos. Portanto, este resultado demonstra **coerência do contrato**, não homologação da estrutura real da SED.

A promoção para E3 técnico continua condicionada a:

1. artefato operacional atual autorizado;
2. identificação técnica das entidades;
3. relação Associação ↔ Grade;
4. cardinalidades;
5. versionamento/publicação;
6. regras de atualização;
7. proveniência.

## Decisão

Nenhum DDL, parser ou chave técnica de produção é autorizado por este resultado.

**Resultado do avanço:** o comportamento temporal está mais protegido e pronto para receber o primeiro artefato real sem alterar a arquitetura.

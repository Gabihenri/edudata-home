# 46 — Contrato do Adaptador SED → Escala v1

**Data:** 2026-09-09  
**Status:** contrato técnico definido — sem DDL de produção.

## 1. Objetivo

Definir o contrato do adaptador que receberá evidências institucionais da SEDUC-SP/SED e as transformará em registros de staging consumíveis pela Escala Inteligente de Substituição, sem tratar dados públicos auxiliares como grade oficial.

## 2. Evidência institucional

A SEDUC-SP informa que a grade horária cadastrada na Associação do Professor à Classe e Grade Horária alimenta os horários exibidos no Diário de Classe. citeturn1view1

A SEDUC-SP também informa que alterações de grade passaram a ser refletidas no Diário de Classe a partir das 05h00 e reconhece a existência de versões/alterações da grade ao longo do ano. citeturn1view2

Para 2026, a atribuição de classes e aulas envolve docentes, unidades escolares e UREs, reforçando que lotação/atribuição e grade são domínios institucionais relacionados, mas não equivalentes. citeturn1view3

O Portal Dados Abertos SP mantém o conjunto “Servidores ativos por Unidade”, mantido pela CGRH/SEDUC, com campos relacionados a cargo, contratação, quadro e unidade. Esse conjunto é fonte auxiliar de identidade funcional, não prova suficiente da grade horária. citeturn1view0

O Plano de Dados Abertos da SEDUC-SP também cataloga bases de “Carga horária de professores”, “Profissionais: cargos e vínculos” e “Turmas”. citeturn0search36turn0search38

## 3. Hierarquia de fontes

A confiança para a Escala será:

1. **Grade institucional publicada na SED/SEDUC ou exportação oficial equivalente** — fonte primária de ocorrência/aula.
2. **Atribuição/carga docente institucional** — fonte de contexto do vínculo e atribuição.
3. **Servidores ativos por Unidade / bases abertas oficiais** — fonte auxiliar de validação funcional e descoberta, quando aplicável.
4. **Core EduData IA** — identidade acadêmica homologada e representação versionada.
5. **Agenda EDI** — contexto operacional e impedimentos, nunca substituto automático da grade.

Nenhum CSV público será promovido automaticamente a grade oficial.

## 4. Contrato mínimo da entrada de grade

O adaptador deve ser capaz de receber, quando disponibilizado pela fonte:

- identificador da organização/rede;
- identificador da escola, preferencialmente CIE/identificador oficial;
- identificador institucional do docente;
- identificador da turma/classe;
- identificador do componente curricular;
- dia/data ou regra de recorrência;
- horário inicial;
- horário final;
- turno;
- situação;
- vigência inicial/final;
- identificador da publicação/versão;
- origem;
- data/hora de extração/publicação;
- responsável ou mecanismo de validação.

Campos de nome, descrição e e-mail são atributos auxiliares e não chaves de identidade.

## 5. Camada docente

A carga docente deve ser separada da ocorrência de grade:

```text
fonte funcional
   ↓
teacher staging
   ↓
teacher_profile homologado
   ↓
ponte Auth ↔ docente, quando existir
```

A grade referencia o `teacher_profile` somente depois de matching institucional resolvido.

Nome/e-mail não podem ativar automaticamente vínculo Auth ↔ docente.

## 6. Camada turma/componente

A mesma regra vale para turma e componente:

```text
ID oficial da fonte
   ↓
matching determinístico
   ↓
academic_class / academic_component
```

Sem identificador oficial suficiente, o registro fica `ambiguous` ou `unresolved` e não alimenta o motor.

## 7. Normalização

A normalização deve ser não destrutiva.

```text
raw_payload       = evidência original, imutável
normalized_payload = representação técnica derivada
canonical_ids     = somente após matching homologado
```

O adaptador não deve apagar campos desconhecidos da fonte. Campos não mapeados devem permanecer no payload bruto/metadata para futura evolução do mapeamento.

## 8. Estados do adaptador

- `received`
- `normalized`
- `resolved`
- `ambiguous`
- `unresolved`
- `rejected`
- `validated`
- `published`

Somente `resolved + validated` pode ser promovido para uma versão de grade publicada.

## 9. Validações obrigatórias

### Estruturais

- escola existente no Core;
- organização compatível;
- ano/período compatível;
- horário inicial < horário final;
- intervalo válido;
- turma resolvida;
- componente resolvido;
- docente resolvido quando a aula possuir titular;
- vigência coerente.

### Institucionais

- fonte reconhecida;
- versão/hash identificável;
- publicação autorizada;
- nenhuma duplicidade incompatível;
- nenhuma ocorrência fora da vigência da versão publicada.

### Segurança

- payload bruto protegido;
- staging fora do alcance de professor comum;
- ações administrativas auditadas;
- dados pessoais tratados conforme escopo e LGPD.

## 10. Versionamento da grade

Uma publicação recebe identidade própria:

```text
source_system
+ source_version
+ source_hash
+ organization_id
+ school_id
```

Uma nova extração não sobrescreve uma versão publicada. Ela gera nova versão candidata.

Somente uma versão explicitamente publicada pode alimentar o motor.

## 11. Alterações de grade

A evidência da SEDUC-SP demonstra que a grade pode sofrer alteração durante o ano e que registros anteriores podem precisar permanecer acessíveis para correções. citeturn1view2

Consequentemente, o adaptador deve preservar:

- versão anterior;
- nova versão;
- vigência;
- momento da publicação;
- origem;
- impacto potencial nas ocorrências futuras.

Uma nova versão não reescreve uma substituição já confirmada.

## 12. Integração com Agenda EDI

A Agenda pode fornecer:

- impedimentos;
- compromissos;
- registros operacionais;
- exceções;
- evidências.

Mas o motor deve distinguir:

`GRADE OFICIAL ≠ AGENDA ≠ IMPEDIMENTO`.

## 13. Adaptadores de fonte

O contrato deve permitir mais de um adaptador sem alterar o Core:

```text
SED export
   ┐
SEDUC official dataset
   ├──→ adapter interface → staging → canonicalization
CSV institucional
   ┘
```

Cada adaptador informa:

- `source_system`;
- `source_version`;
- `schema_version`;
- `source_hash`;
- mapeamento de campos;
- evidências de origem.

## 14. Idempotência

Reprocessar o mesmo pacote não pode criar duplicidade.

Chave mínima:

```text
organization_id
+ school_id
+ source_system
+ source_version/source_hash
```

Quando a fonte oferecer identificador de registro, ele deve ser preservado e utilizado na deduplicação contextual.

## 15. Falhas e exceções

O adaptador deve interromper a promoção quando houver:

- identificador institucional ausente;
- escola inexistente;
- organização incompatível;
- docente não resolvido;
- turma não resolvida;
- componente não resolvido;
- conflito temporal;
- intervalo inválido;
- versão não identificável;
- fonte não reconhecida;
- tentativa de matching textual/fuzzy.

A exceção deve permanecer reproduzível e auditável.

## 16. Testes mínimos

| ID | Cenário | Resultado esperado |
|---|---|---|
| SED-ADP-01 | pacote válido | `resolved` |
| SED-ADP-02 | pacote repetido | idempotente |
| SED-ADP-03 | escola inexistente | bloqueado |
| SED-ADP-04 | docente sem ID | `unresolved` |
| SED-ADP-05 | turma sem ID | `unresolved` |
| SED-ADP-06 | componente sem ID | `unresolved` |
| SED-ADP-07 | nome/fuzzy | nunca promove |
| SED-ADP-08 | horário inválido | rejeitado |
| SED-ADP-09 | versão nova | nova versão preservando anterior |
| SED-ADP-10 | duplicidade incompatível | bloqueado |
| SED-ADP-11 | mudança de professor | nova evidência/versionamento |
| SED-ADP-12 | alteração de horário | nova evidência/versionamento |
| SED-ADP-13 | ocorrência fora da vigência | bloqueada |
| SED-ADP-14 | fonte desconhecida | rejeitada |
| SED-ADP-15 | raw preservado | aprovado |
| SED-ADP-16 | versão publicada | somente publicada alimenta motor |
| SED-ADP-17 | Agenda como fonte | rejeitada como grade oficial |
| SED-ADP-18 | auditoria | evento central registrado |

## 17. Critério de aceite

O adaptador só poderá avançar para implementação quando houver:

1. arquivo/exportação real da fonte;
2. dicionário real de campos;
3. identificadores institucionais confirmados;
4. exemplo real de pelo menos uma escola;
5. regra de publicação/validação;
6. estratégia de versionamento;
7. matching homologado para docente/turma/componente;
8. testes SED-ADP-01..18;
9. auditoria do adaptador;
10. RLS/permissionamento definido para staging.

## 18. Gate

**🟢 Arquitetura do adaptador:** definida.

**🟡 Fonte pública auxiliar:** identificada e verificável.

**🔴 Fonte operacional da grade:** ainda sem exportação/dicionário real homologado.

**🔴 Produção:** bloqueada.

A ausência do arquivo/exportação real é agora um bloqueio explícito e mensurável, não uma lacuna arquitetural genérica.

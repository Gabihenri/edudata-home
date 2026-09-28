# 124 — Auditoria E3: Catálogo Operacional SED e Artigos de Substituição v1

Data: 2026-09-28
Status: NOVA EVIDÊNCIA / FONTE TÉCNICA PÚBLICA AINDA NÃO DISPONÍVEL

## 1. Achado

O catálogo oficial do Portal de Atendimento da SEDUC-SP contém artigos específicos relacionados diretamente ao domínio que estamos auditando:

- Aulas em substituição na Associação do Professor à Classe - SED;
- Aulas em substituição e/ou Artigo 22 na Associação do Professor à Classe;
- Associação em substituição com mensagem "Substituições concomitantes";
- Edição – Cadastro de Horário do Professor à Classe (3º Passo da Associação);
- Associação de professor em mais de uma escola - SED;
- Cadastrar Associação: Substituição de professor no PEI - SED;
- Cadastro de Professores volantes, substitutos, não efetivos e com ensino médio.

Fonte oficial:
https://atendimento.educacao.sp.gov.br/artigos-de-base-de-conhecimento/

## 2. Identificadores localizados no catálogo

O catálogo aponta, entre outros:

- SED-01310 — Aulas em substituição na associação de professor à classe - SED;
- SED-01305 — Edição – Cadastro de Horário do Professor à Classe (3º Passo da Associação);
- SED-03532 — Associação de professor em mais de uma escola - SED.

No momento da auditoria, os artigos SED-01310, SED-01305 e SED-03532 não estavam disponíveis para leitura pública pelo portal.

Isso é importante: não devemos preencher as lacunas com conteúdo reconstruído a partir de títulos ou de documentação antiga.

## 3. Significado arquitetural

O catálogo confirma que o domínio possui regras próprias para:

1. associação docente;
2. associação em substituição;
3. vigência;
4. cadastro de horário;
5. atuação em mais de uma escola;
6. substituições concomitantes;
7. diferentes categorias de professores.

Logo, o motor não pode tratar a substituição como simples troca de professor em uma ocorrência.

## 4. Novo conjunto de requisitos que deve ser comprovado no artefato E3

Quando obtivermos o relatório/layout autorizado, devemos procurar explicitamente evidência de:

- identificador da associação;
- professor titular/regente;
- professor em substituição, quando aplicável;
- classe;
- componente;
- escola;
- tipo/modalidade da associação;
- início da vigência;
- fim da vigência;
- horário;
- vínculo com Grade Horária;
- situação da associação;
- possibilidade de coexistência de associações;
- regra de substituições concomitantes;
- identificador da fonte;
- versão/data de extração.

## 5. Regra de segurança

Não utilizar:
- título de artigo como contrato de dados;
- telas como modelo físico;
- nomes de professores como chave;
- combinação professor + classe + horário como chave sintética;
- dados antigos para preencher lacunas do modelo 2026;
- comportamento observado no Diário para inferir IDs internos.

## 6. Próximo artefato ideal

O artefato de maior valor para destravar E3 continua sendo uma exportação autorizada da própria SED, preferencialmente:

### A
Relatório de Associação do Professor à Classe contendo IDs e vigência.

### B
Relatório de Grade Horária contendo IDs e horários.

### C
Relatório que permita relacionar A e B por chave técnica.

### D
Relatório de substituições/Professor Presente contendo o identificador da efetivação.

Se os três primeiros vierem em um único arquivo, melhor ainda.

## 7. Estado

| Elemento | Estado |
|---|---|
| Existência de regras operacionais específicas | 🟢 |
| Associação | 🟢 |
| Horário | 🟢 |
| Substituição | 🟢 |
| Vigência | 🟢 |
| Multi-escola | 🟢 |
| Substituições concomitantes | 🟢 |
| Layout técnico público | 🔴 |
| IDs físicos | 🔴 |
| Relação Associação ↔ Grade | 🔴 |
| Artefato operacional autorizado | 🔴 |
| Parser | 🔴 |
| DDL | 🔴 |

## 8. Conclusão

A pesquisa não destravou a implementação física, mas reduziu a incerteza semântica e revelou exatamente quais famílias de regras operacionais precisam ser preservadas.

O próximo passo seguro é obter o conteúdo/layout dos relatórios ou exportações autorizados pela SED.

Nenhuma alteração de produção foi realizada.

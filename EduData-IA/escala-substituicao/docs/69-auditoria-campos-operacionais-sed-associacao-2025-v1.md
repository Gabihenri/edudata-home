# 69 — Auditoria de campos operacionais SED — Associação do Professor à Classe 2025 v1

**Data:** 2026-09-10  
**Fonte:** documentação oficial SEDUC-SP publicada em 2025  
**Status:** AMARELO; evidência operacional forte, mas sem homologação do identificador técnico físico

## 1. Nova evidência

Documentação oficial SEDUC de julho/agosto de 2025 reproduz a tela real da SED para **Associação do Professor à Classe**.

A tela exige o **CPF** antes do cadastro e, após a identificação do professor, o formulário de associação apresenta explicitamente:

- Ano Letivo
- Professor
- DI
- Tipo de Ensino
- Turma
- Sub Turma
- Disciplina
- Suplementar — Docente atuando no PEI
- Atribuição de Aula em Substituição
- Tipo de Atribuição
- Fase da Atribuição
- Início da Vigência
- Fim da Vigência

A documentação também mostra que o processo é utilizado para novas atribuições de professores em turmas existentes e novas turmas, inclusive atribuições de segundo semestre.

## 2. O que passa a ser considerado evidência atual

### Confirmado para a interface operacional de 2025

1. CPF é campo obrigatório de entrada para localizar/iniciar o cadastro do professor.
2. O formulário retorna/expõe um campo **DI** associado ao professor.
3. A associação é feita contra Turma e Disciplina.
4. Existe controle explícito de substituição.
5. Existe Tipo de Atribuição e Fase da Atribuição.
6. Existe início e fim de vigência.
7. Existe contexto de ano letivo e tipo de ensino.
8. O fluxo diferencia situações de atribuição do segundo semestre.

## 3. Distinção crítica

A evidência é suficiente para afirmar que **CPF e DI participam do fluxo operacional atual documentado**, mas não é suficiente para afirmar que:

- CPF seja a chave primária do professor;
- DI seja uma chave global, estável ou imutável;
- DI identifique exclusivamente uma pessoa entre escolas/anos;
- qualquer desses campos possa substituir o vínculo acadêmico canônico do Core;
- o Excel exportado contenha exatamente esses campos;
- os nomes exibidos na tela correspondam aos nomes das colunas físicas do banco/API.

Portanto, nenhum desses campos deve ser promovido automaticamente para `teacher_profile_id`.

## 4. Impacto no contrato do adaptador

A fonte SED pode ser modelada como entrada de staging contendo, quando disponível:

`source_teacher_locator` → CPF/DI conforme evidência do arquivo recebido  
`source_teacher_name` → nome apresentado pela fonte  
`source_school_context` → escola/escopo da fonte  
`source_class` → turma  
`source_component` → disciplina  
`assignment_type` → tipo de atribuição  
`assignment_phase` → fase  
`substitution_flag` → indicação de substituição  
`valid_from` → início da vigência  
`valid_until` → fim da vigência

Esses campos permanecem **atributos da fonte**, não chaves canônicas do Core, até que o artefato técnico seja homologado.

## 5. Nova regra de validação para o futuro parser

Quando o artefato técnico atual for obtido, o parser deverá verificar, no mínimo:

- presença/ausência de CPF;
- presença/ausência de DI;
- unicidade de DI no escopo documentado;
- estabilidade de DI em múltiplos registros da mesma associação;
- correspondência entre CPF e DI quando ambos estiverem presentes;
- existência de escola/escopo;
- turma;
- disciplina/componente;
- indicação de substituição;
- início/fim de vigência;
- consistência de ano letivo;
- duplicidades estruturais;
- conflitos temporais.

Nenhuma dessas validações deve inferir identidade a partir de nome.

## 6. Evidência de exportação

A documentação de 2025 mantém a evidência de que a lista de associação possui os comandos:

- Escolher Colunas
- Imprimir
- Gerar Excel
- Gerar PDF

Isso confirma capacidade de exportação no nível da interface, mas ainda não fornece o arquivo XLSX produzido pelo sistema nem um endpoint público para automatizar a operação.

## 7. Gate atualizado

| Controle | Estado |
|---|---|
| Fonte operacional atual documentada | GREEN |
| CPF como locator de entrada | GREEN |
| DI exibido no cadastro | GREEN |
| Turma/disciplina | GREEN |
| Substituição | GREEN |
| Vigência | GREEN |
| Excel/PDF na interface | GREEN |
| Layout físico do Excel atual | RED |
| Dicionário técnico acessível | RED |
| Semântica técnica de DI | RED |
| Identificador canônico docente | RED |
| API pública | RED |
| Parser produtivo | RED |
| DDL produtivo | RED |

## 8. Conclusão

A investigação já não está mais limitada a evidências históricas. A documentação oficial de 2025 mostra o fluxo operacional vigente naquele ano e confirma um conjunto mínimo de atributos necessários para a reconstrução da associação docente.

O bloqueio técnico restante é estreito e objetivo: **obter o artefato físico exportado ou seu dicionário técnico atual**. Até isso ocorrer, CPF e DI continuam sendo atributos de origem/staging, nunca chaves canônicas inferidas.

# 63 — Auditoria da interface e exportação da Associação do Professor à Classe v1

**Data:** 2026-09-10  
**Escopo:** evidência pública 2025 da SED/SEDUC sobre Associação do Professor à Classe  
**Status:** avanço parcial; não libera o gate de produção.

## 1. Nova evidência

Foram localizados materiais oficiais da SEDUC publicados em 2025 contendo capturas da interface real da **Associação do Professor à Classe**.

A tela de cadastro mostra explicitamente:

- Ano Letivo;
- Rede de Ensino;
- Diretoria;
- Município;
- Situação das Escolas;
- Escola;
- Tipo de Ensino;
- CPF.

Na janela de cadastro da associação aparecem:

- Professor;
- DI;
- Tipo de Ensino;
- Turma;
- Sub Turma;
- Disciplina;
- Suplementar — Docente atuando no PEI;
- Atribuição de Aula em Substituição;
- Tipo de Atribuição;
- Fase da Atribuição;
- Início da Vigência;
- Fim da Vigência.

## 2. Evidência especialmente relevante

A lista de associações da própria interface apresenta ações:

- Escolher Colunas;
- Imprimir;
- **Gerar Excel**;
- **Gerar PDF**.

Isso comprova que a SED possui uma representação tabular/exportável da associação no fluxo operacional da interface.

## 3. O que isso permite concluir

Podemos agora distinguir três níveis:

```text
Interface operacional 2025
        ↓
representação tabular/exportável
        ↓
artefato de integração ainda não obtido
```

A existência do botão Gerar Excel é evidência de uma capacidade de exportação pelo usuário, mas **não prova** que exista API, endpoint público, URL estável, formato automatizável ou autorização para integração automática.

## 4. Identificadores observáveis

A interface de 2025 comprova a presença dos conceitos **CPF**, **DI**, turma, disciplina e vigência.

O material histórico e a interface atual não são suficientes para declarar que CPF ou DI sejam a chave canônica atual do docente no backend.

Portanto:

- CPF = atributo de entrada/localização observado em 2025;
- DI = identificador funcional/acadêmico observado na associação;
- chave canônica interna da SED = ainda não homologada;
- ID técnico da turma = ainda não homologado;
- ID técnico do componente = ainda não homologado.

## 5. Impacto na Escala

A especificação do adaptador deve permanecer preparada para receber, quando obtido o arquivo real:

```text
teacher_source_id
class_source_id
component_source_id
school_source_id
schedule/association_source_id
valid_from
valid_until
start_time
end_time
assignment_type
substitution_flag
source_version
```

Esses nomes são **contratos internos do EduData IA**, não afirmações sobre os nomes das colunas da SED.

## 6. Gate

| Controle | Estado |
|---|---|
| Interface operacional 2025 comprovada | 🟢 |
| Campos da associação comprovados visualmente | 🟢 |
| Exportação Excel pelo usuário comprovada | 🟢 |
| Artefato Excel real obtido | 🔴 |
| Dicionário técnico atual obtido | 🔴 |
| API/endpoint automatizável | 🔴 |
| ID técnico atual do docente | 🔴 |
| ID técnico atual da turma | 🔴 |
| ID técnico atual do componente | 🔴 |
| Parser de produção | 🔴 bloqueado |
| DDL de produção | 🔴 bloqueado |

## 7. Próximo passo

O próximo objetivo técnico é obter **um arquivo Excel efetivamente gerado pela interface de 2025/2026** ou documentação oficial que descreva seu layout.

Se o arquivo for obtido, a análise deverá ser feita em quatro camadas:

1. cabeçalhos reais;
2. identificadores e sua semântica;
3. vigência/horário/substituição;
4. correspondência com o dicionário oficial publicado no Portal de Dados Abertos.

Somente após essa comparação poderá ser especificado um parser real.

# Auditoria 77 — Dados Abertos da Associação do Professor à Classe — v1

**Projeto:** Escala de Substituição  
**Data:** 2026-09-11  
**Status:** evidência estrutural histórica confirmada; gate técnico permanece RED/BLOCKED

## 1. Objetivo

Avaliar se o conjunto oficial de Dados Abertos denominado **Associação do Professor à Classe** pode servir como referência estrutural para o domínio da Escala, sem promovê-lo indevidamente a contrato técnico atual da SED.

## 2. Fonte oficial identificada

O catálogo oficial Dados Abertos SP, na organização Secretaria da Educação, lista o conjunto **Associação do Professor à Classe** com a descrição **“Base anonimizada de Associação de Professores às Classes”** e disponibiliza recursos em XLS e CSV.

Fonte institucional:

https://dadosabertos.des.sp.gov.br/

Catálogo da Secretaria da Educação:

https://dadosabertos.des.sp.gov.br/dataset/?organization=secretaria-da-educacao

O portal também informa que os registros dos conjuntos podem ser acessados por API e remete à documentação da API.

## 3. Natureza da evidência

A fonte é oficial e útil para investigação estrutural, mas os dados são declaradamente **anonimizados**. Isso impede assumir que os identificadores presentes no conjunto sejam os mesmos identificadores operacionais utilizados atualmente na SED.

Além disso, a existência e atualização do catálogo não provam que o conteúdo do recurso histórico corresponda ao layout vigente da Associação em 2026.

Portanto:

- **valor como evidência de domínio:** alto;
- **valor como contrato técnico atual:** não homologado;
- **valor para canonização de IDs:** não autorizado;
- **valor para validação de nomenclaturas/categorias:** potencial, sujeito a leitura do dicionário.

## 4. Recursos identificados

O catálogo expõe, para esse conjunto, recursos em XLS e CSV e um recurso de dicionário de dados. O recurso do dicionário é especialmente relevante porque pode revelar a estrutura histórica publicada pela SED sem depender de inferência a partir da interface.

A tentativa de utilizar diretamente o arquivo binário do dicionário a partir do mecanismo público de consulta não produziu conteúdo verificável neste ciclo. Portanto, nenhum nome de coluna adicional foi promovido neste documento sem evidência direta.

## 5. Evidência complementar do TCE-SP

O Tribunal de Contas do Estado de São Paulo descreve a **Associação do Professor à Classe** como banco de dados da SEDUC que registra professores responsáveis por determinada disciplina, turma e escola, incluindo associações titulares e substitutas ao longo do tempo.

Fonte:

https://www.tce.sp.gov.br/sites/default/files/portal/8.%20Fiscaliza%C3%A7%C3%A3o%20Operacional%20-%20Planejamento%20do%20Quadro%20Docente%20-%20TC-021570.989.23-6.pdf

Essa evidência é relevante porque reforça que a Associação é um registro temporal do vínculo docente com a obrigação letiva e que não deve ser confundida com presença efetiva ou com a simples disponibilidade momentânea para substituição.

## 6. Consequências para o modelo da Escala

A fonte reforça as seguintes separações:

`associação docente` ≠ `ocorrência` ≠ `ausência` ≠ `vaga` ≠ `substituição`

Também reforça a necessidade de preservar temporalidade e vigência:

`associação/grade vigente → ocorrência → ausência → necessidade de cobertura → candidato → decisão`

## 7. O que a fonte NÃO comprova

O conjunto de Dados Abertos não comprova, neste ciclo:

1. que seus identificadores sejam os IDs técnicos atuais da SED;
2. que seu layout corresponda à exportação atual da tela de Associação;
3. que os dados históricos contenham a grade horária operacional atual;
4. que exista uma API pública equivalente à API interna da Associação;
5. que seja possível sincronizar a Escala diretamente com esse conjunto;
6. que seus recursos possam ser utilizados para escrita ou atualização na SED.

## 8. Decisão arquitetural

O conjunto **pode ser usado como fonte de evidência histórica e estrutural** durante a especificação e criação de harnesses sintéticos.

O conjunto **não pode ser usado como contrato de integração SED 2026** sem homologação adicional.

Nenhum parser de produção deve ser criado com base exclusivamente nesse dataset.

## 9. Próximo passo seguro

Prosseguir em duas frentes paralelas:

### Frente A — evidência documental

Obter, por fonte oficial, o dicionário XLS ou o Excel real exportado da Associação por usuário autorizado e registrar:

- cabeçalhos;
- tipos aparentes;
- campos de identificação;
- campos de vigência;
- campos de escola/turma/componente;
- campos de substituição;
- campos de horário;
- metadados de exportação.

### Frente B — motor independente da SED

Continuar o desenvolvimento dos contratos internos e harnesses do fluxo:

`ocorrência → ausência → vaga → candidatos → elegibilidade → ranking → alocação`

sem promover nenhum identificador histórico anonimizado a chave canônica.

## 10. Gate

**GATE-FONTE-SED = RED/BLOCKED.**

O achado reduz a incerteza sobre o domínio da Associação, mas não fecha o requisito de contrato técnico atual.

**Conclusão:** a fonte oficial de Dados Abertos é uma evidência estrutural válida; não é, por si só, autorização para integração operacional com a SED.

# 175 — Contrato de cadastro institucional para a Escala Inteligente EDI v1

**Data:** 13/10/2026  
**Status:** ESPECIFICAÇÃO FUNCIONAL — sem DDL de produção  
**Decisão de produto:** a Escala deve funcionar com dados cadastrados e mantidos pela própria organização/instituição. Não depende de uma base pré-existente da SED/SEDUC-SP.

## 1. Decisão e escopo

A escola, rede ou organização é responsável por cadastrar e manter seu quadro docente, turmas, componentes curriculares, horários, disponibilidades e regras locais. Esses registros formam a fonte operacional da Escala dentro do escopo institucional autorizado.

A SED pode ser uma fonte opcional de conferência/importação futura, mas **não é pré-requisito para iniciar nem para operar o cadastro institucional**. Nenhuma sincronização com a SED, identificador SED ou vínculo oficial deve ser presumido.

Este contrato especifica os dados necessários e sua governança. Não autoriza, por si só, DDL, migrações, publicação de ocorrências ou alocação automática em produção.

## 2. Fluxo funcional

`Instituição cria espaço → cadastra equipe → cadastra turmas/componentes → define grade e disponibilidade → registra ausência → motor calcula candidatos → responsável revisa e confirma → sistema registra a substituição e a auditoria`

O motor só pode recomendar com base em registros ativos, válidos para a instituição e para o período analisado. Dado ausente, conflito ou ambiguidade deve gerar pendência explícita, nunca preenchimento silencioso.

## 3. Dados que a instituição cadastra

### 3.1 Organização e unidade escolar

**Obrigatórios**
- organização/instituição proprietária do cadastro;
- unidade escolar, quando a organização possuir mais de uma;
- fuso horário e calendário/ano letivo de referência;
- responsável autorizado pelo cadastro.

A organização e a escola devem usar IDs canônicos do Core/EIOS. Não criar identidades paralelas para contornar entidades existentes.

### 3.2 Perfil docente institucional

**Obrigatórios para participar da Escala**
- nome de exibição/nome completo;
- vínculo com a organização e unidade(s) em que pode atuar;
- situação operacional: ativo ou inativo;
- vigência do vínculo (início e, quando aplicável, fim);
- componentes/disciplinas para os quais está habilitado no contexto cadastrado;
- carga horária ou limites de trabalho necessários às regras da instituição;
- autoria e data da criação/última alteração.

**Opcionais ou condicionais**
- área de conhecimento e etapa de ensino;
- identificador interno atribuído pela própria instituição;
- contato profissional;
- observações administrativas estritamente necessárias.

Nome, e-mail e identificador interno não devem ser usados isoladamente para vincular automaticamente a conta de autenticação a uma identidade docente. O perfil acadêmico/operacional do professor é distinto da conta usada para entrar no sistema.

### 3.3 Conta e permissões

O cadastro institucional de um docente pode existir antes de o professor criar ou acessar uma conta. Quando houver conta, a associação entre usuário autenticado e perfil docente deve ser explícita, autorizada e auditável.

Papéis mínimos a mapear no Core/RBAC existente:
- administrador da organização;
- gestor/coordenador da escola;
- docente;
- operador autorizado da escala.

Cada papel só pode ler ou alterar dados no escopo permitido. Uma instituição não pode consultar ou alterar os cadastros de outra. RLS e autorização de servidor são obrigatórias; esconder controles na interface não é controle de segurança suficiente.

### 3.4 Turmas, componentes e atribuições

**Obrigatórios para gerar candidatos confiáveis**
- turma/classe;
- etapa/ano/série;
- componente curricular;
- professor responsável pela aula, quando aplicável;
- vigência da atribuição;
- unidade escolar e período.

Atribuição de aula e responsabilidade por turma são conceitos distintos. Não inferir uma a partir da outra sem regra explícita.

### 3.5 Grade horária

Para cada aula/slot:
- dia da semana ou data específica;
- início e fim;
- turma/classe e componente;
- docente associado;
- período de vigência da grade;
- fuso/semântica temporal consistente.

Os intervalos devem permitir verificar sobreposição, limites e conflitos. Grade incompleta ou fora da vigência deve bloquear a recomendação afetada e apresentar a razão.

### 3.6 Disponibilidade e impedimentos

A instituição ou o próprio docente, conforme permissão, registra:
- intervalo de disponibilidade;
- indisponibilidades e impedimentos conhecidos;
- limites de carga ou regras de descanso aplicáveis;
- vigência e origem do registro.

Disponibilidade não equivale a habilitação curricular. O motor precisa verificar as duas separadamente.

### 3.7 Ocorrência de ausência e vaga

O responsável autorizado registra:
- docente ausente;
- data e intervalos afetados;
- motivo categorizado, com observações opcionais e minimizadas;
- estado do registro (rascunho, confirmado ou cancelado);
- autor, confirmador e horários de auditoria.

A ausência pode afetar várias aulas. Cada aula afetada deve manter sua própria identidade temporal; não mesclar ocorrências distintas apenas porque pertencem ao mesmo docente ou dia.

### 3.8 Regras institucionais

O responsável autorizado configura, versiona e ativa regras permitidas pelo produto, como:
- requisitos de habilitação/componente;
- conflitos temporais;
- limites de carga;
- prioridades e critérios de desempate;
- restrições institucionais aplicáveis;
- critérios de encaminhamento para decisão humana.

Restrições obrigatórias (*hard constraints*) são avaliadas antes da pontuação. Pesos não podem tornar elegível um candidato que viole uma restrição obrigatória. Cada execução registra a versão de regras usada e explica recomendações e vagas não cobertas.

## 4. Como os dados entram

A primeira versão deve suportar cadastro pela interface. Importação por planilha/CSV pode ser uma conveniência futura, com pré-visualização, validação, relatório de erros, deduplicação e confirmação explícita antes de gravar.

Não presumir importação automática da SED, scraping, APIs oficiais, códigos de professor da rede ou sincronização periódica. Uma importação externa só poderá ser habilitada após especificação e autorização próprias.

## 5. Validações antes de executar o motor

- existem docentes ativos no escopo da escola;
- habilitações/componentes dos candidatos estão cadastrados;
- turmas e grade estão vigentes;
- os intervalos têm início anterior ao fim;
- disponibilidade e impedimentos podem ser comparados temporalmente;
- carga horária pode ser calculada com os dados disponíveis;
- ausência foi confirmada por usuário autorizado;
- regras estão ativas e versionadas;
- os registros pertencem à organização/escola solicitante;
- conflitos ou lacunas relevantes são apresentados como pendências.

Se os dados forem insuficientes, a execução deve terminar com estado explicável (por exemplo, `blocked_missing_data`) ou retornar vagas não cobertas com motivos claros. Não fabricar candidatos ou horários.

## 6. Auditoria e ciclo de vida

Registrar ator, organização/escola, ação, entidade afetada, instante, motivo quando necessário e valores relevantes antes/depois sem expor segredos. Alterações de habilitação, grade, disponibilidade ou regras devem invalidar/requerer nova execução quando materialmente afetarem um plano já calculado.

Inativar um docente ou encerrar um vínculo não deve apagar o histórico de rodadas e substituições. Mudanças e decisões humanas devem permanecer distinguíveis das recomendações do algoritmo.

## 7. Critérios de aceite do cadastro

1. Uma instituição consegue cadastrar docentes e os dados operacionais sem importar uma base oficial.
2. Um docente cadastrado pode existir sem conta de login; associar uma conta exige fluxo autorizado separado.
3. O motor recusa ou sinaliza dados críticos ausentes, vencidos ou conflitantes.
4. As regras de habilitação e conflito são avaliadas antes da pontuação.
5. Uma escola não acessa dados de outra escola/organização sem autorização explícita.
6. Cadastro, alteração, inativação, execução e confirmação humana são auditáveis.
7. A mesma entrada e a mesma versão de regras permitem reproduzir a mesma recomendação.
8. A instituição consegue corrigir os próprios registros sem perder o histórico operacional.

## 8. Relação com especificações anteriores

Este documento esclarece a decisão de produto para a operação autônoma da Escala: cadastro institucional é a fonte operacional inicial; fonte SED é opcional e não bloqueia esse caminho. Contratos anteriores sobre importação oficial continuam aplicáveis somente ao adaptador/importador externo quando esse recurso for explicitamente desenvolvido. Eles não devem ser interpretados como requisito para que a instituição cadastre seus próprios dados.

Antes de implementar alterações físicas, reconciliar este contrato com o Core/EIOS já existente, os contratos de identidade docente, o modelo de grade, as permissões/RLS e a divergência de migrações Supabase. Nenhuma tabela ou FK nova deve ser criada apenas com base neste documento.

## 9. Próximo passo técnico

Auditar os formulários e entidades já existentes no Core/Agenda para mapear cada campo acima a uma fonte canônica, identificar lacunas reais e propor o menor conjunto de mudanças. Depois: testes em ambiente isolado, verificação de autorização/RLS e validação ponta a ponta. Produção permanece bloqueada até os gates existentes serem aprovados.

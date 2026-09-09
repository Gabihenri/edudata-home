# 43 — Contrato da Fonte Institucional de Docentes v1

**Status:** especificação e gate de integração; sem DDL de produção.

## 1. Objetivo

Definir a fonte de verdade para carregar docentes que poderão participar da Escala de Substituição, sem confundir identidade de autenticação com identidade acadêmica.

## 2. Ordem de confiança

1. Fonte oficial publicada pela instituição/rede;
2. identificador institucional estável atribuído pela fonte;
3. registro homologado em `teacher_profiles`;
4. vínculo Auth ↔ docente explicitamente homologado;
5. dados derivados somente depois da homologação.

Nome, e-mail, posição da planilha ou semelhança textual **não são chaves de identidade**.

## 3. Entrada mínima obrigatória

Cada registro de origem deve fornecer, quando aplicável:

- organização;
- escola;
- identificador institucional do docente;
- nome oficial;
- situação funcional/ativa;
- área de conhecimento;
- etapa de ensino;
- componentes/disciplinas;
- carga ou vínculo relevante, se fornecido pela fonte;
- vigência;
- identificador do registro na fonte;
- versão/competência da publicação;
- origem e data de publicação.

A ausência do identificador institucional torna o registro **não homologável automaticamente**.

## 4. Pipeline obrigatório

`Fonte oficial → lote de importação → raw imutável → normalização → matching → fila de exceções → homologação → teacher_profiles → ponte Auth/docente → consumo pela Escala`.

Nenhum registro `ambiguous`, `unresolved` ou `rejected` pode entrar como docente operacional homologado.

## 5. Homologação

### Automática

Permitida somente quando existir identificador institucional estável que corresponda inequivocamente a um `teacher_profile` dentro do mesmo contexto organização/escola e todos os controles de integridade forem satisfeitos.

### Manual

Obrigatória para exceções. O homologador deve ser um usuário autenticado com permissão específica e escopo compatível. A ação registra:

- ator;
- data/hora;
- registro de origem;
- identidade escolhida;
- evidência utilizada;
- justificativa;
- vigência;
- resultado.

A decisão humana não pode ser inferida por nome/e-mail.

## 6. Criação de teacher_profiles

A carga não deve sobrescrever silenciosamente atributos acadêmicos já homologados. Correções originadas na fonte devem preservar proveniência e histórico.

O `teacher_profiles.id` é a identidade acadêmica canônica do sistema. A identidade Auth permanece em `auth.users`/`user_profiles` e só se conecta por ponte explicitamente homologada.

## 7. Multi-escola

Um mesmo docente pode possuir vínculos válidos em escolas diferentes da mesma organização ou em contextos autorizados, desde que cada vínculo tenha:

- contexto institucional próprio;
- vigência própria;
- origem/proveniência;
- eventual vínculo Auth separado ou explicitamente reutilizado de forma segura.

Não existe unicidade global de `auth_user_id` no domínio acadêmico.

## 8. Atualização e desligamento

A fonte nova gera novo lote/versionamento. Não há exclusão física automática de identidade histórica.

Mudança de escola, situação funcional ou identificador deve produzir histórico e passar por revalidação quando afetar a ponte Auth/docente.

Docente inativo não pode ser candidato operacional à substituição.

## 9. Idempotência

A identidade do lote deve considerar, no mínimo:

`organization_id + school_id + source_system + source_hash/version`.

Reprocessamento do mesmo lote não pode duplicar docentes nem vínculos.

## 10. Gate de integração

Antes de conectar a fonte à produção, devem existir:

- amostra oficial/homologada;
- definição documentada do identificador institucional;
- mapeamento dos campos;
- política de exceções;
- ator homologador;
- permissão `escala.manage_teacher_identity_links` homologada;
- auditoria integrada;
- RLS testada;
- harness executado em PostgreSQL isolado.

## 11. Estado atual

A inspeção atual do Supabase confirmou `teacher_profiles` com **0 registros**. Portanto, este contrato está pronto para orientar a integração, mas a integração real permanece bloqueada até existir uma fonte institucional concreta e uma amostra verificável.

## 12. Gate

**🟢 Contrato:** definido.

**🟡 Modelo/harness:** preparados, execução real pendente.

**🔴 Produção:** bloqueada.

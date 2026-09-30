# Professor Digital

Esta pasta contém a experiência do produto **Professor Digital**, definido na arquitetura oficial como uma das aplicações estratégicas construídas sobre o EIOS e o Core Compartilhado da EduData IA.

## Missão do produto

O Professor Digital organiza o desenvolvimento profissional contínuo baseado em evidências. Ele não constitui um motor de IA isolado: capacidades de perfil, recomendações, análise, contexto e aprendizagem devem ser consumidas do núcleo compartilhado da plataforma.

## Áreas presentes

A estrutura atual evidencia uma organização funcional do produto, com áreas como:

- `perfil/` — experiência relacionada ao Perfil Docente Inteligente;
- `plano/` — organização de planos individuais e desenvolvimento;
- `evidencias/` — registro e consulta de evidências relacionadas à trajetória profissional;
- `recomendacoes/` — apresentação de recomendações geradas por capacidades compartilhadas;
- `desenvolvimento/` — acompanhamento do desenvolvimento profissional;
- `conhecimento/` — acesso e organização de conhecimentos relevantes;
- `producao/` — produção e organização de materiais ou registros do docente;
- `copiloto/` — experiência de apoio ao usuário;
- `agenda/` — integração da jornada do professor com recursos de agenda;
- `escola/` — contextualização da atuação do docente no ambiente institucional.

Arquivos como `layout.tsx`, `loading.tsx` e `error.tsx` estabelecem comportamentos compartilhados da experiência do produto no App Router.

## Integrações obrigatórias

O Professor Digital deve evoluir conectado a:

**Framework EDI → EIOS → Core Compartilhado → Professor Digital**

Sempre que uma funcionalidade representar inteligência reutilizável — por exemplo, geração de perfil, análise de evidências ou recomendação — sua lógica deve pertencer ao EIOS. Esta pasta deve concentrar principalmente a experiência, os fluxos e a apresentação específicos do produto.

## Regra de evolução

O Professor Digital já possui uma implementação em desenvolvimento. É proibido recriá-lo como um segundo produto paralelo. Toda evolução deve começar por auditoria da estrutura existente, mapeamento do fluxo atual e integração progressiva com o Core e o EIOS.

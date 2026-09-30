# Agenda Inteligente EDI

Esta pasta reúne a experiência do produto **Agenda Inteligente EDI**, uma aplicação operacional da EduData IA voltada a transformar planejamento e ação pedagógica em informações e evidências estruturadas.

## Papel no ecossistema

A Agenda integra a arquitetura:

**Framework EDI → EIOS → Core Compartilhado → Agenda Inteligente EDI → Clientes**

Seu papel é oferecer uma experiência operacional específica. Capacidades compartilhadas de inteligência, recomendações, análise e aprendizagem não devem ser recriadas nesta camada; devem ser consumidas dos serviços compartilhados da plataforma.

## Responsabilidade do produto

A Agenda organiza a jornada operacional de planejamento, registro, acompanhamento e evidências. A evolução do produto deve preservar o princípio de que dados e evidências gerados por seus fluxos podem alimentar o ecossistema de inteligência de forma governada e respeitando as permissões de cada usuário e instituição.

## Relação com o EIOS

Quando uma necessidade representar inteligência compartilhada — como recomendações, interpretação de evidências, geração de insights ou personalização — a implementação deve ser encaminhada ao EIOS. Quando representar uma tela, fluxo operacional ou comportamento exclusivo da Agenda, a implementação pertence ao produto.

## Regra de evolução

A Agenda já possui implementação e histórico de desenvolvimento. Não deve ser recriada. Toda nova Sprint deve partir da auditoria do código existente e seguir o fluxo:

**auditoria → mapeamento → integração → evolução → validação → documentação**.

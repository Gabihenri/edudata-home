# src

## Finalidade

Este diretório reúne o código-fonte principal da EduData IA Platform. Ele materializa a arquitetura operacional da plataforma e conecta a experiência dos produtos ao Core Compartilhado e ao EIOS.

## Organização

- `app/`: rotas, páginas e endpoints do Next.js App Router.
- `components/`: componentes visuais e funcionais reutilizáveis.
- `data/`: dados e configurações estáticas utilizadas pela experiência.
- `hooks/`: hooks compartilhados do frontend.
- `lib/`: infraestrutura, regras compartilhadas, acesso a dados e integrações.
- `services/`: serviços de domínio e comunicação com APIs.
- `types/`: contratos e tipos TypeScript.
- `scripts/`: utilitários de manutenção e execução local.

## Regra arquitetural

Novas funcionalidades devem ser classificadas antes da implementação: experiências específicas permanecem no produto; capacidades compartilhadas devem ser integradas ao Core e, quando envolverem inteligência reutilizável, ao EIOS.

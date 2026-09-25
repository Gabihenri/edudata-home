# src/services

## Finalidade

Serviços de aplicação responsáveis por organizar operações e comunicação entre a interface, as APIs e os domínios compartilhados.

## Arquitetura

Sempre que aplicável, seguir o fluxo:

Interface ou componente → Serviço → API/Repository/Core

Isso evita que páginas acessem infraestrutura diretamente e mantém as responsabilidades explícitas.

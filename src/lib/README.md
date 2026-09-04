# src/lib

## Finalidade

Camada de infraestrutura e utilidades compartilhadas da aplicação. Aqui vivem contratos, integração com banco e serviços, autenticação, permissões, validações e outras capacidades reutilizadas por múltiplos módulos.

## Diretriz

Esta pasta é parte da implementação do Core Compartilhado no frontend. Não deve receber regras específicas de uma única tela quando elas puderem ser modeladas como serviços ou capacidades de domínio.

## Relação com o EIOS

Capacidades de inteligência compartilhada não devem ser recriadas aqui de forma isolada; devem consumir ou evoluir os contratos oficiais do EIOS.

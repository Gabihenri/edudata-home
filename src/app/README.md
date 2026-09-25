# src/app

## Finalidade

Camada de aplicação baseada no Next.js App Router. Este diretório concentra as interfaces, layouts e rotas HTTP da EduData IA Platform.

## Responsabilidades

- páginas públicas e institucionais;
- experiências dos produtos;
- áreas autenticadas;
- rotas administrativas;
- endpoints em `api/`;
- metadados, sitemap, robots e PWA.

## Convenção

A estrutura de pastas representa rotas e contextos de produto. Arquivos de interface devem delegar regras de negócio a serviços e infraestrutura compartilhada sempre que possível, evitando duplicação de lógica entre páginas.

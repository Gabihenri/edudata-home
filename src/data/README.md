# src/data

## Finalidade

Dados de conteúdo e configuração consumidos pela aplicação. Esta camada separa informações institucionais e estruturadas da lógica de apresentação.

## Uso

A Home e outros módulos devem preferir dados centralizados a textos e listas duplicadas dentro dos componentes. Isso facilita manutenção, evolução futura pelo Experience Manager e integração com fontes administráveis.

## Regra

A presença de dados neste diretório não substitui o banco de dados. Informações operacionais e multiusuário devem evoluir para fontes persistentes apropriadas.

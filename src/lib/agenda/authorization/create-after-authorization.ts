export type AuthorizedCreationDependencies<TInput, TResult> = {
  authorize: () => Promise<void>
  create: (input: TInput) => Promise<TResult>
  input: TInput
}

/**
 * Executa a criação somente depois de a autorização terminar com sucesso.
 * A camada HTTP é responsável por converter exceções em respostas.
 */
export async function createAfterAuthorization<TInput, TResult>(
  dependencies: AuthorizedCreationDependencies<TInput, TResult>,
): Promise<TResult> {
  await dependencies.authorize()
  return dependencies.create(dependencies.input)
}

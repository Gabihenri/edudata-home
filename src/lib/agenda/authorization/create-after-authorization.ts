export type AuthorizedCreationDependencies<TInput, TResult> = {
  authorize: () => Promise<void>
  create: (input: TInput) => Promise<TResult>
  input: TInput
}

/**
 * Garante que a operação de criação só seja executada depois da autorização.
 * A função não captura erros: a camada HTTP decide como convertê-los em resposta.
 */
export async function createAfterAuthorization<TInput, TResult>(
  dependencies: AuthorizedCreationDependencies<TInput, TResult>,
): Promise<TResult> {
  await dependencies.authorize()
  return dependencies.create(dependencies.input)
}

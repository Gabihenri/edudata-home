function buildErrorResponse(
  error: unknown,
): NextResponse {
  if (
    isAccessDeniedError(
      error,
    )
  ) {
    const serializedError =
      serializeAccessDeniedError(
        error,
      )

    return NextResponse.json(
      serializedError,
      {
        status:
          403,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const message =
    error instanceof
      Error
      ? error.message
      : 'Não foi possível processar a inteligência da Agenda.'

  const normalizedMessage =
    message.toLowerCase()

  if (
    normalizedMessage
      .includes(
        'não autenticado',
      )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          'Usuário não autenticado.',
      },
      {
        status:
          401,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  if (
    normalizedMessage
      .includes(
        'não está configurada',
      ) ||
    normalizedMessage
      .includes(
        'não configuradas',
      )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          503,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  return NextResponse.json(
    {
      success:
        false,

      error:
        message,
    },
    {
      status:
        500,

      headers:
        NO_CACHE_HEADERS,
      },
    )
}
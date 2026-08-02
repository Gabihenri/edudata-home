export function useAgendaIntelligence(
  options:
    UseAgendaIntelligenceOptions =
    {},
): UseAgendaIntelligenceResult {
  const {
    autoLoad =
      true,
  } = options

  const [
    intelligence,
    setIntelligence,
  ] = useState<
    AgendaIntelligenceData |
    null
  >(
    null,
  )

  const [
    loading,
    setLoading,
  ] = useState(
    autoLoad,
  )

  const [
    refreshing,
    setRefreshing,
  ] = useState(
    false,
  )

  const [
    error,
    setError,
  ] = useState<
    string |
    null
  >(
    null,
  )

  const mountedRef =
    useRef(
      true,
    )

  const requestIdRef =
    useRef(
      0,
    )

  /*
   * Mantém a última inteligência carregada sem colocar
   * `intelligence` nas dependências de loadIntelligence.
   *
   * Isso impede que a atualização do estado recrie o callback
   * e dispare novamente o useEffect de carregamento automático.
   */
  const intelligenceRef =
    useRef<
      AgendaIntelligenceData |
      null
    >(
      null,
    )

  /*
   * Impede mais de uma execução automática durante a montagem.
   * O recarregamento manual continua disponível por reload().
   */
  const autoLoadStartedRef =
    useRef(
      false,
    )

  useEffect(
    () => {
      mountedRef.current =
        true

      return () => {
        mountedRef.current =
          false

        requestIdRef.current +=
          1
      }
    },
    [],
  )

  const loadIntelligence =
    useCallback(
      async (): Promise<
        AgendaIntelligenceData |
        null
      > => {
        const requestId =
          requestIdRef.current +
          1

        requestIdRef.current =
          requestId

        const isInitialLoad =
          intelligenceRef.current ===
          null

        if (
          mountedRef.current
        ) {
          if (
            isInitialLoad
          ) {
            setLoading(
              true,
            )

            setRefreshing(
              false,
            )
          } else {
            setRefreshing(
              true,
            )
          }

          setError(
            null,
          )
        }

        try {
          const response =
            await fetch(
              '/api/agenda/intelligence',
              {
                method:
                  'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',

                credentials:
                  'same-origin',
              },
            )

          let responseBody:
            unknown

          try {
            responseBody =
              await response.json()
          } catch {
            responseBody =
              null
          }

          if (
            !response.ok
          ) {
            throw new Error(
              extractErrorMessage(
                responseBody,
                'Não foi possível carregar a inteligência da Agenda.',
              ),
            )
          }

          const parsedData =
            parseIntelligenceData(
              responseBody,
            )

          if (
            !mountedRef.current
            || requestId !==
              requestIdRef.current
          ) {
            return null
          }

          /*
           * Atualiza primeiro a referência interna.
           * O callback permanece estável porque não depende
           * do estado `intelligence`.
           */
          intelligenceRef.current =
            parsedData

          setIntelligence(
            parsedData,
          )

          setError(
            null,
          )

          return parsedData
        } catch (
          currentError
        ) {
          const message =
            currentError instanceof
              Error
              ? currentError.message
              : 'Não foi possível carregar a inteligência da Agenda.'

          if (
            mountedRef.current
            && requestId ===
              requestIdRef.current
          ) {
            setError(
              message,
            )
          }

          return null
        } finally {
          if (
            mountedRef.current
            && requestId ===
              requestIdRef.current
          ) {
            setLoading(
              false,
            )

            setRefreshing(
              false,
            )
          }
        }
      },
      [],
    )

  useEffect(
    () => {
      if (
        !autoLoad
      ) {
        setLoading(
          false,
        )

        return
      }

      /*
       * Executa somente uma vez automaticamente.
       * Alterações de estado não reiniciam esta requisição.
       */
      if (
        autoLoadStartedRef.current
      ) {
        return
      }

      autoLoadStartedRef.current =
        true

      void loadIntelligence()
    },
    [
      autoLoad,
      loadIntelligence,
    ],
  )

  const clearError =
    useCallback(
      () => {
        setError(
          null,
        )
      },
      [],
    )

  const analytics =
    intelligence
      ?.analytics ??
    {}

  const insightItems =
    Array.isArray(
      intelligence
        ?.insights
        ?.insights,
    )
      ? intelligence
          ?.insights
          ?.insights
          ?.map(
            normalizeInsight,
          )
          .filter(
            (
              insight,
            ): insight is
              AgendaInsight =>
              Boolean(
                insight,
              ),
          ) ??
        []
      : []

  const recommendationItems =
    Array.isArray(
      intelligence
        ?.recommendations
        ?.recommendations,
    )
      ? intelligence
          ?.recommendations
          ?.recommendations
          ?.map(
            normalizeRecommendation,
          )
          .filter(
            (
              recommendation,
            ): recommendation is
              AgendaRecommendation =>
              Boolean(
                recommendation,
              ),
          ) ??
        []
      : []

  const operationalScore =
    normalizeNumber(
      intelligence
        ?.analytics
        ?.edi_indicators
        ?.operational_score,
    )

  return {
    intelligence,

    analytics,

    insights:
      insightItems,

    recommendations:
      recommendationItems,

    loading,

    refreshing,

    error,

    generatedAt:
      intelligence
        ?.generated_at ??
      null,

    operationalScore,

    loadIntelligence,

    reload:
      loadIntelligence,

    clearError,
  }
}
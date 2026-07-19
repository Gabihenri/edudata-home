'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  UpgradePrompt,
} from '@/components/commercial/UpgradePrompt'

import {
  getApiErrorMessage,
  parseUpgradeAccessResponse,
  type UpgradeAccessContext,
} from '@/lib/commercial/upgrade-access'

type AgendaScheduleTemplate = {
  id: string
  title: string
  description: string | null

  event_type: string
  priority: string

  weekday: number

  start_time: string
  end_time: string | null

  timezone: string

  repeat_interval_weeks: number

  valid_from: string | null
  valid_until: string | null

  active: boolean

  school_id: string | null
  user_id: string | null

  created_at: string
  updated_at: string
}

type TemplatesApiResponse = {
  success?: boolean
  total?: number

  data?:
    AgendaScheduleTemplate[]

  error?: string
  message?: string
}

type ApplyTemplatesApiResponse = {
  success?: boolean

  message?: string
  error?: string

  data?: {
    weekReference: string

    totalTemplates: number
    totalCreated: number
    totalSkipped: number
  }
}

type ScheduleTemplatesPanelProps = {
  selectedWeek: string

  onApplied?:
    () =>
      void |
      Promise<void>

  refreshKey?: number
}

const weekdayLabels:
  Record<number, string> = {
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
    7: 'Domingo',
  }

function formatTime(
  value: string | null,
): string {
  if (!value) {
    return ''
  }

  return value.slice(
    0,
    5,
  )
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return ''
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split('-')
      .map(Number)

  const date =
    new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date)
}

function formatWeekReference(
  value: string,
): string {
  const [
    year,
    month,
    day,
  ] =
    value
      .split('-')
      .map(Number)

  const startDate =
    new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0,
    )

  if (
    Number.isNaN(
      startDate.getTime(),
    )
  ) {
    return value
  }

  const endDate =
    new Date(
      startDate,
    )

  endDate.setDate(
    endDate.getDate() +
      6,
  )

  const formatter =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        day:
          '2-digit',

        month:
          'short',
      },
    )

  return `${formatter.format(
    startDate,
  )} a ${formatter.format(
    endDate,
  )}`
}

function getFrequencyLabel(
  interval: number,
): string {
  if (interval <= 1) {
    return 'Toda semana'
  }

  if (interval === 2) {
    return 'A cada duas semanas'
  }

  return `A cada ${interval} semanas`
}

function getEventTypeLabel(
  value: string,
): string {
  const labels:
    Record<string, string> = {
      pedagogico:
        'Pedagógico',

      aula:
        'Aula',

      reuniao:
        'Reunião',

      formacao:
        'Formação',

      avaliacao:
        'Avaliação',

      prazo:
        'Prazo',

      acompanhamento:
        'Acompanhamento',

      outro:
        'Outro',
    }

  return (
    labels[value] ??
    value
      .replace(
        /_/g,
        ' ',
      )
      .replace(
        /-/g,
        ' ',
      )
      .replace(
        /\b\w/g,
        character =>
          character
            .toUpperCase(),
      )
  )
}

function getPriorityLabel(
  value: string,
): string {
  const labels:
    Record<string, string> = {
      baixa:
        'Baixa',

      media:
        'Média',

      alta:
        'Alta',

      urgente:
        'Urgente',
    }

  return (
    labels[value] ??
    value
  )
}

function getPriorityClasses(
  value: string,
): string {
  if (
    value === 'alta' ||
    value === 'urgente'
  ) {
    return [
      'border-red-200',
      'bg-red-50',
      'text-red-800',
    ].join(' ')
  }

  if (
    value === 'media'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-800',
    ].join(' ')
  }

  return [
    'border-emerald-200',
    'bg-emerald-50',
    'text-emerald-800',
  ].join(' ')
}

async function readJsonPayload(
  response: Response,
): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function normalizeApiPayload<T>(
  payload: unknown,
): T {
  if (
    typeof payload ===
      'object' &&
    payload !== null &&
    !Array.isArray(payload)
  ) {
    return payload as T
  }

  return {} as T
}

export function ScheduleTemplatesPanel({
  selectedWeek,

  onApplied,

  refreshKey = 0,
}: ScheduleTemplatesPanelProps) {
  const [
    templates,
    setTemplates,
  ] =
    useState<
      AgendaScheduleTemplate[]
    >([])

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<string[]>(
      [],
    )

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    isApplying,
    setIsApplying,
  ] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('')

  const [
    upgradeAccess,
    setUpgradeAccess,
  ] =
    useState<
      UpgradeAccessContext |
      null
    >(null)

  const selectedCount =
    selectedIds.length

  const allTemplatesSelected =
    useMemo(() => {
      return (
        templates.length >
          0 &&
        selectedIds.length ===
          templates.length
      )
    }, [
      selectedIds,
      templates,
    ])

  const summary =
    useMemo(() => {
      const active =
        templates.filter(
          template =>
            template.active,
        ).length

      const weekly =
        templates.filter(
          template =>
            template
              .repeat_interval_weeks <=
            1,
        ).length

      const days =
        new Set(
          templates.map(
            template =>
              template.weekday,
          ),
        ).size

      return {
        total:
          templates.length,

        active,

        weekly,

        days,
      }
    }, [
      templates,
    ])

  const loadTemplates =
    useCallback(
      async () => {
        setIsLoading(true)

        setErrorMessage('')
        setSuccessMessage('')
        setUpgradeAccess(null)

        try {
          const response =
            await fetch(
              '/api/agenda/schedule-templates',
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',
              },
            )

          const payload =
            await readJsonPayload(
              response,
            )

          const commercialBlock =
            parseUpgradeAccessResponse(
              payload,
            )

          if (commercialBlock) {
            setTemplates([])
            setSelectedIds([])

            setUpgradeAccess(
              commercialBlock,
            )

            return
          }

          const result =
            normalizeApiPayload<
              TemplatesApiResponse
            >(payload)

          if (
            !response.ok ||
            result.success !==
              true
          ) {
            throw new Error(
              getApiErrorMessage(
                payload,
                'Não foi possível carregar os horários-padrão.',
              ),
            )
          }

          const loadedTemplates =
            result.data ??
            []

          setTemplates(
            loadedTemplates,
          )

          setSelectedIds(
            currentIds => {
              const validIds =
                currentIds.filter(
                  id =>
                    loadedTemplates.some(
                      template =>
                        template.id ===
                        id,
                    ),
                )

              if (
                validIds.length >
                0
              ) {
                return validIds
              }

              return loadedTemplates.map(
                template =>
                  template.id,
              )
            },
          )
        } catch (error) {
          setTemplates([])
          setSelectedIds([])

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os horários-padrão.',
          )
        } finally {
          setIsLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadTemplates()
  }, [
    loadTemplates,
    refreshKey,
  ])

  function clearMessages():
    void {
    setErrorMessage('')
    setSuccessMessage('')
  }

  function toggleTemplate(
    templateId: string,
  ): void {
    clearMessages()

    setSelectedIds(
      currentIds => {
        if (
          currentIds.includes(
            templateId,
          )
        ) {
          return currentIds.filter(
            id =>
              id !==
              templateId,
          )
        }

        return [
          ...currentIds,
          templateId,
        ]
      },
    )
  }

  function selectAllTemplates():
    void {
    setSelectedIds(
      templates.map(
        template =>
          template.id,
      ),
    )

    clearMessages()
  }

  function clearSelection():
    void {
    setSelectedIds([])
    clearMessages()
  }

  async function applySelectedTemplates():
    Promise<void> {
    clearMessages()

    if (
      selectedIds.length ===
      0
    ) {
      setErrorMessage(
        'Selecione pelo menos um horário-padrão.',
      )

      return
    }

    setIsApplying(true)

    try {
      const response =
        await fetch(
          '/api/agenda/schedule-templates/apply',
          {
            method:
              'POST',

            credentials:
              'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                weekReference:
                  selectedWeek,

                templateIds:
                  selectedIds,
              }),
          },
        )

      const payload =
        await readJsonPayload(
          response,
        )

      const commercialBlock =
        parseUpgradeAccessResponse(
          payload,
        )

      if (commercialBlock) {
        setUpgradeAccess(
          commercialBlock,
        )

        setTemplates([])
        setSelectedIds([])

        return
      }

      const result =
        normalizeApiPayload<
          ApplyTemplatesApiResponse
        >(payload)

      if (
        !response.ok ||
        result.success !==
          true
      ) {
        throw new Error(
          getApiErrorMessage(
            payload,
            'Não foi possível aplicar os horários-padrão.',
          ),
        )
      }

      setSuccessMessage(
        result.message ??
          'Horários-padrão aplicados à semana.',
      )

      if (onApplied) {
        await onApplied()
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível aplicar os horários-padrão.',
      )
    } finally {
      setIsApplying(false)
    }
  }

  if (
    !isLoading &&
    upgradeAccess
  ) {
    return (
      <UpgradePrompt
        featureCode={
          upgradeAccess
            .featureCode
        }
        featureName={
          upgradeAccess
            .featureName ??
          'Horários-padrão'
        }
        currentPlanName={
          upgradeAccess
            .currentPlanName
        }
        requestedPlanCode="edi_professor_pro"
        requestedPlanName="EDI Professor Pro"
        sourceProduct="agenda_edi"
        sourceModule="calendario"
        sourcePath="/agenda/calendario"
        returnHref="/agenda/calendario"
      />
    )
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071827] font-mono text-xs font-bold text-cyan-300">
              T
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Rotina reutilizável
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                Horários-padrão
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Selecione compromissos habituais e aplique-os à semana escolhida sem precisar criar cada evento novamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadTemplates()
            }
            disabled={
              isLoading ||
              isApplying
            }
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? 'Atualizando...'
              : 'Atualizar horários'}
          </button>
        </div>
      </header>

      <div className="grid border-b border-slate-200 bg-slate-50 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border-b border-slate-200 p-4 sm:border-r xl:border-b-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Modelos
          </p>

          <p className="mt-2 text-2xl font-bold text-[#071827]">
            {summary.total}
          </p>
        </article>

        <article className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Ativos
          </p>

          <p className="mt-2 text-2xl font-bold text-[#071827]">
            {summary.active}
          </p>
        </article>

        <article className="border-b border-slate-200 p-4 sm:border-r sm:border-b-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Semanais
          </p>

          <p className="mt-2 text-2xl font-bold text-[#071827]">
            {summary.weekly}
          </p>
        </article>

        <article className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Dias utilizados
          </p>

          <p className="mt-2 text-2xl font-bold text-[#071827]">
            {summary.days}
          </p>
        </article>
      </div>

      <div className="p-5 sm:p-7">
        <section className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
                Semana de aplicação
              </p>

              <p className="mt-2 font-bold text-cyan-950">
                {formatWeekReference(
                  selectedWeek,
                )}
              </p>
            </div>

            <div className="rounded-lg border border-cyan-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Selecionados
              </p>

              <p className="mt-1 text-xl font-bold text-[#071827]">
                {selectedCount}
              </p>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800"
          >
            {successMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div
            role="status"
            className="rounded-xl border border-cyan-200 bg-cyan-50 p-6 text-center text-sm font-semibold text-cyan-900"
          >
            Carregando horários-padrão...
          </div>
        ) : templates.length ===
          0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-lg font-bold text-[#071827]">
              Nenhum horário-padrão cadastrado
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ao criar um evento, marque a opção de salvá-lo como horário-padrão para reutilizá-lo nas semanas seguintes.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-600">
                {selectedCount}{' '}
                {selectedCount ===
                1
                  ? 'horário selecionado'
                  : 'horários selecionados'}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={
                    selectAllTemplates
                  }
                  disabled={
                    allTemplatesSelected
                  }
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Selecionar todos
                </button>

                <button
                  type="button"
                  onClick={
                    clearSelection
                  }
                  disabled={
                    selectedCount ===
                    0
                  }
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Limpar seleção
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {templates.map(
                (
                  template,
                  index,
                ) => {
                  const isSelected =
                    selectedIds.includes(
                      template.id,
                    )

                  return (
                    <label
                      key={
                        template.id
                      }
                      className={`cursor-pointer overflow-hidden rounded-2xl border transition ${
                        isSelected
                          ? 'border-[#0B7491] bg-cyan-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-cyan-300'
                      }`}
                    >
                      <div
                        className={`border-b px-5 py-4 ${
                          isSelected
                            ? 'border-cyan-200 bg-cyan-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              toggleTemplate(
                                template.id,
                              )
                            }
                            className="mt-1 h-5 w-5 shrink-0 accent-[#0B7491]"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="font-mono text-xs font-bold text-[#0B7491]">
                                  {String(
                                    index +
                                      1,
                                  ).padStart(
                                    2,
                                    '0',
                                  )}
                                </span>

                                <div className="min-w-0">
                                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
                                    {weekdayLabels[
                                      template
                                        .weekday
                                    ] ??
                                      'Dia não informado'}
                                  </p>

                                  <h3 className="mt-2 break-words text-lg font-bold text-[#071827]">
                                    {
                                      template.title
                                    }
                                  </h3>
                                </div>
                              </div>

                              <span
                                aria-hidden="true"
                                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                                  isSelected
                                    ? 'bg-[#0B7491]'
                                    : 'border border-slate-300 bg-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        {template.description ? (
                          <p className="text-sm leading-6 text-slate-600">
                            {
                              template.description
                            }
                          </p>
                        ) : (
                          <p className="text-sm italic text-slate-400">
                            Sem descrição complementar.
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              Horário
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-700">
                              {formatTime(
                                template.start_time,
                              )}

                              {template.end_time
                                ? ` às ${formatTime(
                                    template.end_time,
                                  )}`
                                : ''}
                            </p>
                          </section>

                          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              Frequência
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-700">
                              {getFrequencyLabel(
                                template
                                  .repeat_interval_weeks,
                              )}
                            </p>
                          </section>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-[#075F78]">
                            {getEventTypeLabel(
                              template.event_type,
                            )}
                          </span>

                          <span
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${getPriorityClasses(
                              template.priority,
                            )}`}
                          >
                            Prioridade{' '}
                            {getPriorityLabel(
                              template.priority,
                            )}
                          </span>

                          <span
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                              template.active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {template.active
                              ? 'Ativo'
                              : 'Inativo'}
                          </span>
                        </div>

                        {template.valid_from ||
                        template.valid_until ? (
                          <section className="rounded-xl border border-slate-200 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Vigência
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {template.valid_from
                                ? formatDate(
                                    template.valid_from,
                                  )
                                : 'Sem data inicial'}

                              {' até '}

                              {template.valid_until
                                ? formatDate(
                                    template.valid_until,
                                  )
                                : 'sem data final'}
                            </p>
                          </section>
                        ) : null}
                      </div>
                    </label>
                  )
                },
              )}
            </div>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() =>
                  void applySelectedTemplates()
                }
                disabled={
                  isApplying ||
                  selectedIds.length ===
                    0
                }
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-base font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                {isApplying
                  ? 'Aplicando horários...'
                  : `Aplicar ${selectedCount} ${
                      selectedCount ===
                      1
                        ? 'horário'
                        : 'horários'
                    } à semana`}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default ScheduleTemplatesPanel
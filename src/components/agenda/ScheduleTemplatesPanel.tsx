'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

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
  success: boolean
  total?: number
  data?: AgendaScheduleTemplate[]
  error?: string
}

type ApplyTemplatesApiResponse = {
  success: boolean
  message?: string

  data?: {
    weekReference: string
    totalTemplates: number
    totalCreated: number
    totalSkipped: number
  }

  error?: string
}

type ScheduleTemplatesPanelProps = {
  selectedWeek: string
  onApplied?: () => void | Promise<void>
  refreshKey?: number
}

const weekdayLabels: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo',
}

function formatTime(value: string | null): string {
  if (!value) {
    return ''
  }

  return value.slice(0, 5)
}

function formatDate(value: string | null): string {
  if (!value) {
    return ''
  }

  const [year, month, day] = value
    .split('-')
    .map(Number)

  const date = new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0,
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR').format(
    date,
  )
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

export function ScheduleTemplatesPanel({
  selectedWeek,
  onApplied,
  refreshKey = 0,
}: ScheduleTemplatesPanelProps) {
  const [templates, setTemplates] = useState<
    AgendaScheduleTemplate[]
  >([])

  const [selectedIds, setSelectedIds] = useState<
    string[]
  >([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isApplying, setIsApplying] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  const selectedCount = selectedIds.length

  const allTemplatesSelected = useMemo(() => {
    return (
      templates.length > 0 &&
      selectedIds.length === templates.length
    )
  }, [selectedIds, templates])

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(
        '/api/agenda/schedule-templates',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
      )

      const result =
        (await response.json()) as TemplatesApiResponse

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            'Não foi possível carregar os horários-padrão.',
        )
      }

      const loadedTemplates = result.data ?? []

      setTemplates(loadedTemplates)

      setSelectedIds((currentIds) => {
        const validCurrentIds = currentIds.filter(
          (id) =>
            loadedTemplates.some(
              (template) => template.id === id,
            ),
        )

        if (validCurrentIds.length > 0) {
          return validCurrentIds
        }

        return loadedTemplates.map(
          (template) => template.id,
        )
      })
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
  }, [])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates, refreshKey])

  function toggleTemplate(templateId: string) {
    setSuccessMessage('')
    setErrorMessage('')

    setSelectedIds((currentIds) => {
      if (currentIds.includes(templateId)) {
        return currentIds.filter(
          (id) => id !== templateId,
        )
      }

      return [...currentIds, templateId]
    })
  }

  function selectAllTemplates() {
    setSelectedIds(
      templates.map((template) => template.id),
    )

    setSuccessMessage('')
    setErrorMessage('')
  }

  function clearSelection() {
    setSelectedIds([])
    setSuccessMessage('')
    setErrorMessage('')
  }

  async function applySelectedTemplates() {
    setErrorMessage('')
    setSuccessMessage('')

    if (selectedIds.length === 0) {
      setErrorMessage(
        'Selecione pelo menos um horário-padrão.',
      )

      return
    }

    setIsApplying(true)

    try {
      const response = await fetch(
        '/api/agenda/schedule-templates/apply',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            weekReference: selectedWeek,
            templateIds: selectedIds,
          }),
        },
      )

      const result =
        (await response.json()) as ApplyTemplatesApiResponse

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            'Não foi possível aplicar os horários-padrão.',
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

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
            Rotina reutilizável
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#081C2E]">
            Horários-padrão
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Selecione os compromissos habituais que
            deverão ser adicionados à semana escolhida.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTemplates()}
          disabled={isLoading || isApplying}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#6B21A8] hover:text-[#6B21A8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? 'Atualizando...'
            : 'Atualizar horários'}
        </button>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 leading-7 text-red-700"
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 leading-7 text-emerald-800"
        >
          {successMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          Carregando horários-padrão...
        </div>
      ) : templates.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h3 className="text-xl font-bold text-[#081C2E]">
            Nenhum horário-padrão cadastrado
          </h3>

          <p className="mt-3 leading-7 text-slate-600">
            Ao criar um evento, será possível guardá-lo
            como rotina para as próximas semanas.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">
              {selectedCount}{' '}
              {selectedCount === 1
                ? 'horário selecionado'
                : 'horários selecionados'}
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={selectAllTemplates}
                disabled={allTemplatesSelected}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selecionar todos
              </button>

              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedCount === 0}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar seleção
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {templates.map((template) => {
              const isSelected =
                selectedIds.includes(template.id)

              return (
                <label
                  key={template.id}
                  className={[
                    'cursor-pointer rounded-3xl border-2 p-5 transition',
                    isSelected
                      ? 'border-[#6B21A8] bg-purple-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleTemplate(template.id)
                      }
                      className="mt-1 h-5 w-5 shrink-0 accent-[#6B21A8]"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">
                          {weekdayLabels[
                            template.weekday
                          ] ?? 'Dia não informado'}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {getFrequencyLabel(
                            template.repeat_interval_weeks,
                          )}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-[#081C2E]">
                        {template.title}
                      </h3>

                      {template.description ? (
                        <p className="mt-2 leading-7 text-slate-600">
                          {template.description}
                        </p>
                      ) : null}

                      <p className="mt-4 font-semibold text-slate-700">
                        {formatTime(
                          template.start_time,
                        )}

                        {template.end_time
                          ? ` às ${formatTime(
                              template.end_time,
                            )}`
                          : ''}
                      </p>

                      {template.valid_from ||
                      template.valid_until ? (
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Vigência:{' '}
                          {template.valid_from
                            ? formatDate(
                                template.valid_from,
                              )
                            : 'sem data inicial'}
                          {' até '}
                          {template.valid_until
                            ? formatDate(
                                template.valid_until,
                              )
                            : 'sem data final'}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="mt-7">
            <button
              type="button"
              onClick={() =>
                void applySelectedTemplates()
              }
              disabled={
                isApplying ||
                selectedIds.length === 0
              }
              className="inline-flex min-h-[58px] w-full items-center justify-center rounded-full bg-[#6B21A8] px-7 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-[#581C87] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isApplying
                ? 'Aplicando horários...'
                : `Aplicar ${selectedCount} ${
                    selectedCount === 1
                      ? 'horário'
                      : 'horários'
                  } à semana`}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
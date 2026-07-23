'use client'

import {
  type FormEvent,
  useEffect,
  useState,
} from 'react'

import type {
  CancelInstitutionalAcademicEventRequest,
  UpdateInstitutionalAcademicEventRequest,
} from '@/lib/agenda/hooks/useInstitutionalAcademicEvents'

import type {
  AcademicPeriod,
  InstitutionalCalendarEvent,
  InstitutionalCalendarEventType,
  InstitutionalCalendarPriority,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

type InstitutionalEventManagementActionsProps = {
  event: InstitutionalCalendarEvent
  periods: AcademicPeriod[]

  schoolYearStartDate:
    | string
    | null

  schoolYearEndDate:
    | string
    | null

  disabled?: boolean

  onUpdate: (
    input:
      UpdateInstitutionalAcademicEventRequest,
  ) => Promise<void>

  onCancel: (
    input:
      CancelInstitutionalAcademicEventRequest,
  ) => Promise<void>
}

type ManagementMode =
  | 'closed'
  | 'edit'
  | 'cancel'

type EditFormState = {
  title: string
  description: string

  eventType:
    InstitutionalCalendarEventType

  academicPeriodId: string

  startDate: string
  endDate: string

  allDay: boolean

  startTime: string
  endTime: string

  sourceReference: string

  isInstructionalDay: boolean
  countsAsSchoolDay: boolean
  suspendsClasses: boolean
  isMandatory: boolean

  priority:
    InstitutionalCalendarPriority
}

const EVENT_TYPE_OPTIONS: Array<{
  value:
    InstitutionalCalendarEventType

  label: string
}> = [
  {
    value: 'holiday',
    label: 'Feriado',
  },
  {
    value: 'optional_holiday',
    label: 'Ponto facultativo',
  },
  {
    value: 'recess',
    label: 'Férias ou recesso',
  },
  {
    value: 'planning',
    label: 'Planejamento',
  },
  {
    value: 'teacher_training',
    label: 'Formação docente',
  },
  {
    value: 'school_council',
    label: 'Conselho escolar',
  },
  {
    value: 'assessment',
    label: 'Avaliação',
  },
  {
    value: 'recovery',
    label: 'Recuperação',
  },
  {
    value: 'school_saturday',
    label: 'Sábado letivo',
  },
  {
    value: 'closure',
    label: 'Suspensão ou fechamento',
  },
  {
    value: 'commemorative',
    label: 'Data comemorativa',
  },
  {
    value: 'operational',
    label: 'Evento operacional',
  },
  {
    value: 'enrollment',
    label: 'Matrícula',
  },
  {
    value: 'deadline',
    label: 'Prazo institucional',
  },
  {
    value: 'other',
    label: 'Outro',
  },
]

function normalizeTimeForInput(
  value:
    | string
    | null,
): string {
  if (!value) {
    return ''
  }

  return value.slice(
    0,
    5,
  )
}

function createEditForm(
  event:
    InstitutionalCalendarEvent,
): EditFormState {
  return {
    title:
      event.title,

    description:
      event.description ??
      '',

    eventType:
      event.event_type,

    academicPeriodId:
      event.academic_period_id ??
      '',

    startDate:
      event.start_date,

    endDate:
      event.end_date,

    allDay:
      event.all_day,

    startTime:
      normalizeTimeForInput(
        event.start_time,
      ),

    endTime:
      normalizeTimeForInput(
        event.end_time,
      ),

    sourceReference:
      event.source_reference ??
      '',

    isInstructionalDay:
      event.is_instructional_day,

    countsAsSchoolDay:
      event.counts_as_school_day,

    suspendsClasses:
      event.suspends_classes,

    isMandatory:
      event.is_mandatory,

    priority:
      event.priority,
  }
}

export function InstitutionalEventManagementActions({
  event,
  periods,

  schoolYearStartDate,
  schoolYearEndDate,

  disabled = false,

  onUpdate,
  onCancel,
}: InstitutionalEventManagementActionsProps) {
  const [
    mode,
    setMode,
  ] =
    useState<ManagementMode>(
      'closed',
    )

  const [
    editForm,
    setEditForm,
  ] =
    useState<EditFormState>(
      createEditForm(
        event,
      ),
    )

  const [
    cancellationReason,
    setCancellationReason,
  ] =
    useState('')

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    )

  useEffect(() => {
    setEditForm(
      createEditForm(
        event,
      ),
    )

    setCancellationReason(
      '',
    )

    setLocalError(
      null,
    )

    setMode(
      'closed',
    )
  }, [
    event,
  ])

  function updateEditForm(
    patch:
      Partial<EditFormState>,
  ): void {
    setEditForm(
      currentForm => ({
        ...currentForm,
        ...patch,
      }),
    )
  }

  function closeManagement(): void {
    if (submitting) {
      return
    }

    setEditForm(
      createEditForm(
        event,
      ),
    )

    setCancellationReason(
      '',
    )

    setLocalError(
      null,
    )

    setMode(
      'closed',
    )
  }

  function openEdit(): void {
    setEditForm(
      createEditForm(
        event,
      ),
    )

    setCancellationReason(
      '',
    )

    setLocalError(
      null,
    )

    setMode(
      'edit',
    )
  }

  function openCancellation(): void {
    setCancellationReason(
      '',
    )

    setLocalError(
      null,
    )

    setMode(
      'cancel',
    )
  }

  async function handleUpdate(
    formEvent:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    formEvent.preventDefault()

    if (
      disabled ||
      submitting ||
      event.status ===
        'cancelled'
    ) {
      return
    }

    setSubmitting(
      true,
    )

    setLocalError(
      null,
    )

    try {
      await onUpdate({
        id:
          event.id,

        title:
          editForm.title,

        description:
          editForm.description
            .trim() ||
          null,

        eventType:
          editForm.eventType,

        academicPeriodId:
          editForm.academicPeriodId ||
          null,

        sourceReference:
          editForm.sourceReference
            .trim() ||
          null,

        startDate:
          editForm.startDate,

        endDate:
          editForm.endDate,

        allDay:
          editForm.allDay,

        startTime:
          editForm.allDay
            ? null
            : editForm.startTime,

        endTime:
          editForm.allDay
            ? null
            : editForm.endTime ||
              null,

        isInstructionalDay:
          editForm
            .isInstructionalDay,

        countsAsSchoolDay:
          editForm
            .countsAsSchoolDay,

        suspendsClasses:
          editForm
            .suspendsClasses,

        isMandatory:
          editForm.isMandatory,

        priority:
          editForm.priority,
      })

      setMode(
        'closed',
      )
    } catch (
      updateError
    ) {
      setLocalError(
        updateError instanceof
          Error
          ? updateError.message
          : 'Não foi possível atualizar o evento.',
      )
    } finally {
      setSubmitting(
        false,
      )
    }
  }

  async function handleCancellation(
    formEvent:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    formEvent.preventDefault()

    if (
      disabled ||
      submitting ||
      event.status ===
        'cancelled'
    ) {
      return
    }

    const normalizedReason =
      cancellationReason.trim()

    if (!normalizedReason) {
      setLocalError(
        'Informe o motivo do cancelamento.',
      )

      return
    }

    setSubmitting(
      true,
    )

    setLocalError(
      null,
    )

    try {
      await onCancel({
        id:
          event.id,

        reason:
          normalizedReason,
      })

      setCancellationReason(
        '',
      )

      setMode(
        'closed',
      )
    } catch (
      cancelError
    ) {
      setLocalError(
        cancelError instanceof
          Error
          ? cancelError.message
          : 'Não foi possível cancelar o evento.',
      )
    } finally {
      setSubmitting(
        false,
      )
    }
  }

  if (
    event.status ===
    'cancelled'
  ) {
    return (
      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-bold text-red-800">
          Evento cancelado
        </p>

        {event.cancellation_reason ? (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">
              Motivo registrado
            </p>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-red-700">
              {
                event
                  .cancellation_reason
              }
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      {mode ===
      'closed' ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={
              openEdit
            }
            disabled={
              disabled ||
              submitting
            }
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-3 text-sm font-bold text-cyan-900 transition hover:border-cyan-600 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Editar evento
          </button>

          <button
            type="button"
            onClick={
              openCancellation
            }
            disabled={
              disabled ||
              submitting
            }
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:border-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Cancelar evento
          </button>
        </div>
      ) : null}

      {localError ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
        >
          {localError}
        </div>
      ) : null}

      {mode ===
      'edit' ? (
        <form
          onSubmit={
            handleUpdate
          }
          className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 sm:p-5"
        >
          <div className="flex flex-col gap-2 border-b border-cyan-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
                Edição do registro
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                As alterações serão aplicadas ao mesmo evento.
              </p>
            </div>

            <button
              type="button"
              onClick={
                closeManagement
              }
              disabled={
                submitting
              }
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Fechar edição
            </button>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">
                Título do evento
              </span>

              <input
                type="text"
                required
                maxLength={220}
                value={
                  editForm.title
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      title:
                        currentEvent
                          .target
                          .value,
                    })
                }
                disabled={
                  submitting
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Tipo
              </span>

              <select
                value={
                  editForm.eventType
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      eventType:
                        currentEvent
                          .target
                          .value as
                          InstitutionalCalendarEventType,
                    })
                }
                disabled={
                  submitting
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {
                  EVENT_TYPE_OPTIONS.map(
                    option => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    ),
                  )
                }
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Prioridade
              </span>

              <select
                value={
                  editForm.priority
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      priority:
                        currentEvent
                          .target
                          .value as
                          InstitutionalCalendarPriority,
                    })
                }
                disabled={
                  submitting
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="normal">
                  Normal
                </option>

                <option value="high">
                  Alta
                </option>

                <option value="critical">
                  Crítica
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Data inicial
              </span>

              <input
                type="date"
                required
                min={
                  schoolYearStartDate ??
                  undefined
                }
                max={
                  schoolYearEndDate ??
                  undefined
                }
                value={
                  editForm.startDate
                }
                onChange={
                  currentEvent => {
                    const nextStartDate =
                      currentEvent
                        .target
                        .value

                    updateEditForm({
                      startDate:
                        nextStartDate,

                      endDate:
                        editForm
                          .endDate <
                        nextStartDate
                          ? nextStartDate
                          : editForm
                              .endDate,
                    })
                  }
                }
                disabled={
                  submitting
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Data final
              </span>

              <input
                type="date"
                required
                min={
                  editForm.startDate ||
                  schoolYearStartDate ||
                  undefined
                }
                max={
                  schoolYearEndDate ??
                  undefined
                }
                value={
                  editForm.endDate
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      endDate:
                        currentEvent
                          .target
                          .value,
                    })
                }
                disabled={
                  submitting
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">
                Período letivo relacionado
              </span>

              <select
                value={
                  editForm
                    .academicPeriodId
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      academicPeriodId:
                        currentEvent
                          .target
                          .value,
                    })
                }
                disabled={
                  submitting
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  Sem vínculo específico
                </option>

                {
                  periods.map(
                    period => (
                      <option
                        key={
                          period.id
                        }
                        value={
                          period.id
                        }
                      >
                        {
                          period.sequence
                        }. {
                          period.name
                        }
                      </option>
                    ),
                  )
                }
              </select>
            </label>

            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="text-sm font-bold text-slate-700">
                Descrição
              </span>

              <textarea
                rows={4}
                maxLength={5000}
                value={
                  editForm.description
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      description:
                        currentEvent
                          .target
                          .value,
                    })
                }
                disabled={
                  submitting
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="text-sm font-bold text-slate-700">
                Referência institucional
              </span>

              <input
                type="text"
                maxLength={500}
                value={
                  editForm
                    .sourceReference
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      sourceReference:
                        currentEvent
                          .target
                          .value,
                    })
                }
                disabled={
                  submitting
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  editForm.allDay
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      allDay:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  submitting
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Dia inteiro
              </span>
            </label>

            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  editForm
                    .suspendsClasses
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      suspendsClasses:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  submitting
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Suspende aulas
              </span>
            </label>

            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  editForm
                    .isInstructionalDay
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      isInstructionalDay:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  submitting
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                É dia letivo
              </span>
            </label>

            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  editForm
                    .countsAsSchoolDay
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      countsAsSchoolDay:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  submitting
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Conta como dia escolar
              </span>
            </label>

            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  editForm.isMandatory
                }
                onChange={
                  currentEvent =>
                    updateEditForm({
                      isMandatory:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  submitting
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Obrigatório
              </span>
            </label>
          </div>

          {!editForm.allDay ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Horário inicial
                </span>

                <input
                  type="time"
                  required
                  value={
                    editForm.startTime
                  }
                  onChange={
                    currentEvent =>
                      updateEditForm({
                        startTime:
                          currentEvent
                            .target
                            .value,
                      })
                  }
                  disabled={
                    submitting
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Horário final
                </span>

                <input
                  type="time"
                  value={
                    editForm.endTime
                  }
                  onChange={
                    currentEvent =>
                      updateEditForm({
                        endTime:
                          currentEvent
                            .target
                            .value,
                      })
                  }
                  disabled={
                    submitting
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={
                submitting ||
                disabled
              }
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting
                ? 'Salvando...'
                : 'Salvar alterações'}
            </button>

            <button
              type="button"
              onClick={
                closeManagement
              }
              disabled={
                submitting
              }
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Descartar alterações
            </button>
          </div>
        </form>
      ) : null}

      {mode ===
      'cancel' ? (
        <form
          onSubmit={
            handleCancellation
          }
          className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
            Cancelamento institucional
          </p>

          <h4 className="mt-2 text-lg font-bold text-[#071827]">
            Cancelar “{event.title}”
          </h4>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            O registro será preservado e identificado como cancelado. Informe um motivo objetivo para a auditoria.
          </p>

          <label className="mt-5 block">
            <span className="text-sm font-bold text-slate-700">
              Motivo do cancelamento
            </span>

            <textarea
              rows={4}
              required
              maxLength={1000}
              value={
                cancellationReason
              }
              onChange={
                currentEvent =>
                  setCancellationReason(
                    currentEvent
                      .target
                      .value,
                  )
              }
              placeholder="Ex.: registro criado apenas para teste da funcionalidade."
              disabled={
                submitting
              }
              className="mt-2 w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={
                submitting ||
                disabled
              }
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting
                ? 'Cancelando...'
                : 'Confirmar cancelamento'}
            </button>

            <button
              type="button"
              onClick={
                closeManagement
              }
              disabled={
                submitting
              }
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Manter evento
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
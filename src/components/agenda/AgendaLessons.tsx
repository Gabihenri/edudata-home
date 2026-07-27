'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

import {
  useLessons,
} from '@/lib/agenda/hooks/useLessons'

import {
  useObjectives,
} from '@/lib/agenda/hooks/useObjectives'

import {
  usePlanning,
} from '@/lib/agenda/hooks/usePlanning'

import {
  useLessonObjectives,
} from '@/lib/agenda/hooks/useLessonObjectives'

import type {
  AgendaLesson,
  AgendaLessonStatus,
} from '@/lib/agenda/repository/lessons.repository'

import type {
  AgendaObjective,
} from '@/lib/agenda/repository/objectives.repository'

type LessonFormState = {
  title: string
  description: string

  subject: string

  scheduledDate: string
  startTime: string
  endTime: string

  planningId: string

  skills: string

  methodology: string
  resources: string

  observations: string
  nextAction: string

  status:
    AgendaLessonStatus
}

type ObjectiveSelectionState = {
  objectiveIds: string[]
  primaryObjectiveId: string | null
}

type RelationshipResponse = {
  success: boolean
  error?: string
}

const INITIAL_FORM:
  LessonFormState = {
    title: '',
    description: '',

    subject: '',

    scheduledDate: '',
    startTime: '',
    endTime: '',

    planningId: '',

    skills: '',

    methodology: '',
    resources: '',

    observations: '',
    nextAction: '',

    status:
      'planejada',
  }

const INITIAL_OBJECTIVE_SELECTION:
  ObjectiveSelectionState = {
    objectiveIds: [],
    primaryObjectiveId:
      null,
  }

const STATUS_OPTIONS: Array<{
  value: AgendaLessonStatus
  label: string
}> = [
  {
    value:
      'planejada',
    label:
      'Planejada',
  },
  {
    value:
      'em_preparacao',
    label:
      'Em preparação',
  },
  {
    value:
      'realizada',
    label:
      'Realizada',
  },
  {
    value:
      'parcialmente_realizada',
    label:
      'Parcialmente realizada',
  },
  {
    value:
      'reagendada',
    label:
      'Reagendada',
  },
  {
    value:
      'cancelada',
    label:
      'Cancelada',
  },
]

const LESSON_FLOW = [
  {
    code:
      '01',
    label:
      'Planejamento',
    description:
      'Relacionar a aula ao contexto, ao planejamento e aos objetivos.',
  },
  {
    code:
      '02',
    label:
      'Execução',
    description:
      'Realizar a aula considerando o contexto real da turma.',
  },
  {
    code:
      '03',
    label:
      'Registro',
    description:
      'Documentar observações, ações e encaminhamentos.',
  },
  {
    code:
      '04',
    label:
      'Evidências',
    description:
      'Produzir registros que demonstrem o desenvolvimento dos objetivos.',
  },
]

function getStatusLabel(
  status:
    AgendaLessonStatus,
): string {
  return STATUS_OPTIONS
    .find(
      option =>
        option.value ===
        status,
    )
    ?.label ??
    status
}

function getStatusClasses(
  status:
    AgendaLessonStatus,
): string {
  if (
    status ===
    'realizada'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    status ===
    'parcialmente_realizada'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-800',
    ].join(' ')
  }

  if (
    status ===
    'em_preparacao'
  ) {
    return [
      'border-cyan-200',
      'bg-cyan-50',
      'text-[#075F78]',
    ].join(' ')
  }

  if (
    status ===
    'reagendada'
  ) {
    return [
      'border-violet-200',
      'bg-violet-50',
      'text-violet-800',
    ].join(' ')
  }

  if (
    status ===
    'cancelada'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-800',
    ].join(' ')
  }

  return [
    'border-amber-200',
    'bg-amber-50',
    'text-amber-800',
  ].join(' ')
}

function getObjectiveCategoryLabel(
  category: string,
): string {
  if (
    category ===
    'pedagogico'
  ) {
    return 'Pedagógico'
  }

  if (
    category ===
    'engajamento'
  ) {
    return 'Engajamento'
  }

  if (
    category ===
    'gestao'
  ) {
    return 'Gestão'
  }

  if (
    category ===
    'formacao'
  ) {
    return 'Formação'
  }

  if (
    category ===
    'inclusao'
  ) {
    return 'Inclusão'
  }

  if (
    category ===
    'desenvolvimento'
  ) {
    return 'Desenvolvimento'
  }

  return category
}

function formatDate(
  date: string | null,
): string {
  if (!date) {
    return 'Data não informada'
  }

  const [
    year,
    month,
    day,
  ] = date.split('-')

  if (
    !year ||
    !month ||
    !day
  ) {
    return date
  }

  return `${day}/${month}/${year}`
}

function formatTime(
  time: string | null,
): string {
  if (!time) {
    return ''
  }

  return time.slice(
    0,
    5,
  )
}

function buildTimeRange(
  startTime: string | null,
  endTime: string | null,
): string {
  const normalizedStart =
    formatTime(
      startTime,
    )

  const normalizedEnd =
    formatTime(
      endTime,
    )

  if (
    normalizedStart &&
    normalizedEnd
  ) {
    return `${normalizedStart}–${normalizedEnd}`
  }

  return (
    normalizedStart ||
    normalizedEnd ||
    'Horário não informado'
  )
}

function normalizeSkills(
  value: string,
): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]/)
        .map(
          skill =>
            skill.trim(),
        )
        .filter(Boolean),
    ),
  )
}

async function synchronizeLessonObjectives(
  lessonId: string,

  selectedObjectives:
    AgendaObjective[],

  primaryObjectiveId:
    string | null,

  schoolId:
    string | null,
): Promise<void> {
  const response =
    await fetch(
      `/api/agenda/lessons/${encodeURIComponent(lessonId)}/objectives`,
      {
        method:
          'PUT',

        headers: {
          'Content-Type':
            'application/json',
        },

        credentials:
          'include',

        body:
          JSON.stringify({
            objectives:
              selectedObjectives.map(
                (
                  objective,
                  index,
                ) => ({
                  objectiveId:
                    objective.id,

                  role:
                    objective.id ===
                    primaryObjectiveId
                      ? 'primary'
                      : 'supporting',

                  sequence:
                    index + 1,

                  metadata: {
                    source:
                      'agenda-lessons-form',
                  },
                }),
              ),

            schoolId,
          }),
      },
    )

  let result:
    RelationshipResponse

  try {
    result =
      await response
        .json() as
        RelationshipResponse
  } catch {
    throw new Error(
      'A resposta da integração dos objetivos possui formato inválido.',
    )
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ??
      'Não foi possível relacionar os objetivos à aula.',
    )
  }
}

function LessonObjectivesSummary({
  lesson,
}: {
  lesson: AgendaLesson
}) {
  const {
    relationships,
    loading,
    error,
  } = useLessonObjectives(
    lesson.id,
  )

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-500">
          Carregando objetivos relacionados...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Não foi possível carregar os objetivos relacionados.
        </p>
      </section>
    )
  }

  if (
    relationships.length ===
    0
  ) {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Objetivos
        </p>

        <p className="mt-2 text-sm text-slate-600">
          Nenhum objetivo relacionado a esta aula.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
        Objetivos relacionados
      </p>

      <div className="mt-3 space-y-2">
        {
          relationships.map(
            relationship => {
              const objective =
                relationship.objective

              if (!objective) {
                return null
              }

              return (
                <article
                  key={
                    relationship.id
                  }
                  className="rounded-lg border border-cyan-200 bg-white px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-[#071827]">
                        {
                          objective.title
                        }
                      </p>

                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                        {
                          getObjectiveCategoryLabel(
                            objective.category,
                          )
                        }
                      </p>
                    </div>

                    <span
                      className={[
                        'rounded-full border px-3 py-1',
                        'text-[11px] font-bold',
                        relationship
                          .relationship_role ===
                        'primary'
                          ? 'border-cyan-300 bg-cyan-100 text-[#075F78]'
                          : 'border-slate-200 bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      {
                        relationship
                          .relationship_role ===
                        'primary'
                          ? 'Principal'
                          : 'Apoio'
                      }
                    </span>
                  </div>
                </article>
              )
            },
          )
        }
      </div>
    </section>
  )
}

export function AgendaLessons() {
  const {
    lessons,

    loading,
    mutating,
    error,

    clearError,
    loadLessons,

    createLesson,
    markAsPreparing,
    completeLesson,
    cancelLesson,
    deleteLesson,
  } = useLessons()

  const {
    objectives,

    loading:
      objectivesLoading,

    error:
      objectivesError,

    loadObjectives,
  } = useObjectives()

  const {
    planning,
    loading:
      planningLoading,
  } = usePlanning()

  const [
    form,
    setForm,
  ] = useState<
    LessonFormState
  >(INITIAL_FORM)

  const [
    selection,
    setSelection,
  ] = useState<
    ObjectiveSelectionState
  >(
    INITIAL_OBJECTIVE_SELECTION,
  )

  const [
    objectiveSearch,
    setObjectiveSearch,
  ] = useState('')

  const [
    lessonSearch,
    setLessonSearch,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('')

  const [
    formOpen,
    setFormOpen,
  ] = useState(false)

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    formError,
    setFormError,
  ] = useState<
    string | null
  >(null)

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null)

  const selectableObjectives =
    useMemo(
      () =>
        objectives.filter(
          objective =>
            objective.status !==
              'arquivado' &&
            objective.status !==
              'cancelado',
        ),
      [
        objectives,
      ],
    )

  const filteredObjectiveOptions =
    useMemo(() => {
      const normalizedSearch =
        objectiveSearch
          .trim()
          .toLowerCase()

      if (!normalizedSearch) {
        return selectableObjectives
      }

      return selectableObjectives.filter(
        objective =>
          [
            objective.title,
            objective.description,
            objective.subject,
            objective.period,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(
              normalizedSearch,
            ),
      )
    }, [
      objectiveSearch,
      selectableObjectives,
    ])

  const selectedObjectives =
    useMemo(
      () =>
        selection
          .objectiveIds
          .map(
            objectiveId =>
              objectives.find(
                objective =>
                  objective.id ===
                  objectiveId,
              ),
          )
          .filter(
            (
              objective,
            ): objective is
              AgendaObjective =>
              Boolean(
                objective,
              ),
          ),
      [
        objectives,
        selection.objectiveIds,
      ],
    )

  const filteredLessons =
    useMemo(() => {
      const normalizedSearch =
        lessonSearch
          .trim()
          .toLowerCase()

      return lessons.filter(
        lesson => {
          if (
            statusFilter &&
            lesson.status !==
              statusFilter
          ) {
            return false
          }

          if (!normalizedSearch) {
            return true
          }

          return [
            lesson.title,
            lesson.description,
            lesson.subject,
            lesson.observations,
            lesson.next_action,
            lesson.skills.join(' '),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(
              normalizedSearch,
            )
        },
      )
    }, [
      lessons,
      lessonSearch,
      statusFilter,
    ])

  const plannedCount =
    useMemo(
      () =>
        lessons.filter(
          lesson =>
            lesson.status ===
            'planejada',
        ).length,
      [
        lessons,
      ],
    )

  const preparingCount =
    useMemo(
      () =>
        lessons.filter(
          lesson =>
            lesson.status ===
            'em_preparacao',
        ).length,
      [
        lessons,
      ],
    )

  const completedCount =
    useMemo(
      () =>
        lessons.filter(
          lesson =>
            lesson.status ===
              'realizada' ||
            lesson.status ===
              'parcialmente_realizada',
        ).length,
      [
        lessons,
      ],
    )

  const subjectsCount =
    useMemo(
      () =>
        new Set(
          lessons
            .map(
              lesson =>
                lesson.subject,
            )
            .filter(Boolean),
        ).size,
      [
        lessons,
      ],
    )

  function updateFormField<
    Key extends
      keyof LessonFormState,
  >(
    key: Key,
    value:
      LessonFormState[Key],
  ): void {
    setForm(
      currentForm => ({
        ...currentForm,

        [key]:
          value,
      }),
    )
  }

  function toggleObjective(
    objectiveId: string,
  ): void {
    setSelection(
      currentSelection => {
        const selected =
          currentSelection
            .objectiveIds
            .includes(
              objectiveId,
            )

        if (selected) {
          const remainingIds =
            currentSelection
              .objectiveIds
              .filter(
                currentId =>
                  currentId !==
                  objectiveId,
              )

          return {
            objectiveIds:
              remainingIds,

            primaryObjectiveId:
              currentSelection
                .primaryObjectiveId ===
              objectiveId
                ? remainingIds[0] ??
                  null
                : currentSelection
                    .primaryObjectiveId,
          }
        }

        const nextIds = [
          ...currentSelection
            .objectiveIds,

          objectiveId,
        ]

        return {
          objectiveIds:
            nextIds,

          primaryObjectiveId:
            currentSelection
              .primaryObjectiveId ??
            objectiveId,
        }
      },
    )
  }

  function definePrimaryObjective(
    objectiveId: string,
  ): void {
    setSelection(
      currentSelection => ({
        objectiveIds:
          currentSelection
            .objectiveIds
            .includes(
              objectiveId,
            )
            ? currentSelection
                .objectiveIds
            : [
                ...currentSelection
                  .objectiveIds,

                objectiveId,
              ],

        primaryObjectiveId:
          objectiveId,
      }),
    )
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)
    clearError()

    try {
      const createdLesson =
        await createLesson({
          title:
            form.title,

          description:
            form.description ||
            null,

          subject:
            form.subject ||
            null,

          scheduledDate:
            form.scheduledDate ||
            null,

          startTime:
            form.startTime ||
            null,

          endTime:
            form.endTime ||
            null,

          planningId:
            form.planningId ||
            null,

          skills:
            normalizeSkills(
              form.skills,
            ),

          methodology:
            form.methodology ||
            null,

          resources:
            form.resources ||
            null,

          observations:
            form.observations ||
            null,

          nextAction:
            form.nextAction ||
            null,

          status:
            form.status,

          metadata: {
            source:
              'agenda-lessons-interface',
          },
        })

      if (
        selectedObjectives.length >
        0
      ) {
        await synchronizeLessonObjectives(
          createdLesson.id,

          selectedObjectives,

          selection
            .primaryObjectiveId,

          createdLesson
            .school_id,
        )
      }

      setForm(
        INITIAL_FORM,
      )

      setSelection(
        INITIAL_OBJECTIVE_SELECTION,
      )

      setObjectiveSearch('')
      setFormOpen(false)

      setSuccessMessage(
        selectedObjectives.length >
        0
          ? 'Aula criada e objetivos relacionados com sucesso.'
          : 'Aula criada com sucesso.',
      )

      await loadLessons()
    } catch (
      createError
    ) {
      setFormError(
        createError instanceof
        Error
          ? createError.message
          : 'Não foi possível criar a aula.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePreparing(
    lesson:
      AgendaLesson,
  ): Promise<void> {
    clearError()
    setSuccessMessage(null)

    try {
      await markAsPreparing(
        lesson.id,
      )

      setSuccessMessage(
        'Aula colocada em preparação.',
      )
    } catch {
      // O hook registra o erro.
    }
  }

  async function handleComplete(
    lesson:
      AgendaLesson,
  ): Promise<void> {
    const observations =
      window.prompt(
        'Registre uma observação sobre a realização da aula:',
        lesson.observations ??
        '',
      )

    if (
      observations ===
      null
    ) {
      return
    }

    clearError()
    setSuccessMessage(null)

    try {
      await completeLesson(
        lesson.id,
        {
          observations:
            observations.trim() ||
            null,
        },
      )

      setSuccessMessage(
        'Aula registrada como realizada.',
      )
    } catch {
      // O hook registra o erro.
    }
  }

  async function handleCancel(
    lesson:
      AgendaLesson,
  ): Promise<void> {
    const reason =
      window.prompt(
        'Informe o motivo do cancelamento:',
      )
        ?.trim()

    if (!reason) {
      return
    }

    clearError()
    setSuccessMessage(null)

    try {
      await cancelLesson(
        lesson.id,
        reason,
      )

      setSuccessMessage(
        'Aula cancelada.',
      )
    } catch {
      // O hook registra o erro.
    }
  }

  async function handleDelete(
    lesson:
      AgendaLesson,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        `Deseja excluir a aula “${lesson.title}”?`,
      )

    if (!confirmed) {
      return
    }

    const reason =
      window.prompt(
        'Informe o motivo da exclusão:',
      )
        ?.trim()

    if (!reason) {
      return
    }

    clearError()
    setSuccessMessage(null)

    try {
      await deleteLesson(
        lesson.id,
        reason,
      )

      setSuccessMessage(
        'Aula excluída com sucesso.',
      )
    } catch {
      // O hook registra o erro.
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Execução pedagógica"
      title="Aulas"
      description="Organize aulas, relacione planejamentos e objetivos e registre a execução pedagógica como parte do ciclo operacional do Framework EDI."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo das aulas"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Planejadas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                plannedCount
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Aguardando execução
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Em preparação
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                preparingCount
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Em organização
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Realizadas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                completedCount
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Total ou parcialmente
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Disciplinas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                subjectsCount
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Componentes registrados
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Gestão da execução
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                  Aulas cadastradas
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Crie aulas, relacione objetivos e acompanhe a execução pedagógica.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormOpen(
                    currentValue =>
                      !currentValue,
                  )
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B7491]"
              >
                {
                  formOpen
                    ? 'Fechar cadastro'
                    : 'Nova aula'
                }
              </button>
            </div>
          </header>

          {
            formOpen && (
              <form
                onSubmit={
                  handleSubmit
                }
                className="border-b border-slate-200 bg-slate-50 p-5 sm:p-7"
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="block lg:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Título da aula
                    </span>

                    <input
                      type="text"
                      required
                      maxLength={
                        240
                      }
                      value={
                        form.title
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'title',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Descrição
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        form.description
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'description',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Componente curricular
                    </span>

                    <input
                      type="text"
                      value={
                        form.subject
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'subject',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Status inicial
                    </span>

                    <select
                      value={
                        form.status
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'status',
                            event
                              .target
                              .value as
                              AgendaLessonStatus,
                          )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    >
                      {
                        STATUS_OPTIONS
                          .filter(
                            option =>
                              option.value ===
                                'planejada' ||
                              option.value ===
                                'em_preparacao',
                          )
                          .map(
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
                      Data
                    </span>

                    <input
                      type="date"
                      value={
                        form.scheduledDate
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'scheduledDate',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Início
                      </span>

                      <input
                        type="time"
                        value={
                          form.startTime
                        }
                        onChange={
                          event =>
                            updateFormField(
                              'startTime',
                              event
                                .target
                                .value,
                            )
                        }
                        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Término
                      </span>

                      <input
                        type="time"
                        value={
                          form.endTime
                        }
                        onChange={
                          event =>
                            updateFormField(
                              'endTime',
                              event
                                .target
                                .value,
                            )
                        }
                        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                      />
                    </label>
                  </div>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Planejamento relacionado
                    </span>

                    <select
                      value={
                        form.planningId
                      }
                      disabled={
                        planningLoading
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'planningId',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                    >
                      <option value="">
                        Nenhum planejamento selecionado
                      </option>

                      {
                        planning.map(
                          item => (
                            <option
                              key={
                                item.id
                              }
                              value={
                                item.id
                              }
                            >
                              {
                                item.title
                              }
                            </option>
                          ),
                        )
                      }
                    </select>
                  </label>

                  <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50 lg:col-span-2">
                    <header className="border-b border-cyan-200 px-5 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#075F78]">
                        Integração EDI
                      </p>

                      <h3 className="mt-2 text-lg font-bold text-[#071827]">
                        Objetivos da aula
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Selecione os objetivos trabalhados e identifique um objetivo principal.
                      </p>
                    </header>

                    <div className="p-5">
                      <input
                        type="search"
                        value={
                          objectiveSearch
                        }
                        onChange={
                          event =>
                            setObjectiveSearch(
                              event
                                .target
                                .value,
                            )
                        }
                        placeholder="Pesquisar objetivos"
                        className="w-full rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                      />

                      {
                        objectivesLoading ? (
                          <p className="mt-4 text-sm font-semibold text-slate-500">
                            Carregando objetivos...
                          </p>
                        ) : objectivesError ? (
                          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <p className="text-sm font-semibold text-rose-800">
                              {
                                objectivesError
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                void loadObjectives()
                              }
                              className="mt-3 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-800"
                            >
                              Tentar novamente
                            </button>
                          </div>
                        ) : filteredObjectiveOptions.length ===
                          0 ? (
                          <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600">
                            Nenhum objetivo disponível.
                          </p>
                        ) : (
                          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
                            {
                              filteredObjectiveOptions.map(
                                objective => {
                                  const selected =
                                    selection
                                      .objectiveIds
                                      .includes(
                                        objective.id,
                                      )

                                  const primary =
                                    selection
                                      .primaryObjectiveId ===
                                    objective.id

                                  return (
                                    <article
                                      key={
                                        objective.id
                                      }
                                      className="rounded-xl border border-cyan-200 bg-white p-4"
                                    >
                                      <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                          type="checkbox"
                                          checked={
                                            selected
                                          }
                                          onChange={() =>
                                            toggleObjective(
                                              objective.id,
                                            )
                                          }
                                          className="mt-1 h-4 w-4 accent-[#0B7491]"
                                        />

                                        <span className="min-w-0 flex-1">
                                          <span className="block font-bold text-[#071827]">
                                            {
                                              objective.title
                                            }
                                          </span>

                                          <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                            {
                                              getObjectiveCategoryLabel(
                                                objective.category,
                                              )
                                            }
                                          </span>
                                        </span>
                                      </label>

                                      {
                                        selected && (
                                          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
                                            <input
                                              type="radio"
                                              name="primary-lesson-objective"
                                              checked={
                                                primary
                                              }
                                              onChange={() =>
                                                definePrimaryObjective(
                                                  objective.id,
                                                )
                                              }
                                              className="accent-[#0B7491]"
                                            />

                                            <span className="text-sm font-bold text-[#075F78]">
                                              Objetivo principal
                                            </span>
                                          </label>
                                        )
                                      }
                                    </article>
                                  )
                                },
                              )
                            }
                          </div>
                        )
                      }
                    </div>
                  </section>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Habilidades
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        form.skills
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'skills',
                            event
                              .target
                              .value,
                          )
                      }
                      placeholder="Separe as habilidades por vírgula ou por linha."
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Metodologia
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        form.methodology
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'methodology',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Recursos
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        form.resources
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'resources',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Observações
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        form.observations
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'observations',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Próxima ação
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        form.nextAction
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'nextAction',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>
                </div>

                {
                  formError && (
                    <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                      {
                        formError
                      }
                    </div>
                  )
                }

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(
                        INITIAL_FORM,
                      )

                      setSelection(
                        INITIAL_OBJECTIVE_SELECTION,
                      )

                      setFormOpen(
                        false,
                      )
                    }}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      mutating
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {
                      submitting
                        ? 'Salvando...'
                        : 'Salvar aula'
                    }
                  </button>
                </div>
              </form>
            )
          }

          <div className="border-b border-slate-200 p-5 sm:p-7">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_auto]">
              <input
                type="search"
                value={
                  lessonSearch
                }
                onChange={
                  event =>
                    setLessonSearch(
                      event
                        .target
                        .value,
                    )
                }
                placeholder="Pesquisar aulas"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
              />

              <select
                value={
                  statusFilter
                }
                onChange={
                  event =>
                    setStatusFilter(
                      event
                        .target
                        .value,
                    )
                }
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">
                  Todos os status
                </option>

                {
                  STATUS_OPTIONS.map(
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

              <button
                type="button"
                onClick={() =>
                  void loadLessons()
                }
                disabled={
                  loading
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-bold text-[#075F78] transition hover:bg-cyan-100 disabled:opacity-60"
              >
                Atualizar
              </button>
            </div>
          </div>

          {
            error && (
              <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800 sm:px-7">
                {
                  error
                }
              </div>
            )
          }

          {
            successMessage && (
              <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 sm:px-7">
                {
                  successMessage
                }
              </div>
            )
          }

          {
            loading ? (
              <div className="p-8 text-center text-sm font-semibold text-slate-500">
                Carregando aulas...
              </div>
            ) : filteredLessons.length ===
              0 ? (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-[#071827]">
                  Nenhuma aula encontrada
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Cadastre uma aula ou ajuste os filtros.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:p-7 xl:grid-cols-2">
                {
                  filteredLessons.map(
                    (
                      lesson,
                      index,
                    ) => (
                      <article
                        key={
                          lesson.id
                        }
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                      >
                        <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-bold text-[#0B7491]">
                                A
                                {
                                  String(
                                    index +
                                      1,
                                  ).padStart(
                                    2,
                                    '0',
                                  )
                                }
                              </p>

                              <h3 className="mt-2 break-words text-xl font-bold leading-7 text-[#071827]">
                                {
                                  lesson.title
                                }
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                {
                                  lesson.subject ||
                                  'Componente não informado'
                                }
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${getStatusClasses(
                                lesson.status,
                              )}`}
                            >
                              {
                                getStatusLabel(
                                  lesson.status,
                                )
                              }
                            </span>
                          </div>
                        </header>

                        <div className="space-y-4 p-5">
                          {
                            lesson.description && (
                              <p className="text-sm leading-6 text-slate-600">
                                {
                                  lesson.description
                                }
                              </p>
                            )
                          }

                          <div className="grid gap-3 sm:grid-cols-2">
                            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Data
                              </p>

                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                {
                                  formatDate(
                                    lesson.scheduled_date,
                                  )
                                }
                              </p>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Horário
                              </p>

                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                {
                                  buildTimeRange(
                                    lesson.start_time,
                                    lesson.end_time,
                                  )
                                }
                              </p>
                            </section>
                          </div>

                          <LessonObjectivesSummary
                            lesson={
                              lesson
                            }
                          />

                          {
                            lesson.skills.length >
                              0 && (
                              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                  Habilidades
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {
                                    lesson.skills.map(
                                      skill => (
                                        <span
                                          key={
                                            skill
                                          }
                                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                                        >
                                          {
                                            skill
                                          }
                                        </span>
                                      ),
                                    )
                                  }
                                </div>
                              </section>
                            )
                          }

                          {
                            lesson.next_action && (
                              <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
                                  Próxima ação
                                </p>

                                <p className="mt-2 text-sm leading-6 text-cyan-950">
                                  {
                                    lesson.next_action
                                  }
                                </p>
                              </section>
                            )
                          }

                          <div className="grid gap-3 sm:grid-cols-2">
                            {
                              lesson.status ===
                                'planejada' && (
                                <button
                                  type="button"
                                  disabled={
                                    mutating
                                  }
                                  onClick={() =>
                                    void handlePreparing(
                                      lesson,
                                    )
                                  }
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-[#075F78] transition hover:bg-cyan-100 disabled:opacity-60"
                                >
                                  Iniciar preparação
                                </button>
                              )
                            }

                            {
                              lesson.status !==
                                'realizada' &&
                              lesson.status !==
                                'cancelada' && (
                                <button
                                  type="button"
                                  disabled={
                                    mutating
                                  }
                                  onClick={() =>
                                    void handleComplete(
                                      lesson,
                                    )
                                  }
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  Marcar realizada
                                </button>
                              )
                            }

                            <Link
                              href={`/agenda/evidencias?source=lesson&id=${encodeURIComponent(
                                lesson.id,
                              )}`}
                              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100"
                            >
                              Registrar evidência
                            </Link>

                            {
                              lesson.status !==
                                'realizada' &&
                              lesson.status !==
                                'cancelada' && (
                                <button
                                  type="button"
                                  disabled={
                                    mutating
                                  }
                                  onClick={() =>
                                    void handleCancel(
                                      lesson,
                                    )
                                  }
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                                >
                                  Cancelar aula
                                </button>
                              )
                            }

                            <button
                              type="button"
                              disabled={
                                mutating
                              }
                              onClick={() =>
                                void handleDelete(
                                  lesson,
                                )
                              }
                              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </article>
                    ),
                  )
                }
              </div>
            )
          }
        </section>

        <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
          <header className="border-b border-white/10 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Fluxo EDI
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Ciclo da aula
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              A aula passa a ser uma unidade rastreável entre planejamento, objetivos, execução e evidências.
            </p>
          </header>

          <div className="grid divide-y divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {
              LESSON_FLOW.map(
                step => (
                  <article
                    key={
                      step.code
                    }
                    className="px-5 py-5 sm:px-7"
                  >
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {
                        step.code
                      }
                    </span>

                    <h3 className="mt-3 font-bold">
                      {
                        step.label
                      }
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {
                        step.description
                      }
                    </p>
                  </article>
                ),
              )
            }
          </div>
        </aside>
      </div>
    </AgendaPageShell>
  )
}
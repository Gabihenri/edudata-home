'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import {
  useObjectives,
} from '@/lib/agenda/hooks/useObjectives'

import {
  usePlanning,
} from '@/lib/agenda/hooks/usePlanning'

import {
  usePlanningObjectives,
} from '@/lib/agenda/hooks/usePlanningObjectives'

import type {
  AgendaObjective,
} from '@/lib/agenda/repository/objectives.repository'

import type {
  AgendaPlanning,
} from '@/lib/agenda/repository/planning.repository'

type PlanningFormState = {
  title: string
  description: string

  subject: string
  className: string

  methodology: string
  resources: string
  evaluation: string

  plannedDate: string
}

type PlanningObjectiveSelectionState = {
  objectiveIds: string[]
  primaryObjectiveId: string | null
}

type SynchronizeObjectivesResponse = {
  success: boolean
  error?: string
}

const INITIAL_FORM:
  PlanningFormState = {
    title: '',
    description: '',

    subject: '',
    className: '',

    methodology: '',
    resources: '',
    evaluation: '',

    plannedDate: '',
  }

const INITIAL_OBJECTIVE_SELECTION:
  PlanningObjectiveSelectionState = {
    objectiveIds: [],
    primaryObjectiveId:
      null,
  }

function formatDate(
  date: string | null,
): string {
  if (!date) {
    return 'Não informada'
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

function getObjectiveStatusLabel(
  status: string,
): string {
  if (
    status ===
    'em_acompanhamento'
  ) {
    return 'Em acompanhamento'
  }

  if (
    status ===
    'concluido'
  ) {
    return 'Concluído'
  }

  if (
    status ===
    'rascunho'
  ) {
    return 'Rascunho'
  }

  if (
    status ===
    'ativo'
  ) {
    return 'Ativo'
  }

  if (
    status ===
    'suspenso'
  ) {
    return 'Suspenso'
  }

  if (
    status ===
    'cancelado'
  ) {
    return 'Cancelado'
  }

  if (
    status ===
    'arquivado'
  ) {
    return 'Arquivado'
  }

  return status
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

function buildLegacyObjectiveText(
  objectives:
    AgendaObjective[],
): string | null {
  if (
    objectives.length ===
    0
  ) {
    return null
  }

  return objectives
    .map(
      objective =>
        objective.title,
    )
    .join('; ')
}

async function synchronizePlanningObjectives(
  planningId: string,

  selectedObjectives:
    AgendaObjective[],

  primaryObjectiveId:
    string | null,

  schoolId:
    string | null,
): Promise<void> {
  const response =
    await fetch(
      `/api/agenda/planning/${encodeURIComponent(planningId)}/objectives`,
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
                      'agenda-planning-form',
                  },
                }),
              ),

            schoolId,
          }),
      },
    )

  let result:
    SynchronizeObjectivesResponse

  try {
    result =
      await response
        .json() as
        SynchronizeObjectivesResponse
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
      'Não foi possível vincular os objetivos ao planejamento.',
    )
  }
}

function PlanningObjectivesSummary({
  planning,
}: {
  planning: AgendaPlanning
}) {
  const {
    relationships,
    loading,
    error,
  } = usePlanningObjectives(
    planning.id,
  )

  if (loading) {
    return (
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-500">
          Carregando objetivos relacionados...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Não foi possível carregar os objetivos relacionados.
        </p>

        {
          planning.objective && (
            <p className="mt-2 text-sm leading-6 text-amber-950">
              <strong>
                Registro legado:
              </strong>{' '}
              {
                planning.objective
              }
            </p>
          )
        }
      </section>
    )
  }

  if (
    relationships.length ===
    0
  ) {
    if (
      !planning.objective
    ) {
      return null
    }

    return (
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Objetivo registrado anteriormente
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {
            planning.objective
          }
        </p>
      </section>
    )
  }

  return (
    <section className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
        Objetivos relacionados
      </p>

      <div className="mt-3 space-y-3">
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
                  className="rounded-xl border border-cyan-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[#071827]">
                        {
                          objective.title
                        }
                      </p>

                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                        {
                          getObjectiveCategoryLabel(
                            objective.category,
                          )
                        }
                        {' · '}
                        {
                          getObjectiveStatusLabel(
                            objective.status,
                          )
                        }
                      </p>
                    </div>

                    <span
                      className={[
                        'inline-flex rounded-full border px-3 py-1',
                        'text-xs font-bold',
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

                  {
                    objective.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {
                          objective.description
                        }
                      </p>
                    )
                  }
                </article>
              )
            },
          )
        }
      </div>
    </section>
  )
}

export function AgendaPlanning() {
  const {
    planning,
    loading,
    error,

    reload,
    createPlanning,
  } = usePlanning()

  const {
    objectives,
    loading:
      objectivesLoading,

    error:
      objectivesError,

    loadObjectives,
  } = useObjectives()

  const [
    form,
    setForm,
  ] = useState<
    PlanningFormState
  >(INITIAL_FORM)

  const [
    objectiveSelection,
    setObjectiveSelection,
  ] = useState<
    PlanningObjectiveSelectionState
  >(
    INITIAL_OBJECTIVE_SELECTION,
  )

  const [
    objectiveSearch,
    setObjectiveSearch,
  ] = useState('')

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

  const filteredObjectives =
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
      selectableObjectives,
      objectiveSearch,
    ])

  const selectedObjectives =
    useMemo(
      () =>
        objectiveSelection
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
        objectiveSelection
          .objectiveIds,
      ],
    )

  function updateFormField<
    Key extends
      keyof PlanningFormState,
  >(
    key: Key,
    value:
      PlanningFormState[Key],
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
    setObjectiveSelection(
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
    setObjectiveSelection(
      currentSelection => {
        const objectiveIds =
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
              ]

        return {
          objectiveIds,

          primaryObjectiveId:
            objectiveId,
        }
      },
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

    try {
      const createdPlanning =
        await createPlanning({
          title:
            form.title,

          description:
            form.description ||
            null,

          subject:
            form.subject ||
            null,

          class_name:
            form.className ||
            null,

          /*
           * Compatibilidade temporária:
           * os títulos também permanecem
           * no campo legado.
           */
          objective:
            buildLegacyObjectiveText(
              selectedObjectives,
            ),

          methodology:
            form.methodology ||
            null,

          resources:
            form.resources ||
            null,

          evaluation:
            form.evaluation ||
            null,

          planned_date:
            form.plannedDate ||
            null,

          status:
            'rascunho',
        })

      if (
        selectedObjectives.length >
        0
      ) {
        await synchronizePlanningObjectives(
          createdPlanning.id,

          selectedObjectives,

          objectiveSelection
            .primaryObjectiveId,

          createdPlanning
            .school_id,
        )
      }

      setForm(
        INITIAL_FORM,
      )

      setObjectiveSelection(
        INITIAL_OBJECTIVE_SELECTION,
      )

      setObjectiveSearch('')

      setSuccessMessage(
        selectedObjectives.length >
        0
          ? 'Planejamento criado e objetivos vinculados com sucesso.'
          : 'Planejamento criado com sucesso.',
      )

      await reload()
    } catch (
      createError
    ) {
      setFormError(
        createError instanceof
        Error
          ? createError.message
          : 'Não foi possível criar o planejamento.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Planejamento pedagógico
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Organize objetivos, metodologias, recursos, avaliações e datas utilizando dados persistidos no Supabase.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={
              handleSubmit
            }
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-950">
              Novo planejamento
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="planning-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Título
                </label>

                <input
                  id="planning-title"
                  type="text"
                  required
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
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="planning-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Descrição
                </label>

                <textarea
                  id="planning-description"
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
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="planning-subject"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Disciplina
                  </label>

                  <input
                    id="planning-subject"
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
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="planning-class"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Turma
                  </label>

                  <input
                    id="planning-class"
                    type="text"
                    value={
                      form.className
                    }
                    onChange={
                      event =>
                        updateFormField(
                          'className',
                          event
                            .target
                            .value,
                        )
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                  />
                </div>
              </div>

              <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50">
                <header className="border-b border-cyan-200 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#075F78]">
                    Integração EDI
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-[#071827]">
                    Objetivos relacionados
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Selecione um ou mais objetivos já cadastrados. Apenas um deles poderá ser definido como principal.
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
                    ) : filteredObjectives.length ===
                      0 ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Nenhum objetivo disponível.
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Cadastre primeiro um objetivo no módulo Objetivos.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
                        {
                          filteredObjectives.map(
                            objective => {
                              const selected =
                                objectiveSelection
                                  .objectiveIds
                                  .includes(
                                    objective.id,
                                  )

                              const primary =
                                objectiveSelection
                                  .primaryObjectiveId ===
                                objective.id

                              return (
                                <article
                                  key={
                                    objective.id
                                  }
                                  className={[
                                    'rounded-xl border p-4 transition',
                                    selected
                                      ? 'border-cyan-300 bg-white'
                                      : 'border-slate-200 bg-white/70',
                                  ].join(' ')}
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
                                        {' · '}
                                        {
                                          getObjectiveStatusLabel(
                                            objective.status,
                                          )
                                        }
                                      </span>

                                      {
                                        objective.description && (
                                          <span className="mt-2 block text-sm leading-6 text-slate-600">
                                            {
                                              objective.description
                                            }
                                          </span>
                                        )
                                      }
                                    </span>
                                  </label>

                                  {
                                    selected && (
                                      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
                                        <input
                                          type="radio"
                                          name="primary-planning-objective"
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
                                          Definir como objetivo principal
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

                  {
                    selectedObjectives.length >
                      0 && (
                      <div className="mt-4 rounded-xl border border-cyan-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
                          Seleção atual
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {
                            selectedObjectives.length
                          } objetivo
                          {
                            selectedObjectives.length ===
                            1
                              ? ''
                              : 's'
                          } selecionado
                          {
                            selectedObjectives.length ===
                            1
                              ? ''
                              : 's'
                          }.
                        </p>
                      </div>
                    )
                  }
                </div>
              </section>

              <div>
                <label
                  htmlFor="planning-methodology"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Metodologia
                </label>

                <textarea
                  id="planning-methodology"
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
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="planning-resources"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Recursos
                </label>

                <textarea
                  id="planning-resources"
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
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="planning-evaluation"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Avaliação
                </label>

                <textarea
                  id="planning-evaluation"
                  rows={
                    3
                  }
                  value={
                    form.evaluation
                  }
                  onChange={
                    event =>
                      updateFormField(
                        'evaluation',
                        event
                          .target
                          .value,
                      )
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="planning-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Data planejada
                </label>

                <input
                  id="planning-date"
                  type="date"
                  value={
                    form.plannedDate
                  }
                  onChange={
                    event =>
                      updateFormField(
                        'plannedDate',
                        event
                          .target
                          .value,
                      )
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>
            </div>

            {
              formError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {
                    formError
                  }
                </div>
              )
            }

            {
              successMessage && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  {
                    successMessage
                  }
                </div>
              )
            }

            <button
              type="submit"
              disabled={
                submitting
              }
              className="mt-6 w-full rounded-full bg-[#5C1A8C] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {
                submitting
                  ? 'Salvando...'
                  : 'Criar planejamento'
              }
            </button>
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">
                Planejamentos cadastrados
              </h2>

              <button
                type="button"
                onClick={() =>
                  void reload()
                }
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Atualizar
              </button>
            </div>

            {
              loading && (
                <p className="mt-8 text-slate-600">
                  Carregando planejamentos...
                </p>
              )
            }

            {
              error && (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                  {
                    error
                  }
                </div>
              )
            }

            {
              !loading &&
              !error &&
              planning.length ===
                0 && (
                <p className="mt-8 text-slate-500">
                  Nenhum planejamento cadastrado.
                </p>
              )
            }

            <div className="mt-8 space-y-5">
              {
                planning.map(
                  item => (
                    <article
                      key={
                        item.id
                      }
                      className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                            {
                              item.status
                            }
                          </p>

                          <h3 className="mt-3 text-xl font-bold text-slate-950">
                            {
                              item.title
                            }
                          </h3>
                        </div>

                        {
                          item.planned_date && (
                            <span className="rounded-full bg-[#081C2E] px-4 py-2 text-xs font-bold text-white">
                              {
                                formatDate(
                                  item.planned_date,
                                )
                              }
                            </span>
                          )
                        }
                      </div>

                      {
                        item.description && (
                          <p className="mt-4 leading-7 text-slate-600">
                            {
                              item.description
                            }
                          </p>
                        )
                      }

                      <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                        <p>
                          <strong>
                            Disciplina:
                          </strong>{' '}
                          {
                            item.subject ??
                            'Não informada'
                          }
                        </p>

                        <p>
                          <strong>
                            Turma:
                          </strong>{' '}
                          {
                            item.class_name ??
                            'Não informada'
                          }
                        </p>
                      </div>

                      <PlanningObjectivesSummary
                        planning={
                          item
                        }
                      />
                    </article>
                  ),
                )
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
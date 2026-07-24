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
  useObjectives,
} from '@/lib/agenda/hooks/useObjectives'

import type {
  AgendaObjective,
  AgendaObjectiveCategory,
  AgendaObjectiveStatus,
} from '@/lib/agenda/repository/objectives.repository'

type ObjectiveFormState = {
  title: string
  description: string

  category:
    AgendaObjectiveCategory

  period: string
  subject: string

  expectedIndicator: string
  expectedEvidence: string

  startDate: string
  endDate: string

  status:
    AgendaObjectiveStatus

  progress: string
}

const INITIAL_FORM:
  ObjectiveFormState = {
    title: '',
    description: '',

    category:
      'pedagogico',

    period: '',
    subject: '',

    expectedIndicator: '',
    expectedEvidence: '',

    startDate: '',
    endDate: '',

    status:
      'rascunho',

    progress:
      '0',
  }

const CATEGORY_OPTIONS: Array<{
  value: AgendaObjectiveCategory
  label: string
}> = [
  {
    value:
      'pedagogico',
    label:
      'Pedagógico',
  },
  {
    value:
      'engajamento',
    label:
      'Engajamento',
  },
  {
    value:
      'gestao',
    label:
      'Gestão',
  },
  {
    value:
      'formacao',
    label:
      'Formação',
  },
  {
    value:
      'inclusao',
    label:
      'Inclusão',
  },
  {
    value:
      'desenvolvimento',
    label:
      'Desenvolvimento',
  },
]

const STATUS_OPTIONS: Array<{
  value: AgendaObjectiveStatus
  label: string
}> = [
  {
    value:
      'rascunho',
    label:
      'Rascunho',
  },
  {
    value:
      'ativo',
    label:
      'Ativo',
  },
  {
    value:
      'em_acompanhamento',
    label:
      'Em acompanhamento',
  },
  {
    value:
      'concluido',
    label:
      'Concluído',
  },
  {
    value:
      'suspenso',
    label:
      'Suspenso',
  },
  {
    value:
      'cancelado',
    label:
      'Cancelado',
  },
  {
    value:
      'arquivado',
    label:
      'Arquivado',
  },
]

const OBJECTIVE_CYCLE = [
  {
    code:
      '01',
    label:
      'Definir',
    description:
      'Estabelecer uma intenção clara, contextualizada e alcançável.',
  },
  {
    code:
      '02',
    label:
      'Relacionar',
    description:
      'Conectar o objetivo a turmas, planejamentos, ações e responsáveis.',
  },
  {
    code:
      '03',
    label:
      'Evidenciar',
    description:
      'Determinar quais registros poderão demonstrar evolução.',
  },
  {
    code:
      '04',
    label:
      'Analisar',
    description:
      'Revisar os resultados e orientar as decisões seguintes.',
  },
]

function getCategoryLabel(
  category:
    AgendaObjectiveCategory,
): string {
  return CATEGORY_OPTIONS
    .find(
      option =>
        option.value ===
        category,
    )
    ?.label ??
    category
}

function getStatusLabel(
  status:
    AgendaObjectiveStatus,
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

function getCategoryClasses(
  category:
    AgendaObjectiveCategory,
): string {
  if (
    category ===
    'pedagogico'
  ) {
    return [
      'border-cyan-200',
      'bg-cyan-50',
      'text-[#075F78]',
    ].join(' ')
  }

  if (
    category ===
    'engajamento'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    category ===
    'gestao'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-800',
    ].join(' ')
  }

  if (
    category ===
    'formacao'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-800',
    ].join(' ')
  }

  if (
    category ===
    'inclusao'
  ) {
    return [
      'border-violet-200',
      'bg-violet-50',
      'text-violet-800',
    ].join(' ')
  }

  return [
    'border-slate-200',
    'bg-slate-50',
    'text-slate-700',
  ].join(' ')
}

function getStatusClasses(
  status:
    AgendaObjectiveStatus,
): string {
  if (
    status ===
    'concluido'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    status ===
      'ativo' ||
    status ===
      'em_acompanhamento'
  ) {
    return [
      'border-cyan-200',
      'bg-cyan-50',
      'text-[#075F78]',
    ].join(' ')
  }

  if (
    status ===
      'suspenso' ||
    status ===
      'cancelado'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-800',
    ].join(' ')
  }

  if (
    status ===
    'arquivado'
  ) {
    return [
      'border-slate-300',
      'bg-slate-100',
      'text-slate-700',
    ].join(' ')
  }

  return [
    'border-amber-200',
    'bg-amber-50',
    'text-amber-800',
  ].join(' ')
}

function formatDate(
  date: string | null,
): string {
  if (!date) {
    return 'Não informado'
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

function normalizeProgress(
  value: string,
): number {
  const parsedValue =
    Number(value)

  if (
    !Number.isFinite(
      parsedValue,
    )
  ) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      parsedValue,
    ),
  )
}

function getRelatedModule(
  objective:
    AgendaObjective,
): {
  label: string
  href: string
} {
  if (
    objective.expected_evidence
  ) {
    return {
      label:
        'Evidências',
      href:
        '/agenda/evidencias',
    }
  }

  if (
    objective.expected_indicator
  ) {
    return {
      label:
        'Indicadores',
      href:
        '/agenda/indicadores',
    }
  }

  return {
    label:
      'Planejamento',
    href:
      '/agenda/planejamento',
  }
}

export function AgendaGoals() {
  const {
    objectives,

    loading,
    mutating,
    error,

    clearError,
    loadObjectives,

    createObjective,
    updateProgress,
    changeStatus,
    deleteObjective,
  } = useObjectives()

  const [
    form,
    setForm,
  ] = useState<
    ObjectiveFormState
  >(INITIAL_FORM)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    categoryFilter,
    setCategoryFilter,
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
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null)

  const filteredObjectives =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase()

      return objectives.filter(
        objective => {
          if (
            categoryFilter &&
            objective.category !==
              categoryFilter
          ) {
            return false
          }

          if (
            statusFilter &&
            objective.status !==
              statusFilter
          ) {
            return false
          }

          if (
            !normalizedSearch
          ) {
            return true
          }

          const searchableContent =
            [
              objective.title,
              objective.description,
              objective.subject,
              objective.period,
              objective.expected_indicator,
              objective.expected_evidence,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()

          return searchableContent
            .includes(
              normalizedSearch,
            )
        },
      )
    }, [
      objectives,
      search,
      categoryFilter,
      statusFilter,
    ])

  const categories =
    useMemo(
      () =>
        new Set(
          objectives.map(
            objective =>
              objective.category,
          ),
        ).size,
      [
        objectives,
      ],
    )

  const activeObjectives =
    useMemo(
      () =>
        objectives.filter(
          objective =>
            objective.status ===
              'ativo' ||
            objective.status ===
              'em_acompanhamento',
        ).length,
      [
        objectives,
      ],
    )

  const averageProgress =
    useMemo(() => {
      if (
        objectives.length ===
        0
      ) {
        return 0
      }

      const total =
        objectives.reduce(
          (
            accumulator,
            objective,
          ) =>
            accumulator +
            Number(
              objective.progress ??
              0,
            ),
          0,
        )

      return Math.round(
        total /
          objectives.length,
      )
    }, [
      objectives,
    ])

  function updateFormField<
    Key extends
      keyof ObjectiveFormState,
  >(
    key: Key,
    value:
      ObjectiveFormState[Key],
  ): void {
    setForm(
      currentForm => ({
        ...currentForm,
        [key]:
          value,
      }),
    )
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    clearError()
    setSuccessMessage(null)

    try {
      await createObjective({
        title:
          form.title,

        description:
          form.description ||
          null,

        category:
          form.category,

        period:
          form.period ||
          null,

        subject:
          form.subject ||
          null,

        expected_indicator:
          form.expectedIndicator ||
          null,

        expected_evidence:
          form.expectedEvidence ||
          null,

        start_date:
          form.startDate ||
          null,

        end_date:
          form.endDate ||
          null,

        status:
          form.status,

        progress:
          normalizeProgress(
            form.progress,
          ),
      })

      setForm(
        INITIAL_FORM,
      )

      setFormOpen(false)

      setSuccessMessage(
        'Objetivo criado com sucesso.',
      )
    } catch {
      // O hook já registra o erro.
    }
  }

  async function handleProgressChange(
    objective:
      AgendaObjective,

    value: string,
  ): Promise<void> {
    clearError()
    setSuccessMessage(null)

    try {
      await updateProgress(
        objective.id,
        normalizeProgress(
          value,
        ),
      )

      setSuccessMessage(
        'Progresso atualizado com sucesso.',
      )
    } catch {
      // O hook já registra o erro.
    }
  }

  async function handleStatusChange(
    objective:
      AgendaObjective,

    status:
      AgendaObjectiveStatus,
  ): Promise<void> {
    clearError()
    setSuccessMessage(null)

    try {
      await changeStatus(
        objective.id,
        status,
      )

      setSuccessMessage(
        'Status atualizado com sucesso.',
      )
    } catch {
      // O hook já registra o erro.
    }
  }

  async function handleDelete(
    objective:
      AgendaObjective,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        `Deseja excluir o objetivo “${objective.title}”?`,
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
      await deleteObjective(
        objective.id,
        reason,
      )

      setSuccessMessage(
        'Objetivo excluído com sucesso.',
      )
    } catch {
      // O hook já registra o erro.
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Direção e acompanhamento"
      title="Objetivos"
      description="Organize intenções pedagógicas, metas de desenvolvimento e direções de acompanhamento relacionadas às evidências, à inclusão e à inteligência educacional."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo dos objetivos"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Objetivos
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                objectives.length
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Registros cadastrados
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Categorias
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                categories
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Eixos utilizados
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Em andamento
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                activeObjectives
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Ativos ou acompanhados
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Progresso médio
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                averageProgress
              }
              %
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Evolução registrada
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Gestão operacional
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                  Objetivos cadastrados
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Cadastre, acompanhe e relacione objetivos a indicadores, evidências e planejamentos.
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
                    : 'Novo objetivo'
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
                      Título
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
                      placeholder="Ex.: Ampliar a participação dos estudantes"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Descrição
                    </span>

                    <textarea
                      rows={
                        4
                      }
                      maxLength={
                        5000
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
                      placeholder="Descreva a finalidade e o contexto do objetivo."
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Categoria
                    </span>

                    <select
                      value={
                        form.category
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'category',
                            event
                              .target
                              .value as
                              AgendaObjectiveCategory,
                          )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    >
                      {
                        CATEGORY_OPTIONS.map(
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
                              AgendaObjectiveStatus,
                          )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                    >
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
                      placeholder="Ex.: Física"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Período
                    </span>

                    <input
                      type="text"
                      value={
                        form.period
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'period',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                      placeholder="Ex.: 2º bimestre"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Data inicial
                    </span>

                    <input
                      type="date"
                      value={
                        form.startDate
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'startDate',
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
                      Data final
                    </span>

                    <input
                      type="date"
                      value={
                        form.endDate
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'endDate',
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
                      Indicador esperado
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        form.expectedIndicator
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'expectedIndicator',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                      placeholder="Descreva o indicador que permitirá acompanhar a evolução."
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Evidência esperada
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        form.expectedEvidence
                      }
                      onChange={
                        event =>
                          updateFormField(
                            'expectedEvidence',
                            event
                              .target
                              .value,
                          )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                      placeholder="Indique quais registros poderão demonstrar a evolução."
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(
                        INITIAL_FORM,
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
                      mutating
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {
                      mutating
                        ? 'Salvando...'
                        : 'Salvar objetivo'
                    }
                  </button>
                </div>
              </form>
            )
          }

          <div className="border-b border-slate-200 p-5 sm:p-7">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
              <label className="block">
                <span className="sr-only">
                  Pesquisar objetivos
                </span>

                <input
                  type="search"
                  value={
                    search
                  }
                  onChange={
                    event =>
                      setSearch(
                        event
                          .target
                          .value,
                      )
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                  placeholder="Pesquisar por título, descrição ou disciplina"
                />
              </label>

              <label className="block">
                <span className="sr-only">
                  Filtrar por categoria
                </span>

                <select
                  value={
                    categoryFilter
                  }
                  onChange={
                    event =>
                      setCategoryFilter(
                        event
                          .target
                          .value,
                      )
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">
                    Todas as categorias
                  </option>

                  {
                    CATEGORY_OPTIONS.map(
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
                <span className="sr-only">
                  Filtrar por status
                </span>

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
              </label>

              <button
                type="button"
                onClick={() =>
                  void loadObjectives()
                }
                disabled={
                  loading
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-bold text-[#075F78] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Atualizar
              </button>
            </div>
          </div>

          {
            error && (
              <div
                role="alert"
                className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800 sm:px-7"
              >
                {
                  error
                }
              </div>
            )
          }

          {
            successMessage && (
              <div
                role="status"
                className="border-b border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 sm:px-7"
              >
                {
                  successMessage
                }
              </div>
            )
          }

          {
            loading ? (
              <div className="p-8 text-center text-sm font-semibold text-slate-500">
                Carregando objetivos...
              </div>
            ) : filteredObjectives.length ===
              0 ? (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-[#071827]">
                  Nenhum objetivo encontrado
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Cadastre um novo objetivo ou ajuste os filtros de pesquisa.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:p-7 xl:grid-cols-2">
                {
                  filteredObjectives.map(
                    (
                      objective,
                      index,
                    ) => {
                      const relatedModule =
                        getRelatedModule(
                          objective,
                        )

                      const progress =
                        Number(
                          objective.progress ??
                          0,
                        )

                      return (
                        <article
                          key={
                            objective.id
                          }
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                                    O
                                    {
                                      String(
                                        index +
                                          1,
                                      )
                                        .padStart(
                                          2,
                                          '0',
                                        )
                                    }
                                  </span>

                                  <span
                                    className={`inline-flex rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${getCategoryClasses(
                                      objective.category,
                                    )}`}
                                  >
                                    {
                                      getCategoryLabel(
                                        objective.category,
                                      )
                                    }
                                  </span>

                                  <span
                                    className={`inline-flex rounded-lg border px-3 py-1 text-xs font-bold ${getStatusClasses(
                                      objective.status,
                                    )}`}
                                  >
                                    {
                                      getStatusLabel(
                                        objective.status,
                                      )
                                    }
                                  </span>
                                </div>

                                <h3 className="mt-3 break-words text-xl font-bold leading-7 text-[#071827]">
                                  {
                                    objective.title
                                  }
                                </h3>

                                {
                                  objective.subject && (
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                      {
                                        objective.subject
                                      }
                                    </p>
                                  )
                                }
                              </div>
                            </div>
                          </header>

                          <div className="space-y-5 p-5">
                            <p className="text-sm leading-6 text-slate-600">
                              {
                                objective.description ||
                                'Nenhuma descrição informada.'
                              }
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                  Período
                                </p>

                                <p className="mt-2 text-sm font-semibold text-slate-700">
                                  {
                                    objective.period ||
                                    'Não informado'
                                  }
                                </p>
                              </section>

                              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                  Prazo
                                </p>

                                <p className="mt-2 text-sm font-semibold text-slate-700">
                                  {
                                    formatDate(
                                      objective.start_date,
                                    )
                                  }
                                  {' — '}
                                  {
                                    formatDate(
                                      objective.end_date,
                                    )
                                  }
                                </p>
                              </section>
                            </div>

                            {
                              objective.expected_indicator && (
                                <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-800">
                                    Indicador esperado
                                  </p>

                                  <p className="mt-2 text-sm leading-6 text-blue-950">
                                    {
                                      objective.expected_indicator
                                    }
                                  </p>
                                </section>
                              )
                            }

                            {
                              objective.expected_evidence && (
                                <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
                                    Evidência esperada
                                  </p>

                                  <p className="mt-2 text-sm leading-6 text-[#073B4C]">
                                    {
                                      objective.expected_evidence
                                    }
                                  </p>
                                </section>
                              )
                            }

                            <section>
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                  Progresso
                                </p>

                                <p className="text-sm font-bold text-[#071827]">
                                  {
                                    progress
                                  }
                                  %
                                </p>
                              </div>

                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-[#0B7491] transition-all"
                                  style={{
                                    width:
                                      `${progress}%`,
                                  }}
                                />
                              </div>

                              <input
                                type="range"
                                min={
                                  0
                                }
                                max={
                                  100
                                }
                                step={
                                  5
                                }
                                defaultValue={
                                  progress
                                }
                                disabled={
                                  mutating
                                }
                                onChange={
                                  event => {
                                    const progressBar =
                                      event
                                        .currentTarget
                                        .previousElementSibling
                                        ?.firstElementChild as
                                        HTMLElement |
                                        null

                                    if (
                                      progressBar
                                    ) {
                                      progressBar.style.width =
                                        `${event.target.value}%`
                                    }
                                  }
                                }
                                onMouseUp={
                                  event =>
                                    void handleProgressChange(
                                      objective,
                                      event
                                        .currentTarget
                                        .value,
                                    )
                                }
                                onTouchEnd={
                                  event =>
                                    void handleProgressChange(
                                      objective,
                                      event
                                        .currentTarget
                                        .value,
                                    )
                                }
                                className="mt-4 w-full accent-[#0B7491]"
                              />
                            </section>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                Status
                              </span>

                              <select
                                value={
                                  objective.status
                                }
                                disabled={
                                  mutating
                                }
                                onChange={
                                  event =>
                                    void handleStatusChange(
                                      objective,
                                      event
                                        .target
                                        .value as
                                        AgendaObjectiveStatus,
                                    )
                                }
                                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#071827] outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
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
                            </label>

                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                              <Link
                                href={
                                  relatedModule.href
                                }
                                className="inline-flex min-h-11 items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-[#075F78] transition hover:border-[#0B7491] hover:bg-cyan-100"
                              >
                                <span>
                                  Acessar{' '}
                                  {
                                    relatedModule.label
                                  }
                                </span>

                                <span
                                  aria-hidden="true"
                                >
                                  →
                                </span>
                              </Link>

                              <button
                                type="button"
                                disabled={
                                  mutating
                                }
                                onClick={() =>
                                  void handleDelete(
                                    objective,
                                  )
                                }
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    },
                  )
                }
              </div>
            )
          }
        </section>

        <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
          <header className="border-b border-white/10 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Estrutura EDI
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Ciclo do objetivo
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Um objetivo ganha valor operacional quando pode ser acompanhado por ações, evidências e indicadores.
            </p>
          </header>

          <div className="grid divide-y divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {
              OBJECTIVE_CYCLE.map(
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

          <div className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-5 sm:px-7">
            <p className="text-sm font-semibold leading-6 text-cyan-100">
              O Framework EDI orienta a definição de objetivos por evidências, inclusão e inteligência, preservando a autonomia pedagógica.
            </p>
          </div>
        </aside>
      </div>
    </AgendaPageShell>
  )
}

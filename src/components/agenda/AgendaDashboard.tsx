'use client'

import {
  useMemo,
} from 'react'

import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

import {
  useEvidences,
} from '@/lib/agenda/hooks/useEvidences'

import {
  useLessons,
} from '@/lib/agenda/hooks/useLessons'

import {
  useObjectives,
} from '@/lib/agenda/hooks/useObjectives'

import {
  usePlanning,
} from '@/lib/agenda/hooks/usePlanning'

type DashboardAlertLevel =
  | 'critical'
  | 'warning'
  | 'attention'
  | 'positive'

type DashboardAlert = {
  id: string
  level: DashboardAlertLevel

  title: string
  description: string

  value: number

  href: string
  actionLabel: string
}

type DashboardAction = {
  id: string

  priority:
    | 'alta'
    | 'media'
    | 'normal'

  title: string
  description: string

  value: number

  href: string
  actionLabel: string
}

type OperationalMetric = {
  id: string

  label: string
  value: number

  description: string
  href: string
}

type PerformanceMetric = {
  id: string

  label: string
  value: number

  suffix: string
  description: string
}

type RecentActivity = {
  id: string

  label: string
  title: string
  description: string

  date: string | null

  href: string
}

function calculatePercentage(
  numerator: number,
  denominator: number,
): number {
  if (
    denominator <=
    0
  ) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (
          numerator /
          denominator
        ) *
        100,
      ),
    ),
  )
}

function formatDateTime(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return 'Data não informada'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data indisponível'
  }

  return date.toLocaleString(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  )
}

function getAlertClasses(
  level:
    DashboardAlertLevel,
): string {
  if (
    level ===
    'critical'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-900',
    ].join(' ')
  }

  if (
    level ===
    'warning'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-950',
    ].join(' ')
  }

  if (
    level ===
    'attention'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-900',
    ].join(' ')
  }

  return [
    'border-emerald-200',
    'bg-emerald-50',
    'text-emerald-900',
  ].join(' ')
}

function getPriorityClasses(
  priority:
    DashboardAction['priority'],
): string {
  if (
    priority ===
    'alta'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-800',
    ].join(' ')
  }

  if (
    priority ===
    'media'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-800',
    ].join(' ')
  }

  return [
    'border-slate-200',
    'bg-slate-100',
    'text-slate-700',
  ].join(' ')
}

function MetricProgress({
  value,
}: {
  value: number
}) {
  return (
    <div
      className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"
      aria-label={`${value}%`}
    >
      <div
        className="h-full rounded-full bg-[#0B7491] transition-all"
        style={{
          width:
            `${value}%`,
        }}
      />
    </div>
  )
}

export function AgendaDashboard() {
  const {
    planning,
    loading:
      planningLoading,

    error:
      planningError,
  } = usePlanning()

  const {
    objectives,
    loading:
      objectivesLoading,

    error:
      objectivesError,

    loadObjectives,
  } = useObjectives()

  const {
    lessons,
    loading:
      lessonsLoading,

    error:
      lessonsError,

    loadLessons,
  } = useLessons()

  const {
    evidences,
    loading:
      evidencesLoading,

    error:
      evidencesError,

    reload:
      reloadEvidences,
  } = useEvidences()

  const loading =
    planningLoading ||
    objectivesLoading ||
    lessonsLoading ||
    evidencesLoading

  const errors =
    useMemo(
      () =>
        [
          planningError,
          objectivesError,
          lessonsError,
          evidencesError,
        ].filter(
          (
            error,
          ): error is string =>
            Boolean(
              error,
            ),
        ),
      [
        evidencesError,
        lessonsError,
        objectivesError,
        planningError,
      ],
    )

  const activeObjectives =
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

  const plannedLessons =
    useMemo(
      () =>
        lessons.filter(
          lesson =>
            lesson.status ===
              'planejada' ||
            lesson.status ===
              'em_preparacao' ||
            lesson.status ===
              'reagendada',
        ),
      [
        lessons,
      ],
    )

  const completedLessons =
    useMemo(
      () =>
        lessons.filter(
          lesson =>
            lesson.status ===
              'realizada' ||
            lesson.status ===
              'parcialmente_realizada',
        ),
      [
        lessons,
      ],
    )

  const cancelledLessons =
    useMemo(
      () =>
        lessons.filter(
          lesson =>
            lesson.status ===
            'cancelada',
        ),
      [
        lessons,
      ],
    )

  const lessonIdsWithEvidence =
    useMemo(
      () =>
        new Set(
          evidences
            .map(
              evidence =>
                evidence.lesson_id,
            )
            .filter(
              (
                lessonId,
              ): lessonId is string =>
                Boolean(
                  lessonId,
                ),
            ),
        ),
      [
        evidences,
      ],
    )

  const objectiveIdsWithEvidence =
    useMemo(
      () =>
        new Set(
          evidences
            .map(
              evidence =>
                evidence.objective_id,
            )
            .filter(
              (
                objectiveId,
              ): objectiveId is string =>
                Boolean(
                  objectiveId,
                ),
            ),
        ),
      [
        evidences,
      ],
    )

  const planningIdsWithLessons =
    useMemo(
      () =>
        new Set(
          lessons
            .map(
              lesson =>
                lesson.planning_id,
            )
            .filter(
              (
                planningId,
              ): planningId is string =>
                Boolean(
                  planningId,
                ),
            ),
        ),
      [
        lessons,
      ],
    )

  const completedLessonsWithoutEvidence =
    useMemo(
      () =>
        completedLessons.filter(
          lesson =>
            !lessonIdsWithEvidence
              .has(
                lesson.id,
              ),
        ),
      [
        completedLessons,
        lessonIdsWithEvidence,
      ],
    )

  const objectivesWithoutEvidence =
    useMemo(
      () =>
        activeObjectives.filter(
          objective =>
            !objectiveIdsWithEvidence
              .has(
                objective.id,
              ),
        ),
      [
        activeObjectives,
        objectiveIdsWithEvidence,
      ],
    )

  const planningWithoutLessons =
    useMemo(
      () =>
        planning.filter(
          item =>
            !planningIdsWithLessons
              .has(
                item.id,
              ),
        ),
      [
        planning,
        planningIdsWithLessons,
      ],
    )

  const evidencesWithoutObjective =
    useMemo(
      () =>
        evidences.filter(
          evidence =>
            !evidence.objective_id,
        ),
      [
        evidences,
      ],
    )

  const executionRate =
    calculatePercentage(
      completedLessons.length,
      lessons.filter(
        lesson =>
          lesson.status !==
          'cancelada',
      ).length,
    )

  const evidenceCoverageRate =
    calculatePercentage(
      completedLessons.filter(
        lesson =>
          lessonIdsWithEvidence
            .has(
              lesson.id,
            ),
      ).length,
      completedLessons.length,
    )

  const objectiveCoverageRate =
    calculatePercentage(
      activeObjectives.filter(
        objective =>
          objectiveIdsWithEvidence
            .has(
              objective.id,
            ),
      ).length,
      activeObjectives.length,
    )

  const planningExecutionRate =
    calculatePercentage(
      planning.filter(
        item =>
          planningIdsWithLessons
            .has(
              item.id,
            ),
      ).length,
      planning.length,
    )

  const pendingCount =
    completedLessonsWithoutEvidence
      .length +
    objectivesWithoutEvidence
      .length +
    planningWithoutLessons
      .length +
    evidencesWithoutObjective
      .length

  const operationalMetrics:
    OperationalMetric[] = [
      {
        id:
          'planning',

        label:
          'Planejamentos',

        value:
          planning.length,

        description:
          'Planejamentos pedagógicos registrados.',

        href:
          '/agenda/planejamento',
      },
      {
        id:
          'objectives',

        label:
          'Objetivos ativos',

        value:
          activeObjectives.length,

        description:
          'Objetivos disponíveis para execução.',

        href:
          '/agenda/objetivos',
      },
      {
        id:
          'planned-lessons',

        label:
          'Aulas em andamento',

        value:
          plannedLessons.length,

        description:
          'Planejadas, em preparação ou reagendadas.',

        href:
          '/agenda/aulas',
      },
      {
        id:
          'completed-lessons',

        label:
          'Aulas realizadas',

        value:
          completedLessons.length,

        description:
          'Realizadas total ou parcialmente.',

        href:
          '/agenda/aulas',
      },
      {
        id:
          'evidences',

        label:
          'Evidências',

        value:
          evidences.length,

        description:
          'Registros pedagógicos ativos.',

        href:
          '/agenda/evidencias',
      },
      {
        id:
          'pending',

        label:
          'Pendências',

        value:
          pendingCount,

        description:
          'Ações que precisam de acompanhamento.',

        href:
          '#alertas-operacionais',
      },
    ]

  const performanceMetrics:
    PerformanceMetric[] = [
      {
        id:
          'execution-rate',

        label:
          'Taxa de execução',

        value:
          executionRate,

        suffix:
          '%',

        description:
          'Percentual de aulas realizadas entre as aulas não canceladas.',
      },
      {
        id:
          'evidence-coverage',

        label:
          'Cobertura de evidências',

        value:
          evidenceCoverageRate,

        suffix:
          '%',

        description:
          'Aulas realizadas que já possuem evidência vinculada.',
      },
      {
        id:
          'objective-coverage',

        label:
          'Cobertura de objetivos',

        value:
          objectiveCoverageRate,

        suffix:
          '%',

        description:
          'Objetivos ativos que possuem evidência principal vinculada.',
      },
      {
        id:
          'planning-execution',

        label:
          'Planejamento em execução',

        value:
          planningExecutionRate,

        suffix:
          '%',

        description:
          'Planejamentos que já originaram pelo menos uma aula.',
      },
    ]

  const alerts =
    useMemo<
      DashboardAlert[]
    >(
      () => {
        const items:
          DashboardAlert[] = []

        if (
          completedLessonsWithoutEvidence
            .length >
          0
        ) {
          items.push({
            id:
              'completed-lessons-without-evidence',

            level:
              'critical',

            title:
              'Aulas realizadas sem evidências',

            description:
              'Existem aulas concluídas que ainda não possuem documentação pedagógica vinculada.',

            value:
              completedLessonsWithoutEvidence
                .length,

            href:
              '/agenda/aulas',

            actionLabel:
              'Revisar aulas',
          })
        }

        if (
          objectivesWithoutEvidence
            .length >
          0
        ) {
          items.push({
            id:
              'objectives-without-evidence',

            level:
              'warning',

            title:
              'Objetivos sem evidências',

            description:
              'Há objetivos ativos que ainda não apresentam evidência principal registrada.',

            value:
              objectivesWithoutEvidence
                .length,

            href:
              '/agenda/objetivos',

            actionLabel:
              'Revisar objetivos',
          })
        }

        if (
          planningWithoutLessons
            .length >
          0
        ) {
          items.push({
            id:
              'planning-without-lessons',

            level:
              'attention',

            title:
              'Planejamentos sem aulas',

            description:
              'Alguns planejamentos ainda não foram transformados em execução pedagógica.',

            value:
              planningWithoutLessons
                .length,

            href:
              '/agenda/planejamento',

            actionLabel:
              'Abrir planejamentos',
          })
        }

        if (
          evidencesWithoutObjective
            .length >
          0
        ) {
          items.push({
            id:
              'evidences-without-objective',

            level:
              'warning',

            title:
              'Evidências sem objetivo principal',

            description:
              'Existem evidências registradas sem vínculo direto com um objetivo principal.',

            value:
              evidencesWithoutObjective
                .length,

            href:
              '/agenda/evidencias',

            actionLabel:
              'Revisar evidências',
          })
        }

        if (
          items.length ===
          0
        ) {
          items.push({
            id:
              'operational-cycle-complete',

            level:
              'positive',

            title:
              'Ciclo operacional atualizado',

            description:
              'Não foram identificadas pendências críticas entre planejamentos, objetivos, aulas e evidências.',

            value:
              0,

            href:
              '/agenda/historico',

            actionLabel:
              'Ver histórico',
          })
        }

        return items
      },
      [
        completedLessonsWithoutEvidence,
        evidencesWithoutObjective,
        objectivesWithoutEvidence,
        planningWithoutLessons,
      ],
    )

  const nextActions =
    useMemo<
      DashboardAction[]
    >(
      () => {
        const actions:
          DashboardAction[] = []

        if (
          completedLessonsWithoutEvidence
            .length >
          0
        ) {
          actions.push({
            id:
              'register-evidences',

            priority:
              'alta',

            title:
              'Registrar evidências',

            description:
              'Documente as aulas que já foram realizadas.',

            value:
              completedLessonsWithoutEvidence
                .length,

            href:
              '/agenda/aulas',

            actionLabel:
              'Abrir aulas',
          })
        }

        if (
          plannedLessons.length >
          0
        ) {
          actions.push({
            id:
              'execute-lessons',

            priority:
              'media',

            title:
              'Acompanhar aulas',

            description:
              'Revise as aulas planejadas, em preparação ou reagendadas.',

            value:
              plannedLessons.length,

            href:
              '/agenda/aulas',

            actionLabel:
              'Acompanhar execução',
          })
        }

        if (
          planningWithoutLessons
            .length >
          0
        ) {
          actions.push({
            id:
              'connect-planning',

            priority:
              'media',

            title:
              'Transformar planejamento em aula',

            description:
              'Conecte os planejamentos que ainda não possuem execução registrada.',

            value:
              planningWithoutLessons
                .length,

            href:
              '/agenda/planejamento',

            actionLabel:
              'Abrir planejamento',
          })
        }

        if (
          activeObjectives.length ===
          0
        ) {
          actions.push({
            id:
              'create-objectives',

            priority:
              'alta',

            title:
              'Cadastrar objetivos',

            description:
              'Crie objetivos para orientar o planejamento, a execução e as evidências.',

            value:
              0,

            href:
              '/agenda/objetivos',

            actionLabel:
              'Criar objetivo',
          })
        }

        if (
          planning.length ===
          0
        ) {
          actions.push({
            id:
              'create-planning',

            priority:
              'alta',

            title:
              'Criar planejamento',

            description:
              'Inicie o ciclo operacional com um planejamento pedagógico.',

            value:
              0,

            href:
              '/agenda/planejamento',

            actionLabel:
              'Criar planejamento',
          })
        }

        return actions.slice(
          0,
          4,
        )
      },
      [
        activeObjectives.length,
        completedLessonsWithoutEvidence,
        plannedLessons.length,
        planning.length,
        planningWithoutLessons,
      ],
    )

  const recentActivities =
    useMemo<
      RecentActivity[]
    >(
      () => {
        const items:
          RecentActivity[] = []

        const latestLesson =
          [...lessons]
            .sort(
              (
                first,
                second,
              ) =>
                new Date(
                  second.updated_at,
                ).getTime() -
                new Date(
                  first.updated_at,
                ).getTime(),
            )[0]

        if (latestLesson) {
          items.push({
            id:
              `lesson-${latestLesson.id}`,

            label:
              'Última aula',

            title:
              latestLesson.title,

            description:
              latestLesson.subject ||
              'Componente não informado',

            date:
              latestLesson.updated_at,

            href:
              '/agenda/aulas',
          })
        }

        const latestEvidence =
          [...evidences]
            .sort(
              (
                first,
                second,
              ) =>
                new Date(
                  second.created_at,
                ).getTime() -
                new Date(
                  first.created_at,
                ).getTime(),
            )[0]

        if (latestEvidence) {
          items.push({
            id:
              `evidence-${latestEvidence.id}`,

            label:
              'Última evidência',

            title:
              latestEvidence.title,

            description:
              `Tipo: ${latestEvidence.evidence_type}`,

            date:
              latestEvidence.created_at,

            href:
              '/agenda/evidencias',
          })
        }

        const latestPlanning =
          [...planning]
            .sort(
              (
                first,
                second,
              ) =>
                new Date(
                  second.updated_at ??
                  second.created_at,
                ).getTime() -
                new Date(
                  first.updated_at ??
                  first.created_at,
                ).getTime(),
            )[0]

        if (latestPlanning) {
          items.push({
            id:
              `planning-${latestPlanning.id}`,

            label:
              'Último planejamento',

            title:
              latestPlanning.title,

            description:
              'Planejamento pedagógico atualizado.',

            date:
              latestPlanning.updated_at ??
              latestPlanning.created_at,

            href:
              '/agenda/planejamento',
          })
        }

        const latestObjective =
          [...objectives]
            .sort(
              (
                first,
                second,
              ) =>
                new Date(
                  second.updated_at,
                ).getTime() -
                new Date(
                  first.updated_at,
                ).getTime(),
            )[0]

        if (latestObjective) {
          items.push({
            id:
              `objective-${latestObjective.id}`,

            label:
              'Último objetivo',

            title:
              latestObjective.title,

            description:
              'Objetivo pedagógico atualizado.',

            date:
              latestObjective.updated_at,

            href:
              '/agenda/objetivos',
          })
        }

        return items
      },
      [
        evidences,
        lessons,
        objectives,
        planning,
      ],
    )

  async function reloadDashboard():
    Promise<void> {
    await Promise.allSettled([
      loadObjectives(),
      loadLessons(),
      reloadEvidences(),
    ])
  }

  if (loading) {
    return (
      <AgendaPageShell
        eyebrow="Inteligência operacional"
        title="Dashboard"
        description="Consolidando planejamentos, objetivos, aulas e evidências."
      >
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-600">
            Carregando o centro de inteligência da Agenda EDI...
          </p>
        </section>
      </AgendaPageShell>
    )
  }

  return (
    <AgendaPageShell
      eyebrow="Inteligência operacional"
      title="Dashboard"
      description="Acompanhe execução, cobertura, pendências e próximos passos do ciclo pedagógico da Agenda Inteligente EDI."
    >
      <div className="space-y-6 sm:space-y-8">
        {
          errors.length >
            0 && (
            <section className="overflow-hidden rounded-[1.5rem] border border-rose-200 bg-rose-50">
              <div className="px-5 py-5 sm:px-7">
                <h2 className="text-lg font-bold text-rose-900">
                  Alguns dados não puderam ser carregados
                </h2>

                <div className="mt-3 space-y-2">
                  {
                    errors.map(
                      (
                        currentError,
                        index,
                      ) => (
                        <p
                          key={`${currentError}-${index}`}
                          className="text-sm font-semibold text-rose-800"
                        >
                          {
                            currentError
                          }
                        </p>
                      ),
                    )
                  }
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void reloadDashboard()
                  }
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-900"
                >
                  Tentar novamente
                </button>
              </div>
            </section>
          )
        }

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
          <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Centro de Inteligência Operacional
              </p>

              <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
                Do registro pedagógico à ação orientada por evidências
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                O Dashboard consolida o ciclo Planejamento → Objetivos → Aulas → Evidências para apoiar decisões e replanejamentos.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void reloadDashboard()
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Atualizar indicadores
            </button>
          </div>

          <div className="grid border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">
            {
              performanceMetrics.map(
                metric => (
                  <article
                    key={
                      metric.id
                    }
                    className="border-b border-white/10 p-5 sm:border-r xl:border-b-0"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      {
                        metric.label
                      }
                    </p>

                    <p className="mt-3 text-4xl font-bold">
                      {
                        metric.value
                      }
                      {
                        metric.suffix
                      }
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {
                        metric.description
                      }
                    </p>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-300"
                        style={{
                          width:
                            `${metric.value}%`,
                        }}
                      />
                    </div>
                  </article>
                ),
              )
            }
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
              Resumo operacional
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#071827]">
              Situação atual da Agenda
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {
              operationalMetrics.map(
                metric => (
                  <Link
                    key={
                      metric.id
                    }
                    href={
                      metric.href
                    }
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          {
                            metric.label
                          }
                        </p>

                        <p className="mt-3 text-4xl font-bold text-[#071827]">
                          {
                            metric.value
                          }
                        </p>
                      </div>

                      <span className="text-xl font-bold text-cyan-700 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {
                        metric.description
                      }
                    </p>
                  </Link>
                ),
              )
            }
          </div>
        </section>

        <section
          id="alertas-operacionais"
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
        >
          <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
              Alertas operacionais
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#071827]">
              Pontos que exigem atenção
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Alertas calculados automaticamente a partir dos registros atuais da Agenda.
            </p>
          </header>

          <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
            {
              alerts.map(
                alert => (
                  <article
                    key={
                      alert.id
                    }
                    className={`rounded-2xl border p-5 ${getAlertClasses(
                      alert.level,
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold">
                          {
                            alert.title
                          }
                        </h3>

                        <p className="mt-2 text-sm leading-6 opacity-90">
                          {
                            alert.description
                          }
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-current/20 bg-white/70 px-3 py-1 text-sm font-bold">
                        {
                          alert.value
                        }
                      </span>
                    </div>

                    <Link
                      href={
                        alert.href
                      }
                      className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-current/20 bg-white/70 px-4 py-2 text-sm font-bold transition hover:bg-white"
                    >
                      {
                        alert.actionLabel
                      }
                    </Link>
                  </article>
                ),
              )
            }
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Próximas ações
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                Prioridades sugeridas
              </h2>
            </header>

            {
              nextActions.length ===
              0 ? (
                <div className="p-7">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <h3 className="font-bold text-emerald-900">
                      Nenhuma ação prioritária identificada
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-emerald-800">
                      O ciclo operacional está atualizado com os dados disponíveis.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {
                    nextActions.map(
                      action => (
                        <article
                          key={
                            action.id
                          }
                          className="p-5 sm:px-7"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${getPriorityClasses(
                                  action.priority,
                                )}`}
                              >
                                Prioridade {
                                  action.priority
                                }
                              </span>

                              <h3 className="mt-3 font-bold text-[#071827]">
                                {
                                  action.title
                                }
                              </h3>

                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {
                                  action.description
                                }
                              </p>
                            </div>

                            <span className="text-3xl font-bold text-[#0B7491]">
                              {
                                action.value
                              }
                            </span>
                          </div>

                          <Link
                            href={
                              action.href
                            }
                            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-[#075F78] transition hover:bg-cyan-100"
                          >
                            {
                              action.actionLabel
                            }
                          </Link>
                        </article>
                      ),
                    )
                  }
                </div>
              )
            }
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Atividade recente
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                Últimas atualizações
              </h2>
            </header>

            {
              recentActivities.length ===
              0 ? (
                <div className="p-7 text-sm font-semibold text-slate-500">
                  Nenhuma atividade recente encontrada.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {
                    recentActivities.map(
                      activity => (
                        <Link
                          key={
                            activity.id
                          }
                          href={
                            activity.href
                          }
                          className="block p-5 transition hover:bg-slate-50 sm:px-7"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0B7491]">
                            {
                              activity.label
                            }
                          </p>

                          <h3 className="mt-2 font-bold text-[#071827]">
                            {
                              activity.title
                            }
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {
                              activity.description
                            }
                          </p>

                          <p className="mt-2 text-xs font-semibold text-slate-400">
                            {
                              formatDateTime(
                                activity.date,
                              )
                            }
                          </p>
                        </Link>
                      ),
                    )
                  }
                </div>
              )
            }
          </section>
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
              Indicadores EDI
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#071827]">
              Cobertura do ciclo pedagógico
            </h2>
          </header>

          <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
            {
              performanceMetrics.map(
                metric => (
                  <article
                    key={
                      `detail-${metric.id}`
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-[#071827]">
                          {
                            metric.label
                          }
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {
                            metric.description
                          }
                        </p>
                      </div>

                      <span className="shrink-0 text-3xl font-bold text-[#0B7491]">
                        {
                          metric.value
                        }
                        {
                          metric.suffix
                        }
                      </span>
                    </div>

                    <MetricProgress
                      value={
                        metric.value
                      }
                    />
                  </article>
                ),
              )
            }
          </div>
        </section>

        <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
          <header className="border-b border-white/10 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Framework EDI
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Inteligência orientada pelo trabalho real
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Os indicadores são produzidos a partir da atividade pedagógica registrada, sem duplicar cadastros ou criar estruturas paralelas.
            </p>
          </header>

          <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {
              [
                {
                  code:
                    '01',

                  title:
                    'Planejar',

                  description:
                    'Organizar intencionalidades, contexto e ações pedagógicas.',
                },
                {
                  code:
                    '02',

                  title:
                    'Executar',

                  description:
                    'Transformar o planejamento em aulas e ações concretas.',
                },
                {
                  code:
                    '03',

                  title:
                    'Evidenciar',

                  description:
                    'Documentar o desenvolvimento de objetivos e aprendizagens.',
                },
                {
                  code:
                    '04',

                  title:
                    'Replanejar',

                  description:
                    'Usar indicadores e evidências para orientar novas decisões.',
                },
              ].map(
                item => (
                  <article
                    key={
                      item.code
                    }
                    className="px-5 py-5 sm:px-7"
                  >
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {
                        item.code
                      }
                    </span>

                    <h3 className="mt-3 font-bold">
                      {
                        item.title
                      }
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {
                        item.description
                      }
                    </p>
                  </article>
                ),
              )
            }
          </div>
        </aside>

        {
          cancelledLessons.length >
            0 && (
            <p className="text-center text-xs font-semibold text-slate-400">
              {
                cancelledLessons.length
              } aula(s) cancelada(s) não entram no cálculo da taxa de execução.
            </p>
          )
        }
      </div>
    </AgendaPageShell>
  )
}
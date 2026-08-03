'use client'

import Link from 'next/link'

import {
  useMemo,
} from 'react'

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

type RecommendationPriority =
  | 'alta'
  | 'media'
  | 'normal'
  | 'positiva'

type ContextualRecommendation = {
  id: string

  priority:
    RecommendationPriority

  title: string

  description: string

  reason: string

  value: number

  valueLabel: string

  href: string

  actionLabel: string
}

function getPriorityClasses(
  priority:
    RecommendationPriority,
): string {
  if (
    priority ===
    'alta'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-900',
    ].join(' ')
  }

  if (
    priority ===
    'media'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-950',
    ].join(' ')
  }

  if (
    priority ===
    'positiva'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-900',
    ].join(' ')
  }

  return [
    'border-cyan-200',
    'bg-cyan-50',
    'text-[#075F78]',
  ].join(' ')
}

function getPriorityLabel(
  priority:
    RecommendationPriority,
): string {
  if (
    priority ===
    'alta'
  ) {
    return 'Prioridade alta'
  }

  if (
    priority ===
    'media'
  ) {
    return 'Prioridade média'
  }

  if (
    priority ===
    'positiva'
  ) {
    return 'Ciclo atualizado'
  }

  return 'Orientação'
}

export default function RecomendacoesPage() {
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
  } = useObjectives()

  const {
    lessons,

    loading:
      lessonsLoading,

    error:
      lessonsError,
  } = useLessons()

  const {
    evidences,

    loading:
      evidencesLoading,

    error:
      evidencesError,
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
            objective.status ===
              'ativo' ||
            objective.status ===
              'em_acompanhamento',
        ),
      [
        objectives,
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
            !lessonIdsWithEvidence.has(
              lesson.id,
            ),
        ),
      [
        completedLessons,
        lessonIdsWithEvidence,
      ],
    )

  const activeObjectivesWithoutEvidence =
    useMemo(
      () =>
        activeObjectives.filter(
          objective =>
            !objectiveIdsWithEvidence.has(
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
            !planningIdsWithLessons.has(
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

  const recommendations =
    useMemo<
      ContextualRecommendation[]
    >(
      () => {
        const items:
          ContextualRecommendation[] = []

        if (
          planning.length ===
          0
        ) {
          items.push({
            id:
              'create-first-planning',

            priority:
              'alta',

            title:
              'Crie o primeiro planejamento',

            description:
              'O ciclo pedagógico ainda não possui um planejamento registrado.',

            reason:
              'O planejamento é a base para relacionar objetivos, aulas e evidências.',

            value:
              0,

            valueLabel:
              'planejamentos',

            href:
              '/agenda/planejamento',

            actionLabel:
              'Criar planejamento',
          })

          return items
        }

        if (
          activeObjectives.length ===
          0
        ) {
          items.push({
            id:
              'create-active-objective',

            priority:
              'alta',

            title:
              'Defina um objetivo pedagógico ativo',

            description:
              `Existem ${planning.length} ${
                planning.length === 1
                  ? 'planejamento registrado'
                  : 'planejamentos registrados'
              }, mas nenhum objetivo ativo orientando a execução.`,

            reason:
              'Sem um objetivo ativo, aulas e evidências não conseguem demonstrar claramente a evolução pedagógica.',

            value:
              planning.length,

            valueLabel:
              planning.length === 1
                ? 'planejamento'
                : 'planejamentos',

            href:
              '/agenda/objetivos',

            actionLabel:
              'Criar objetivo',
          })
        }

        if (
          planningWithoutLessons.length >
          0
        ) {
          items.push({
            id:
              'planning-without-lessons',

            priority:
              activeObjectives.length ===
              0
                ? 'media'
                : 'alta',

            title:
              'Transforme planejamentos em aulas',

            description:
              `${planningWithoutLessons.length} ${
                planningWithoutLessons.length ===
                1
                  ? 'planejamento ainda não originou nenhuma aula'
                  : 'planejamentos ainda não originaram nenhuma aula'
              }.`,

            reason:
              'Planejamentos sem aulas permanecem apenas como intenção e não alimentam a taxa de execução.',

            value:
              planningWithoutLessons.length,

            valueLabel:
              planningWithoutLessons.length ===
              1
                ? 'planejamento'
                : 'planejamentos',

            href:
              '/agenda/aulas',

            actionLabel:
              'Registrar aulas',
          })
        }

        if (
          plannedLessons.length >
          0
        ) {
          items.push({
            id:
              'planned-lessons',

            priority:
              'media',

            title:
              'Acompanhe as aulas em andamento',

            description:
              `${plannedLessons.length} ${
                plannedLessons.length ===
                1
                  ? 'aula está planejada, em preparação ou reagendada'
                  : 'aulas estão planejadas, em preparação ou reagendadas'
              }.`,

            reason:
              'Atualizar o status das aulas permite acompanhar execução, atrasos e continuidade do planejamento.',

            value:
              plannedLessons.length,

            valueLabel:
              plannedLessons.length ===
              1
                ? 'aula'
                : 'aulas',

            href:
              '/agenda/aulas',

            actionLabel:
              'Atualizar aulas',
          })
        }

        if (
          completedLessonsWithoutEvidence
            .length >
          0
        ) {
          items.push({
            id:
              'completed-lessons-without-evidence',

            priority:
              'alta',

            title:
              'Registre evidências das aulas realizadas',

            description:
              `${completedLessonsWithoutEvidence.length} ${
                completedLessonsWithoutEvidence.length ===
                1
                  ? 'aula realizada ainda não possui evidência vinculada'
                  : 'aulas realizadas ainda não possuem evidências vinculadas'
              }.`,

            reason:
              'A evidência documenta a prática, fortalece o acompanhamento e permite análises posteriores pelo EIOS.',

            value:
              completedLessonsWithoutEvidence
                .length,

            valueLabel:
              completedLessonsWithoutEvidence
                .length ===
              1
                ? 'aula'
                : 'aulas',

            href:
              '/agenda/evidencias',

            actionLabel:
              'Registrar evidências',
          })
        }

        if (
          activeObjectivesWithoutEvidence
            .length >
          0
        ) {
          items.push({
            id:
              'objectives-without-evidence',

            priority:
              'media',

            title:
              'Documente a evolução dos objetivos',

            description:
              `${activeObjectivesWithoutEvidence.length} ${
                activeObjectivesWithoutEvidence.length ===
                1
                  ? 'objetivo ativo ainda não possui evidência principal'
                  : 'objetivos ativos ainda não possuem evidências principais'
              }.`,

            reason:
              'Objetivos precisam de evidências para demonstrar avanço, dificuldade ou necessidade de replanejamento.',

            value:
              activeObjectivesWithoutEvidence
                .length,

            valueLabel:
              activeObjectivesWithoutEvidence
                .length ===
              1
                ? 'objetivo'
                : 'objetivos',

            href:
              '/agenda/evidencias',

            actionLabel:
              'Vincular evidências',
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

            priority:
              'normal',

            title:
              'Revise evidências sem objetivo principal',

            description:
              `${evidencesWithoutObjective.length} ${
                evidencesWithoutObjective.length ===
                1
                  ? 'evidência não está vinculada a um objetivo'
                  : 'evidências não estão vinculadas a objetivos'
              }.`,

            reason:
              'O vínculo com objetivos melhora a organização dos registros e a qualidade das análises pedagógicas.',

            value:
              evidencesWithoutObjective.length,

            valueLabel:
              evidencesWithoutObjective.length ===
              1
                ? 'evidência'
                : 'evidências',

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
              'cycle-updated',

            priority:
              'positiva',

            title:
              'O ciclo pedagógico está atualizado',

            description:
              'Não foram identificadas pendências críticas entre planejamentos, objetivos, aulas e evidências.',

            reason:
              'Os registros atuais permitem acompanhar execução e produzir análises mais confiáveis.',

            value:
              completedLessons.length,

            valueLabel:
              completedLessons.length ===
              1
                ? 'aula realizada'
                : 'aulas realizadas',

            href:
              '/agenda/dashboard',

            actionLabel:
              'Abrir Dashboard',
          })
        }

        return items
      },
      [
        activeObjectives.length,
        activeObjectivesWithoutEvidence
          .length,
        completedLessons.length,
        completedLessonsWithoutEvidence
          .length,
        evidencesWithoutObjective
          .length,
        plannedLessons.length,
        planning.length,
        planningWithoutLessons.length,
      ],
    )

  const highPriorityCount =
    recommendations.filter(
      recommendation =>
        recommendation.priority ===
        'alta',
    ).length

  const pendingItemsCount =
    completedLessonsWithoutEvidence
      .length +
    activeObjectivesWithoutEvidence
      .length +
    planningWithoutLessons
      .length +
    evidencesWithoutObjective
      .length

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-950">
      <header className="border-b border-white/10 bg-[#081C2E] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              Professor Digital
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Recomendações contextuais
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-slate-300">
              Orientações produzidas a partir do estado real dos planejamentos,
              objetivos, aulas e evidências registrados na Agenda Inteligente
              EDI.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/professor-digital/agenda"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
            >
              Voltar ao ambiente docente
            </Link>

            <Link
              href="/agenda/dashboard"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Abrir Agenda EDI
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <section
          aria-label="Resumo das recomendações"
          className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-6 sm:border-r lg:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Recomendações
            </p>

            <p className="mt-3 text-4xl font-bold text-[#081C2E]">
              {recommendations.length}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Orientações disponíveis agora.
            </p>
          </article>

          <article className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Prioridade alta
            </p>

            <p className="mt-3 text-4xl font-bold text-rose-700">
              {highPriorityCount}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ações que precisam de atenção.
            </p>
          </article>

          <article className="border-b border-slate-200 p-6 sm:border-b-0 sm:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Pendências
            </p>

            <p className="mt-3 text-4xl font-bold text-amber-700">
              {pendingItemsCount}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Registros que precisam de acompanhamento.
            </p>
          </article>

          <article className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Ciclo EDI
            </p>

            <p className="mt-3 text-2xl font-bold text-cyan-700">
              Contextual
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Análise baseada nos dados atuais.
            </p>
          </article>
        </section>

        {
          loading && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
                Inteligência contextual
              </p>

              <p className="mt-4 text-lg font-semibold text-slate-700">
                Analisando os registros da Agenda...
              </p>
            </section>
          )
        }

        {
          !loading &&
          errors.length >
            0 && (
            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">
                Análise parcialmente indisponível
              </p>

              <p className="mt-4 leading-7 text-amber-950">
                Alguns registros não puderam ser consultados. As recomendações
                exibidas podem não representar todo o ciclo pedagógico.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-amber-950">
                {
                  errors.map(
                    error => (
                      <li
                        key={error}
                      >
                        {error}
                      </li>
                    ),
                  )
                }
              </ul>
            </section>
          )
        }

        {
          !loading && (
            <section aria-labelledby="recommendations-list">
              <div className="mb-6">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                  O que precisa de atenção agora
                </p>

                <h2
                  id="recommendations-list"
                  className="mt-2 text-3xl font-bold text-[#081C2E]"
                >
                  Recomendações do Professor Digital
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  As recomendações mudam automaticamente conforme o professor
                  atualiza planejamentos, objetivos, aulas e evidências.
                </p>
              </div>

              <div className="space-y-5">
                {
                  recommendations.map(
                    recommendation => (
                      <article
                        key={
                          recommendation.id
                        }
                        className={[
                          'rounded-[2rem] border p-6 shadow-sm sm:p-8',
                          getPriorityClasses(
                            recommendation.priority,
                          ),
                        ].join(' ')}
                      >
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                          <div className="max-w-4xl">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full border border-current/20 bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">
                                {
                                  getPriorityLabel(
                                    recommendation.priority,
                                  )
                                }
                              </span>

                              <span className="text-sm font-bold">
                                {
                                  recommendation.value
                                }{' '}
                                {
                                  recommendation.valueLabel
                                }
                              </span>
                            </div>

                            <h3 className="mt-5 text-2xl font-bold">
                              {
                                recommendation.title
                              }
                            </h3>

                            <p className="mt-3 text-base leading-7 opacity-90">
                              {
                                recommendation.description
                              }
                            </p>

                            <div className="mt-5 rounded-2xl border border-current/10 bg-white/50 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
                                Por que isso importa
                              </p>

                              <p className="mt-2 text-sm leading-6">
                                {
                                  recommendation.reason
                                }
                              </p>
                            </div>
                          </div>

                          <Link
                            href={
                              recommendation.href
                            }
                            className="inline-flex w-fit shrink-0 rounded-full bg-[#081C2E] px-6 py-3 font-semibold text-white transition hover:opacity-90"
                          >
                            {
                              recommendation.actionLabel
                            }
                          </Link>
                        </div>
                      </article>
                    ),
                  )
                }
              </div>
            </section>
          )
        }

        <section className="rounded-[2rem] border border-cyan-900/10 bg-[#081C2E] p-8 text-white shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
            Próxima evolução
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Professor Digital orientado pelo contexto
          </h2>

          <p className="mt-4 max-w-4xl leading-7 text-slate-300">
            Esta camada utiliza regras determinísticas e dados autorizados da
            Agenda. Nenhum registro é alterado automaticamente, e a decisão
            final permanece com o professor.
          </p>
        </section>
      </div>
    </main>
  )
}
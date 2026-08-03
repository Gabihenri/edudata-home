'use client'

import Link from 'next/link'

import {
  useEducationalContext,
} from '@/lib/eios/context/useEducationalContext'

import type {
  EducationalContextAlert,
  EducationalContextDailyPriority,
  EducationalContextInsight,
  EducationalContextRecommendation,
} from '@/lib/eios/context/educational-context.contract'

function formatGeneratedAt(
  value: string | null,
): string {
  if (!value) {
    return 'Ainda não atualizado'
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

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle:
        'short',

      timeStyle:
        'short',
    },
  ).format(date)
}

function getScoreLabel(
  score: number,
): string {
  if (
    score >=
    90
  ) {
    return 'Excelente'
  }

  if (
    score >=
    75
  ) {
    return 'Consistente'
  }

  if (
    score >=
    60
  ) {
    return 'Em desenvolvimento'
  }

  if (
    score >=
    40
  ) {
    return 'Atenção'
  }

  return 'Ciclo inicial'
}

function getScoreClasses(
  score: number,
): string {
  if (
    score >=
    75
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    score >=
    50
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-800',
    ].join(' ')
  }

  return [
    'border-rose-200',
    'bg-rose-50',
    'text-rose-800',
  ].join(' ')
}

function getPriorityClasses(
  priority: string,
): string {
  if (
    priority ===
    'critical'
  ) {
    return [
      'border-rose-300',
      'bg-rose-100',
      'text-rose-950',
    ].join(' ')
  }

  if (
    priority ===
    'high'
  ) {
    return [
      'border-orange-200',
      'bg-orange-50',
      'text-orange-950',
    ].join(' ')
  }

  if (
    priority ===
    'medium'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-950',
    ].join(' ')
  }

  return [
    'border-cyan-200',
    'bg-cyan-50',
    'text-[#075F78]',
  ].join(' ')
}

function PriorityItem({
  priority,
}: {
  priority:
    EducationalContextDailyPriority
}) {
  return (
    <article
      className={[
        'rounded-2xl border p-5',
        getPriorityClasses(
          priority.priority,
        ),
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
            {
              priority.priority ===
              'critical'
                ? 'Prioridade crítica'
                : priority.priority ===
                    'high'
                  ? 'Prioridade alta'
                  : priority.priority ===
                      'medium'
                    ? 'Prioridade média'
                    : 'Orientação'
            }
          </p>

          <h3 className="mt-2 text-lg font-bold">
            {
              priority.title
            }
          </h3>

          <p className="mt-2 text-sm leading-6 opacity-90">
            {
              priority.description
            }
          </p>

          <div className="mt-4 rounded-xl border border-current/10 bg-white/50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
              Motivo
            </p>

            <p className="mt-2 text-sm leading-6">
              {
                priority.reason
              }
            </p>
          </div>
        </div>

        {
          priority.actionHref &&
          priority.actionLabel && (
            <Link
              href={
                priority.actionHref
              }
              className="inline-flex w-fit shrink-0 rounded-full bg-[#081C2E] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {
                priority.actionLabel
              }
            </Link>
          )
        }
      </div>
    </article>
  )
}

function AlertItem({
  alert,
}: {
  alert:
    EducationalContextAlert
}) {
  return (
    <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
        Alerta
      </p>

      <h3 className="mt-2 text-lg font-bold">
        {
          alert.title
        }
      </h3>

      <p className="mt-2 text-sm leading-6">
        {
          alert.description
        }
      </p>

      <p className="mt-3 text-sm leading-6 text-rose-800">
        <strong>
          Por que isso importa:
        </strong>{' '}
        {
          alert.reason
        }
      </p>

      {
        alert.actionHref &&
        alert.recommendedAction && (
          <Link
            href={
              alert.actionHref
            }
            className="mt-4 inline-flex rounded-full bg-rose-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {
              alert.recommendedAction
            }
          </Link>
        )
      }
    </article>
  )
}

function RecommendationItem({
  recommendation,
}: {
  recommendation:
    EducationalContextRecommendation
}) {
  return (
    <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-[#075F78]">
      <p className="text-xs font-bold uppercase tracking-[0.16em]">
        Recomendação
      </p>

      <h3 className="mt-2 text-lg font-bold text-[#081C2E]">
        {
          recommendation.title
        }
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {
          recommendation.description
        }
      </p>

      <div className="mt-4 rounded-xl border border-cyan-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
          Explicação
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {
            recommendation.reason
          }
        </p>

        {
          recommendation.expectedImpact && (
            <p className="mt-3 text-sm leading-6 text-slate-700">
              <strong>
                Impacto esperado:
              </strong>{' '}
              {
                recommendation.expectedImpact
              }
            </p>
          )
        }
      </div>

      {
        recommendation.actionHref &&
        recommendation.actionLabel && (
          <Link
            href={
              recommendation.actionHref
            }
            className="mt-4 inline-flex rounded-full bg-[#0A3A5E] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {
              recommendation.actionLabel
            }
          </Link>
        )
      }
    </article>
  )
}

function InsightItem({
  insight,
}: {
  insight:
    EducationalContextInsight
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
        Insight
      </p>

      <h3 className="mt-2 text-lg font-bold text-[#081C2E]">
        {
          insight.title
        }
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {
          insight.description
        }
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {
          insight.explanation
        }
      </p>
    </article>
  )
}

export function ProfessorDigitalTodayPanel() {
  const {
    context,

    loading,

    refreshing,

    error,

    warnings,

    generatedAt,

    reload,
  } = useEducationalContext({
    refreshOnFocus:
      false,
  })

  if (loading) {
    return (
      <section
        aria-label="Painel Hoje"
        className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
          Professor Digital
        </p>

        <h2 className="mt-4 text-3xl font-bold text-[#081C2E]">
          Preparando seu dia
        </h2>

        <p className="mt-4 leading-7 text-slate-600">
          O Context Engine está analisando planejamentos, objetivos, aulas,
          evidências e indicadores.
        </p>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-600" />
        </div>
      </section>
    )
  }

  if (
    error ||
    !context
  ) {
    return (
      <section
        aria-label="Painel Hoje indisponível"
        className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8"
      >
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">
          Painel Hoje indisponível
        </p>

        <h2 className="mt-4 text-2xl font-bold text-amber-950">
          Não foi possível carregar o contexto educacional
        </h2>

        <p className="mt-4 leading-7 text-amber-950">
          {
            error ??
            'O Context Engine não retornou dados para este usuário.'
          }
        </p>

        <button
          type="button"
          onClick={
            () => {
              void reload()
            }
          }
          className="mt-6 rounded-full bg-amber-900 px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Tentar novamente
        </button>
      </section>
    )
  }

  const {
    agenda,
    dailySummary,
    indicators,
    metadata,
  } = context

  const primaryPriority =
    dailySummary
      .priorities[0] ??
    null

  const secondaryPriorities =
    dailySummary
      .priorities
      .slice(1, 4)

  const visibleAlerts =
    dailySummary
      .alerts
      .slice(0, 3)

  const visibleRecommendations =
    dailySummary
      .recommendations
      .slice(0, 3)

  const visibleInsights =
    dailySummary
      .insights
      .slice(0, 3)

  return (
    <section
      aria-labelledby="professor-digital-today-title"
      className="space-y-6"
    >
      <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#081C2E] via-[#0A3A5E] to-[#075F78] text-white shadow-lg">
        <div className="grid lg:grid-cols-[1fr_280px]">
          <div className="p-7 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
              Painel Hoje
            </p>

            <h2
              id="professor-digital-today-title"
              className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl"
            >
              {
                dailySummary.greeting
              }
            </h2>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
              {
                dailySummary.summary
              }
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={
                  () => {
                    void reload()
                  }
                }
                disabled={
                  refreshing
                }
                className="rounded-full bg-white px-6 py-3 font-semibold text-[#081C2E] transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
              >
                {
                  refreshing
                    ? 'Atualizando...'
                    : 'Atualizar contexto'
                }
              </button>

              <Link
                href="/agenda/dashboard"
                className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Abrir Agenda EDI
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/10 p-7 lg:border-l lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Contexto
            </p>

            <p className="mt-3 text-xl font-bold">
              {
                metadata.status ===
                'available'
                  ? 'Disponível'
                  : metadata.status ===
                      'partial'
                    ? 'Parcial'
                    : metadata.status ===
                        'degraded'
                      ? 'Com alertas'
                      : 'Inicial'
              }
            </p>

            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-slate-400">
                  Atualizado em
                </dt>

                <dd className="mt-1 font-semibold text-white">
                  {
                    formatGeneratedAt(
                      generatedAt,
                    )
                  }
                </dd>
              </div>

              <div>
                <dt className="text-slate-400">
                  Qualidade dos dados
                </dt>

                <dd className="mt-1 font-semibold text-white">
                  {
                    metadata
                      .dataQualityScore ===
                    null
                      ? 'Não calculada'
                      : `${metadata.dataQualityScore}%`
                  }
                </dd>
              </div>

              <div>
                <dt className="text-slate-400">
                  Fontes
                </dt>

                <dd className="mt-1 font-semibold text-white">
                  {
                    metadata.sources
                      .join(', ')
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {
        warnings.length >
          0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
              Avisos do contexto
            </p>

            <ul className="mt-3 space-y-2 text-sm leading-6">
              {
                warnings.map(
                  warning => (
                    <li
                      key={
                        warning
                      }
                    >
                      {
                        warning
                      }
                    </li>
                  ),
                )
              }
            </ul>
          </section>
        )
      }

      <section
        aria-label="Indicadores do dia"
        className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-5"
      >
        <article className="border-b border-slate-200 p-6 sm:border-r xl:border-b-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Aulas hoje
          </p>

          <p className="mt-3 text-4xl font-bold text-[#081C2E]">
            {
              agenda.lessons
                .scheduledToday
            }
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Aulas previstas para a data atual.
          </p>
        </article>

        <article className="border-b border-slate-200 p-6 xl:border-b-0 xl:border-r">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Tarefas hoje
          </p>

          <p className="mt-3 text-4xl font-bold text-[#081C2E]">
            {
              agenda.tasks
                .dueToday
            }
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tarefas com prazo para hoje.
          </p>
        </article>

        <article className="border-b border-slate-200 p-6 sm:border-r xl:border-b-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Evidências pendentes
          </p>

          <p className="mt-3 text-4xl font-bold text-amber-700">
            {
              agenda.lessons
                .completedWithoutEvidence
            }
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Aulas realizadas sem documentação.
          </p>
        </article>

        <article
          className={[
            'border-b border-slate-200 p-6 xl:border-b-0 xl:border-r',
            getScoreClasses(
              indicators
                .overallScore,
            ),
          ].join(' ')}
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
            Score EDI
          </p>

          <p className="mt-3 text-4xl font-bold">
            {
              indicators
                .overallScore
            }
          </p>

          <p className="mt-2 text-sm font-semibold">
            {
              getScoreLabel(
                indicators
                  .overallScore,
              )
            }
          </p>
        </article>

        <article
          className={[
            'p-6',
            getScoreClasses(
              indicators
                .pedagogicalHealthIndex,
            ),
          ].join(' ')}
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
            Saúde pedagógica
          </p>

          <p className="mt-3 text-4xl font-bold">
            {
              indicators
                .pedagogicalHealthIndex
            }
          </p>

          <p className="mt-2 text-sm font-semibold">
            {
              getScoreLabel(
                indicators
                  .pedagogicalHealthIndex,
              )
            }
          </p>
        </article>
      </section>

      {
        primaryPriority && (
          <section aria-labelledby="main-priority-title">
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
                Prioridade principal
              </p>

              <h2
                id="main-priority-title"
                className="mt-2 text-2xl font-bold text-[#081C2E]"
              >
                O que precisa de atenção agora
              </h2>
            </div>

            <PriorityItem
              priority={
                primaryPriority
              }
            />
          </section>
        )
      }

      {
        secondaryPriorities.length >
          0 && (
          <section aria-labelledby="other-priorities-title">
            <h2
              id="other-priorities-title"
              className="text-2xl font-bold text-[#081C2E]"
            >
              Outras prioridades
            </h2>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {
                secondaryPriorities.map(
                  priority => (
                    <PriorityItem
                      key={
                        priority.id
                      }
                      priority={
                        priority
                      }
                    />
                  ),
                )
              }
            </div>
          </section>
        )
      }

      {
        visibleAlerts.length >
          0 && (
          <section aria-labelledby="today-alerts-title">
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-rose-700">
                Alertas
              </p>

              <h2
                id="today-alerts-title"
                className="mt-2 text-2xl font-bold text-[#081C2E]"
              >
                Pontos que exigem acompanhamento
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {
                visibleAlerts.map(
                  alert => (
                    <AlertItem
                      key={
                        alert.id
                      }
                      alert={
                        alert
                      }
                    />
                  ),
                )
              }
            </div>
          </section>
        )
      }

      {
        visibleRecommendations.length >
          0 && (
          <section aria-labelledby="today-recommendations-title">
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
                Recomendações explicáveis
              </p>

              <h2
                id="today-recommendations-title"
                className="mt-2 text-2xl font-bold text-[#081C2E]"
              >
                Próximas ações recomendadas
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {
                visibleRecommendations.map(
                  recommendation => (
                    <RecommendationItem
                      key={
                        recommendation.id
                      }
                      recommendation={
                        recommendation
                      }
                    />
                  ),
                )
              }
            </div>
          </section>
        )
      }

      {
        visibleInsights.length >
          0 && (
          <section aria-labelledby="today-insights-title">
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
                Professor Digital observou
              </p>

              <h2
                id="today-insights-title"
                className="mt-2 text-2xl font-bold text-[#081C2E]"
              >
                Insights do contexto atual
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {
                visibleInsights.map(
                  insight => (
                    <InsightItem
                      key={
                        insight.id
                      }
                      insight={
                        insight
                      }
                    />
                  ),
                )
              }
            </div>
          </section>
        )
      }

      <section
        aria-label="Ações rápidas"
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
          Ações rápidas
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/agenda/planejamento"
            className="rounded-full bg-[#0A3A5E] px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Planejamento
          </Link>

          <Link
            href="/agenda/objetivos"
            className="rounded-full border border-[#0A3A5E]/20 bg-white px-6 py-3 font-semibold text-[#0A3A5E] transition hover:bg-slate-50"
          >
            Objetivos
          </Link>

          <Link
            href="/agenda/aulas"
            className="rounded-full border border-[#0A3A5E]/20 bg-white px-6 py-3 font-semibold text-[#0A3A5E] transition hover:bg-slate-50"
          >
            Aulas
          </Link>

          <Link
            href="/agenda/evidencias"
            className="rounded-full border border-[#0A3A5E]/20 bg-white px-6 py-3 font-semibold text-[#0A3A5E] transition hover:bg-slate-50"
          >
            Evidências
          </Link>

          <Link
            href="/professor-digital/recomendacoes"
            className="rounded-full border border-[#0A3A5E]/20 bg-white px-6 py-3 font-semibold text-[#0A3A5E] transition hover:bg-slate-50"
          >
            Recomendações
          </Link>
        </div>
      </section>
    </section>
  )
}
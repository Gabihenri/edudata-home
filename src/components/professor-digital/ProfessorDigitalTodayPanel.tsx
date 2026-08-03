'use client'

import Link from 'next/link'

import {
  AlertCard,
  type AlertCardTone,
} from '@/components/ui/cards/AlertCard'

import {
  InsightCard,
} from '@/components/ui/cards/InsightCard'

import {
  MetricCard,
  type MetricCardTone,
} from '@/components/ui/cards/MetricCard'

import {
  RecommendationCard,
  type RecommendationCardTone,
} from '@/components/ui/cards/RecommendationCard'

import {
  PageShell,
  type PageShellStatusItem,
} from '@/components/ui/layout/PageShell'

import {
  SectionHeader,
} from '@/components/ui/layout/SectionHeader'

import type {
  EducationalContextDailyPriority,
  EducationalContextPriority,
  EducationalContextRiskLevel,
} from '@/lib/eios/context/educational-context.contract'

import {
  useEducationalContext,
} from '@/lib/eios/context/useEducationalContext'

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

function formatSource(
  source: string,
): string {
  const labels:
    Record<string, string> = {
      agenda:
        'Agenda',

      professor_digital:
        'Professor Digital',

      class_diary:
        'Diário de Classe',

      professional_development:
        'Desenvolvimento profissional',

      analytics:
        'Analytics',

      institution:
        'Instituição',

      manual:
        'Registro manual',

      integration:
        'Integração',
    }

  return (
    labels[source] ??
    source
  )
}

function getContextStatusLabel(
  status: string,
): string {
  if (
    status ===
    'available'
  ) {
    return 'Disponível'
  }

  if (
    status ===
    'partial'
  ) {
    return 'Parcial'
  }

  if (
    status ===
    'degraded'
  ) {
    return 'Com alertas'
  }

  if (
    status ===
    'unavailable'
  ) {
    return 'Indisponível'
  }

  return 'Inicial'
}

function getContextStatusTone(
  status: string,
): PageShellStatusItem['tone'] {
  if (
    status ===
    'available'
  ) {
    return 'success'
  }

  if (
    status ===
      'degraded' ||
    status ===
      'partial'
  ) {
    return 'warning'
  }

  if (
    status ===
    'unavailable'
  ) {
    return 'danger'
  }

  return 'brand'
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

function getScoreTone(
  score: number,
): MetricCardTone {
  if (
    score >=
    75
  ) {
    return 'success'
  }

  if (
    score >=
    50
  ) {
    return 'warning'
  }

  return 'danger'
}

function getPriorityLabel(
  priority:
    EducationalContextPriority,
): string {
  if (
    priority ===
    'critical'
  ) {
    return 'Crítica'
  }

  if (
    priority ===
    'high'
  ) {
    return 'Alta'
  }

  if (
    priority ===
    'medium'
  ) {
    return 'Média'
  }

  if (
    priority ===
    'low'
  ) {
    return 'Baixa'
  }

  return 'Normal'
}

function getPriorityTone(
  priority:
    EducationalContextPriority,
): RecommendationCardTone {
  if (
    priority ===
    'critical'
  ) {
    return 'danger'
  }

  if (
    priority ===
      'high' ||
    priority ===
      'medium'
  ) {
    return 'warning'
  }

  return 'brand'
}

function getAlertTone({
  priority,
  riskLevel,
}: {
  priority:
    EducationalContextPriority

  riskLevel:
    EducationalContextRiskLevel
}): AlertCardTone {
  if (
    priority ===
      'critical' ||
    riskLevel ===
      'critical' ||
    riskLevel ===
      'high'
  ) {
    return 'critical'
  }

  if (
    priority ===
      'high' ||
    priority ===
      'medium' ||
    riskLevel ===
      'medium'
  ) {
    return 'warning'
  }

  if (
    riskLevel ===
    'low'
  ) {
    return 'attention'
  }

  return 'neutral'
}

function PriorityCard({
  priority,
}: {
  priority:
    EducationalContextDailyPriority
}) {
  return (
    <RecommendationCard
      title={
        priority.title
      }
      description={
        priority.description
      }
      reason={
        priority.reason
      }
      label="Prioridade"
      priorityLabel={
        getPriorityLabel(
          priority.priority,
        )
      }
      tone={
        getPriorityTone(
          priority.priority,
        )
      }
      href={
        priority.actionHref ??
        undefined
      }
      actionLabel={
        priority.actionLabel ??
        undefined
      }
    />
  )
}

function LoadingPanel() {
  return (
    <section
      aria-label="Painel Hoje"
      aria-busy="true"
      className="rounded-shell border border-border bg-surface p-7 shadow-card sm:p-9"
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">
        Professor Digital
      </p>

      <h2 className="mt-4 text-3xl font-bold tracking-tight text-content-primary">
        Preparando seu dia
      </h2>

      <p className="mt-4 max-w-3xl leading-7 text-content-secondary">
        O Context Engine está analisando planejamentos, objetivos, aulas,
        evidências e indicadores.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {
          Array.from({
            length:
              5,
          }).map(
            (
              _,
              index,
            ) => (
              <MetricCard
                key={
                  index
                }
                title="Carregando"
                loading
              />
            ),
          )
        }
      </div>
    </section>
  )
}

function ErrorPanel({
  message,
  onReload,
}: {
  message: string

  onReload:
    () => void
}) {
  return (
    <section
      aria-label="Painel Hoje indisponível"
      className="rounded-shell border border-status-warningBorder bg-status-warningBackground p-7 shadow-card sm:p-9"
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-status-warning">
        Painel Hoje indisponível
      </p>

      <h2 className="mt-4 text-2xl font-bold text-content-primary">
        Não foi possível carregar o contexto educacional
      </h2>

      <p className="mt-4 max-w-3xl leading-7 text-content-secondary">
        {
          message
        }
      </p>

      <button
        type="button"
        onClick={
          onReload
        }
        className="mt-6 rounded-full bg-brand-secondary px-6 py-3 font-semibold text-white transition duration-250 hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
      >
        Tentar novamente
      </button>
    </section>
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
      <LoadingPanel />
    )
  }

  if (
    error ||
    !context
  ) {
    return (
      <ErrorPanel
        message={
          error ??
          'O Context Engine não retornou dados para este usuário.'
        }
        onReload={
          () => {
            void reload()
          }
        }
      />
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
      .slice(
        1,
        4,
      )

  const visibleAlerts =
    dailySummary
      .alerts
      .slice(
        0,
        3,
      )

  const visibleRecommendations =
    dailySummary
      .recommendations
      .slice(
        0,
        3,
      )

  const visibleInsights =
    dailySummary
      .insights
      .slice(
        0,
        3,
      )

  const sourcesLabel =
    metadata.sources.length >
    0
      ? metadata.sources
          .map(
            formatSource,
          )
          .join(', ')
      : 'Nenhuma fonte'

  const statusItems:
    PageShellStatusItem[] = [
      {
        label:
          'Contexto',

        value:
          getContextStatusLabel(
            metadata.status,
          ),

        tone:
          getContextStatusTone(
            metadata.status,
          ),
      },
      {
        label:
          'Qualidade',

        value:
          metadata
            .dataQualityScore ===
          null
            ? 'Não calculada'
            : `${metadata.dataQualityScore}%`,

        tone:
          metadata
            .dataQualityScore !==
            null &&
          metadata
            .dataQualityScore >=
            75
            ? 'success'
            : 'warning',
      },
      {
        label:
          'Atualização',

        value:
          formatGeneratedAt(
            generatedAt,
          ),

        tone:
          'brand',
      },
    ]

  return (
    <PageShell
      productName="Professor Digital"
      eyebrow="Painel Hoje"
      title={
        dailySummary.greeting
      }
      description={
        dailySummary.summary
      }
      headerId="professor-digital-today-title"
      statusItems={
        statusItems
      }
      actions={
        <>
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
            className="rounded-full bg-white px-6 py-3 font-semibold text-brand-primary transition duration-250 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            {
              refreshing
                ? 'Atualizando...'
                : 'Atualizar contexto'
            }
          </button>

          <Link
            href="/agenda/dashboard"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition duration-250 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            Abrir Agenda EDI
          </Link>
        </>
      }
      contentClassName="space-y-8"
    >
      {
        warnings.length >
        0 ? (
          <AlertCard
            title="O contexto possui avisos"
            description={
              warnings.join(
                ' ',
              )
            }
            explanation="Os avisos indicam fontes incompletas, dados ainda não conectados ou condições que podem reduzir a precisão das análises."
            label="Aviso de contexto"
            tone="warning"
          />
        ) : null
      }

      <section
        aria-labelledby="today-metrics-title"
      >
        <SectionHeader
          eyebrow="Indicadores operacionais"
          title="Resumo do contexto atual"
          description={`Fontes utilizadas: ${sourcesLabel}.`}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Aulas hoje"
            value={
              agenda
                .lessons
                .scheduledToday
            }
            description="Aulas previstas para a data atual."
            tone="brand"
            href="/agenda/aulas"
            actionLabel="Abrir aulas"
          />

          <MetricCard
            title="Tarefas hoje"
            value={
              agenda
                .tasks
                .dueToday
            }
            description="Tarefas com prazo para hoje."
            tone={
              agenda
                .tasks
                .dueToday >
              0
                ? 'info'
                : 'default'
            }
            href="/agenda/tarefas"
            actionLabel="Abrir tarefas"
          />

          <MetricCard
            title="Evidências pendentes"
            value={
              agenda
                .lessons
                .completedWithoutEvidence
            }
            description="Aulas realizadas ainda sem documentação."
            tone={
              agenda
                .lessons
                .completedWithoutEvidence >
              0
                ? 'warning'
                : 'success'
            }
            href="/agenda/evidencias"
            actionLabel="Abrir evidências"
          />

          <MetricCard
            title="Score EDI"
            value={
              indicators
                .overallScore
            }
            statusLabel={
              getScoreLabel(
                indicators
                  .overallScore,
              )
            }
            description="Síntese dos indicadores disponíveis no contexto."
            tone={
              getScoreTone(
                indicators
                  .overallScore,
              )
            }
            progress={
              indicators
                .overallScore
            }
            progressLabel="Score atual"
          />

          <MetricCard
            title="Saúde pedagógica"
            value={
              indicators
                .pedagogicalHealthIndex
            }
            statusLabel={
              getScoreLabel(
                indicators
                  .pedagogicalHealthIndex,
              )
            }
            description="Visão integrada de planejamento, execução, evidências e organização."
            tone={
              getScoreTone(
                indicators
                  .pedagogicalHealthIndex,
              )
            }
            progress={
              indicators
                .pedagogicalHealthIndex
            }
            progressLabel="Índice atual"
          />
        </div>
      </section>

      {
        primaryPriority ? (
          <section
            aria-labelledby="main-priority-title"
          >
            <SectionHeader
              eyebrow="Prioridade principal"
              title="O que precisa de atenção agora"
              description="A prioridade é calculada a partir do contexto operacional disponível."
            />

            <div className="mt-6">
              <PriorityCard
                priority={
                  primaryPriority
                }
              />
            </div>
          </section>
        ) : null
      }

      {
        secondaryPriorities.length >
        0 ? (
          <section
            aria-labelledby="other-priorities-title"
          >
            <SectionHeader
              title="Outras prioridades"
              description="Ações adicionais organizadas por relevância e urgência."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {
                secondaryPriorities.map(
                  priority => (
                    <PriorityCard
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
        ) : null
      }

      {
        visibleAlerts.length >
        0 ? (
          <section
            aria-labelledby="today-alerts-title"
          >
            <SectionHeader
              eyebrow="Alertas"
              title="Pontos que exigem acompanhamento"
              description="Os alertas destacam riscos e pendências identificados pelo Context Engine."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {
                visibleAlerts.map(
                  alert => (
                    <AlertCard
                      key={
                        alert.id
                      }
                      title={
                        alert.title
                      }
                      description={
                        alert.description
                      }
                      explanation={
                        alert.reason
                      }
                      label={
                        alert.priority ===
                        'critical'
                          ? 'Alerta crítico'
                          : 'Alerta'
                      }
                      tone={
                        getAlertTone({
                          priority:
                            alert.priority,

                          riskLevel:
                            alert.riskLevel,
                        })
                      }
                      href={
                        alert.actionHref ??
                        undefined
                      }
                      actionLabel={
                        alert.recommendedAction ??
                        undefined
                      }
                    />
                  ),
                )
              }
            </div>
          </section>
        ) : null
      }

      {
        visibleRecommendations.length >
        0 ? (
          <section
            aria-labelledby="today-recommendations-title"
          >
            <SectionHeader
              eyebrow="Recomendações explicáveis"
              title="Próximas ações recomendadas"
              description="Cada recomendação apresenta o motivo e o impacto esperado."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {
                visibleRecommendations.map(
                  recommendation => (
                    <RecommendationCard
                      key={
                        recommendation.id
                      }
                      title={
                        recommendation.title
                      }
                      description={
                        recommendation.description
                      }
                      reason={
                        recommendation.reason
                      }
                      expectedImpact={
                        recommendation.expectedImpact ??
                        undefined
                      }
                      priorityLabel={
                        getPriorityLabel(
                          recommendation.priority,
                        )
                      }
                      tone={
                        getPriorityTone(
                          recommendation.priority,
                        )
                      }
                      href={
                        recommendation.actionHref ??
                        undefined
                      }
                      actionLabel={
                        recommendation.actionLabel ??
                        undefined
                      }
                      requiresConfirmation={
                        recommendation.requiresConfirmation
                      }
                    />
                  ),
                )
              }
            </div>
          </section>
        ) : null
      }

      {
        visibleInsights.length >
        0 ? (
          <section
            aria-labelledby="today-insights-title"
          >
            <SectionHeader
              eyebrow="Professor Digital observou"
              title="Insights do contexto atual"
              description="Leituras explicáveis produzidas a partir dos indicadores disponíveis."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {
                visibleInsights.map(
                  insight => (
                    <InsightCard
                      key={
                        insight.id
                      }
                      title={
                        insight.title
                      }
                      description={
                        insight.description
                      }
                      explanation={
                        insight.explanation
                      }
                      sourceLabel={
                        formatSource(
                          insight.source,
                        )
                      }
                      confidence={
                        insight.confidence
                      }
                      generatedAt={
                        insight.generatedAt
                      }
                    />
                  ),
                )
              }
            </div>
          </section>
        ) : null
      }

      <section
        aria-labelledby="quick-actions-title"
        className="rounded-panel border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        <SectionHeader
          eyebrow="Ações rápidas"
          title="Acesse os principais módulos"
          description="Continue o ciclo pedagógico nos módulos integrados à Agenda Inteligente EDI."
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/agenda/planejamento"
            className="rounded-full bg-brand-secondary px-6 py-3 font-semibold text-white transition duration-250 hover:bg-brand-hover"
          >
            Planejamento
          </Link>

          <Link
            href="/agenda/objetivos"
            className="rounded-full border border-border-strong bg-surface px-6 py-3 font-semibold text-brand-primary transition duration-250 hover:bg-surface-muted"
          >
            Objetivos
          </Link>

          <Link
            href="/agenda/aulas"
            className="rounded-full border border-border-strong bg-surface px-6 py-3 font-semibold text-brand-primary transition duration-250 hover:bg-surface-muted"
          >
            Aulas
          </Link>

          <Link
            href="/agenda/evidencias"
            className="rounded-full border border-border-strong bg-surface px-6 py-3 font-semibold text-brand-primary transition duration-250 hover:bg-surface-muted"
          >
            Evidências
          </Link>

          <Link
            href="/professor-digital/recomendacoes"
            className="rounded-full border border-border-strong bg-surface px-6 py-3 font-semibold text-brand-primary transition duration-250 hover:bg-surface-muted"
          >
            Recomendações
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
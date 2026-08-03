import Link from 'next/link'

import type {
  ReactNode,
} from 'react'

export type MetricCardTone =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

export type MetricCardTrend =
  | 'up'
  | 'down'
  | 'stable'

export type MetricCardProps = {
  title: string

  value?:
    | string
    | number
    | null

  description?: string

  supportingText?: string

  statusLabel?: string

  tone?: MetricCardTone

  trend?: MetricCardTrend

  variation?: string

  progress?: number | null

  progressLabel?: string

  icon?: ReactNode

  footer?: ReactNode

  href?: string

  actionLabel?: string

  loading?: boolean

  empty?: boolean

  emptyLabel?: string

  className?: string

  ariaLabel?: string
}

function joinClasses(
  ...classes:
    Array<
      string |
      null |
      undefined |
      false
    >
): string {
  return classes
    .filter(Boolean)
    .join(' ')
}

function normalizeProgress(
  value:
    number | null | undefined,
): number | null {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value),
    ),
  )
}

function getToneClasses(
  tone:
    MetricCardTone,
): {
  accent: string

  badge: string

  icon: string

  value: string

  progress: string
} {
  if (
    tone ===
    'brand'
  ) {
    return {
      accent:
        'bg-brand-secondary',

      badge:
        'border-border-brand bg-brand-soft text-brand-secondary',

      icon:
        'border-border-brand bg-brand-soft text-brand-secondary',

      value:
        'text-brand-primary',

      progress:
        'bg-brand-secondary',
    }
  }

  if (
    tone ===
    'success'
  ) {
    return {
      accent:
        'bg-status-success',

      badge:
        'border-status-successBorder bg-status-successBackground text-status-success',

      icon:
        'border-status-successBorder bg-status-successBackground text-status-success',

      value:
        'text-status-success',

      progress:
        'bg-status-success',
    }
  }

  if (
    tone ===
    'warning'
  ) {
    return {
      accent:
        'bg-status-warning',

      badge:
        'border-status-warningBorder bg-status-warningBackground text-status-warning',

      icon:
        'border-status-warningBorder bg-status-warningBackground text-status-warning',

      value:
        'text-status-warning',

      progress:
        'bg-status-warning',
    }
  }

  if (
    tone ===
    'danger'
  ) {
    return {
      accent:
        'bg-status-danger',

      badge:
        'border-status-dangerBorder bg-status-dangerBackground text-status-danger',

      icon:
        'border-status-dangerBorder bg-status-dangerBackground text-status-danger',

      value:
        'text-status-danger',

      progress:
        'bg-status-danger',
    }
  }

  if (
    tone ===
    'info'
  ) {
    return {
      accent:
        'bg-status-info',

      badge:
        'border-status-infoBorder bg-status-infoBackground text-status-info',

      icon:
        'border-status-infoBorder bg-status-infoBackground text-status-info',

      value:
        'text-status-info',

      progress:
        'bg-status-info',
    }
  }

  return {
    accent:
      'bg-slate-400',

    badge:
      'border-border bg-surface-muted text-content-secondary',

    icon:
      'border-border bg-surface-muted text-content-secondary',

    value:
      'text-content-primary',

    progress:
      'bg-brand-secondary',
  }
}

function getTrendSymbol(
  trend:
    MetricCardTrend,
): string {
  if (
    trend ===
    'up'
  ) {
    return '↑'
  }

  if (
    trend ===
    'down'
  ) {
    return '↓'
  }

  return '→'
}

function getTrendClasses(
  trend:
    MetricCardTrend,
): string {
  if (
    trend ===
    'up'
  ) {
    return 'text-status-success'
  }

  if (
    trend ===
    'down'
  ) {
    return 'text-status-danger'
  }

  return 'text-content-muted'
}

function MetricCardLoading() {
  return (
    <article
      aria-busy="true"
      aria-label="Carregando indicador"
      className="relative overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-card"
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-slate-200" />

      <div className="animate-pulse">
        <div className="h-3 w-24 rounded-full bg-slate-200" />

        <div className="mt-5 h-10 w-32 rounded-xl bg-slate-200" />

        <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />

        <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100" />
      </div>
    </article>
  )
}

function MetricCardContent({
  title,
  value,
  description,
  supportingText,
  statusLabel,
  tone =
    'default',
  trend,
  variation,
  progress,
  progressLabel,
  icon,
  footer,
  actionLabel,
  empty,
  emptyLabel,
}: Omit<
  MetricCardProps,
  | 'href'
  | 'loading'
  | 'className'
  | 'ariaLabel'
>) {
  const toneClasses =
    getToneClasses(
      tone,
    )

  const normalizedProgress =
    normalizeProgress(
      progress,
    )

  const hasTrend =
    Boolean(
      trend &&
      variation,
    )

  return (
    <>
      <div
        aria-hidden="true"
        className={joinClasses(
          'absolute left-0 top-0 h-full w-1',
          toneClasses.accent,
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-content-muted">
            {
              title
            }
          </p>

          {
            empty ? (
              <p className="mt-4 text-lg font-semibold text-content-muted">
                {
                  emptyLabel ??
                  'Sem dados disponíveis'
                }
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
                <p
                  className={joinClasses(
                    'text-4xl font-bold tracking-tight sm:text-5xl',
                    toneClasses.value,
                  )}
                >
                  {
                    value ??
                    0
                  }
                </p>

                {
                  hasTrend &&
                  trend &&
                  variation ? (
                    <span
                      className={joinClasses(
                        'mb-1 inline-flex items-center gap-1 text-sm font-bold',
                        getTrendClasses(
                          trend,
                        ),
                      )}
                    >
                      <span
                        aria-hidden="true"
                      >
                        {
                          getTrendSymbol(
                            trend,
                          )
                        }
                      </span>

                      {
                        variation
                      }
                    </span>
                  ) : null
                }
              </div>
            )
          }
        </div>

        {
          icon ? (
            <div
              className={joinClasses(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                toneClasses.icon,
              )}
            >
              {
                icon
              }
            </div>
          ) : null
        }
      </div>

      {
        statusLabel ? (
          <div className="mt-4">
            <span
              className={joinClasses(
                'inline-flex rounded-full border px-3 py-1 text-xs font-bold',
                toneClasses.badge,
              )}
            >
              {
                statusLabel
              }
            </span>
          </div>
        ) : null
      }

      {
        description ? (
          <p className="mt-4 text-sm leading-6 text-content-secondary">
            {
              description
            }
          </p>
        ) : null
      }

      {
        supportingText ? (
          <p className="mt-2 text-sm leading-6 text-content-muted">
            {
              supportingText
            }
          </p>
        ) : null
      }

      {
        normalizedProgress !==
        null ? (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-content-muted">
              <span>
                {
                  progressLabel ??
                  'Progresso'
                }
              </span>

              <span>
                {
                  normalizedProgress
                }
                %
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuemin={
                0
              }
              aria-valuemax={
                100
              }
              aria-valuenow={
                normalizedProgress
              }
              aria-label={
                progressLabel ??
                title
              }
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className={joinClasses(
                  'h-full rounded-full transition-all duration-250',
                  toneClasses.progress,
                )}
                style={{
                  width:
                    `${normalizedProgress}%`,
                }}
              />
            </div>
          </div>
        ) : null
      }

      {
        footer ||
        actionLabel ? (
          <div className="mt-6 border-t border-border pt-4">
            {
              footer ?? (
                <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-secondary">
                  {
                    actionLabel
                  }

                  <span
                    aria-hidden="true"
                  >
                    →
                  </span>
                </span>
              )
            }
          </div>
        ) : null
      }
    </>
  )
}

export function MetricCard({
  title,
  value =
    null,
  description,
  supportingText,
  statusLabel,
  tone =
    'default',
  trend,
  variation,
  progress =
    null,
  progressLabel,
  icon,
  footer,
  href,
  actionLabel,
  loading =
    false,
  empty =
    false,
  emptyLabel,
  className,
  ariaLabel,
}: MetricCardProps) {
  if (loading) {
    return (
      <MetricCardLoading />
    )
  }

  const cardClasses =
    joinClasses(
      'relative h-full overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-card',
      href &&
        'group transition duration-250 hover:-translate-y-0.5 hover:border-border-brand hover:shadow-panel focus-within:border-border-brand',
      className,
    )

  const content = (
    <MetricCardContent
      title={
        title
      }
      value={
        value
      }
      description={
        description
      }
      supportingText={
        supportingText
      }
      statusLabel={
        statusLabel
      }
      tone={
        tone
      }
      trend={
        trend
      }
      variation={
        variation
      }
      progress={
        progress
      }
      progressLabel={
        progressLabel
      }
      icon={
        icon
      }
      footer={
        footer
      }
      actionLabel={
        actionLabel
      }
      empty={
        empty
      }
      emptyLabel={
        emptyLabel
      }
    />
  )

  if (href) {
    return (
      <Link
        href={
          href
        }
        aria-label={
          ariaLabel ??
          `${title}: ${String(
            value ??
            emptyLabel ??
            'sem dados',
          )}`
        }
        className={joinClasses(
          cardClasses,
          'block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2',
        )}
      >
        {
          content
        }
      </Link>
    )
  }

  return (
    <article
      aria-label={
        ariaLabel ??
        title
      }
      className={
        cardClasses
      }
    >
      {
        content
      }
    </article>
  )
}
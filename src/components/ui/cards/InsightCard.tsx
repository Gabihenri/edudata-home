import Link from 'next/link'

import type {
  ReactNode,
} from 'react'

export type InsightCardTone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'

export type InsightCardProps = {
  title: string

  description: string

  explanation?: string

  label?: string

  tone?: InsightCardTone

  confidence?: number | null

  sourceLabel?: string

  generatedAt?: string | null

  icon?: ReactNode

  href?: string

  actionLabel?: string

  footer?: ReactNode

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

function normalizeConfidence(
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

  const normalizedValue =
    value <=
    1
      ? value *
        100
      : value

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        normalizedValue,
      ),
    ),
  )
}

function formatGeneratedAt(
  value:
    string | null | undefined,
): string | null {
  if (!value) {
    return null
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
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

function getToneClasses(
  tone:
    InsightCardTone,
): {
  accent: string

  badge: string

  icon: string

  progress: string

  action: string
} {
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

      progress:
        'bg-status-success',

      action:
        'bg-status-success text-white hover:opacity-90',
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

      progress:
        'bg-status-warning',

      action:
        'bg-status-warning text-white hover:opacity-90',
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

      progress:
        'bg-status-danger',

      action:
        'bg-status-danger text-white hover:opacity-90',
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

      progress:
        'bg-status-info',

      action:
        'bg-status-info text-white hover:opacity-90',
    }
  }

  if (
    tone ===
    'neutral'
  ) {
    return {
      accent:
        'bg-slate-400',

      badge:
        'border-border bg-surface-muted text-content-secondary',

      icon:
        'border-border bg-surface-muted text-content-secondary',

      progress:
        'bg-slate-400',

      action:
        'bg-brand-secondary text-white hover:bg-brand-hover',
    }
  }

  return {
    accent:
      'bg-brand-secondary',

    badge:
      'border-border-brand bg-brand-soft text-brand-secondary',

    icon:
      'border-border-brand bg-brand-soft text-brand-secondary',

    progress:
      'bg-brand-secondary',

    action:
      'bg-brand-secondary text-white hover:bg-brand-hover',
  }
}

export function InsightCard({
  title,
  description,
  explanation,
  label =
    'Insight',
  tone =
    'brand',
  confidence =
    null,
  sourceLabel,
  generatedAt =
    null,
  icon,
  href,
  actionLabel,
  footer,
  className,
  ariaLabel,
}: InsightCardProps) {
  const toneClasses =
    getToneClasses(
      tone,
    )

  const normalizedConfidence =
    normalizeConfidence(
      confidence,
    )

  const formattedGeneratedAt =
    formatGeneratedAt(
      generatedAt,
    )

  return (
    <article
      aria-label={
        ariaLabel ??
        title
      }
      className={joinClasses(
        'relative h-full overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-card',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={joinClasses(
          'absolute left-0 top-0 h-full w-1',
          toneClasses.accent,
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={joinClasses(
                'inline-flex rounded-full border px-3 py-1 text-xs font-bold',
                toneClasses.badge,
              )}
            >
              {
                label
              }
            </span>

            {
              sourceLabel ? (
                <span className="inline-flex rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold text-content-muted">
                  {
                    sourceLabel
                  }
                </span>
              ) : null
            }
          </div>

          <h3 className="mt-4 text-xl font-bold text-content-primary">
            {
              title
            }
          </h3>
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

      <p className="mt-4 text-sm leading-6 text-content-secondary">
        {
          description
        }
      </p>

      {
        explanation ? (
          <div className="mt-5 rounded-card border border-border bg-surface-muted p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-content-muted">
              Como interpretar
            </p>

            <p className="mt-2 text-sm leading-6 text-content-secondary">
              {
                explanation
              }
            </p>
          </div>
        ) : null
      }

      {
        normalizedConfidence !==
        null ? (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-content-muted">
              <span>
                Confiança da análise
              </span>

              <span>
                {
                  normalizedConfidence
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
                normalizedConfidence
              }
              aria-label="Confiança da análise"
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className={joinClasses(
                  'h-full rounded-full transition-all duration-250',
                  toneClasses.progress,
                )}
                style={{
                  width:
                    `${normalizedConfidence}%`,
                }}
              />
            </div>
          </div>
        ) : null
      }

      {
        formattedGeneratedAt ? (
          <p className="mt-4 text-xs leading-5 text-content-muted">
            Gerado em{' '}
            {
              formattedGeneratedAt
            }
          </p>
        ) : null
      }

      {
        footer ? (
          <div className="mt-6 border-t border-border pt-4">
            {
              footer
            }
          </div>
        ) : null
      }

      {
        href &&
        actionLabel ? (
          <div className="mt-6">
            <Link
              href={
                href
              }
              className={joinClasses(
                'inline-flex rounded-full px-5 py-3 text-sm font-semibold transition duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2',
                toneClasses.action,
              )}
            >
              {
                actionLabel
              }
            </Link>
          </div>
        ) : null
      }
    </article>
  )
}
import Link from 'next/link'

import type {
  ReactNode,
} from 'react'

export type AlertCardTone =
  | 'critical'
  | 'warning'
  | 'attention'
  | 'positive'
  | 'neutral'

export type AlertCardProps = {
  title: string

  description: string

  explanation?: string

  label?: string

  tone?: AlertCardTone

  value?:
    | string
    | number
    | null

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

function getToneClasses(
  tone:
    AlertCardTone,
): {
  accent: string

  badge: string

  icon: string

  value: string

  action: string
} {
  if (
    tone ===
    'critical'
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

      action:
        'bg-status-danger text-white hover:opacity-90',
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

      action:
        'bg-status-warning text-white hover:opacity-90',
    }
  }

  if (
    tone ===
    'attention'
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

      action:
        'bg-status-info text-white hover:opacity-90',
    }
  }

  if (
    tone ===
    'positive'
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

      action:
        'bg-status-success text-white hover:opacity-90',
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

    action:
      'bg-brand-secondary text-white hover:bg-brand-hover',
  }
}

export function AlertCard({
  title,
  description,
  explanation,
  label =
    'Alerta',
  tone =
    'warning',
  value = null,
  icon,
  href,
  actionLabel,
  footer,
  className,
  ariaLabel,
}: AlertCardProps) {
  const toneClasses =
    getToneClasses(
      tone,
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

      {
        value !==
        null ? (
          <p
            className={joinClasses(
              'mt-5 text-4xl font-bold tracking-tight',
              toneClasses.value,
            )}
          >
            {
              value
            }
          </p>
        ) : null
      }

      <p className="mt-4 text-sm leading-6 text-content-secondary">
        {
          description
        }
      </p>

      {
        explanation ? (
          <div className="mt-5 rounded-card border border-border bg-surface-muted p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-content-muted">
              Por que isso importa
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
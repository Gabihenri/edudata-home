import type {
  ReactNode,
} from 'react'

export type PageShellStatusItem = {
  label: string

  value: string

  tone?:
    | 'default'
    | 'brand'
    | 'success'
    | 'warning'
    | 'danger'
}

export type PageShellPrinciple = {
  label: string
}

export type PageShellProps = {
  productName: string

  eyebrow: string

  title: string

  description: string

  children?: ReactNode

  actions?: ReactNode

  statusItems?:
    PageShellStatusItem[]

  principles?:
    PageShellPrinciple[]

  className?: string

  contentClassName?: string

  headerId?: string

  maxWidth?:
    | 'content'
    | 'readable'
    | 'full'
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

function getStatusItemClasses(
  tone:
    PageShellStatusItem['tone'] =
      'default',
): string {
  if (
    tone ===
    'brand'
  ) {
    return [
      'border-brand-accent/20',
      'bg-brand-accent/10',
      'text-white',
    ].join(' ')
  }

  if (
    tone ===
    'success'
  ) {
    return [
      'border-status-successBorder/30',
      'bg-status-success/10',
      'text-white',
    ].join(' ')
  }

  if (
    tone ===
    'warning'
  ) {
    return [
      'border-status-warningBorder/30',
      'bg-status-warning/10',
      'text-white',
    ].join(' ')
  }

  if (
    tone ===
    'danger'
  ) {
    return [
      'border-status-dangerBorder/30',
      'bg-status-danger/10',
      'text-white',
    ].join(' ')
  }

  return [
    'border-white/10',
    'bg-white/5',
    'text-white',
  ].join(' ')
}

function getStatusLabelClasses(
  tone:
    PageShellStatusItem['tone'] =
      'default',
): string {
  if (
    tone ===
    'brand'
  ) {
    return 'text-cyan-200'
  }

  if (
    tone ===
    'success'
  ) {
    return 'text-emerald-200'
  }

  if (
    tone ===
    'warning'
  ) {
    return 'text-amber-200'
  }

  if (
    tone ===
    'danger'
  ) {
    return 'text-rose-200'
  }

  return 'text-slate-400'
}

function getMaxWidthClasses(
  maxWidth:
    PageShellProps['maxWidth'],
): string {
  if (
    maxWidth ===
    'readable'
  ) {
    return 'max-w-readable'
  }

  if (
    maxWidth ===
    'full'
  ) {
    return 'max-w-none'
  }

  return 'max-w-content'
}

export function PageShell({
  productName,
  eyebrow,
  title,
  description,
  children,
  actions,
  statusItems = [],
  principles = [
    {
      label:
        'Evidências',
    },
    {
      label:
        'Inclusão',
    },
    {
      label:
        'Inteligência',
    },
  ],
  className,
  contentClassName,
  headerId =
    'eios-page-title',
  maxWidth =
    'content',
}: PageShellProps) {
  const hasStatusItems =
    statusItems.length >
    0

  const hasPrinciples =
    principles.length >
    0

  return (
    <section
      className={joinClasses(
        'mx-auto w-full',
        getMaxWidthClasses(
          maxWidth,
        ),
        className,
      )}
    >
      <header
        aria-labelledby={
          headerId
        }
        className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-brand-primary text-content-inverse shadow-card sm:rounded-shell"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-brand-accent/15" />

          <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full border border-brand-accent/10" />

          <div className="absolute bottom-0 right-0 h-px w-2/3 bg-brand-line" />

          <div className="absolute bottom-0 right-[18%] h-24 w-px bg-gradient-to-t from-brand-accent/25 to-transparent" />

          <div className="absolute left-0 top-0 h-full w-1.5 bg-brand-secondary" />
        </div>

        <div className="relative px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">
            <span className="text-brand-accent">
              EIOS
            </span>

            <span
              aria-hidden="true"
              className="text-slate-500"
            >
              /
            </span>

            <span className="text-slate-300">
              {
                productName
              }
            </span>
          </div>

          <div
            className={joinClasses(
              'mt-6 grid gap-6',
              hasStatusItems
                ? 'lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end'
                : 'lg:grid-cols-1',
            )}
          >
            <div className="min-w-0">
              <p className="text-label-sm uppercase text-brand-accent">
                {
                  eyebrow
                }
              </p>

              <h1
                id={
                  headerId
                }
                className="mt-3 max-w-4xl font-display text-display-xs text-white sm:text-display-sm lg:text-display-md"
              >
                {
                  title
                }
              </h1>

              <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {
                  description
                }
              </p>

              {
                actions ? (
                  <div className="mt-7 flex flex-wrap gap-3">
                    {
                      actions
                    }
                  </div>
                ) : null
              }
            </div>

            {
              hasStatusItems ? (
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-md lg:justify-end">
                  {
                    statusItems.map(
                      (
                        item,
                      ) => (
                        <div
                          key={
                            `${item.label}-${item.value}`
                          }
                          className={joinClasses(
                            'min-w-32 rounded-xl border px-4 py-3',
                            getStatusItemClasses(
                              item.tone,
                            ),
                          )}
                        >
                          <p
                            className={joinClasses(
                              'text-label-xs uppercase',
                              getStatusLabelClasses(
                                item.tone,
                              ),
                            )}
                          >
                            {
                              item.label
                            }
                          </p>

                          <p className="mt-1 text-sm font-bold text-white">
                            {
                              item.value
                            }
                          </p>
                        </div>
                      ),
                    )
                  }
                </div>
              ) : null
            }
          </div>
        </div>

        {
          hasPrinciples ? (
            <div
              className="relative grid border-t border-white/10 bg-white/[0.03]"
              style={{
                gridTemplateColumns:
                  `repeat(${principles.length}, minmax(0, 1fr))`,
              }}
            >
              {
                principles.map(
                  (
                    principle,
                    index,
                  ) => (
                    <div
                      key={
                        principle.label
                      }
                      className={joinClasses(
                        'px-3 py-3 text-center sm:px-5',
                        index <
                          principles.length -
                            1 &&
                          'border-r border-white/10',
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {
                          principle.label
                        }
                      </p>
                    </div>
                  ),
                )
              }
            </div>
          ) : null
        }
      </header>

      {
        children ? (
          <div
            className={joinClasses(
              'mt-6 sm:mt-8',
              contentClassName,
            )}
          >
            {
              children
            }
          </div>
        ) : null
      }
    </section>
  )
}
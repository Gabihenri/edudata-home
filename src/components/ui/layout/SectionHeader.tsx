import type { ReactNode } from 'react'

export type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  align = 'left',
  className,
}: SectionHeaderProps) {
  const centered = align === 'center'

  return (
    <header
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        centered && 'items-center text-center md:flex-col md:items-center',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-label-sm uppercase text-brand-secondary">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-2 font-display text-3xl font-bold text-content-primary md:text-4xl">
          {title}
        </h2>

        {description ? (
          <p className="mt-3 max-w-readable text-base leading-7 text-content-secondary">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div
          className={cn(
            'flex flex-wrap gap-3',
            centered && 'justify-center',
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  )
}
import Link from 'next/link'

export type IntelligentTimelineStatus =
  | 'completed'
  | 'pending'
  | 'attention'
  | 'cancelled'
  | 'informational'

export type IntelligentTimelineItem = {
  id: string

  title: string
  description: string

  date: string

  time?: string | null

  status:
    IntelligentTimelineStatus

  category?: string | null

  href?: string | null

  actionLabel?: string | null

  contextLabel?: string | null

  relatedRecords?: number | null
}

type IntelligentTimelineProps = {
  items?: IntelligentTimelineItem[]

  title?: string

  description?: string

  loading?: boolean

  maximumItems?: number

  emptyTitle?: string

  emptyDescription?: string
}

type TimelineStatusAppearance = {
  label: string

  markerClassName: string

  badgeClassName: string

  borderClassName: string

  backgroundClassName: string
}

type TimelineGroup = {
  key: string

  label: string

  date: Date

  items: IntelligentTimelineItem[]
}

const STATUS_APPEARANCE:
  Record<
    IntelligentTimelineStatus,
    TimelineStatusAppearance
  > = {
    completed: {
      label:
        'Concluído',

      markerClassName:
        'border-emerald-600 bg-emerald-600',

      badgeClassName:
        'border-emerald-200 bg-emerald-50 text-emerald-700',

      borderClassName:
        'border-emerald-200',

      backgroundClassName:
        'bg-emerald-50/50',
    },

    pending: {
      label:
        'Pendente',

      markerClassName:
        'border-amber-500 bg-white',

      badgeClassName:
        'border-amber-200 bg-amber-50 text-amber-700',

      borderClassName:
        'border-amber-200',

      backgroundClassName:
        'bg-amber-50/50',
    },

    attention: {
      label:
        'Atenção',

      markerClassName:
        'border-red-600 bg-red-600',

      badgeClassName:
        'border-red-200 bg-red-50 text-red-700',

      borderClassName:
        'border-red-200',

      backgroundClassName:
        'bg-red-50/50',
    },

    cancelled: {
      label:
        'Cancelado',

      markerClassName:
        'border-slate-400 bg-slate-400',

      badgeClassName:
        'border-slate-200 bg-slate-100 text-slate-600',

      borderClassName:
        'border-slate-200',

      backgroundClassName:
        'bg-slate-50',
    },

    informational: {
      label:
        'Informativo',

      markerClassName:
        'border-sky-600 bg-sky-600',

      badgeClassName:
        'border-sky-200 bg-sky-50 text-sky-700',

      borderClassName:
        'border-sky-200',

      backgroundClassName:
        'bg-sky-50/50',
    },
  }

const STATUS_ORDER:
  Record<
    IntelligentTimelineStatus,
    number
  > = {
    attention:
      0,

    pending:
      1,

    informational:
      2,

    completed:
      3,

    cancelled:
      4,
  }

function normalizeText(
  value:
    string |
    null |
    undefined,
): string {
  if (
    typeof value !==
    'string'
  ) {
    return ''
  }

  return value.trim()
}

function normalizeMaximumItems(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 12
  }

  return Math.min(
    Math.max(
      Math.trunc(
        value,
      ),
      1,
    ),
    50,
  )
}

function normalizeRelatedRecords(
  value:
    number |
    null |
    undefined,
): number | null {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(
      value,
    )
  ) {
    return null
  }

  return Math.max(
    Math.trunc(
      value,
    ),
    0,
  )
}

function parseDate(
  value: string,
): Date | null {
  const date =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return date
}

function getDateKey(
  date: Date,
): string {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() +
      1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}

function formatGroupLabel(
  date: Date,
): string {
  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0,
  )

  const currentDate =
    new Date(
      date,
    )

  currentDate.setHours(
    0,
    0,
    0,
    0,
  )

  const differenceInDays =
    Math.round(
      (
        currentDate.getTime() -
        today.getTime()
      ) /
      86_400_000,
    )

  if (
    differenceInDays ===
    0
  ) {
    return 'Hoje'
  }

  if (
    differenceInDays ===
    -1
  ) {
    return 'Ontem'
  }

  if (
    differenceInDays ===
    1
  ) {
    return 'Amanhã'
  }

  const formattedDate =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        weekday:
          'long',

        day:
          '2-digit',

        month:
          'long',
      },
    ).format(
      date,
    )

  return (
    formattedDate
      .charAt(0)
      .toUpperCase() +
    formattedDate.slice(
      1,
    )
  )
}

function formatTime(
  item: IntelligentTimelineItem,
): string | null {
  const explicitTime =
    normalizeText(
      item.time,
    )

  if (
    explicitTime
  ) {
    return explicitTime
  }

  const date =
    parseDate(
      item.date,
    )

  if (
    !date
  ) {
    return null
  }

  const hasTime =
    date.getHours() !==
      0 ||
    date.getMinutes() !==
      0

  if (
    !hasTime
  ) {
    return null
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  ).format(
    date,
  )
}

function normalizeHref(
  value:
    string |
    null |
    undefined,
): string | null {
  const href =
    normalizeText(
      value,
    )

  if (
    !href ||
    !href.startsWith(
      '/',
    )
  ) {
    return null
  }

  return href
}

function sortTimelineItems(
  items:
    IntelligentTimelineItem[],
): IntelligentTimelineItem[] {
  return [
    ...items,
  ].sort(
    (
      firstItem,
      secondItem,
    ) => {
      const firstDate =
        parseDate(
          firstItem.date,
        )

      const secondDate =
        parseDate(
          secondItem.date,
        )

      if (
        firstDate &&
        secondDate
      ) {
        const dateDifference =
          firstDate.getTime() -
          secondDate.getTime()

        if (
          dateDifference !==
          0
        ) {
          return dateDifference
        }
      }

      const statusDifference =
        STATUS_ORDER[
          firstItem.status
        ] -
        STATUS_ORDER[
          secondItem.status
        ]

      if (
        statusDifference !==
        0
      ) {
        return statusDifference
      }

      return firstItem.title.localeCompare(
        secondItem.title,
        'pt-BR',
      )
    },
  )
}

function groupTimelineItems(
  items:
    IntelligentTimelineItem[],
): TimelineGroup[] {
  const groups =
    new Map<
      string,
      TimelineGroup
    >()

  items.forEach(
    item => {
      const date =
        parseDate(
          item.date,
        )

      if (
        !date
      ) {
        return
      }

      const key =
        getDateKey(
          date,
        )

      const existingGroup =
        groups.get(
          key,
        )

      if (
        existingGroup
      ) {
        existingGroup.items.push(
          item,
        )

        return
      }

      groups.set(
        key,
        {
          key,

          label:
            formatGroupLabel(
              date,
            ),

          date,

          items: [
            item,
          ],
        },
      )
    },
  )

  return Array.from(
    groups.values(),
  ).sort(
    (
      firstGroup,
      secondGroup,
    ) =>
      firstGroup.date.getTime() -
      secondGroup.date.getTime(),
  )
}

function IntelligentTimelineSkeleton() {
  return (
    <section
      aria-label="Carregando linha do tempo pedagógica"
      aria-busy="true"
      className="
        animate-pulse
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      <div
        className="
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-7
        "
      >
        <div
          className="
            h-4
            w-40
            rounded
            bg-slate-200
          "
        />

        <div
          className="
            mt-3
            h-7
            w-72
            max-w-full
            rounded
            bg-slate-200
          "
        />

        <div
          className="
            mt-3
            h-4
            w-full
            max-w-2xl
            rounded
            bg-slate-100
          "
        />
      </div>

      <div
        className="
          space-y-6
          p-5
          sm:p-7
        "
      >
        {Array.from({
          length:
            3,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={
                index
              }
            >
              <div
                className="
                  h-5
                  w-28
                  rounded
                  bg-slate-200
                "
              />

              <div
                className="
                  mt-4
                  space-y-3
                "
              >
                {Array.from({
                  length:
                    2,
                }).map(
                  (
                    __,
                    itemIndex,
                  ) => (
                    <div
                      key={
                        itemIndex
                      }
                      className="
                        h-32
                        rounded-2xl
                        bg-slate-100
                      "
                    />
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  )
}

function IntelligentTimelineEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      className="
        px-5
        py-10
        sm:px-7
      "
    >
      <div
        className="
          mx-auto
          max-w-xl
          rounded-3xl
          border
          border-dashed
          border-slate-300
          bg-slate-50
          px-6
          py-9
          text-center
        "
      >
        <div
          aria-hidden="true"
          className="
            mx-auto
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            border
            border-cyan-200
            bg-cyan-50
          "
        >
          <div
            className="
              relative
              h-7
              w-7
            "
          >
            <span
              className="
                absolute
                left-1/2
                top-0
                h-full
                w-px
                -translate-x-1/2
                bg-cyan-700
              "
            />

            <span
              className="
                absolute
                left-1/2
                top-1
                h-2
                w-2
                -translate-x-1/2
                rounded-full
                bg-cyan-700
              "
            />

            <span
              className="
                absolute
                bottom-1
                left-1/2
                h-2
                w-2
                -translate-x-1/2
                rounded-full
                bg-cyan-700
              "
            />
          </div>
        </div>

        <h3
          className="
            mt-5
            text-lg
            font-bold
            text-slate-950
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-slate-600
          "
        >
          {description}
        </p>
      </div>
    </div>
  )
}

function TimelineItemCard({
  item,
  isLast,
}: {
  item:
    IntelligentTimelineItem

  isLast: boolean
}) {
  const appearance =
    STATUS_APPEARANCE[
      item.status
    ]

  const time =
    formatTime(
      item,
    )

  const category =
    normalizeText(
      item.category,
    )

  const contextLabel =
    normalizeText(
      item.contextLabel,
    )

  const actionLabel =
    normalizeText(
      item.actionLabel,
    ) ||
    'Abrir registro'

  const href =
    normalizeHref(
      item.href,
    )

  const relatedRecords =
    normalizeRelatedRecords(
      item.relatedRecords,
    )

  return (
    <article
      className="
        relative
        grid
        grid-cols-[28px_minmax(0,1fr)]
        gap-3
      "
    >
      <div
        aria-hidden="true"
        className="
          relative
          flex
          justify-center
        "
      >
        {!isLast ? (
          <span
            className="
              absolute
              left-1/2
              top-5
              h-[calc(100%+0.75rem)]
              w-px
              -translate-x-1/2
              bg-slate-200
            "
          />
        ) : null}

        <span
          className={`
            relative
            z-10
            mt-1
            h-4
            w-4
            rounded-full
            border-[3px]
            ${appearance.markerClassName}
          `}
        />
      </div>

      <div
        className={`
          rounded-2xl
          border
          p-4
          sm:p-5
          ${appearance.borderClassName}
          ${appearance.backgroundClassName}
        `}
      >
        <div
          className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div
            className="
              min-w-0
            "
          >
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <span
                className={`
                  inline-flex
                  items-center
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  ${appearance.badgeClassName}
                `}
              >
                {appearance.label}
              </span>

              {category ? (
                <span
                  className="
                    inline-flex
                    items-center
                    rounded-full
                    border
                    border-slate-200
                    bg-white/70
                    px-2.5
                    py-1
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-slate-600
                  "
                >
                  {category}
                </span>
              ) : null}

              {time ? (
                <span
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                  "
                >
                  {time}
                </span>
              ) : null}
            </div>

            <h4
              className="
                mt-3
                text-base
                font-bold
                leading-6
                text-slate-950
                sm:text-lg
              "
            >
              {item.title}
            </h4>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-700
              "
            >
              {item.description}
            </p>
          </div>

          {href ? (
            <Link
              href={
                href
              }
              className="
                inline-flex
                min-h-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-sm
                font-semibold
                text-slate-800
                transition
                hover:border-cyan-400
                hover:text-cyan-800
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-cyan-600
                focus-visible:ring-offset-2
              "
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>

        {contextLabel ||
        relatedRecords !==
          null ? (
          <div
            className="
              mt-4
              flex
              flex-wrap
              gap-2
              border-t
              border-slate-200/70
              pt-4
            "
          >
            {contextLabel ? (
              <span
                className="
                  inline-flex
                  items-center
                  rounded-full
                  border
                  border-slate-200
                  bg-white/70
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-slate-600
                "
              >
                {contextLabel}
              </span>
            ) : null}

            {relatedRecords !==
            null ? (
              <span
                className="
                  inline-flex
                  items-center
                  rounded-full
                  border
                  border-slate-200
                  bg-white/70
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-slate-600
                "
              >
                {new Intl.NumberFormat(
                  'pt-BR',
                ).format(
                  relatedRecords,
                )}{' '}
                registro(s)
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function IntelligentTimeline({
  items =
    [],

  title =
    'Linha do tempo pedagógica',

  description =
    'Visão cronológica dos registros, pendências e acontecimentos do ciclo pedagógico.',

  loading =
    false,

  maximumItems =
    12,

  emptyTitle =
    'Nenhum acontecimento disponível',

  emptyDescription =
    'Ainda não existem registros suficientes para compor a linha do tempo pedagógica.',
}: IntelligentTimelineProps) {
  if (
    loading
  ) {
    return (
      <IntelligentTimelineSkeleton />
    )
  }

  const normalizedMaximumItems =
    normalizeMaximumItems(
      maximumItems,
    )

  const validItems =
    items.filter(
      item =>
        Boolean(
          item.id &&
          item.title &&
          parseDate(
            item.date,
          ),
        ),
    )

  const orderedItems =
    sortTimelineItems(
      validItems,
    )

  const visibleItems =
    orderedItems.slice(
      0,
      normalizedMaximumItems,
    )

  const groups =
    groupTimelineItems(
      visibleItems,
    )

  const hiddenItemsCount =
    Math.max(
      orderedItems.length -
        visibleItems.length,
      0,
    )

  return (
    <section
      aria-labelledby="intelligent-timeline-title"
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-[0_20px_70px_-50px_rgba(15,23,42,0.55)]
      "
    >
      <div
        className="
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-7
        "
      >
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.18em]
            text-cyan-700
          "
        >
          Centro de Comando
        </p>

        <h2
          id="intelligent-timeline-title"
          className="
            mt-1
            text-xl
            font-bold
            tracking-tight
            text-slate-950
            sm:text-2xl
          "
        >
          {title}
        </h2>

        <p
          className="
            mt-2
            max-w-3xl
            text-sm
            leading-6
            text-slate-600
          "
        >
          {description}
        </p>
      </div>

      {groups.length ===
      0 ? (
        <IntelligentTimelineEmptyState
          title={
            emptyTitle
          }
          description={
            emptyDescription
          }
        />
      ) : (
        <div
          className="
            space-y-8
            p-5
            sm:p-7
          "
        >
          {groups.map(
            group => (
              <section
                key={
                  group.key
                }
                aria-labelledby={
                  `timeline-group-${group.key}`
                }
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <h3
                    id={
                      `timeline-group-${group.key}`
                    }
                    className="
                      text-sm
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-slate-800
                    "
                  >
                    {group.label}
                  </h3>

                  <span
                    aria-hidden="true"
                    className="
                      h-px
                      flex-1
                      bg-slate-200
                    "
                  />
                </div>

                <div
                  className="
                    mt-4
                    space-y-3
                  "
                >
                  {group.items.map(
                    (
                      item,
                      index,
                    ) => (
                      <TimelineItemCard
                        key={
                          item.id
                        }
                        item={
                          item
                        }
                        isLast={
                          index ===
                          group.items.length -
                            1
                        }
                      />
                    ),
                  )}
                </div>
              </section>
            ),
          )}
        </div>
      )}

      <footer
        className="
          border-t
          border-slate-100
          bg-slate-50/70
          px-5
          py-4
          sm:px-7
        "
      >
        <div
          className="
            flex
            flex-col
            gap-2
            text-xs
            text-slate-500
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p>
            A linha do tempo apresenta registros autorizados e não altera
            informações do ciclo pedagógico.
          </p>

          <p
            className="
              font-medium
              text-slate-600
            "
          >
            {hiddenItemsCount >
            0
              ? `${hiddenItemsCount} item(ns) adicional(is) não exibido(s)`
              : `${orderedItems.length} item(ns) analisado(s)`}
          </p>
        </div>
      </footer>
    </section>
  )
}
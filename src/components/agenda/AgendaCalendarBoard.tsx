'use client'

import {
  type CSSProperties,
  useMemo,
} from 'react'

export type AgendaCalendarView =
  | 'day'
  | 'week'
  | 'month'

export type AgendaCalendarBoardEvent = {
  id: string
  title: string
  description?: string | null
  event_type: string
  start_at: string
  end_at?: string | null
  status: string
  priority: string
  schedule_mode?: string | null
  source_template_id?: string | null
}

type AgendaCalendarBoardProps = {
  events: AgendaCalendarBoardEvent[]
  view: AgendaCalendarView
  selectedDate: Date
  loading?: boolean
  canCreateEvent?: boolean

  onViewChange: (
    view: AgendaCalendarView,
  ) => void

  onSelectedDateChange: (
    date: Date,
  ) => void

  onCreateEvent?: (
    date: Date,
  ) => void

  onSelectEvent?: (
    event: AgendaCalendarBoardEvent,
  ) => void
}

type PositionedEvent = {
  event: AgendaCalendarBoardEvent
  startMinute: number
  endMinute: number
  column: number
  totalColumns: number
}

type EventVisual = {
  container: string
  dot: string
}

const TIMEZONE =
  'America/Sao_Paulo'

const DAY_START_HOUR = 6
const DAY_END_HOUR = 23
const HOUR_HEIGHT = 64

const WEEKDAY_SHORT =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      weekday: 'short',
    },
  )

const DAY_MONTH =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
    },
  )

const MONTH_YEAR =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      month: 'long',
      year: 'numeric',
    },
  )

const LONG_DATE =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  )

const EVENT_TIME =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        TIMEZONE,

      hour:
        '2-digit',

      minute:
        '2-digit',

      hourCycle:
        'h23',
    },
  )

function padNumber(
  value: number,
): string {
  return String(value).padStart(
    2,
    '0',
  )
}

function formatDateInput(
  date: Date,
): string {
  return [
    date.getFullYear(),

    padNumber(
      date.getMonth() + 1,
    ),

    padNumber(
      date.getDate(),
    ),
  ].join('-')
}

function parseDateInput(
  value: string,
): Date {
  const [
    year,
    month,
    day,
  ] =
    value
      .split('-')
      .map(Number)

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0,
  )
}

function startOfDay(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  )
}

function addDays(
  date: Date,
  amount: number,
): Date {
  const result =
    new Date(date)

  result.setDate(
    result.getDate() +
    amount,
  )

  return result
}

function addMonths(
  date: Date,
  amount: number,
): Date {
  const result =
    new Date(
      date.getFullYear(),
      date.getMonth() +
        amount,
      1,
      12,
      0,
      0,
      0,
    )

  return result
}

function startOfWeek(
  date: Date,
): Date {
  const result =
    startOfDay(date)

  const weekday =
    result.getDay() === 0
      ? 7
      : result.getDay()

  result.setDate(
    result.getDate() -
      weekday +
      1,
  )

  return result
}

function startOfMonth(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0,
  )
}

function isSameDay(
  firstDate: Date,
  secondDate: Date,
): boolean {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  )
}

function isSameMonth(
  firstDate: Date,
  secondDate: Date,
): boolean {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth()
  )
}

function capitalize(
  value: string,
): string {
  if (!value) {
    return value
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  )
}

function normalizeLabel(
  value: string,
): string {
  return capitalize(
    value
      .replace(
        /[_-]+/g,
        ' ',
      )
      .trim(),
  )
}

function getDateKeyInTimeZone(
  value: string | Date,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          TIMEZONE,

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',
      },
    ).formatToParts(date)

  const year =
    parts.find(
      part =>
        part.type ===
        'year',
    )?.value

  const month =
    parts.find(
      part =>
        part.type ===
        'month',
    )?.value

  const day =
    parts.find(
      part =>
        part.type ===
        'day',
    )?.value

  if (
    !year ||
    !month ||
    !day
  ) {
    return ''
  }

  return `${year}-${month}-${day}`
}

function getMinutesInTimeZone(
  value: string,
): number {
  const date =
    new Date(value)

  const parts =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          TIMEZONE,

        hour:
          '2-digit',

        minute:
          '2-digit',

        hourCycle:
          'h23',
      },
    ).formatToParts(date)

  const hour =
    Number(
      parts.find(
        part =>
          part.type ===
          'hour',
      )?.value ??
        0,
    )

  const minute =
    Number(
      parts.find(
        part =>
          part.type ===
          'minute',
      )?.value ??
        0,
    )

  return (
    hour * 60 +
    minute
  )
}

function getEventEndDate(
  event:
    AgendaCalendarBoardEvent,
): Date {
  const start =
    new Date(
      event.start_at,
    )

  if (event.end_at) {
    const informedEnd =
      new Date(
        event.end_at,
      )

    if (
      !Number.isNaN(
        informedEnd.getTime(),
      )
    ) {
      return informedEnd
    }
  }

  return new Date(
    start.getTime() +
      50 * 60 * 1000,
  )
}

function eventIntersectsRange(
  event:
    AgendaCalendarBoardEvent,

  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const eventStart =
    new Date(
      event.start_at,
    )

  const eventEnd =
    getEventEndDate(
      event,
    )

  return (
    eventStart <
      rangeEnd &&
    eventEnd >
      rangeStart
  )
}

function sortEvents(
  events:
    AgendaCalendarBoardEvent[],
): AgendaCalendarBoardEvent[] {
  return [
    ...events,
  ].sort(
    (
      firstEvent,
      secondEvent,
    ) =>
      new Date(
        firstEvent.start_at,
      ).getTime() -
      new Date(
        secondEvent.start_at,
      ).getTime(),
  )
}

function getEventVisual(
  event:
    AgendaCalendarBoardEvent,
): EventVisual {
  if (
    event.priority ===
      'urgente'
  ) {
    return {
      container:
        'border-red-300 bg-red-50 text-red-950',

      dot:
        'bg-red-600',
    }
  }

  if (
    event.event_type ===
      'aula'
  ) {
    return {
      container:
        'border-blue-300 bg-blue-50 text-blue-950',

      dot:
        'bg-blue-600',
    }
  }

  if (
    event.event_type ===
      'pedagogico' ||
    event.event_type ===
      'planejamento' ||
    event.event_type ===
      'acompanhamento'
  ) {
    return {
      container:
        'border-violet-300 bg-violet-50 text-violet-950',

      dot:
        'bg-violet-600',
    }
  }

  if (
    event.event_type ===
      'formacao'
  ) {
    return {
      container:
        'border-cyan-300 bg-cyan-50 text-cyan-950',

      dot:
        'bg-cyan-700',
    }
  }

  if (
    event.event_type ===
      'prazo' ||
    event.event_type ===
      'avaliacao'
  ) {
    return {
      container:
        'border-amber-300 bg-amber-50 text-amber-950',

      dot:
        'bg-amber-500',
    }
  }

  if (
    event.event_type ===
      'acao_institucional'
  ) {
    return {
      container:
        'border-rose-300 bg-rose-50 text-rose-950',

      dot:
        'bg-rose-600',
    }
  }

  return {
    container:
      'border-slate-300 bg-slate-50 text-slate-950',

    dot:
      'bg-slate-600',
  }
}

function getPositionedEvents(
  events:
    AgendaCalendarBoardEvent[],
): PositionedEvent[] {
  const rangeStart =
    DAY_START_HOUR *
    60

  const rangeEnd =
    DAY_END_HOUR *
    60

  const prepared =
    sortEvents(events)
      .map(event => {
        const startMinute =
          Math.max(
            rangeStart,
            getMinutesInTimeZone(
              event.start_at,
            ),
          )

        const eventEndDate =
          getEventEndDate(
            event,
          )

        const endDateKey =
          getDateKeyInTimeZone(
            eventEndDate,
          )

        const startDateKey =
          getDateKeyInTimeZone(
            event.start_at,
          )

        let endMinute =
          endDateKey !==
          startDateKey
            ? rangeEnd
            : getMinutesInTimeZone(
                eventEndDate.toISOString(),
              )

        if (
          endMinute <=
          startMinute
        ) {
          endMinute =
            startMinute +
            50
        }

        return {
          event,

          startMinute:
            Math.max(
              rangeStart,
              Math.min(
                startMinute,
                rangeEnd,
              ),
            ),

          endMinute:
            Math.max(
              rangeStart,
              Math.min(
                endMinute,
                rangeEnd,
              ),
            ),
        }
      })
      .filter(
        item =>
          item.endMinute >
          item.startMinute,
      )

  const columnEnds:
    number[] = []

  const positioned =
    prepared.map(item => {
      let column =
        columnEnds.findIndex(
          endMinute =>
            item.startMinute >=
            endMinute,
        )

      if (column === -1) {
        column =
          columnEnds.length

        columnEnds.push(
          item.endMinute,
        )
      } else {
        columnEnds[column] =
          item.endMinute
      }

      return {
        ...item,
        column,
      }
    })

  const totalColumns =
    Math.max(
      1,
      columnEnds.length,
    )

  return positioned.map(
    item => ({
      ...item,
      totalColumns,
    }),
  )
}

function getVisibleRange(
  view:
    AgendaCalendarView,

  selectedDate: Date,
): {
  start: Date
  end: Date
} {
  if (view === 'day') {
    const start =
      startOfDay(
        selectedDate,
      )

    return {
      start,
      end:
        addDays(
          start,
          1,
        ),
    }
  }

  if (view === 'week') {
    const start =
      startOfWeek(
        selectedDate,
      )

    return {
      start,
      end:
        addDays(
          start,
          7,
        ),
    }
  }

  const monthStart =
    startOfMonth(
      selectedDate,
    )

  const start =
    startOfWeek(
      monthStart,
    )

  return {
    start,
    end:
      addDays(
        start,
        42,
      ),
  }
}

function getHeaderLabel(
  view:
    AgendaCalendarView,

  selectedDate: Date,
): string {
  if (view === 'day') {
    return capitalize(
      LONG_DATE.format(
        selectedDate,
      ),
    )
  }

  if (view === 'week') {
    const firstDay =
      startOfWeek(
        selectedDate,
      )

    const lastDay =
      addDays(
        firstDay,
        6,
      )

    return `${DAY_MONTH.format(
      firstDay,
    )} – ${DAY_MONTH.format(
      lastDay,
    )}`
  }

  return capitalize(
    MONTH_YEAR.format(
      selectedDate,
    ),
  )
}

function getDayEvents(
  eventsByDate:
    Map<
      string,
      AgendaCalendarBoardEvent[]
    >,

  date: Date,
): AgendaCalendarBoardEvent[] {
  return (
    eventsByDate.get(
      formatDateInput(
        date,
      ),
    ) ??
    []
  )
}

function EventButton({
  event,
  compact = false,
  onSelectEvent,
}: {
  event:
    AgendaCalendarBoardEvent

  compact?: boolean

  onSelectEvent?: (
    event:
      AgendaCalendarBoardEvent,
  ) => void
}) {
  const visual =
    getEventVisual(
      event,
    )

  return (
    <button
      type="button"
      onClick={() =>
        onSelectEvent?.(
          event,
        )
      }
      className={[
        'w-full min-w-0 rounded-xl border text-left transition',
        'hover:brightness-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-1',
        visual.container,
        compact
          ? 'px-2 py-1.5'
          : 'p-4',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-start gap-2">
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${visual.dot}`}
        />

        <div className="min-w-0">
          <p
            className={
              compact
                ? 'truncate text-xs font-bold'
                : 'break-words text-sm font-bold'
            }
          >
            {event.title}
          </p>

          <p
            className={
              compact
                ? 'mt-1 truncate text-[10px] opacity-75'
                : 'mt-2 text-xs font-semibold opacity-75'
            }
          >
            {EVENT_TIME.format(
              new Date(
                event.start_at,
              ),
            )}

            {' • '}

            {normalizeLabel(
              event.event_type,
            )}
          </p>
        </div>
      </div>
    </button>
  )
}

function Timeline({
  date,
  events,
  onSelectEvent,
}: {
  date: Date

  events:
    AgendaCalendarBoardEvent[]

  onSelectEvent?: (
    event:
      AgendaCalendarBoardEvent,
  ) => void
}) {
  const hours =
    Array.from(
      {
        length:
          DAY_END_HOUR -
          DAY_START_HOUR +
          1,
      },

      (
        _,
        index,
      ) =>
        DAY_START_HOUR +
        index,
    )

  const positionedEvents =
    getPositionedEvents(
      events,
    )

  const totalHeight =
    (
      DAY_END_HOUR -
      DAY_START_HOUR
    ) *
    HOUR_HEIGHT

  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] border-t border-slate-200">
      <div
        className="relative border-r border-slate-200 bg-slate-50"
        style={{
          height:
            totalHeight,
        }}
      >
        {hours.map(
          (
            hour,
            index,
          ) => (
            <span
              key={
                hour
              }
              className="absolute right-2 -translate-y-2 text-[10px] font-semibold text-slate-400"
              style={{
                top:
                  index *
                  HOUR_HEIGHT,
              }}
            >
              {padNumber(
                hour,
              )}
              :00
            </span>
          ),
        )}
      </div>

      <div
        className="relative bg-white"
        style={{
          height:
            totalHeight,
        }}
      >
        {hours.map(
          (
            hour,
            index,
          ) => (
            <div
              key={
                hour
              }
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-slate-200"
              style={{
                top:
                  index *
                  HOUR_HEIGHT,
              }}
            />
          ),
        )}

        {positionedEvents.map(
          positionedEvent => {
            const top =
              (
                positionedEvent
                  .startMinute -
                DAY_START_HOUR *
                  60
              ) /
              60 *
              HOUR_HEIGHT

            const height =
              Math.max(
                32,

                (
                  positionedEvent
                    .endMinute -
                  positionedEvent
                    .startMinute
                ) /
                  60 *
                  HOUR_HEIGHT -
                  4,
              )

            const width =
              100 /
              positionedEvent
                .totalColumns

            const left =
              positionedEvent
                .column *
              width

            const visual =
              getEventVisual(
                positionedEvent
                  .event,
              )

            const style:
              CSSProperties = {
              top:
                top + 2,

              height,

              left:
                `calc(${left}% + 2px)`,

              width:
                `calc(${width}% - 4px)`,
            }

            return (
              <button
                key={
                  positionedEvent
                    .event.id
                }
                type="button"
                onClick={() =>
                  onSelectEvent?.(
                    positionedEvent
                      .event,
                  )
                }
                style={
                  style
                }
                className={[
                  'absolute z-10 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-sm',
                  'transition hover:z-20 hover:shadow-md focus:z-20 focus:outline-none focus:ring-2 focus:ring-cyan-600',
                  visual.container,
                ].join(' ')}
              >
                <p className="truncate text-[11px] font-bold">
                  {
                    positionedEvent
                      .event.title
                  }
                </p>

                <p className="mt-0.5 truncate text-[10px] font-semibold opacity-75">
                  {EVENT_TIME.format(
                    new Date(
                      positionedEvent
                        .event
                        .start_at,
                    ),
                  )}
                </p>
              </button>
            )
          },
        )}

        {events.length ===
        0 ? (
          <div className="absolute inset-x-4 top-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Nenhum compromisso neste dia.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DayView({
  selectedDate,
  events,
  onSelectEvent,
}: {
  selectedDate: Date

  events:
    AgendaCalendarBoardEvent[]

  onSelectEvent?: (
    event:
      AgendaCalendarBoardEvent,
  ) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
          Visão diária
        </p>

        <h3 className="mt-2 text-xl font-bold text-[#071827]">
          {capitalize(
            LONG_DATE.format(
              selectedDate,
            ),
          )}
        </h3>
      </header>

      <Timeline
        date={
          selectedDate
        }
        events={
          events
        }
        onSelectEvent={
          onSelectEvent
        }
      />
    </section>
  )
}

function WeekView({
  selectedDate,
  eventsByDate,
  onSelectEvent,
  onSelectedDateChange,
}: {
  selectedDate: Date

  eventsByDate:
    Map<
      string,
      AgendaCalendarBoardEvent[]
    >

  onSelectEvent?: (
    event:
      AgendaCalendarBoardEvent,
  ) => void

  onSelectedDateChange: (
    date: Date,
  ) => void
}) {
  const weekStart =
    startOfWeek(
      selectedDate,
    )

  const days =
    Array.from(
      {
        length: 7,
      },

      (
        _,
        index,
      ) =>
        addDays(
          weekStart,
          index,
        ),
    )

  return (
    <>
      <div className="space-y-4 lg:hidden">
        {days.map(
          date => {
            const dayEvents =
              getDayEvents(
                eventsByDate,
                date,
              )

            return (
              <section
                key={
                  formatDateInput(
                    date,
                  )
                }
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectedDateChange(
                      date,
                    )
                  }
                  className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-4 text-left"
                >
                  <span className="font-bold text-[#071827]">
                    {capitalize(
                      WEEKDAY_SHORT.format(
                        date,
                      ),
                    )}
                  </span>

                  <span className="text-sm font-semibold text-slate-500">
                    {DAY_MONTH.format(
                      date,
                    )}
                  </span>
                </button>

                <div className="space-y-3 p-4">
                  {dayEvents.length >
                  0 ? (
                    dayEvents.map(
                      event => (
                        <EventButton
                          key={
                            event.id
                          }
                          event={
                            event
                          }
                          onSelectEvent={
                            onSelectEvent
                          }
                        />
                      ),
                    )
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                      Sem compromissos.
                    </p>
                  )}
                </div>
              </section>
            )
          },
        )}
      </div>

      <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block">
        <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-slate-200">
          <div className="bg-slate-50" />

          {days.map(
            date => (
              <button
                key={
                  formatDateInput(
                    date,
                  )
                }
                type="button"
                onClick={() =>
                  onSelectedDateChange(
                    date,
                  )
                }
                className={[
                  'border-l border-slate-200 px-2 py-3 text-center transition hover:bg-cyan-50',
                  isSameDay(
                    date,
                    new Date(),
                  )
                    ? 'bg-cyan-50'
                    : 'bg-slate-50',
                ].join(' ')}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {WEEKDAY_SHORT.format(
                    date,
                  )}
                </p>

                <p
                  className={[
                    'mt-1 text-lg font-bold',
                    isSameDay(
                      date,
                      new Date(),
                    )
                      ? 'text-cyan-800'
                      : 'text-[#071827]',
                  ].join(' ')}
                >
                  {date.getDate()}
                </p>
              </button>
            ),
          )}
        </div>

        <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))]">
          <div
            className="relative border-r border-slate-200 bg-slate-50"
            style={{
              height:
                (
                  DAY_END_HOUR -
                  DAY_START_HOUR
                ) *
                HOUR_HEIGHT,
            }}
          >
            {Array.from(
              {
                length:
                  DAY_END_HOUR -
                  DAY_START_HOUR +
                  1,
              },

              (
                _,
                index,
              ) => {
                const hour =
                  DAY_START_HOUR +
                  index

                return (
                  <span
                    key={
                      hour
                    }
                    className="absolute right-2 -translate-y-2 text-[10px] font-semibold text-slate-400"
                    style={{
                      top:
                        index *
                        HOUR_HEIGHT,
                    }}
                  >
                    {padNumber(
                      hour,
                    )}
                    :00
                  </span>
                )
              },
            )}
          </div>

          {days.map(
            date => {
              const dayEvents =
                getDayEvents(
                  eventsByDate,
                  date,
                )

              const positionedEvents =
                getPositionedEvents(
                  dayEvents,
                )

              return (
                <div
                  key={
                    formatDateInput(
                      date,
                    )
                  }
                  className="relative border-l border-slate-200"
                  style={{
                    height:
                      (
                        DAY_END_HOUR -
                        DAY_START_HOUR
                      ) *
                      HOUR_HEIGHT,
                  }}
                >
                  {Array.from(
                    {
                      length:
                        DAY_END_HOUR -
                        DAY_START_HOUR +
                        1,
                    },

                    (
                      _,
                      index,
                    ) => (
                      <div
                        key={
                          index
                        }
                        aria-hidden="true"
                        className="absolute inset-x-0 border-t border-slate-200"
                        style={{
                          top:
                            index *
                            HOUR_HEIGHT,
                        }}
                      />
                    ),
                  )}

                  {positionedEvents.map(
                    positionedEvent => {
                      const top =
                        (
                          positionedEvent
                            .startMinute -
                          DAY_START_HOUR *
                            60
                        ) /
                        60 *
                        HOUR_HEIGHT

                      const height =
                        Math.max(
                          30,

                          (
                            positionedEvent
                              .endMinute -
                            positionedEvent
                              .startMinute
                          ) /
                            60 *
                            HOUR_HEIGHT -
                            4,
                        )

                      const width =
                        100 /
                        positionedEvent
                          .totalColumns

                      const left =
                        positionedEvent
                          .column *
                        width

                      const visual =
                        getEventVisual(
                          positionedEvent
                            .event,
                        )

                      return (
                        <button
                          key={
                            positionedEvent
                              .event.id
                          }
                          type="button"
                          onClick={() =>
                            onSelectEvent?.(
                              positionedEvent
                                .event,
                            )
                          }
                          style={{
                            top:
                              top + 2,

                            height,

                            left:
                              `calc(${left}% + 2px)`,

                            width:
                              `calc(${width}% - 4px)`,
                          }}
                          className={[
                            'absolute z-10 overflow-hidden rounded-md border px-1.5 py-1 text-left shadow-sm',
                            'hover:z-20 hover:shadow-md focus:z-20 focus:outline-none focus:ring-2 focus:ring-cyan-600',
                            visual.container,
                          ].join(' ')}
                        >
                          <p className="truncate text-[10px] font-bold">
                            {
                              positionedEvent
                                .event.title
                            }
                          </p>

                          <p className="mt-0.5 truncate text-[9px] font-semibold opacity-75">
                            {EVENT_TIME.format(
                              new Date(
                                positionedEvent
                                  .event
                                  .start_at,
                              ),
                            )}
                          </p>
                        </button>
                      )
                    },
                  )}
                </div>
              )
            },
          )}
        </div>
      </section>
    </>
  )
}

function MonthView({
  selectedDate,
  eventsByDate,
  onSelectEvent,
  onSelectedDateChange,
}: {
  selectedDate: Date

  eventsByDate:
    Map<
      string,
      AgendaCalendarBoardEvent[]
    >

  onSelectEvent?: (
    event:
      AgendaCalendarBoardEvent,
  ) => void

  onSelectedDateChange: (
    date: Date,
  ) => void
}) {
  const monthStart =
    startOfMonth(
      selectedDate,
    )

  const gridStart =
    startOfWeek(
      monthStart,
    )

  const days =
    Array.from(
      {
        length: 42,
      },

      (
        _,
        index,
      ) =>
        addDays(
          gridStart,
          index,
        ),
    )

  const selectedDayEvents =
    getDayEvents(
      eventsByDate,
      selectedDate,
    )

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {[
          'Seg',
          'Ter',
          'Qua',
          'Qui',
          'Sex',
          'Sáb',
          'Dom',
        ].map(
          weekday => (
            <div
              key={
                weekday
              }
              className="border-r border-slate-200 px-1 py-3 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 last:border-r-0 sm:text-xs"
            >
              {weekday}
            </div>
          ),
        )}
      </div>

      <div className="grid grid-cols-7">
        {days.map(
          date => {
            const dayEvents =
              getDayEvents(
                eventsByDate,
                date,
              )

            const selected =
              isSameDay(
                date,
                selectedDate,
              )

            const today =
              isSameDay(
                date,
                new Date(),
              )

            const currentMonth =
              isSameMonth(
                date,
                selectedDate,
              )

            return (
              <div
                key={
                  formatDateInput(
                    date,
                  )
                }
                className={[
                  'min-h-24 min-w-0 border-b border-r border-slate-200 p-1.5 sm:min-h-32 sm:p-2',
                  currentMonth
                    ? 'bg-white'
                    : 'bg-slate-50',
                  selected
                    ? 'ring-2 ring-inset ring-cyan-600'
                    : '',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectedDateChange(
                      date,
                    )
                  }
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition sm:h-8 sm:w-8 sm:text-sm',
                    today
                      ? 'bg-[#071827] text-white'
                      : selected
                        ? 'bg-cyan-100 text-cyan-900'
                        : currentMonth
                          ? 'text-slate-800 hover:bg-slate-100'
                          : 'text-slate-400 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {date.getDate()}
                </button>

                <div className="mt-1 space-y-1">
                  {dayEvents
                    .slice(
                      0,
                      2,
                    )
                    .map(
                      event => (
                        <EventButton
                          key={
                            event.id
                          }
                          event={
                            event
                          }
                          compact
                          onSelectEvent={
                            onSelectEvent
                          }
                        />
                      ),
                    )}

                  {dayEvents.length >
                  2 ? (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectedDateChange(
                          date,
                        )
                      }
                      className="w-full rounded-md px-1 py-1 text-left text-[10px] font-bold text-cyan-800 hover:bg-cyan-50"
                    >
                      +{' '}
                      {dayEvents.length -
                        2}{' '}
                      eventos
                    </button>
                  ) : null}
                </div>
              </div>
            )
          },
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
          Dia selecionado
        </p>

        <h3 className="mt-2 text-lg font-bold text-[#071827]">
          {capitalize(
            LONG_DATE.format(
              selectedDate,
            ),
          )}
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {selectedDayEvents.length >
          0 ? (
            selectedDayEvents.map(
              event => (
                <EventButton
                  key={
                    event.id
                  }
                  event={
                    event
                  }
                  onSelectEvent={
                    onSelectEvent
                  }
                />
              ),
            )
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 md:col-span-2">
              Nenhum compromisso registrado para este dia.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export function AgendaCalendarBoard({
  events,
  view,
  selectedDate,
  loading = false,
  canCreateEvent = true,
  onViewChange,
  onSelectedDateChange,
  onCreateEvent,
  onSelectEvent,
}: AgendaCalendarBoardProps) {
  const visibleRange =
    useMemo(
      () =>
        getVisibleRange(
          view,
          selectedDate,
        ),
      [
        selectedDate,
        view,
      ],
    )

  const visibleEvents =
    useMemo(
      () =>
        sortEvents(
          events.filter(
            event =>
              eventIntersectsRange(
                event,
                visibleRange.start,
                visibleRange.end,
              ),
          ),
        ),
      [
        events,
        visibleRange.end,
        visibleRange.start,
      ],
    )

  const eventsByDate =
    useMemo(
      () => {
        const grouped =
          new Map<
            string,
            AgendaCalendarBoardEvent[]
          >()

        visibleEvents.forEach(
          event => {
            const dateKey =
              getDateKeyInTimeZone(
                event.start_at,
              )

            const currentEvents =
              grouped.get(
                dateKey,
              ) ??
              []

            currentEvents.push(
              event,
            )

            grouped.set(
              dateKey,
              currentEvents,
            )
          },
        )

        grouped.forEach(
          (
            groupedEvents,
            dateKey,
          ) => {
            grouped.set(
              dateKey,
              sortEvents(
                groupedEvents,
              ),
            )
          },
        )

        return grouped
      },
      [
        visibleEvents,
      ],
    )

  const selectedDayEvents =
    useMemo(
      () =>
        getDayEvents(
          eventsByDate,
          selectedDate,
        ),
      [
        eventsByDate,
        selectedDate,
      ],
    )

  const urgentEvents =
    useMemo(
      () =>
        visibleEvents.filter(
          event =>
            event.priority ===
              'urgente' &&
            event.status !==
              'cancelado',
        ),
      [
        visibleEvents,
      ],
    )

  function movePeriod(
    direction: number,
  ) {
    if (view === 'day') {
      onSelectedDateChange(
        addDays(
          selectedDate,
          direction,
        ),
      )

      return
    }

    if (view === 'week') {
      onSelectedDateChange(
        addDays(
          selectedDate,
          direction * 7,
        ),
      )

      return
    }

    onSelectedDateChange(
      addMonths(
        selectedDate,
        direction,
      ),
    )
  }

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
      <header className="border-b border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Agenda Operacional EDI
            </p>

            <h2 className="mt-2 break-words text-2xl font-bold text-[#071827] sm:text-3xl">
              {getHeaderLabel(
                view,
                selectedDate,
              )}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {visibleEvents.length}{' '}
              compromisso
              {visibleEvents.length ===
              1
                ? ''
                : 's'}{' '}
              no período exibido.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
            <button
              type="button"
              onClick={() =>
                onSelectedDateChange(
                  new Date(),
                )
              }
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-800"
            >
              Hoje
            </button>

            {canCreateEvent ? (
              <button
                type="button"
                onClick={() =>
                  onCreateEvent?.(
                    selectedDate,
                  )
                }
                className="min-h-11 rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-900"
              >
                Nova ação
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[auto_minmax(220px,1fr)_auto] xl:items-center">
          <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] gap-2">
            <button
              type="button"
              onClick={() =>
                movePeriod(-1)
              }
              aria-label="Período anterior"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-lg font-bold text-slate-700 hover:border-cyan-500 hover:text-cyan-800"
            >
              ←
            </button>

            <input
              type="date"
              value={
                formatDateInput(
                  selectedDate,
                )
              }
              onChange={
                event => {
                  if (
                    !event.target
                      .value
                  ) {
                    return
                  }

                  onSelectedDateChange(
                    parseDateInput(
                      event.target
                        .value,
                    ),
                  )
                }
              }
              aria-label="Selecionar data"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />

            <button
              type="button"
              onClick={() =>
                movePeriod(1)
              }
              aria-label="Próximo período"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-lg font-bold text-slate-700 hover:border-cyan-500 hover:text-cyan-800"
            >
              →
            </button>
          </div>

          <div className="hidden xl:block" />

          <div className="grid grid-cols-3 rounded-xl border border-slate-300 bg-slate-100 p-1">
            {(
              [
                {
                  value:
                    'day',

                  label:
                    'Dia',
                },
                {
                  value:
                    'week',

                  label:
                    'Semana',
                },
                {
                  value:
                    'month',

                  label:
                    'Mês',
                },
              ] as Array<{
                value:
                  AgendaCalendarView

                label:
                  string
              }>
            ).map(
              option => (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  aria-pressed={
                    view ===
                    option.value
                  }
                  onClick={() =>
                    onViewChange(
                      option.value,
                    )
                  }
                  className={[
                    'min-h-10 rounded-lg px-3 py-2 text-sm font-bold transition',
                    view ===
                    option.value
                      ? 'bg-white text-[#071827] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ),
            )}
          </div>
        </div>
      </header>

      {urgentEvents.length >
      0 ? (
        <section className="border-b border-red-200 bg-red-50 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-full bg-red-600"
            />

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
                Atenção imediata
              </p>

              <p className="mt-1 text-sm font-semibold text-red-900">
                {urgentEvents.length}{' '}
                ação
                {urgentEvents.length ===
                1
                  ? ''
                  : 'ões'}{' '}
                urgente
                {urgentEvents.length ===
                1
                  ? ''
                  : 's'}{' '}
                no período.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {urgentEvents
              .slice(
                0,
                3,
              )
              .map(
                event => (
                  <EventButton
                    key={
                      event.id
                    }
                    event={
                      event
                    }
                    onSelectEvent={
                      onSelectEvent
                    }
                  />
                ),
              )}
          </div>
        </section>
      ) : null}

      <div className="relative p-3 sm:p-5">
        {loading ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-lg">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />

              <p className="mt-3 text-sm font-bold text-slate-700">
                Atualizando agenda...
              </p>
            </div>
          </div>
        ) : null}

        {view === 'day' ? (
          <DayView
            selectedDate={
              selectedDate
            }
            events={
              selectedDayEvents
            }
            onSelectEvent={
              onSelectEvent
            }
          />
        ) : null}

        {view === 'week' ? (
          <WeekView
            selectedDate={
              selectedDate
            }
            eventsByDate={
              eventsByDate
            }
            onSelectEvent={
              onSelectEvent
            }
            onSelectedDateChange={
              onSelectedDateChange
            }
          />
        ) : null}

        {view === 'month' ? (
          <MonthView
            selectedDate={
              selectedDate
            }
            eventsByDate={
              eventsByDate
            }
            onSelectEvent={
              onSelectEvent
            }
            onSelectedDateChange={
              onSelectedDateChange
            }
          />
        ) : null}
      </div>
    </section>
  )
}
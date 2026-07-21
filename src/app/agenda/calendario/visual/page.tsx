'use client'

import {
  useState,
} from 'react'

import {
  AgendaCalendarBoard,
  type AgendaCalendarBoardEvent,
  type AgendaCalendarView,
} from '@/components/agenda/AgendaCalendarBoard'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

import {
  useEvents,
} from '@/lib/agenda/hooks/useEvents'

const TIMEZONE =
  'America/Sao_Paulo'

const DATE_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        TIMEZONE,

      weekday:
        'long',

      day:
        '2-digit',

      month:
        'long',

      year:
        'numeric',

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

function formatLabel(
  value: string,
): string {
  const normalizedValue =
    value
      .replace(
        /[_-]+/g,
        ' ',
      )
      .trim()

  if (!normalizedValue) {
    return 'Não informado'
  }

  return (
    normalizedValue
      .charAt(0)
      .toUpperCase() +
    normalizedValue.slice(1)
  )
}

function formatEventDateTime(
  value: string | null | undefined,
): string {
  if (!value) {
    return 'Não informado'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data inválida'
  }

  return DATE_TIME_FORMATTER.format(
    date,
  )
}

function getPriorityClasses(
  priority: string,
): string {
  if (
    priority === 'urgente'
  ) {
    return [
      'border-red-300',
      'bg-red-50',
      'text-red-800',
    ].join(' ')
  }

  if (
    priority === 'alta'
  ) {
    return [
      'border-orange-300',
      'bg-orange-50',
      'text-orange-800',
    ].join(' ')
  }

  if (
    priority === 'media'
  ) {
    return [
      'border-amber-300',
      'bg-amber-50',
      'text-amber-800',
    ].join(' ')
  }

  return [
    'border-emerald-300',
    'bg-emerald-50',
    'text-emerald-800',
  ].join(' ')
}

export default function AgendaCalendarVisualPage() {
  const {
    events,
    loading,
    error,
    reload,
  } = useEvents()

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<Date>(
      () =>
        new Date(),
    )

  const [
    view,
    setView,
  ] =
    useState<AgendaCalendarView>(
      'day',
    )

  const [
    selectedEvent,
    setSelectedEvent,
  ] =
    useState<
      AgendaCalendarBoardEvent |
      null
    >(null)

  function handleViewChange(
    nextView:
      AgendaCalendarView,
  ): void {
    setView(
      nextView,
    )

    setSelectedEvent(
      null,
    )
  }

  function handleSelectedDateChange(
    date: Date,
  ): void {
    setSelectedDate(
      date,
    )

    setSelectedEvent(
      null,
    )
  }

  function handleCreateEvent(
    date: Date,
  ): void {
    const selectedDateValue =
      formatDateInput(
        date,
      )

    window.location.assign(
      `/agenda/calendario?action=new&date=${encodeURIComponent(
        selectedDateValue,
      )}`,
    )
  }

  function handleSelectEvent(
    event:
      AgendaCalendarBoardEvent,
  ): void {
    setSelectedEvent(
      event,
    )

    window.setTimeout(
      () => {
        document
          .getElementById(
            'agenda-event-details',
          )
          ?.scrollIntoView({
            behavior:
              'smooth',

            block:
              'start',
          })
      },
      50,
    )
  }

  return (
    <AgendaPageShell
      eyebrow="Experiência temporal"
      title="Agenda Operacional EDI"
      description="Visualize compromissos pedagógicos, aulas, reuniões, formações e ações prioritárias em uma estrutura diária, semanal ou mensal."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
                Validação visual controlada
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">
                Novo padrão da Agenda Inteligente EDI
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Esta tela utiliza os eventos reais da conta autenticada. O cadastro, a recorrência, os horários-padrão e a exclusão permanecem preservados no fluxo atual durante esta validação.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void reload()
              }
              disabled={
                loading
              }
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300 bg-white px-5 py-3 text-sm font-bold text-cyan-900 transition hover:border-cyan-600 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Atualizando...'
                : 'Atualizar dados'}
            </button>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-700"
          >
            {error}
          </div>
        ) : null}

        <AgendaCalendarBoard
          events={
            events
          }
          view={
            view
          }
          selectedDate={
            selectedDate
          }
          loading={
            loading
          }
          canCreateEvent
          onViewChange={
            handleViewChange
          }
          onSelectedDateChange={
            handleSelectedDateChange
          }
          onCreateEvent={
            handleCreateEvent
          }
          onSelectEvent={
            handleSelectEvent
          }
        />

        {selectedEvent ? (
          <section
            id="agenda-event-details"
            className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
          >
            <header className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                    Detalhes do compromisso
                  </p>

                  <h2 className="mt-2 break-words text-2xl font-bold text-[#071827]">
                    {selectedEvent.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedEvent(
                      null,
                    )
                  }
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900"
                >
                  Fechar detalhes
                </button>
              </div>
            </header>

            <div className="space-y-6 p-5 sm:p-7">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-cyan-800">
                  {formatLabel(
                    selectedEvent
                      .event_type,
                  )}
                </span>

                <span
                  className={[
                    'rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em]',
                    getPriorityClasses(
                      selectedEvent
                        .priority,
                    ),
                  ].join(' ')}
                >
                  Prioridade:{' '}
                  {formatLabel(
                    selectedEvent
                      .priority,
                  )}
                </span>

                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-700">
                  Status:{' '}
                  {formatLabel(
                    selectedEvent
                      .status,
                  )}
                </span>
              </div>

              {selectedEvent.description ? (
                <section>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Descrição
                  </p>

                  <p className="mt-3 break-words text-sm leading-7 text-slate-700">
                    {
                      selectedEvent.description
                    }
                  </p>
                </section>
              ) : (
                <p className="text-sm italic text-slate-400">
                  Este compromisso não possui descrição complementar.
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Início
                  </p>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                    {formatEventDateTime(
                      selectedEvent
                        .start_at,
                    )}
                  </p>
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Término
                  </p>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                    {formatEventDateTime(
                      selectedEvent
                        .end_at,
                    )}
                  </p>
                </section>
              </div>

              <footer className="border-t border-slate-200 pt-5">
                <a
                  href="/agenda/calendario"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-900 sm:w-auto"
                >
                  Abrir gerenciamento atual
                </a>
              </footer>
            </div>
          </section>
        ) : null}
      </div>
    </AgendaPageShell>
  )
}
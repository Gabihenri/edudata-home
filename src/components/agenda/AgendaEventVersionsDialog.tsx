'use client'

import {
  useEffect,
} from 'react'

import { useEventVersions } from '@/lib/agenda/hooks/useEventVersions'

import type {
  AgendaEventAuditAction,
  AgendaEventAuditChange,
} from '@/lib/agenda/repository/event-audit.repository'

type AgendaEventVersionsDialogProps = {
  eventId: string
  title: string
  onClose: () => void
}

const actionLabels:
  Record<
    AgendaEventAuditAction,
    string
  > = {
    create: 'Criação',
    update: 'Alteração',
    delete: 'Exclusão',
    restore: 'Restauração',
  }

const actionDescriptions:
  Record<
    AgendaEventAuditAction,
    string
  > = {
    create:
      'O evento foi criado.',

    update:
      'Os dados do evento foram alterados.',

    delete:
      'O evento foi excluído de forma governada.',

    restore:
      'O evento foi restaurado de forma governada.',
  }

const actionClasses:
  Record<
    AgendaEventAuditAction,
    string
  > = {
    create:
      'border-cyan-200 bg-cyan-50 text-cyan-900',

    update:
      'border-blue-200 bg-blue-50 text-blue-900',

    delete:
      'border-amber-200 bg-amber-50 text-amber-950',

    restore:
      'border-emerald-200 bg-emerald-50 text-emerald-900',
  }

const actionBadgeClasses:
  Record<
    AgendaEventAuditAction,
    string
  > = {
    create:
      'bg-cyan-100 text-cyan-900',

    update:
      'bg-blue-100 text-blue-900',

    delete:
      'bg-amber-100 text-amber-950',

    restore:
      'bg-emerald-100 text-emerald-900',
  }

const fieldLabels:
  Record<string, string> = {
    title: 'Título',
    description: 'Descrição',
    event_type: 'Tipo do evento',

    start_at: 'Data e hora de início',
    end_at: 'Data e hora de término',

    status: 'Status',
    priority: 'Prioridade',

    organization_id: 'Organização',
    school_id: 'Escola',
    user_id: 'Proprietário',

    planning_id: 'Planejamento relacionado',
    evidence_id: 'Evidência relacionada',

    schedule_mode: 'Modo de agendamento',

    recurrence_frequency:
      'Frequência da recorrência',

    recurrence_interval:
      'Intervalo da recorrência',

    recurrence_until:
      'Término da recorrência',

    series_id: 'Série recorrente',
    source_template_id: 'Modelo de origem',

    week_reference:
      'Semana de referência',

    original_start_at:
      'Data original',

    is_exception:
      'Exceção da recorrência',

    deleted_at: 'Data da exclusão',
    deleted_by:
      'Responsável pela exclusão',

    deletion_reason:
      'Motivo da exclusão',

    restored_at:
      'Data da restauração',

    restored_by:
      'Responsável pela restauração',

    restore_reason:
      'Motivo da restauração',
  }

const DATE_FIELDS =
  new Set<string>([
    'start_at',
    'end_at',
    'recurrence_until',
    'week_reference',
    'original_start_at',
    'deleted_at',
    'restored_at',
  ])

function formatDateTime(
  value: string,
): string {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'long',
      timeStyle: 'short',
    },
  ).format(date)
}

function formatFieldName(
  field: string,
): string {
  const knownLabel =
    fieldLabels[field]

  if (knownLabel) {
    return knownLabel
  }

  return field
    .replace(
      /_/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    )
}

function formatIdentifier(
  value: string,
): string {
  return value.length > 18
    ? `${value.slice(
        0,
        8,
      )}…${value.slice(-6)}`
    : value
}

function formatValue(
  field: string,
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Não informado'
  }

  if (
    typeof value === 'boolean'
  ) {
    return value
      ? 'Sim'
      : 'Não'
  }

  if (
    typeof value === 'number'
  ) {
    return String(value)
  }

  if (
    typeof value === 'string'
  ) {
    if (
      DATE_FIELDS.has(field)
    ) {
      return formatDateTime(
        value,
      )
    }

    if (
      field.endsWith('_id') ||
      field.endsWith('_by')
    ) {
      return formatIdentifier(
        value,
      )
    }

    return value
  }

  try {
    return JSON.stringify(
      value,
      null,
      2,
    )
  } catch {
    return String(value)
  }
}

function getActorReference(
  value: string | null,
): string {
  if (!value) {
    return 'Responsável não identificado'
  }

  return `Usuário ${formatIdentifier(
    value,
  )}`
}

function getChangeDescription(
  changes: AgendaEventAuditChange[],
): string {
  if (changes.length === 0) {
    return 'Nenhuma diferença de campo foi disponibilizada para esta operação.'
  }

  if (changes.length === 1) {
    return '1 campo alterado'
  }

  return `${changes.length} campos alterados`
}

function ChangeItem({
  change,
}: {
  change: AgendaEventAuditChange
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-bold text-slate-900">
        {formatFieldName(
          change.field,
        )}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-700">
            Antes
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-950">
            {formatValue(
              change.field,
              change.before,
            )}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Depois
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-emerald-950">
            {formatValue(
              change.field,
              change.after,
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export function AgendaEventVersionsDialog({
  eventId,
  title,
  onClose,
}: AgendaEventVersionsDialogProps) {
  const {
    event,
    versions,
    total,
    loading,
    error,
    loadEventVersions,
    clear,
  } =
    useEventVersions()

  useEffect(() => {
    clear()

    void loadEventVersions(
      eventId,
      200,
    )
  }, [
    clear,
    eventId,
    loadEventVersions,
  ])

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    function handleKeyDown(
      keyboardEvent: KeyboardEvent,
    ): void {
      if (
        keyboardEvent.key ===
        'Escape'
      ) {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [onClose])

  const displayTitle =
    event?.title ??
    title

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/75 p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <section
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-versions-title"
      >
        <header className="shrink-0 bg-[#081C2E] px-5 py-6 text-white sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                Governança e auditoria
              </p>

              <h2
                id="event-versions-title"
                className="mt-2 text-2xl font-bold sm:text-3xl"
              >
                Linha do tempo do evento
              </h2>

              <p className="mt-3 break-words text-sm leading-6 text-slate-200 sm:text-base">
                {displayTitle}
              </p>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
              aria-label="Fechar linha do tempo"
              autoFocus
            >
              Fechar
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
              {total}{' '}
              operação
              {total === 1
                ? ''
                : 'ões'}
            </span>

            {event ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  event.isDeleted
                    ? 'bg-amber-100 text-amber-950'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {event.isDeleted
                  ? 'Evento excluído'
                  : 'Evento ativo'}
              </span>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-7">
          {loading ? (
            <div
              className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 text-cyan-950"
              role="status"
              aria-live="polite"
            >
              <p className="font-bold">
                Carregando versões
              </p>

              <p className="mt-2 text-sm leading-6">
                Consultando a trilha de auditoria do evento.
              </p>
            </div>
          ) : null}

          {error ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"
              role="alert"
            >
              <p className="font-bold">
                Não foi possível carregar a linha do tempo
              </p>

              <p className="mt-2 text-sm leading-6">
                {error}
              </p>
            </div>
          ) : null}

          {!loading &&
          !error &&
          versions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-7 text-slate-600">
              Nenhuma operação de auditoria foi encontrada para este evento.
            </div>
          ) : null}

          {!loading &&
          !error &&
          versions.length > 0 ? (
            <div className="relative space-y-5 before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-px before:bg-slate-300 sm:before:left-[1.4rem]">
              {versions.map(
                (
                  version,
                  index,
                ) => (
                  <article
                    key={
                      version.id
                    }
                    className="relative pl-11 sm:pl-14"
                  >
                    <div
                      className={`absolute left-0 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 border-slate-50 text-xs font-black shadow-sm sm:h-11 sm:w-11 ${
                        actionBadgeClasses[
                          version.action
                        ]
                      }`}
                      aria-hidden="true"
                    >
                      {versions.length -
                        index}
                    </div>

                    <div
                      className={`overflow-hidden rounded-2xl border shadow-sm ${
                        actionClasses[
                          version.action
                        ]
                      }`}
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                                actionBadgeClasses[
                                  version
                                    .action
                                ]
                              }`}
                            >
                              {
                                actionLabels[
                                  version
                                    .action
                                ]
                              }
                            </span>

                            <h3 className="mt-3 text-lg font-bold text-slate-950 sm:text-xl">
                              {
                                actionDescriptions[
                                  version
                                    .action
                                ]
                              }
                            </h3>

                            <p className="mt-2 text-sm font-semibold text-slate-600">
                              {getChangeDescription(
                                version.changes,
                              )}
                            </p>
                          </div>

                          <time
                            dateTime={
                              version.occurred_at
                            }
                            className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-700"
                          >
                            {formatDateTime(
                              version.occurred_at,
                            )}
                          </time>
                        </div>

                        <dl className="mt-5 grid gap-3 rounded-xl border border-white/70 bg-white/60 p-4 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="font-bold text-slate-700">
                              Responsável
                            </dt>

                            <dd className="mt-1 break-words text-slate-900">
                              {getActorReference(
                                version.actor_user_id,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-bold text-slate-700">
                              Perfil registrado
                            </dt>

                            <dd className="mt-1 text-slate-900">
                              {version.actor_role
                                ? formatFieldName(
                                    version.actor_role,
                                  )
                                : 'Não informado'}
                            </dd>
                          </div>
                        </dl>

                        {version.changes.length >
                        0 ? (
                          <div className="mt-5 space-y-3">
                            {version.changes.map(
                              (
                                change,
                              ) => (
                                <ChangeItem
                                  key={
                                    change.field
                                  }
                                  change={
                                    change
                                  }
                                />
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="mt-5 rounded-xl border border-white/70 bg-white/70 p-4 text-sm leading-6 text-slate-700">
                            A operação foi registrada na auditoria institucional, mas não apresentou diferenças de campos disponíveis para exibição.
                          </div>
                        )}

                        <div className="mt-5 border-t border-slate-900/10 pt-4">
                          <p className="font-mono text-xs text-slate-600">
                            Auditoria:{' '}
                            {formatIdentifier(
                              version.id,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              As operações são preservadas para rastreabilidade e auditoria institucional.
            </p>

            <button
              type="button"
              onClick={
                onClose
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0A6F8F] px-5 py-3 font-semibold text-white transition hover:bg-[#085A75]"
            >
              Voltar ao histórico
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import {
  AgendaEventVersionsDialog,
} from '@/components/agenda/AgendaEventVersionsDialog'
import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'
import {
  AgendaRestoreDialog,
} from '@/components/agenda/AgendaRestoreDialog'
import {
  useHistory,
} from '@/lib/agenda/hooks'

import type {
  AgendaHistoryFilters,
  AgendaHistoryItem,
  AgendaHistoryItemType,
} from '@/lib/agenda'

type HistoryFormState = {
  search: string

  type:
    | ''
    | AgendaHistoryItemType

  startDate: string
  endDate: string
}

type RestorableHistoryItemType =
  | 'evento'
  | 'evidencia'

type RestoreTarget = {
  sourceId: string
  title: string
  type: RestorableHistoryItemType
}

type VersionsTarget = {
  eventId: string
  title: string
}

type HistoryRecordCardProps = {
  item: AgendaHistoryItem
  sequence: number

  restoringEventId:
    | string
    | null

  restoringEvidenceId:
    | string
    | null

  onRestore: (
    target: RestoreTarget,
  ) => void

  onOpenVersions: (
    target: VersionsTarget,
  ) => void
}

type TypePresentation = {
  label: string
  classes: string
}

const initialForm:
  HistoryFormState = {
  search: '',
  type: '',
  startDate: '',
  endDate: '',
}

const inputClassName = [
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-slate-950 outline-none transition placeholder:text-slate-400',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

const typePresentations:
  Record<
    AgendaHistoryItemType,
    TypePresentation
  > = {
    evento: {
      label:
        'Evento',

      classes:
        'border-blue-200 bg-blue-50 text-blue-800',
    },

    planejamento: {
      label:
        'Planejamento',

      classes:
        'border-cyan-200 bg-cyan-50 text-[#075F78]',
    },

    evidencia: {
      label:
        'Evidência',

      classes:
        'border-emerald-200 bg-emerald-50 text-emerald-800',
    },

    tarefa: {
      label:
        'Tarefa',

      classes:
        'border-amber-200 bg-amber-50 text-amber-800',
    },
  }

function formatDate(
  value: string,
): string {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data não disponível'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short',
    },
  ).format(date)
}

function formatDay(
  value: string,
): string {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data não disponível'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      weekday:
        'long',

      day:
        '2-digit',

      month:
        'long',

      year:
        'numeric',
    },
  ).format(date)
}

function formatLabel(
  value: string,
): string {
  return value
    .replace(
      /_/g,
      ' ',
    )
    .replace(
      /-/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    )
}

function getActorReference(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  return value.length > 12
    ? `${value.slice(
        0,
        8,
      )}…${value.slice(-4)}`
    : value
}

function getRestoreButtonLabel(
  type:
    RestorableHistoryItemType,
  restoring: boolean,
): string {
  if (
    type ===
    'evento'
  ) {
    return restoring
      ? 'Restaurando evento...'
      : 'Restaurar evento'
  }

  return restoring
    ? 'Restaurando evidência...'
    : 'Restaurar evidência'
}

function HistoryRecordCard({
  item,
  sequence,
  restoringEventId,
  restoringEvidenceId,
  onRestore,
  onOpenVersions,
}: HistoryRecordCardProps) {
  const presentation =
    typePresentations[
      item.type
    ]

  const actorReference =
    getActorReference(
      item.deleted_by,
    )

  const isEvent =
    item.type ===
    'evento'

  const isEvidence =
    item.type ===
    'evidencia'

  const restorableType:
    | RestorableHistoryItemType
    | null =
    isEvent
      ? 'evento'
      : isEvidence
        ? 'evidencia'
        : null

  const canRestore =
    item.is_deleted &&
    Boolean(
      restorableType,
    )

  const restoringRecordId =
    restorableType ===
    'evento'
      ? restoringEventId
      : restorableType ===
          'evidencia'
        ? restoringEvidenceId
        : null

  const isRestoring =
    restoringRecordId ===
    item.source_id

  const hasAvailableLinks =
    !item.is_deleted &&
    Boolean(
      item.file_url ||
        item.external_url,
    )

  const hasActions =
    isEvent ||
    canRestore ||
    hasAvailableLinks

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white ${
        item.is_deleted
          ? 'border-amber-300'
          : 'border-slate-200'
      }`}
    >
      {item.is_deleted ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500"
            />

            <p className="text-sm font-bold text-amber-950">
              Registro excluído e preservado para auditoria
            </p>
          </div>
        </div>
      ) : null}

      <header className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="font-mono text-xs font-bold text-[#0B7491]">
              {String(
                sequence,
              ).padStart(
                2,
                '0',
              )}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${presentation.classes}`}
                >
                  {
                    presentation.label
                  }
                </span>

                <span
                  className={`inline-flex rounded-lg border px-3 py-1 text-xs font-bold ${
                    item.is_deleted
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {item.is_deleted
                    ? 'Excluído'
                    : 'Ativo'}
                </span>

                {isEvent ? (
                  <span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                    Versionado
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 break-words text-xl font-bold leading-7 text-[#071827] sm:text-2xl">
                {item.title}
              </h3>
            </div>
          </div>

          <div
            className={`shrink-0 rounded-xl px-4 py-3 ${
              item.is_deleted
                ? 'border border-amber-200 bg-amber-50'
                : 'bg-[#071827] text-white'
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                item.is_deleted
                  ? 'text-amber-800'
                  : 'text-slate-300'
              }`}
            >
              {item.is_deleted
                ? 'Excluído em'
                : 'Registrado em'}
            </p>

            <p
              className={`mt-1 text-xs font-bold ${
                item.is_deleted
                  ? 'text-amber-950'
                  : 'text-white'
              }`}
            >
              {formatDate(
                item.occurred_at,
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {item.description ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            {
              item.description
            }
          </p>
        ) : (
          <p className="text-sm italic text-slate-400">
            Registro sem descrição complementar.
          </p>
        )}

        {item.status ||
        item.category ||
        item.subject ||
        item.class_name ? (
          <div className="flex flex-wrap gap-2">
            {item.status &&
            !item.is_deleted ? (
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                Status:{' '}
                {formatLabel(
                  item.status,
                )}
              </span>
            ) : null}

            {item.category ? (
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-[#075F78]">
                {formatLabel(
                  item.category,
                )}
              </span>
            ) : null}

            {item.subject ? (
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                Disciplina:{' '}
                {item.subject}
              </span>
            ) : null}

            {item.class_name ? (
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                Turma:{' '}
                {
                  item.class_name
                }
              </span>
            ) : null}
          </div>
        ) : null}

        {item.is_deleted ? (
          <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
            <header className="border-b border-amber-200 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
                Informações da exclusão
              </p>
            </header>

            <dl className="grid gap-5 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-amber-900">
                  Motivo
                </dt>

                <dd className="mt-1 whitespace-pre-wrap break-words leading-6 text-amber-950">
                  {item.deletion_reason ??
                    'Motivo não informado.'}
                </dd>
              </div>

              <div>
                <dt className="font-bold text-amber-900">
                  Data da exclusão
                </dt>

                <dd className="mt-1 leading-6 text-amber-950">
                  {item.deleted_at
                    ? formatDate(
                        item.deleted_at,
                      )
                    : 'Data não disponível'}
                </dd>
              </div>

              <div>
                <dt className="font-bold text-amber-900">
                  Responsável
                </dt>

                <dd className="mt-1 leading-6 text-amber-950">
                  {item.deleted_by
                    ? 'Usuário identificado pelo sistema'
                    : 'Identificação não disponível'}
                </dd>
              </div>

              <div>
                <dt className="font-bold text-amber-900">
                  Referência de auditoria
                </dt>

                <dd className="mt-1 break-all font-mono text-xs leading-6 text-amber-950">
                  {actorReference ??
                    'Não disponível'}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="font-bold text-amber-900">
                  Data original do registro
                </dt>

                <dd className="mt-1 leading-6 text-amber-950">
                  {formatDate(
                    item.source_occurred_at,
                  )}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        {hasActions ? (
          <footer className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:flex-wrap">
            {isEvent ? (
              <button
                type="button"
                onClick={() =>
                  onOpenVersions({
                    eventId:
                      item.source_id,

                    title:
                      item.title,
                  })
                }
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#0B7491] bg-white px-5 py-3 text-sm font-semibold text-[#075F78] transition hover:bg-cyan-50 sm:w-auto"
              >
                Ver versões
              </button>
            ) : null}

            {canRestore &&
            restorableType ? (
              <button
                type="button"
                disabled={Boolean(
                  restoringEventId ||
                    restoringEvidenceId,
                )}
                onClick={() =>
                  onRestore({
                    sourceId:
                      item.source_id,

                    title:
                      item.title,

                    type:
                      restorableType,
                  })
                }
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
              >
                {getRestoreButtonLabel(
                  restorableType,
                  isRestoring,
                )}
              </button>
            ) : null}

            {!item.is_deleted &&
            item.file_url ? (
              <a
                href={
                  item.file_url
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0B2940] sm:w-auto"
              >
                Abrir arquivo
              </a>
            ) : null}

            {!item.is_deleted &&
            item.external_url ? (
              <a
                href={
                  item.external_url
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] sm:w-auto"
              >
                Abrir link
              </a>
            ) : null}
          </footer>
        ) : null}
      </div>
    </article>
  )
}

export function AgendaHistory() {
  const {
    history,
    loading,
    error,
    reload,

    restoringEventId,
    restoringEvidenceId,

    actionError,
    actionMessage,

    restoreEvent,
    restoreEvidence,

    clearActionFeedback,
  } = useHistory({
    limit: 200,
  })

  const [
    form,
    setForm,
  ] =
    useState<HistoryFormState>(
      initialForm,
    )

  const [
    activeFilters,
    setActiveFilters,
  ] =
    useState<AgendaHistoryFilters>({
      limit: 200,
    })

  const [
    restoreTarget,
    setRestoreTarget,
  ] =
    useState<RestoreTarget | null>(
      null,
    )

  const [
    versionsTarget,
    setVersionsTarget,
  ] =
    useState<VersionsTarget | null>(
      null,
    )

  const isRestoring =
    Boolean(
      restoringEventId ||
        restoringEvidenceId,
    )

  const summary =
    useMemo(() => {
      const deleted =
        history.filter(
          (item) =>
            item.is_deleted,
        ).length

      const events =
        history.filter(
          (item) =>
            item.type ===
            'evento',
        ).length

      const evidences =
        history.filter(
          (item) =>
            item.type ===
            'evidencia',
        ).length

      return {
        total:
          history.length,

        active:
          history.length -
          deleted,

        deleted,
        events,
        evidences,
      }
    }, [history])

  const groupedHistory =
    useMemo(() => {
      return history.reduce<
        Record<
          string,
          AgendaHistoryItem[]
        >
      >(
        (
          groups,
          item,
        ) => {
          const dateKey =
            formatDay(
              item.occurred_at,
            )

          if (
            !groups[
              dateKey
            ]
          ) {
            groups[
              dateKey
            ] = []
          }

          groups[
            dateKey
          ].push(item)

          return groups
        },
        {},
      )
    }, [history])

  function updateForm<
    Key extends
      keyof HistoryFormState,
  >(
    key: Key,
    value:
      HistoryFormState[Key],
  ): void {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    clearActionFeedback()

    const filters:
      AgendaHistoryFilters = {
      search:
        form.search.trim() ||
        null,

      type:
        form.type ||
        null,

      startDate:
        form.startDate ||
        null,

      endDate:
        form.endDate ||
        null,

      limit:
        200,
    }

    setActiveFilters(
      filters,
    )

    await reload(
      filters,
    )
  }

  async function handleClearFilters():
    Promise<void> {
    clearActionFeedback()

    setForm(
      initialForm,
    )

    const filters:
      AgendaHistoryFilters = {
      limit:
        200,
    }

    setActiveFilters(
      filters,
    )

    await reload(
      filters,
    )
  }

  function openRestoreDialog(
    target: RestoreTarget,
  ): void {
    clearActionFeedback()

    setVersionsTarget(
      null,
    )

    setRestoreTarget(
      target,
    )
  }

  function closeRestoreDialog():
    void {
    if (isRestoring) {
      return
    }

    setRestoreTarget(
      null,
    )

    clearActionFeedback()
  }

  function openVersionsDialog(
    target: VersionsTarget,
  ): void {
    if (isRestoring) {
      return
    }

    clearActionFeedback()

    setRestoreTarget(
      null,
    )

    setVersionsTarget(
      target,
    )
  }

  function closeVersionsDialog():
    void {
    setVersionsTarget(
      null,
    )
  }

  async function handleRestoreConfirm(
    reason: string,
  ): Promise<void> {
    if (!restoreTarget) {
      throw new Error(
        'Nenhum registro foi selecionado para restauração.',
      )
    }

    const restored =
      restoreTarget.type ===
      'evento'
        ? await restoreEvent(
            restoreTarget.sourceId,
            reason,
          )
        : await restoreEvidence(
            restoreTarget.sourceId,
            reason,
          )

    if (!restored) {
      return
    }

    setRestoreTarget(
      null,
    )
  }

  return (
    <>
      <AgendaPageShell
        eyebrow="Memória, versões e auditoria"
        title="Histórico pedagógico"
        description="Consulte eventos, planejamentos, evidências e tarefas preservados na trajetória pedagógica, incluindo registros excluídos e versões auditáveis."
      >
        <div className="space-y-6 sm:space-y-8">
          <section
            aria-label="Resumo do histórico"
            className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
          >
            <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Registros
              </p>

              <p className="mt-3 text-3xl font-bold text-[#071827]">
                {
                  summary.total
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Itens encontrados
              </p>
            </article>

            <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Ativos
              </p>

              <p className="mt-3 text-3xl font-bold text-[#071827]">
                {
                  summary.active
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Disponíveis nos módulos
              </p>
            </article>

            <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Preservados
              </p>

              <p className="mt-3 text-3xl font-bold text-[#071827]">
                {
                  summary.deleted
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Excluídos com auditoria
              </p>
            </article>

            <article className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Eventos versionados
              </p>

              <p className="mt-3 text-3xl font-bold text-[#071827]">
                {
                  summary.events
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Com consulta de versões
              </p>
            </article>
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071827] font-mono text-xs font-bold text-cyan-300">
                  10
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Consulta avançada
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                    Filtrar histórico
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Localize registros por texto, tipo e período.
                  </p>
                </div>
              </div>
            </header>

            <form
              onSubmit={
                handleSubmit
              }
              className="p-5 sm:p-7"
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="history-search"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Buscar no histórico
                  </label>

                  <input
                    id="history-search"
                    type="search"
                    value={
                      form.search
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'search',
                        event.target
                          .value,
                      )
                    }
                    placeholder="Título, descrição, turma, disciplina ou motivo da exclusão"
                    className={
                      inputClassName
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="history-type"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Tipo de registro
                  </label>

                  <select
                    id="history-type"
                    value={
                      form.type
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'type',
                        event.target
                          .value as
                          | ''
                          | AgendaHistoryItemType,
                      )
                    }
                    className={
                      inputClassName
                    }
                  >
                    <option value="">
                      Todos
                    </option>

                    <option value="evento">
                      Eventos
                    </option>

                    <option value="planejamento">
                      Planejamentos
                    </option>

                    <option value="evidencia">
                      Evidências
                    </option>

                    <option value="tarefa">
                      Tarefas
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="history-start-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Data inicial
                  </label>

                  <input
                    id="history-start-date"
                    type="date"
                    value={
                      form.startDate
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'startDate',
                        event.target
                          .value,
                      )
                    }
                    className={
                      inputClassName
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="history-end-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Data final
                  </label>

                  <input
                    id="history-end-date"
                    type="date"
                    value={
                      form.endDate
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'endDate',
                        event.target
                          .value,
                      )
                    }
                    className={
                      inputClassName
                    }
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() =>
                    void handleClearFilters()
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpar filtros
                </button>

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading
                    ? 'Carregando...'
                    : 'Aplicar filtros'}
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Linha do tempo
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                    Registros encontrados
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {history.length}{' '}
                    registro
                    {history.length === 1
                      ? ''
                      : 's'}{' '}
                    encontrado
                    {history.length === 1
                      ? ''
                      : 's'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() => {
                    clearActionFeedback()

                    void reload(
                      activeFilters,
                    )
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Atualizando...'
                    : 'Atualizar histórico'}
                </button>
              </div>
            </header>

            <div className="p-5 sm:p-7">
              {actionMessage ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold">
                        Restauração concluída
                      </p>

                      <p className="mt-1 text-sm leading-6">
                        {
                          actionMessage
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        clearActionFeedback
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : null}

              {actionError &&
              !restoreTarget ? (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
                >
                  <p className="font-bold">
                    Não foi possível restaurar o registro
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    {
                      actionError
                    }
                  </p>
                </div>
              ) : null}

              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-sm font-semibold text-cyan-900"
                >
                  Carregando o histórico pedagógico...
                </div>
              ) : null}

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"
                >
                  <p className="font-bold">
                    Não foi possível carregar o histórico
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    {error}
                  </p>
                </div>
              ) : null}

              {!loading &&
              !error &&
              history.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <h3 className="text-lg font-bold text-[#071827]">
                    Nenhum registro encontrado
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Revise os filtros ou registre novas atividades nos módulos da Agenda.
                  </p>
                </div>
              ) : null}

              {!loading &&
              !error &&
              history.length >
                0 ? (
                <div className="space-y-10">
                  {Object.entries(
                    groupedHistory,
                  ).map(
                    ([
                      date,
                      items,
                    ]) => (
                      <section
                        key={
                          date
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-slate-200" />

                          <h3 className="text-center text-sm font-bold capitalize text-slate-700 sm:text-base">
                            {date}
                          </h3>

                          <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="mt-5 space-y-5">
                          {items.map(
                            (
                              item,
                              index,
                            ) => (
                              <HistoryRecordCard
                                key={
                                  item.id
                                }
                                item={
                                  item
                                }
                                sequence={
                                  index +
                                  1
                                }
                                restoringEventId={
                                  restoringEventId
                                }
                                restoringEvidenceId={
                                  restoringEvidenceId
                                }
                                onRestore={
                                  openRestoreDialog
                                }
                                onOpenVersions={
                                  openVersionsDialog
                                }
                              />
                            ),
                          )}
                        </div>
                      </section>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </section>

          <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-3">
            <article>
              <p className="font-mono text-xs font-bold text-[#0B7491]">
                01
              </p>

              <h3 className="mt-3 font-bold text-[#071827]">
                Preservação
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Exclusões permanecem registradas com motivo, data e referência de auditoria.
              </p>
            </article>

            <article>
              <p className="font-mono text-xs font-bold text-[#0B7491]">
                02
              </p>

              <h3 className="mt-3 font-bold text-[#071827]">
                Restauração governada
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Eventos e evidências excluídos podem ser restaurados mediante justificativa.
              </p>
            </article>

            <article>
              <p className="font-mono text-xs font-bold text-[#0B7491]">
                03
              </p>

              <h3 className="mt-3 font-bold text-[#071827]">
                Versionamento
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Alterações de eventos podem ser consultadas para preservar sua evolução histórica.
              </p>
            </article>
          </section>
        </div>
      </AgendaPageShell>

      <AgendaRestoreDialog
        open={
          restoreTarget !==
          null
        }
        recordType={
          restoreTarget?.type ===
          'evento'
            ? 'evento'
            : 'evidência'
        }
        recordTitle={
          restoreTarget?.title ??
          null
        }
        submitting={
          isRestoring
        }
        error={
          actionError
        }
        onClose={
          closeRestoreDialog
        }
        onConfirm={
          handleRestoreConfirm
        }
      />

      {versionsTarget ? (
        <AgendaEventVersionsDialog
          eventId={
            versionsTarget.eventId
          }
          title={
            versionsTarget.title
          }
          onClose={
            closeVersionsDialog
          }
        />
      ) : null}
    </>
  )
}
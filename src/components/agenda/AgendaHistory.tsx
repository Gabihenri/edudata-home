'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import {
  AgendaEventVersionsDialog,
} from './AgendaEventVersionsDialog'

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
  type: '' | AgendaHistoryItemType
  startDate: string
  endDate: string
}

type RestoreTarget = {
  sourceId: string
  title: string
}

type VersionsTarget = {
  eventId: string
  title: string
}

type HistoryRecordCardProps = {
  item: AgendaHistoryItem
  restoringEventId: string | null

  onRestore: (
    target: RestoreTarget,
  ) => void

  onOpenVersions: (
    target: VersionsTarget,
  ) => void
}

const initialForm: HistoryFormState = {
  search: '',
  type: '',
  startDate: '',
  endDate: '',
}

const typeLabels:
  Record<
    AgendaHistoryItemType,
    string
  > = {
    evento: 'Evento',
    planejamento: 'Planejamento',
    evidencia: 'Evidência',
    tarefa: 'Tarefa',
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
      dateStyle: 'long',
      timeStyle: 'short',
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
      dateStyle: 'full',
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

function HistoryRecordCard({
  item,
  restoringEventId,
  onRestore,
  onOpenVersions,
}: HistoryRecordCardProps) {
  const actorReference =
    getActorReference(
      item.deleted_by,
    )

  const isEvent =
    item.type === 'evento'

  const canRestore =
    item.is_deleted &&
    isEvent

  const isRestoring =
    restoringEventId ===
    item.source_id

  const hasProtectedLinks =
    !item.is_deleted &&
    Boolean(
      item.file_url ||
        item.external_url,
    )

  const hasActions =
    isEvent ||
    canRestore ||
    hasProtectedLinks

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        item.is_deleted
          ? 'border-amber-300'
          : 'border-slate-200'
      }`}
    >
      {item.is_deleted ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 sm:px-6">
          <p className="text-sm font-bold text-amber-900">
            Registro excluído e
            preservado para histórico e
            auditoria
          </p>
        </div>
      ) : null}

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-cyan-800">
                {
                  typeLabels[
                    item.type
                  ]
                }
              </span>

              {item.is_deleted ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  Excluído
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  Ativo
                </span>
              )}

              {isEvent ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                  Versionado
                </span>
              ) : null}
            </div>

            <h3 className="mt-3 break-words text-xl font-bold text-slate-950 sm:text-2xl">
              {item.title}
            </h3>
          </div>

          <div className="rounded-xl bg-[#081C2E] px-4 py-2 text-xs font-bold text-white">
            {item.is_deleted
              ? 'Excluído em '
              : 'Registrado em '}

            {formatDate(
              item.occurred_at,
            )}
          </div>
        </div>

        {item.description ? (
          <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-slate-600">
            {item.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {item.status &&
          !item.is_deleted ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Status:{' '}
              {formatLabel(
                item.status,
              )}
            </span>
          ) : null}

          {item.category ? (
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
              {formatLabel(
                item.category,
              )}
            </span>
          ) : null}

          {item.subject ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              Disciplina:{' '}
              {item.subject}
            </span>
          ) : null}

          {item.class_name ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              Turma:{' '}
              {item.class_name}
            </span>
          ) : null}
        </div>

        {item.is_deleted ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h4 className="font-bold text-amber-950">
              Informações da exclusão
            </h4>

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-amber-900">
                  Motivo
                </dt>

                <dd className="mt-1 whitespace-pre-wrap break-words text-amber-950">
                  {item.deletion_reason ??
                    'Motivo não informado.'}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-amber-900">
                  Data da exclusão
                </dt>

                <dd className="mt-1 text-amber-950">
                  {item.deleted_at
                    ? formatDate(
                        item.deleted_at,
                      )
                    : 'Data não disponível'}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-amber-900">
                  Responsável
                </dt>

                <dd className="mt-1 text-amber-950">
                  {item.deleted_by
                    ? 'Usuário identificado pelo sistema'
                    : 'Identificação não disponível'}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-amber-900">
                  Referência de auditoria
                </dt>

                <dd className="mt-1 font-mono text-xs text-amber-950">
                  {actorReference ??
                    'Não disponível'}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="font-semibold text-amber-900">
                  Data original do registro
                </dt>

                <dd className="mt-1 text-amber-950">
                  {formatDate(
                    item.source_occurred_at,
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {hasActions ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:flex-wrap">
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
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-700 bg-white px-5 py-3 font-semibold text-cyan-800 transition hover:bg-cyan-50 sm:w-auto"
              >
                Ver versões
              </button>
            ) : null}

            {canRestore ? (
              <button
                type="button"
                disabled={
                  Boolean(
                    restoringEventId,
                  )
                }
                onClick={() =>
                  onRestore({
                    sourceId:
                      item.source_id,

                    title:
                      item.title,
                  })
                }
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0A6F8F] px-5 py-3 font-semibold text-white transition hover:bg-[#085A75] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isRestoring
                  ? 'Restaurando evento...'
                  : 'Restaurar evento'}
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
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-700 bg-white px-5 py-3 font-semibold text-cyan-800 transition hover:bg-cyan-50 sm:w-auto"
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
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                Abrir link
              </a>
            ) : null}
          </div>
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
    actionError,
    actionMessage,

    restoreEvent,
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

  const [
    restoreReason,
    setRestoreReason,
  ] =
    useState('')

  const [
    restoreValidationError,
    setRestoreValidationError,
  ] =
    useState<string | null>(
      null,
    )

  const summary =
    useMemo(() => {
      const deleted =
        history.filter(
          (item) =>
            item.is_deleted,
        ).length

      return {
        total:
          history.length,

        active:
          history.length -
          deleted,

        deleted,
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

          if (!groups[dateKey]) {
            groups[dateKey] = []
          }

          groups[
            dateKey
          ].push(item)

          return groups
        },
        {},
      )
    }, [history])

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

      limit: 200,
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
      limit: 200,
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

    setRestoreValidationError(
      null,
    )

    setRestoreReason('')

    setRestoreTarget(
      target,
    )
  }

  function closeRestoreDialog():
    void {
    if (restoringEventId) {
      return
    }

    setRestoreTarget(
      null,
    )

    setRestoreReason('')

    setRestoreValidationError(
      null,
    )
  }

  function openVersionsDialog(
    target: VersionsTarget,
  ): void {
    if (restoringEventId) {
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

  async function handleRestoreSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    if (!restoreTarget) {
      return
    }

    const normalizedReason =
      restoreReason.trim()

    if (!normalizedReason) {
      setRestoreValidationError(
        'Informe o motivo da restauração.',
      )

      return
    }

    if (
      normalizedReason.length >
      500
    ) {
      setRestoreValidationError(
        'O motivo da restauração não pode ultrapassar 500 caracteres.',
      )

      return
    }

    setRestoreValidationError(
      null,
    )

    const restored =
      await restoreEvent(
        restoreTarget.sourceId,
        normalizedReason,
      )

    if (!restored) {
      return
    }

    setRestoreTarget(
      null,
    )

    setRestoreReason('')
  }

  return (
    <>
      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#081C2E] px-6 py-8 text-white sm:px-8 sm:py-10">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
                Agenda Inteligente EDI
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Histórico pedagógico
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
                Consulte eventos,
                planejamentos, evidências e
                tarefas preservados na sua
                trajetória pedagógica.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                    Registros
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {summary.total}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">
                    Ativos
                  </p>

                  <p className="mt-2 text-3xl font-bold text-cyan-200">
                    {summary.active}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-100">
                    Excluídos e preservados
                  </p>

                  <p className="mt-2 text-3xl font-bold text-amber-200">
                    {summary.deleted}
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="border-b border-slate-200 bg-slate-50 p-6 sm:p-8"
            >
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
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
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          search:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="Título, descrição, disciplina, turma, motivo da exclusão..."
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
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
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          type:
                            event
                              .target
                              .value as
                              | ''
                              | AgendaHistoryItemType,
                        }),
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
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
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          startDate:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
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
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          endDate:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0A6F8F] px-6 py-3 font-semibold text-white transition hover:bg-[#085A75] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Carregando...'
                    : 'Aplicar filtros'}
                </button>

                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() =>
                    void handleClearFilters()
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpar filtros
                </button>
              </div>
            </form>

            <div className="p-6 sm:p-8">
              {actionMessage ? (
                <div
                  className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        Restauração concluída
                      </p>

                      <p className="mt-1">
                        {actionMessage}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        clearActionFeedback
                      }
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : null}

              {actionError &&
              !restoreTarget ? (
                <div
                  className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"
                  role="alert"
                >
                  <p className="font-bold">
                    Não foi possível
                    restaurar o evento
                  </p>

                  <p className="mt-1">
                    {actionError}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-600">
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
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Atualizando...'
                    : 'Atualizar histórico'}
                </button>
              </div>

              {loading ? (
                <div
                  className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50 p-6 text-cyan-900"
                  role="status"
                  aria-live="polite"
                >
                  Carregando o histórico
                  pedagógico...
                </div>
              ) : null}

              {error ? (
                <div
                  className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"
                  role="alert"
                >
                  <p className="font-bold">
                    Não foi possível
                    carregar o histórico.
                  </p>

                  <p className="mt-2">
                    {error}
                  </p>
                </div>
              ) : null}

              {!loading &&
              !error &&
              history.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
                  Nenhum registro foi
                  encontrado para os
                  filtros informados.
                </div>
              ) : null}

              {!loading &&
              !error &&
              history.length > 0 ? (
                <div className="mt-10 space-y-10">
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

                          <h2 className="text-center text-base font-bold capitalize text-slate-700 sm:text-lg">
                            {date}
                          </h2>

                          <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="mt-5 space-y-5">
                          {items.map(
                            (
                              item,
                            ) => (
                              <HistoryRecordCard
                                key={
                                  item.id
                                }
                                item={
                                  item
                                }
                                restoringEventId={
                                  restoringEventId
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
          </div>
        </div>
      </section>

      {restoreTarget ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-4 sm:items-center"
          role="presentation"
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-event-title"
          >
            <div className="bg-[#081C2E] px-6 py-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                Restauração governada
              </p>

              <h2
                id="restore-event-title"
                className="mt-2 text-2xl font-bold"
              >
                Restaurar evento
              </h2>

              <p className="mt-3 break-words text-sm leading-6 text-slate-200">
                {restoreTarget.title}
              </p>
            </div>

            <form
              onSubmit={
                handleRestoreSubmit
              }
              className="p-6"
            >
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
                O evento voltará a
                aparecer no calendário.
                A exclusão e a
                restauração permanecerão
                registradas na auditoria
                institucional.
              </div>

              <div className="mt-5">
                <label
                  htmlFor="restore-reason"
                  className="block text-sm font-bold text-slate-800"
                >
                  Motivo da restauração
                </label>

                <textarea
                  id="restore-reason"
                  value={
                    restoreReason
                  }
                  onChange={(
                    event,
                  ) => {
                    setRestoreReason(
                      event.target.value,
                    )

                    if (
                      restoreValidationError
                    ) {
                      setRestoreValidationError(
                        null,
                      )
                    }
                  }}
                  maxLength={
                    500
                  }
                  rows={
                    5
                  }
                  disabled={
                    Boolean(
                      restoringEventId,
                    )
                  }
                  placeholder="Explique por que este evento deve ser restaurado."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  autoFocus
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Campo obrigatório.
                  </p>

                  <p className="text-xs text-slate-500">
                    {restoreReason.length}
                    /500
                  </p>
                </div>
              </div>

              {restoreValidationError ? (
                <div
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  {restoreValidationError}
                </div>
              ) : null}

              {actionError ? (
                <div
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  {actionError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    Boolean(
                      restoringEventId,
                    )
                  }
                  onClick={
                    closeRestoreDialog
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    Boolean(
                      restoringEventId,
                    )
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0A6F8F] px-5 py-3 font-semibold text-white transition hover:bg-[#085A75] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {restoringEventId
                    ? 'Restaurando...'
                    : 'Confirmar restauração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
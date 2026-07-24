'use client'

import {
  type FormEvent,
  useState,
} from 'react'

import type {
  AgendaPlanning,
} from '@/lib/agenda'

type PlanningTrashPanelProps = {
  records: AgendaPlanning[]

  loading: boolean
  error: string | null

  disabled?: boolean

  onReload: () => Promise<void>

  onRestore: (
    id: string,
    reason: string,
  ) => Promise<AgendaPlanning>
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return 'Data não registrada'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl
    .DateTimeFormat(
      'pt-BR',
      {
        dateStyle:
          'medium',

        timeStyle:
          'short',
      },
    )
    .format(date)
}

export function PlanningTrashPanel({
  records,
  loading,
  error,
  disabled = false,
  onReload,
  onRestore,
}: PlanningTrashPanelProps) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false)

  const [
    selectedPlanningId,
    setSelectedPlanningId,
  ] = useState<
    string | null
  >(null)

  const [
    restorationReason,
    setRestorationReason,
  ] = useState('')

  const [
    actionBusy,
    setActionBusy,
  ] = useState(false)

  const [
    actionError,
    setActionError,
  ] = useState('')

  const [
    actionSuccess,
    setActionSuccess,
  ] = useState('')

  const isDisabled =
    disabled ||
    loading ||
    actionBusy

  async function openTrash():
    Promise<void> {
    setIsOpen(true)
    setActionError('')
    setActionSuccess('')

    await onReload()
  }

  function closeTrash(): void {
    if (actionBusy) {
      return
    }

    setIsOpen(false)
    setSelectedPlanningId(null)
    setRestorationReason('')
    setActionError('')
  }

  function openRestoration(
    planningId: string,
  ): void {
    if (isDisabled) {
      return
    }

    setSelectedPlanningId(
      planningId,
    )

    setRestorationReason('')
    setActionError('')
    setActionSuccess('')
  }

  function cancelRestoration(): void {
    if (actionBusy) {
      return
    }

    setSelectedPlanningId(null)
    setRestorationReason('')
    setActionError('')
  }

  async function handleRestore(
    event:
      FormEvent<HTMLFormElement>,

    planningId: string,
  ): Promise<void> {
    event.preventDefault()

    const reason =
      restorationReason
        .trim()

    setActionError('')
    setActionSuccess('')

    if (!reason) {
      setActionError(
        'Informe o motivo da restauração.',
      )

      return
    }

    setActionBusy(true)

    try {
      await onRestore(
        planningId,
        reason,
      )

      setSelectedPlanningId(null)
      setRestorationReason('')

      setActionSuccess(
        'Planejamento restaurado e devolvido à lista de registros disponíveis.',
      )
    } catch (
      restoreError
    ) {
      setActionError(
        restoreError instanceof
        Error
          ? restoreError.message
          : 'Não foi possível restaurar o planejamento.',
      )
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Governança dos registros
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#071827]">
            Lixeira de planejamentos
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Registros excluídos permanecem preservados e podem ser restaurados mediante justificativa.
          </p>
        </div>

        {!isOpen ? (
          <button
            type="button"
            onClick={() =>
              void openTrash()
            }
            disabled={
              disabled ||
              loading
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Carregando...'
              : 'Abrir lixeira'}
          </button>
        ) : (
          <button
            type="button"
            onClick={
              closeTrash
            }
            disabled={
              actionBusy
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Fechar lixeira
          </button>
        )}
      </header>

      {isOpen ? (
        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">
              {records.length}{' '}
              registro
              {records.length === 1
                ? ''
                : 's'}{' '}
              excluído
              {records.length === 1
                ? ''
                : 's'}
            </p>

            <button
              type="button"
              onClick={() =>
                void onReload()
              }
              disabled={
                isDisabled
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Atualizando...'
                : 'Atualizar lixeira'}
            </button>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
            >
              {error}
            </div>
          ) : null}

          {actionError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
            >
              {actionError}
            </div>
          ) : null}

          {actionSuccess ? (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800"
            >
              {actionSuccess}
            </div>
          ) : null}

          {loading ? (
            <div
              role="status"
              className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-sm font-semibold text-cyan-900"
            >
              Carregando registros excluídos...
            </div>
          ) : null}

          {!loading &&
          !error &&
          records.length ===
            0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-lg font-bold text-[#071827]">
                A lixeira está vazia
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nenhum planejamento excluído está disponível para restauração.
              </p>
            </div>
          ) : null}

          {!loading &&
          records.length >
            0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {records.map(
                record => (
                  <article
                    key={
                      record.id
                    }
                    className="overflow-hidden rounded-2xl border border-red-200 bg-white"
                  >
                    <header className="border-b border-red-100 bg-red-50 px-5 py-4">
                      <span className="inline-flex rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-red-700">
                        Excluído
                      </span>

                      <h3 className="mt-3 break-words text-lg font-bold text-[#071827]">
                        {record.title}
                      </h3>

                      <p className="mt-2 text-xs font-semibold text-red-700">
                        {formatDateTime(
                          record.deleted_at,
                        )}
                      </p>
                    </header>

                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap gap-2">
                        {record.subject ? (
                          <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                            {
                              record.subject
                            }
                          </span>
                        ) : null}

                        {record.class_name ? (
                          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                            Turma{' '}
                            {
                              record.class_name
                            }
                          </span>
                        ) : null}
                      </div>

                      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Motivo da exclusão
                        </p>

                        <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                          {record.deletion_reason ??
                            'Motivo não registrado.'}
                        </p>
                      </section>

                      {selectedPlanningId ===
                      record.id ? (
                        <form
                          onSubmit={
                            event =>
                              void handleRestore(
                                event,
                                record.id,
                              )
                          }
                          className="space-y-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4"
                        >
                          <div>
                            <label
                              htmlFor={`planning-restore-reason-${record.id}`}
                              className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                              Motivo da restauração
                            </label>

                            <textarea
                              id={`planning-restore-reason-${record.id}`}
                              rows={3}
                              required
                              value={
                                restorationReason
                              }
                              onChange={
                                event => {
                                  setRestorationReason(
                                    event.target
                                      .value,
                                  )

                                  setActionError('')
                                }
                              }
                              disabled={
                                isDisabled
                              }
                              placeholder="Registre por que este planejamento deve retornar à lista disponível."
                              className="min-h-24 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                          </div>

                          <div className="flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={
                                cancelRestoration
                              }
                              disabled={
                                isDisabled
                              }
                              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Cancelar
                            </button>

                            <button
                              type="submit"
                              disabled={
                                isDisabled
                              }
                              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {actionBusy
                                ? 'Restaurando...'
                                : 'Confirmar restauração'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openRestoration(
                              record.id,
                            )
                          }
                          disabled={
                            isDisabled
                          }
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Restaurar planejamento
                        </button>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
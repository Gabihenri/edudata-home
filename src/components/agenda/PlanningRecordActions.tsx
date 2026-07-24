'use client'

import {
  type FormEvent,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaPlanning,
  UpdateAgendaPlanningInput,
} from '@/lib/agenda'

type PlanningRecordActionsProps = {
  planning: AgendaPlanning

  disabled?: boolean

  onUpdate: (
    id: string,
    input: UpdateAgendaPlanningInput,
  ) => Promise<AgendaPlanning>

  onArchive: (
    id: string,
    reason: string,
  ) => Promise<AgendaPlanning>

  onDelete: (
    id: string,
    reason: string,
  ) => Promise<AgendaPlanning>
}

type ActionMode =
  | 'idle'
  | 'edit'
  | 'archive'
  | 'delete'

type PlanningEditForm = {
  title: string
  description: string
  subject: string
  className: string
  objective: string
  methodology: string
  resources: string
  evaluation: string
  plannedDate: string
  status: AgendaPlanning['status']
}

const inputClassName = [
  'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-sm text-slate-950 outline-none transition placeholder:text-slate-400',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

const secondaryButtonClassName = [
  'inline-flex min-h-11 items-center justify-center rounded-xl',
  'border border-slate-300 bg-white px-4 py-3',
  'text-sm font-semibold text-slate-700 transition',
  'hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

const statusOptions: Array<{
  value: AgendaPlanning['status']
  label: string
}> = [
  {
    value: 'rascunho',
    label: 'Rascunho',
  },
  {
    value: 'em_revisao',
    label: 'Em revisão',
  },
  {
    value: 'aprovado',
    label: 'Aprovado',
  },
  {
    value: 'programado',
    label: 'Programado',
  },
  {
    value: 'executado',
    label: 'Executado',
  },

  // Compatibilidade com registros anteriores.
  {
    value: 'planejado',
    label: 'Planejado',
  },
  {
    value: 'concluido',
    label: 'Concluído',
  },
  {
    value: 'em revisão',
    label: 'Em revisão — legado',
  },
  {
    value: 'concluído',
    label: 'Concluído — legado',
  },
]

function createEditForm(
  planning: AgendaPlanning,
): PlanningEditForm {
  return {
    title:
      planning.title,

    description:
      planning.description ??
      '',

    subject:
      planning.subject ??
      '',

    className:
      planning.class_name ??
      '',

    objective:
      planning.objective ??
      '',

    methodology:
      planning.methodology ??
      '',

    resources:
      planning.resources ??
      '',

    evaluation:
      planning.evaluation ??
      '',

    plannedDate:
      planning.planned_date ??
      '',

    status:
      planning.status,
  }
}

export function PlanningRecordActions({
  planning,
  disabled = false,
  onUpdate,
  onArchive,
  onDelete,
}: PlanningRecordActionsProps) {
  const [
    mode,
    setMode,
  ] =
    useState<ActionMode>(
      'idle',
    )

  const [
    editForm,
    setEditForm,
  ] =
    useState<PlanningEditForm>(
      () =>
        createEditForm(
          planning,
        ),
    )

  const [
    archiveReason,
    setArchiveReason,
  ] =
    useState('')

  const [
    deletionReason,
    setDeletionReason,
  ] =
    useState('')

  const [
    actionBusy,
    setActionBusy,
  ] =
    useState(false)

  const [
    actionError,
    setActionError,
  ] =
    useState('')

  const [
    actionSuccess,
    setActionSuccess,
  ] =
    useState('')

  const isDisabled =
    disabled ||
    actionBusy

  const isArchived =
    planning.status ===
    'arquivado'

  useEffect(() => {
    setEditForm(
      createEditForm(
        planning,
      ),
    )
  }, [
    planning,
  ])

  function clearMessages(): void {
    setActionError('')
    setActionSuccess('')
  }

  function openMode(
    nextMode: ActionMode,
  ): void {
    if (isDisabled) {
      return
    }

    clearMessages()

    setEditForm(
      createEditForm(
        planning,
      ),
    )

    setArchiveReason('')
    setDeletionReason('')

    setMode(
      nextMode,
    )
  }

  function closeActions(): void {
    if (actionBusy) {
      return
    }

    setMode('idle')
    setArchiveReason('')
    setDeletionReason('')

    setEditForm(
      createEditForm(
        planning,
      ),
    )

    setActionError('')
  }

  function updateEditField<
    Key extends
      keyof PlanningEditForm,
  >(
    key: Key,
    value:
      PlanningEditForm[Key],
  ): void {
    setEditForm(
      current => ({
        ...current,
        [key]: value,
      }),
    )

    clearMessages()
  }

  async function handleEditSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    clearMessages()

    const title =
      editForm.title.trim()

    const objective =
      editForm.objective.trim()

    if (!title) {
      setActionError(
        'Informe o título do planejamento.',
      )

      return
    }

    if (!objective) {
      setActionError(
        'Informe o objetivo pedagógico.',
      )

      return
    }

    setActionBusy(true)

    try {
      await onUpdate(
        planning.id,
        {
          title,

          description:
            editForm.description
              .trim() ||
            null,

          subject:
            editForm.subject
              .trim() ||
            null,

          class_name:
            editForm.className
              .trim() ||
            null,

          objective,

          methodology:
            editForm.methodology
              .trim() ||
            null,

          resources:
            editForm.resources
              .trim() ||
            null,

          evaluation:
            editForm.evaluation
              .trim() ||
            null,

          planned_date:
            editForm.plannedDate ||
            null,

          status:
            editForm.status,
        },
      )

      setMode('idle')

      setActionSuccess(
        'Planejamento atualizado com sucesso.',
      )
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o planejamento.',
      )
    } finally {
      setActionBusy(false)
    }
  }

  async function handleArchiveSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    clearMessages()

    const reason =
      archiveReason.trim()

    if (!reason) {
      setActionError(
        'Informe o motivo do arquivamento.',
      )

      return
    }

    setActionBusy(true)

    try {
      await onArchive(
        planning.id,
        reason,
      )

      setArchiveReason('')
      setMode('idle')

      setActionSuccess(
        'Planejamento arquivado com sucesso.',
      )
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível arquivar o planejamento.',
      )
    } finally {
      setActionBusy(false)
    }
  }

  async function handleDeleteSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    clearMessages()

    const reason =
      deletionReason.trim()

    if (!reason) {
      setActionError(
        'Informe o motivo da exclusão.',
      )

      return
    }

    setActionBusy(true)

    try {
      await onDelete(
        planning.id,
        reason,
      )
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o planejamento.',
      )

      setActionBusy(false)
    }
  }

  return (
    <section
      aria-label={`Ações do planejamento ${planning.title}`}
      className="border-t border-slate-200 bg-slate-50 px-4 py-4"
    >
      {actionError ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
        >
          {actionError}
        </div>
      ) : null}

      {actionSuccess ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800"
        >
          {actionSuccess}
        </div>
      ) : null}

      {mode === 'idle' ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              openMode(
                'edit',
              )
            }
            disabled={
              isDisabled
            }
            className={
              secondaryButtonClassName
            }
          >
            Editar
          </button>

          {isArchived ? (
            <div className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Arquivado
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                openMode(
                  'archive',
                )
              }
              disabled={
                isDisabled
              }
              className={
                secondaryButtonClassName
              }
            >
              Arquivar
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              openMode(
                'delete',
              )
            }
            disabled={
              isDisabled
            }
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      ) : null}

      {mode === 'edit' ? (
        <form
          onSubmit={
            handleEditSubmit
          }
          className="space-y-5"
        >
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
              Editar planejamento
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Atualize somente os campos necessários. As alterações serão registradas no histórico.
            </p>
          </header>

          <div>
            <label
              htmlFor={`planning-title-${planning.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Título
            </label>

            <input
              id={`planning-title-${planning.id}`}
              type="text"
              required
              value={
                editForm.title
              }
              onChange={
                event =>
                  updateEditField(
                    'title',
                    event.target
                      .value,
                  )
              }
              disabled={
                isDisabled
              }
              className={
                inputClassName
              }
            />
          </div>

          <div>
            <label
              htmlFor={`planning-description-${planning.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Descrição geral
            </label>

            <textarea
              id={`planning-description-${planning.id}`}
              rows={3}
              value={
                editForm.description
              }
              onChange={
                event =>
                  updateEditField(
                    'description',
                    event.target
                      .value,
                  )
              }
              disabled={
                isDisabled
              }
              className={`${inputClassName} resize-y`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`planning-subject-${planning.id}`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Disciplina ou área
              </label>

              <input
                id={`planning-subject-${planning.id}`}
                type="text"
                value={
                  editForm.subject
                }
                onChange={
                  event =>
                    updateEditField(
                      'subject',
                      event.target
                        .value,
                    )
                }
                disabled={
                  isDisabled
                }
                className={
                  inputClassName
                }
              />
            </div>

            <div>
              <label
                htmlFor={`planning-class-${planning.id}`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Turma
              </label>

              <input
                id={`planning-class-${planning.id}`}
                type="text"
                value={
                  editForm.className
                }
                onChange={
                  event =>
                    updateEditField(
                      'className',
                      event.target
                        .value,
                    )
                }
                disabled={
                  isDisabled
                }
                className={
                  inputClassName
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`planning-date-${planning.id}`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Data planejada
              </label>

              <input
                id={`planning-date-${planning.id}`}
                type="date"
                value={
                  editForm.plannedDate
                }
                onChange={
                  event =>
                    updateEditField(
                      'plannedDate',
                      event.target
                        .value,
                    )
                }
                disabled={
                  isDisabled
                }
                className={
                  inputClassName
                }
              />
            </div>

            <div>
              <label
                htmlFor={`planning-status-${planning.id}`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id={`planning-status-${planning.id}`}
                value={
                  editForm.status
                }
                onChange={
                  event =>
                    updateEditField(
                      'status',
                      event.target
                        .value as
                        AgendaPlanning['status'],
                    )
                }
                disabled={
                  isDisabled
                }
                className={
                  inputClassName
                }
              >
                {isArchived ? (
                  <option value="arquivado">
                    Arquivado
                  </option>
                ) : null}

                {
                  statusOptions.map(
                    option => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    ),
                  )
                }
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor={`planning-objective-${planning.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Objetivo pedagógico
            </label>

            <textarea
              id={`planning-objective-${planning.id}`}
              rows={4}
              required
              value={
                editForm.objective
              }
              onChange={
                event =>
                  updateEditField(
                    'objective',
                    event.target
                      .value,
                  )
              }
              disabled={
                isDisabled
              }
              className={`${inputClassName} resize-y`}
            />
          </div>

          <div>
            <label
              htmlFor={`planning-methodology-${planning.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Estratégias e metodologia
            </label>

            <textarea
              id={`planning-methodology-${planning.id}`}
              rows={3}
              value={
                editForm.methodology
              }
              onChange={
                event =>
                  updateEditField(
                    'methodology',
                    event.target
                      .value,
                  )
              }
              disabled={
                isDisabled
              }
              className={`${inputClassName} resize-y`}
            />
          </div>

          <div>
            <label
              htmlFor={`planning-resources-${planning.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Recursos
            </label>

            <textarea
              id={`planning-resources-${planning.id}`}
              rows={3}
              value={
                editForm.resources
              }
              onChange={
                event =>
                  updateEditField(
                    'resources',
                    event.target
                      .value,
                  )
              }
              disabled={
                isDisabled
              }
              className={`${inputClassName} resize-y`}
            />
          </div>

          <div>
            <label
              htmlFor={`planning-evaluation-${planning.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Avaliação e evidências esperadas
            </label>

            <textarea
              id={`planning-evaluation-${planning.id}`}
              rows={3}
              value={
                editForm.evaluation
              }
              onChange={
                event =>
                  updateEditField(
                    'evaluation',
                    event.target
                      .value,
                  )
              }
              disabled={
                isDisabled
              }
              className={`${inputClassName} resize-y`}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                closeActions
              }
              disabled={
                isDisabled
              }
              className={`${secondaryButtonClassName} flex-1`}
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
                ? 'Salvando...'
                : 'Salvar alterações'}
            </button>
          </div>
        </form>
      ) : null}

      {mode === 'archive' ? (
        <form
          onSubmit={
            handleArchiveSubmit
          }
          className="space-y-4"
        >
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              Arquivar planejamento
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              O registro permanecerá preservado, mas será identificado como arquivado.
            </p>
          </header>

          <div>
            <label
              htmlFor={`planning-archive-reason-${planning.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Motivo do arquivamento
            </label>

            <textarea
              id={`planning-archive-reason-${planning.id}`}
              rows={3}
              required
              value={
                archiveReason
              }
              onChange={
                event => {
                  setArchiveReason(
                    event.target
                      .value,
                  )

                  clearMessages()
                }
              }
              disabled={
                isDisabled
              }
              placeholder="Registre por que este planejamento está sendo arquivado."
              className={`${inputClassName} resize-y`}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                closeActions
              }
              disabled={
                isDisabled
              }
              className={`${secondaryButtonClassName} flex-1`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isDisabled
              }
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {actionBusy
                ? 'Arquivando...'
                : 'Confirmar arquivamento'}
            </button>
          </div>
        </form>
      ) : null}

      {mode === 'delete' ? (
        <form
          onSubmit={
            handleDeleteSubmit
          }
          className="space-y-4"
        >
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
              Excluir planejamento
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              A exclusão será lógica e auditável. O registro não será apagado fisicamente.
            </p>
          </header>

          <div>
            <label
              htmlFor={`planning-delete-reason-${planning.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Motivo da exclusão
            </label>

            <textarea
              id={`planning-delete-reason-${planning.id}`}
              rows={3}
              required
              value={
                deletionReason
              }
              onChange={
                event => {
                  setDeletionReason(
                    event.target
                      .value,
                  )

                  clearMessages()
                }
              }
              disabled={
                isDisabled
              }
              placeholder="Registre por que este planejamento deve sair da lista ativa."
              className={`${inputClassName} resize-y`}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                closeActions
              }
              disabled={
                isDisabled
              }
              className={`${secondaryButtonClassName} flex-1`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isDisabled
              }
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {actionBusy
                ? 'Excluindo...'
                : 'Confirmar exclusão'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
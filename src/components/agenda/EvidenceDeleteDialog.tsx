'use client'

import {
  type FormEvent,
  useEffect,
  useId,
  useState,
} from 'react'

type EvidenceDeleteDialogProps = {
  open: boolean

  evidenceTitle:
    | string
    | null

  submitting: boolean

  error:
    | string
    | null

  onClose: () => void

  onConfirm: (
    reason: string,
  ) => Promise<void>
}

const MAX_REASON_LENGTH = 500

export function EvidenceDeleteDialog({
  open,
  evidenceTitle,
  submitting,
  error,
  onClose,
  onConfirm,
}: EvidenceDeleteDialogProps) {
  const titleId =
    useId()

  const descriptionId =
    useId()

  const reasonId =
    useId()

  const [
    reason,
    setReason,
  ] = useState('')

  const [
    localError,
    setLocalError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setReason('')
    setLocalError(null)
  }, [
    evidenceTitle,
    open,
  ])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      if (
        event.key ===
          'Escape' &&
        !submitting
      ) {
        onClose()
      }
    }

    const previousOverflow =
      document.body.style
        .overflow

    document.body.style.overflow =
      'hidden'

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
  }, [
    onClose,
    open,
    submitting,
  ])

  if (!open) {
    return null
  }

  const normalizedReason =
    reason.trim()

  const isReasonValid =
    normalizedReason.length > 0 &&
    normalizedReason.length <=
      MAX_REASON_LENGTH

  const displayedError =
    localError ?? error

  function handleClose(): void {
    if (submitting) {
      return
    }

    setLocalError(null)
    onClose()
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setLocalError(null)

    if (!normalizedReason) {
      setLocalError(
        'Informe o motivo da exclusão.',
      )

      return
    }

    if (
      normalizedReason.length >
      MAX_REASON_LENGTH
    ) {
      setLocalError(
        `O motivo da exclusão não pode ultrapassar ${MAX_REASON_LENGTH} caracteres.`,
      )

      return
    }

    try {
      await onConfirm(
        normalizedReason,
      )
    } catch (
      confirmationError
    ) {
      setLocalError(
        confirmationError instanceof
          Error
          ? confirmationError.message
          : 'Não foi possível excluir a evidência.',
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !submitting
        ) {
          handleClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          titleId
        }
        aria-describedby={
          descriptionId
        }
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-slate-200 bg-white shadow-2xl sm:max-w-xl sm:rounded-[2rem]"
      >
        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7 sm:py-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-700">
              Exclusão governada
            </p>

            <h2
              id={titleId}
              className="mt-3 text-2xl font-bold text-slate-950"
            >
              Excluir evidência
            </h2>

            <p
              id={
                descriptionId
              }
              className="mt-3 leading-7 text-slate-600"
            >
              A evidência será
              retirada da lista,
              mas permanecerá
              preservada para
              auditoria e possível
              restauração
              autorizada.
            </p>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Evidência
                selecionada
              </p>

              <p className="mt-2 break-words font-bold text-slate-950">
                {evidenceTitle ||
                  'Evidência sem título'}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <p className="font-bold text-amber-950">
                O arquivo protegido
                não será apagado
                fisicamente nesta
                etapa.
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-900">
                A exclusão será
                lógica e registrada
                com o usuário
                responsável, data,
                horário e motivo.
              </p>
            </div>

            <div>
              <label
                htmlFor={
                  reasonId
                }
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Motivo da exclusão
              </label>

              <textarea
                id={reasonId}
                autoFocus
                required
                rows={5}
                maxLength={
                  MAX_REASON_LENGTH
                }
                disabled={
                  submitting
                }
                value={reason}
                onChange={(
                  event,
                ) => {
                  setReason(
                    event.target
                      .value,
                  )

                  setLocalError(
                    null,
                  )
                }}
                placeholder="Descreva por que esta evidência deve ser excluída."
                className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                <p className="text-slate-500">
                  O motivo ficará
                  registrado na
                  auditoria.
                </p>

                <p
                  className={
                    reason.length >=
                    MAX_REASON_LENGTH
                      ? 'font-bold text-red-700'
                      : 'text-slate-500'
                  }
                >
                  {reason.length}/
                  {
                    MAX_REASON_LENGTH
                  }
                </p>
              </div>
            </div>

            {displayedError ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
              >
                {displayedError}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-5 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              disabled={
                submitting
              }
              onClick={
                handleClose
              }
              className="min-h-[48px] rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                !isReasonValid
              }
              className="min-h-[48px] rounded-full bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {submitting
                ? 'Excluindo...'
                : 'Confirmar exclusão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
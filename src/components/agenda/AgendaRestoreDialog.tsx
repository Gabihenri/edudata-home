'use client'

import {
  type FormEvent,
  useEffect,
  useId,
  useState,
} from 'react'

type RestorableRecordType =
  | 'evento'
  | 'evidência'

type AgendaRestoreDialogProps = {
  open: boolean

  recordType:
    RestorableRecordType

  recordTitle:
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

const MAX_REASON_LENGTH =
  500

function getRecordLabel(
  recordType: RestorableRecordType,
): string {
  return recordType ===
    'evento'
    ? 'evento'
    : 'evidência'
}

function getRecordArticle(
  recordType: RestorableRecordType,
): string {
  return recordType ===
    'evento'
    ? 'O'
    : 'A'
}

export function AgendaRestoreDialog({
  open,
  recordType,
  recordTitle,
  submitting,
  error,
  onClose,
  onConfirm,
}: AgendaRestoreDialogProps) {
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

  const recordLabel =
    getRecordLabel(
      recordType,
    )

  const recordArticle =
    getRecordArticle(
      recordType,
    )

  useEffect(() => {
    if (!open) {
      return
    }

    setReason('')
    setLocalError(null)
  }, [
    open,
    recordTitle,
    recordType,
  ])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow =
      document.body.style
        .overflow

    document.body.style.overflow =
      'hidden'

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
    normalizedReason.length >
      0 &&
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
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setLocalError(null)

    if (!normalizedReason) {
      setLocalError(
        'Informe o motivo da restauração.',
      )

      return
    }

    if (
      normalizedReason.length >
      MAX_REASON_LENGTH
    ) {
      setLocalError(
        `O motivo da restauração não pode ultrapassar ${MAX_REASON_LENGTH} caracteres.`,
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
          : `Não foi possível restaurar ${recordArticle.toLowerCase()} ${recordLabel}.`,
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
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
          <div className="bg-[#081C2E] px-5 py-6 text-white sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Restauração
              governada
            </p>

            <h2
              id={titleId}
              className="mt-3 text-2xl font-bold sm:text-3xl"
            >
              Restaurar{' '}
              {recordLabel}
            </h2>

            <p
              id={
                descriptionId
              }
              className="mt-3 leading-7 text-slate-200"
            >
              {recordArticle}{' '}
              {recordLabel} voltará
              a ficar disponível,
              mas a exclusão e a
              restauração
              continuarão
              registradas na
              auditoria.
            </p>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Registro
                selecionado
              </p>

              <p className="mt-2 break-words font-bold text-slate-950">
                {recordTitle ||
                  `${recordArticle} ${recordLabel} sem título`}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="font-bold text-cyan-950">
                A restauração não
                apaga o histórico
                da exclusão.
              </p>

              <p className="mt-2 text-sm leading-6 text-cyan-900">
                O responsável,
                a data, o motivo
                da exclusão e o
                motivo da
                restauração
                permanecerão
                preservados para
                auditoria
                institucional.
              </p>
            </div>

            <div>
              <label
                htmlFor={
                  reasonId
                }
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Motivo da
                restauração
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
                placeholder={`Explique por que ${recordArticle.toLowerCase()} ${recordLabel} deve ser restaurad${recordType === 'evento' ? 'o' : 'a'}.`}
                className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:flex-row sm:justify-end sm:px-7 sm:pb-5">
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
              className="min-h-[48px] rounded-full bg-[#0A6F8F] px-6 py-3 font-semibold text-white transition hover:bg-[#085A75] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {submitting
                ? 'Restaurando...'
                : 'Confirmar restauração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import { EvidenceDeleteDialog } from '@/components/agenda/EvidenceDeleteDialog'
import { useEvidences } from '@/lib/agenda/hooks/useEvidences'

type EvidenceType =
  | 'texto'
  | 'imagem'
  | 'pdf'
  | 'link'

type EvidenceFormState = {
  title: string
  description: string
  evidenceType: EvidenceType
  externalUrl: string
  containsIdentifiableMinor:
    | boolean
    | null
  guardianAuthorizationConfirmed: boolean
  authorizationReference: string
}

type EvidenceSelectedForDeletion = {
  id: string
  title: string
}

const PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

const initialForm: EvidenceFormState = {
  title: '',
  description: '',
  evidenceType: 'texto',
  externalUrl: '',
  containsIdentifiableMinor: null,
  guardianAuthorizationConfirmed: false,
  authorizationReference: '',
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
    return 'Data indisponível'
  }

  return date.toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  )
}

function getEvidenceTypeLabel(
  type: EvidenceType,
): string {
  const labels: Record<
    EvidenceType,
    string
  > = {
    texto: 'Texto',
    imagem: 'Imagem',
    pdf: 'PDF',
    link: 'Link',
  }

  return labels[type]
}

export function AgendaEvidence() {
  const {
    evidences,
    loading,
    error,
    reload,
    createEvidence,
    deleteEvidence,
    uploadEvidenceFile,
    getEvidenceFileUrl,
  } = useEvidences()

  const [
    form,
    setForm,
  ] = useState<EvidenceFormState>(
    initialForm,
  )

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null,
  )

  const [
    fileInputKey,
    setFileInputKey,
  ] = useState(0)

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    formError,
    setFormError,
  ] = useState<
    string | null
  >(null)

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null)

  const [
    openingEvidenceId,
    setOpeningEvidenceId,
  ] = useState<
    string | null
  >(null)

  const [
    fileAccessError,
    setFileAccessError,
  ] = useState<
    string | null
  >(null)

  const [
    evidenceSelectedForDeletion,
    setEvidenceSelectedForDeletion,
  ] =
    useState<EvidenceSelectedForDeletion | null>(
      null,
    )

  const [
    deletingEvidence,
    setDeletingEvidence,
  ] = useState(false)

  const [
    deletionError,
    setDeletionError,
  ] = useState<
    string | null
  >(null)

  const [
    deletionSuccessMessage,
    setDeletionSuccessMessage,
  ] = useState<
    string | null
  >(null)

  const usesFile =
    form.evidenceType ===
      'imagem' ||
    form.evidenceType ===
      'pdf'

  const isMinorProtectionComplete =
    useMemo(() => {
      if (
        form
          .containsIdentifiableMinor ===
        null
      ) {
        return false
      }

      if (
        form
          .containsIdentifiableMinor ===
        false
      ) {
        return true
      }

      return (
        form
          .guardianAuthorizationConfirmed &&
        Boolean(
          form
            .authorizationReference
            .trim(),
        )
      )
    }, [
      form.authorizationReference,
      form.containsIdentifiableMinor,
      form
        .guardianAuthorizationConfirmed,
    ])

  const isSubmitDisabled =
    useMemo(() => {
      if (submitting) {
        return true
      }

      if (
        !form.title.trim()
      ) {
        return true
      }

      if (
        usesFile &&
        !selectedFile
      ) {
        return true
      }

      if (
        form.evidenceType ===
          'link' &&
        !form.externalUrl.trim()
      ) {
        return true
      }

      return (
        !isMinorProtectionComplete
      )
    }, [
      form.evidenceType,
      form.externalUrl,
      form.title,
      isMinorProtectionComplete,
      selectedFile,
      submitting,
      usesFile,
    ])

  function clearMessages(): void {
    setFormError(null)
    setSuccessMessage(null)
  }

  function resetForm(): void {
    setForm(initialForm)
    setSelectedFile(null)

    setFileInputKey(
      (current) =>
        current + 1,
    )
  }

  function handleEvidenceTypeChange(
    value: EvidenceType,
  ): void {
    setForm(
      (current) => ({
        ...current,

        evidenceType:
          value,

        externalUrl:
          value === 'link'
            ? current.externalUrl
            : '',
      }),
    )

    setSelectedFile(null)

    setFileInputKey(
      (current) =>
        current + 1,
    )

    clearMessages()
  }

  function handleMinorAnswer(
    value: boolean,
  ): void {
    setForm(
      (current) => ({
        ...current,

        containsIdentifiableMinor:
          value,

        guardianAuthorizationConfirmed:
          value
            ? current
                .guardianAuthorizationConfirmed
            : false,

        authorizationReference:
          value
            ? current
                .authorizationReference
            : '',
      }),
    )

    clearMessages()
  }

  function handleRequestDelete(
    evidenceId: string,
    evidenceTitle: string,
  ): void {
    setEvidenceSelectedForDeletion({
      id: evidenceId,
      title: evidenceTitle,
    })

    setDeletionError(null)
    setDeletionSuccessMessage(
      null,
    )
  }

  function handleCloseDeleteDialog(): void {
    if (deletingEvidence) {
      return
    }

    setEvidenceSelectedForDeletion(
      null,
    )

    setDeletionError(null)
  }

  async function handleConfirmDelete(
    reason: string,
  ): Promise<void> {
    if (
      !evidenceSelectedForDeletion
    ) {
      throw new Error(
        'Nenhuma evidência foi selecionada para exclusão.',
      )
    }

    setDeletingEvidence(true)
    setDeletionError(null)

    try {
      const message =
        await deleteEvidence(
          evidenceSelectedForDeletion.id,
          reason,
        )

      setDeletionSuccessMessage(
        message,
      )

      setEvidenceSelectedForDeletion(
        null,
      )
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Não foi possível excluir a evidência.'

      setDeletionError(
        message,
      )

      throw deleteError
    } finally {
      setDeletingEvidence(false)
    }
  }

  async function handleOpenProtectedFile(
    evidenceId: string,
  ): Promise<void> {
    setOpeningEvidenceId(
      evidenceId,
    )

    setFileAccessError(
      null,
    )

    const fileWindow =
      window.open(
        'about:blank',
        '_blank',
      )

    if (!fileWindow) {
      setOpeningEvidenceId(
        null,
      )

      setFileAccessError(
        'O navegador bloqueou a abertura do arquivo. Permita novas janelas e tente novamente.',
      )

      return
    }

    fileWindow.opener =
      null

    try {
      const signedUrl =
        await getEvidenceFileUrl(
          evidenceId,
        )

      fileWindow.location.replace(
        signedUrl,
      )
    } catch (openError) {
      fileWindow.close()

      setFileAccessError(
        openError instanceof Error
          ? openError.message
          : 'Não foi possível abrir o arquivo protegido.',
      )
    } finally {
      setOpeningEvidenceId(
        null,
      )
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(true)
    clearMessages()

    try {
      const title =
        form.title.trim()

      if (!title) {
        throw new Error(
          'Informe o título da evidência.',
        )
      }

      const containsIdentifiableMinor =
        form
          .containsIdentifiableMinor

      if (
        containsIdentifiableMinor ===
        null
      ) {
        throw new Error(
          'Informe se a evidência contém criança ou adolescente identificável.',
        )
      }

      if (
        containsIdentifiableMinor &&
        !form
          .guardianAuthorizationConfirmed
      ) {
        throw new Error(
          'Confirme que a instituição possui autorização vigente do responsável legal.',
        )
      }

      const authorizationReference =
        form
          .authorizationReference
          .trim()

      if (
        containsIdentifiableMinor &&
        !authorizationReference
      ) {
        throw new Error(
          'Informe a referência do termo de autorização.',
        )
      }

      let uploadedFile:
        | Awaited<
            ReturnType<
              typeof uploadEvidenceFile
            >
          >
        | null = null

      if (usesFile) {
        if (!selectedFile) {
          throw new Error(
            'Selecione um arquivo para enviar.',
          )
        }

        uploadedFile =
          await uploadEvidenceFile(
            selectedFile,
          )
      }

      if (
        form.evidenceType ===
          'link' &&
        !form.externalUrl.trim()
      ) {
        throw new Error(
          'Informe o link externo da evidência.',
        )
      }

      await createEvidence({
        title,

        description:
          form.description.trim() ||
          null,

        evidence_type:
          form.evidenceType,

        file_url:
          null,

        external_url:
          form.evidenceType ===
          'link'
            ? form.externalUrl.trim()
            : null,

        contains_identifiable_minor:
          containsIdentifiableMinor,

        guardian_authorization_confirmed:
          containsIdentifiableMinor
            ? form
                .guardianAuthorizationConfirmed
            : false,

        authorization_reference:
          containsIdentifiableMinor
            ? authorizationReference
            : null,

        privacy_notice_version:
          PRIVACY_NOTICE_VERSION,

        storage_bucket:
          uploadedFile?.bucket ??
          null,

        storage_path:
          uploadedFile?.path ??
          null,

        original_file_name:
          uploadedFile
            ?.originalFileName ??
          null,

        file_mime_type:
          uploadedFile?.mimeType ??
          null,

        file_size_bytes:
          uploadedFile?.sizeBytes ??
          null,
      })

      resetForm()

      setSuccessMessage(
        containsIdentifiableMinor
          ? 'Evidência criada com registro da declaração de autorização.'
          : 'Evidência criada com sucesso.',
      )
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar a evidência.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen bg-[#F4F7FA]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6B21A8]">
            Agenda Inteligente EDI
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
            Evidências pedagógicas
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Registre práticas,
            produções, documentos e
            resultados pedagógicos
            com rastreabilidade e
            proteção de dados.
          </p>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
          <form
            onSubmit={
              handleSubmit
            }
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <h2 className="text-2xl font-bold text-slate-950">
              Nova evidência
            </h2>

            <div className="mt-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xl font-bold text-white"
                >
                  !
                </div>

                <div>
                  <h3 className="text-lg font-bold text-amber-950">
                    Proteção da
                    imagem e dos
                    dados de
                    crianças e
                    adolescentes
                  </h3>

                  <div className="mt-3 space-y-3 text-sm leading-6 text-amber-950">
                    <p>
                      Não envie
                      imagem,
                      documento,
                      nome,
                      matrícula,
                      uniforme,
                      localização ou
                      outro dado que
                      permita
                      identificar
                      uma criança ou
                      adolescente
                      sem observar
                      as regras de
                      proteção da
                      instituição.
                    </p>

                    <p>
                      Quando houver
                      menor
                      identificável,
                      o envio
                      somente será
                      permitido após
                      a confirmação
                      de que a
                      instituição
                      possui
                      autorização
                      expressa,
                      específica,
                      informada e
                      vigente do
                      responsável
                      legal.
                    </p>

                    <p className="font-semibold">
                      Esta
                      confirmação
                      não substitui
                      o termo
                      original nem
                      transfere para
                      a plataforma
                      as obrigações
                      legais da
                      instituição e
                      do usuário.
                    </p>

                    <p>
                      Sempre que
                      possível,
                      utilize
                      imagens sem
                      identificação,
                      enquadramentos
                      sem rosto,
                      desfoque
                      facial e
                      remoção de
                      nomes ou
                      outros dados
                      pessoais.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <fieldset className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <legend className="px-2 text-base font-bold text-slate-900">
                A evidência contém
                criança ou
                adolescente
                identificável?
              </legend>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Considere rosto,
                nome, matrícula,
                voz, uniforme,
                escola,
                localização ou
                qualquer
                combinação de
                informações que
                permita
                identificar o
                estudante.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition',

                    form
                      .containsIdentifiableMinor ===
                    false
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-300 bg-white hover:border-slate-400',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="contains-identifiable-minor"
                    value="no"
                    checked={
                      form
                        .containsIdentifiableMinor ===
                      false
                    }
                    onChange={() =>
                      handleMinorAnswer(
                        false,
                      )
                    }
                    className="h-5 w-5 accent-emerald-600"
                  />

                  <span className="font-semibold text-slate-800">
                    Não
                  </span>
                </label>

                <label
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition',

                    form
                      .containsIdentifiableMinor ===
                    true
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-300 bg-white hover:border-slate-400',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="contains-identifiable-minor"
                    value="yes"
                    checked={
                      form
                        .containsIdentifiableMinor ===
                      true
                    }
                    onChange={() =>
                      handleMinorAnswer(
                        true,
                      )
                    }
                    className="h-5 w-5 accent-amber-600"
                  />

                  <span className="font-semibold text-slate-800">
                    Sim
                  </span>
                </label>
              </div>

              {form
                .containsIdentifiableMinor ===
              true ? (
                <div className="mt-5 space-y-5 rounded-2xl border border-amber-300 bg-white p-5">
                  <div>
                    <label
                      htmlFor="authorization-reference"
                      className="mb-2 block text-sm font-bold text-slate-800"
                    >
                      Referência da
                      autorização
                    </label>

                    <input
                      id="authorization-reference"
                      type="text"
                      required
                      value={
                        form
                          .authorizationReference
                      }
                      onChange={(
                        event,
                      ) => {
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            authorizationReference:
                              event
                                .target
                                .value,
                          }),
                        )

                        clearMessages()
                      }}
                      placeholder="Ex.: Termo de uso de imagem 2026 — turma 2º A"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#6B21A8] focus:ring-4 focus:ring-purple-100"
                    />

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Informe
                      somente uma
                      referência
                      interna. Não
                      anexe o termo
                      completo neste
                      campo.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                    <input
                      type="checkbox"
                      required
                      checked={
                        form
                          .guardianAuthorizationConfirmed
                      }
                      onChange={(
                        event,
                      ) => {
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            guardianAuthorizationConfirmed:
                              event
                                .target
                                .checked,
                          }),
                        )

                        clearMessages()
                      }}
                      className="mt-1 h-5 w-5 shrink-0 accent-[#6B21A8]"
                    />

                    <span className="text-sm font-semibold leading-6 text-amber-950">
                      Declaro que a
                      instituição
                      possui
                      autorização
                      expressa,
                      específica,
                      informada e
                      vigente do
                      responsável
                      legal para o
                      registro,
                      armazenamento
                      e uso desta
                      evidência na
                      finalidade
                      pedagógica
                      informada.
                    </span>
                  </label>
                </div>
              ) : null}
            </fieldset>

            <div className="mt-7 space-y-6">
              <div>
                <label
                  htmlFor="evidence-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Título
                </label>

                <input
                  id="evidence-title"
                  type="text"
                  required
                  value={
                    form.title
                  }
                  onChange={(
                    event,
                  ) => {
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        title:
                          event
                            .target
                            .value,
                      }),
                    )

                    clearMessages()
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#6B21A8] focus:ring-4 focus:ring-purple-100"
                />
              </div>

              <div>
                <label
                  htmlFor="evidence-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Descrição
                </label>

                <textarea
                  id="evidence-description"
                  rows={5}
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) => {
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        description:
                          event
                            .target
                            .value,
                      }),
                    )

                    clearMessages()
                  }}
                  className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#6B21A8] focus:ring-4 focus:ring-purple-100"
                />
              </div>

              <div>
                <label
                  htmlFor="evidence-type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Tipo
                </label>

                <select
                  id="evidence-type"
                  value={
                    form.evidenceType
                  }
                  onChange={(
                    event,
                  ) =>
                    handleEvidenceTypeChange(
                      event
                        .target
                        .value as EvidenceType,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#6B21A8] focus:ring-4 focus:ring-purple-100"
                >
                  <option value="texto">
                    Texto
                  </option>

                  <option value="imagem">
                    Imagem
                  </option>

                  <option value="pdf">
                    PDF
                  </option>

                  <option value="link">
                    Link
                  </option>
                </select>
              </div>

              {usesFile ? (
                <div>
                  <label
                    htmlFor="evidence-file"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Arquivo
                  </label>

                  <input
                    key={
                      fileInputKey
                    }
                    id="evidence-file"
                    type="file"
                    required
                    accept={
                      form.evidenceType ===
                      'imagem'
                        ? 'image/jpeg,image/png,image/webp'
                        : 'application/pdf'
                    }
                    onChange={(
                      event,
                    ) => {
                      setSelectedFile(
                        event
                          .target
                          .files?.[0] ??
                          null,
                      )

                      clearMessages()
                    }}
                    className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#6B21A8] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
                  />

                  <p className="mt-2 text-sm text-slate-500">
                    {form.evidenceType ===
                    'imagem'
                      ? 'Formatos aceitos: JPG, PNG ou WEBP. Máximo de 10 MB.'
                      : 'Formato aceito: PDF. Máximo de 10 MB.'}
                  </p>

                  {selectedFile ? (
                    <div className="mt-3 rounded-2xl bg-slate-100 px-4 py-3">
                      <p className="break-words text-sm font-semibold text-slate-700">
                        Arquivo
                        selecionado:{' '}
                        {
                          selectedFile.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {(
                          selectedFile.size /
                          1024 /
                          1024
                        ).toFixed(
                          2,
                        )}{' '}
                        MB
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {form.evidenceType ===
              'link' ? (
                <div>
                  <label
                    htmlFor="evidence-external-url"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Link externo
                  </label>

                  <input
                    id="evidence-external-url"
                    type="url"
                    required
                    value={
                      form.externalUrl
                    }
                    onChange={(
                      event,
                    ) => {
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          externalUrl:
                            event
                              .target
                              .value,
                        }),
                      )

                      clearMessages()
                    }}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#6B21A8] focus:ring-4 focus:ring-purple-100"
                    placeholder="https://..."
                  />
                </div>
              ) : null}
            </div>

            {formError ? (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              >
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div
                role="status"
                className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
              >
                {
                  successMessage
                }
              </div>
            ) : null}

            <button
              type="submit"
              disabled={
                isSubmitDisabled
              }
              className="mt-7 min-h-[52px] w-full rounded-full bg-[#6B21A8] px-6 py-4 font-semibold text-white transition hover:bg-[#581C87] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {submitting
                ? 'Enviando e salvando...'
                : 'Criar evidência'}
            </button>

            {!isMinorProtectionComplete ? (
              <p className="mt-3 text-center text-sm font-medium text-slate-500">
                Responda à
                pergunta sobre
                identificação de
                menores para
                liberar o envio.
              </p>
            ) : null}
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">
                Evidências
                cadastradas
              </h2>

              <button
                type="button"
                onClick={() => {
                  setDeletionSuccessMessage(
                    null,
                  )

                  void reload()
                }}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Atualizar
              </button>
            </div>

            {deletionSuccessMessage ? (
              <div
                role="status"
                className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700"
              >
                {
                  deletionSuccessMessage
                }
              </div>
            ) : null}

            {loading ? (
              <p className="mt-8 text-slate-600">
                Carregando
                evidências...
              </p>
            ) : null}

            {error ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            ) : null}

            {fileAccessError ? (
              <div
                role="alert"
                className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
              >
                {
                  fileAccessError
                }
              </div>
            ) : null}

            {!loading &&
            !error &&
            evidences.length ===
              0 ? (
              <p className="mt-8 text-slate-500">
                Nenhuma evidência
                cadastrada.
              </p>
            ) : null}

            <div className="mt-8 space-y-5">
              {evidences.map(
                (evidence) => (
                  <article
                    key={
                      evidence.id
                    }
                    className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6B21A8]">
                          {getEvidenceTypeLabel(
                            evidence
                              .evidence_type,
                          )}
                        </p>

                        <h3 className="mt-3 break-words text-xl font-bold text-slate-950">
                          {
                            evidence.title
                          }
                        </h3>
                      </div>

                      <span className="rounded-full bg-[#081C2E] px-4 py-2 text-xs font-bold text-white">
                        {formatDate(
                          evidence
                            .created_at,
                        )}
                      </span>
                    </div>

                    {evidence.description ? (
                      <p className="mt-4 break-words leading-7 text-slate-600">
                        {
                          evidence.description
                        }
                      </p>
                    ) : null}

                    {evidence
                      .contains_identifiable_minor ? (
                      <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                        <p className="text-sm font-bold text-amber-950">
                          Evidência
                          com menor
                          identificável
                        </p>

                        <p className="mt-1 text-sm leading-6 text-amber-900">
                          Declaração
                          de
                          autorização
                          registrada
                          pelo usuário
                          responsável.
                        </p>

                        {evidence
                          .authorization_reference ? (
                          <p className="mt-2 break-words text-sm font-semibold text-amber-950">
                            Referência:{' '}
                            {
                              evidence
                                .authorization_reference
                            }
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
                        Sem menor
                        identificável
                        declarado
                      </p>
                    )}

                    {evidence
                      .original_file_name ? (
                      <p className="mt-5 break-words text-sm text-slate-600">
                        Arquivo:{' '}
                        <strong>
                          {
                            evidence
                              .original_file_name
                          }
                        </strong>
                      </p>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-3">
                      {evidence.file_url ? (
                        <a
                          href={
                            evidence
                              .file_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#6B21A8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#581C87]"
                        >
                          Abrir
                          arquivo
                        </a>
                      ) : null}

                      {!evidence.file_url &&
                      evidence.storage_path ? (
                        <button
                          type="button"
                          onClick={() =>
                            void handleOpenProtectedFile(
                              evidence.id,
                            )
                          }
                          disabled={
                            openingEvidenceId !==
                            null
                          }
                          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#6B21A8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#581C87] disabled:cursor-wait disabled:bg-slate-400"
                        >
                          {openingEvidenceId ===
                          evidence.id
                            ? 'Abrindo arquivo...'
                            : 'Abrir arquivo protegido'}
                        </button>
                      ) : null}

                      {evidence
                        .external_url ? (
                        <a
                          href={
                            evidence
                              .external_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#6B21A8] bg-white px-5 py-2.5 text-sm font-semibold text-[#6B21A8] transition hover:bg-purple-50"
                        >
                          Abrir link
                        </a>
                      ) : null}

                      <button
                        type="button"
                        disabled={
                          deletingEvidence
                        }
                        onClick={() =>
                          handleRequestDelete(
                            evidence.id,
                            evidence.title,
                          )
                        }
                        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                      >
                        Excluir
                        evidência
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <EvidenceDeleteDialog
        open={
          evidenceSelectedForDeletion !==
          null
        }
        evidenceTitle={
          evidenceSelectedForDeletion
            ?.title ??
          null
        }
        submitting={
          deletingEvidence
        }
        error={
          deletionError
        }
        onClose={
          handleCloseDeleteDialog
        }
        onConfirm={
          handleConfirmDelete
        }
      />
    </section>
  )
}
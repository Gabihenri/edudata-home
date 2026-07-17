'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'
import {
  EvidenceDeleteDialog,
} from '@/components/agenda/EvidenceDeleteDialog'
import {
  useEvidences,
} from '@/lib/agenda/hooks/useEvidences'

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

  guardianAuthorizationConfirmed:
    boolean

  authorizationReference: string
}

type EvidenceSelectedForDeletion = {
  id: string
  title: string
}

const PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

const initialForm:
  EvidenceFormState = {
  title: '',
  description: '',
  evidenceType: 'texto',
  externalUrl: '',
  containsIdentifiableMinor:
    null,
  guardianAuthorizationConfirmed:
    false,
  authorizationReference: '',
}

const inputClassName = [
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-slate-950 outline-none transition placeholder:text-slate-400',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

const evidenceTypeOptions: Array<{
  value: EvidenceType
  label: string
  description: string
}> = [
  {
    value: 'texto',
    label: 'Texto',
    description:
      'Registro descritivo sem arquivo.',
  },
  {
    value: 'imagem',
    label: 'Imagem',
    description:
      'JPG, PNG ou WEBP protegido.',
  },
  {
    value: 'pdf',
    label: 'PDF',
    description:
      'Documento pedagógico protegido.',
  },
  {
    value: 'link',
    label: 'Link',
    description:
      'Referência externa autorizada.',
  },
]

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

function formatFileSize(
  value:
    | number
    | null
    | undefined,
): string | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null
  }

  return `${(
    value /
    1024 /
    1024
  ).toFixed(2)} MB`
}

function getEvidenceTypeLabel(
  type: EvidenceType,
): string {
  const option =
    evidenceTypeOptions.find(
      (item) =>
        item.value === type,
    )

  return (
    option?.label ??
    type
  )
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
  ] =
    useState<EvidenceFormState>(
      initialForm,
    )

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    fileInputKey,
    setFileInputKey,
  ] =
    useState(0)

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

  const [
    openingEvidenceId,
    setOpeningEvidenceId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    fileAccessError,
    setFileAccessError,
  ] =
    useState<string | null>(
      null,
    )

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
  ] =
    useState(false)

  const [
    deletionError,
    setDeletionError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    deletionSuccessMessage,
    setDeletionSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

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

  const evidenceSummary =
    useMemo(() => {
      const protectedFiles =
        evidences.filter(
          (evidence) =>
            Boolean(
              evidence.storage_path,
            ),
        ).length

      const externalLinks =
        evidences.filter(
          (evidence) =>
            Boolean(
              evidence.external_url,
            ),
        ).length

      const identifiableMinors =
        evidences.filter(
          (evidence) =>
            evidence
              .contains_identifiable_minor,
        ).length

      return {
        total:
          evidences.length,

        protectedFiles,
        externalLinks,
        identifiableMinors,
      }
    }, [evidences])

  function clearMessages(): void {
    setFormError(null)
    setSuccessMessage(null)
  }

  function resetForm(): void {
    setForm(
      initialForm,
    )

    setSelectedFile(
      null,
    )

    setFileInputKey(
      (current) =>
        current + 1,
    )
  }

  function updateForm<
    Key extends
      keyof EvidenceFormState,
  >(
    key: Key,
    value:
      EvidenceFormState[Key],
  ): void {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )

    clearMessages()
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

    setSelectedFile(
      null,
    )

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

    setDeletionError(
      null,
    )

    setDeletionSuccessMessage(
      null,
    )
  }

  function handleCloseDeleteDialog():
    void {
    if (deletingEvidence) {
      return
    }

    setEvidenceSelectedForDeletion(
      null,
    )

    setDeletionError(
      null,
    )
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

    setDeletingEvidence(
      true,
    )

    setDeletionError(
      null,
    )

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
      setDeletingEvidence(
        false,
      )
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

    setSubmitting(
      true,
    )

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
      setSubmitting(
        false,
      )
    }
  }

  return (
    <>
      <AgendaPageShell
        eyebrow="Registro e memória pedagógica"
        title="Evidências pedagógicas"
        description="Registre práticas, documentos, produções e resultados pedagógicos com rastreabilidade, governança e proteção de dados integrada ao EIOS."
      >
        <div className="space-y-6 sm:space-y-8">
          <section
            aria-label="Resumo das evidências"
            className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
          >
            <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Total ativo
              </p>

              <p className="mt-3 text-3xl font-bold text-[#071827]">
                {
                  evidenceSummary.total
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Evidências disponíveis
              </p>
            </article>

            <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Arquivos protegidos
              </p>

              <p className="mt-3 text-3xl font-bold text-[#071827]">
                {
                  evidenceSummary.protectedFiles
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Objetos privados
              </p>
            </article>

            <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Links externos
              </p>

              <p className="mt-3 text-3xl font-bold text-[#071827]">
                {
                  evidenceSummary.externalLinks
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Referências registradas
              </p>
            </article>

            <article className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Proteção de menores
              </p>

              <p className="mt-3 text-3xl font-bold text-[#071827]">
                {
                  evidenceSummary.identifiableMinors
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Declarações registradas
              </p>
            </article>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <form
              onSubmit={
                handleSubmit
              }
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071827] font-mono text-xs font-bold text-cyan-300">
                    04
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                      Novo registro
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                      Criar evidência
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Preencha os dados e valide a proteção de menores antes de concluir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-7 p-5 sm:p-7">
                <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
                  <div className="border-b border-amber-200 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 font-bold text-white">
                        !
                      </span>

                      <div>
                        <h3 className="font-bold text-amber-950">
                          Proteção de crianças e adolescentes
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-amber-900">
                          Verificação obrigatória antes do registro da evidência.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 px-5 py-4 text-sm leading-6 text-amber-950">
                    <p>
                      Não envie rosto, nome, matrícula, voz, uniforme, localização ou qualquer combinação de dados que permita identificar uma criança ou adolescente sem observar as regras institucionais de proteção.
                    </p>

                    <p>
                      Quando houver menor identificável, o envio exige confirmação de autorização expressa, específica, informada e vigente do responsável legal.
                    </p>

                    <p className="font-semibold">
                      A confirmação registrada na plataforma não substitui o termo original nem transfere as obrigações legais da instituição ou do usuário.
                    </p>

                    <p>
                      Sempre que possível, utilize enquadramentos sem rosto, desfoque facial e remoção de nomes ou outros dados pessoais.
                    </p>
                  </div>
                </section>

                <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <legend className="px-2 font-bold text-[#071827]">
                    A evidência contém criança ou adolescente identificável?
                  </legend>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Considere rosto, nome, matrícula, voz, uniforme, escola, localização ou combinação de informações.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                        form
                          .containsIdentifiableMinor ===
                        false
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-300 bg-white hover:border-cyan-300'
                      }`}
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
                        Não contém
                      </span>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                        form
                          .containsIdentifiableMinor ===
                        true
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-300 bg-white hover:border-cyan-300'
                      }`}
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
                        Contém
                      </span>
                    </label>
                  </div>

                  {form
                    .containsIdentifiableMinor ===
                  true ? (
                    <div className="mt-5 space-y-5 rounded-xl border border-amber-300 bg-white p-5">
                      <div>
                        <label
                          htmlFor="authorization-reference"
                          className="mb-2 block text-sm font-bold text-slate-800"
                        >
                          Referência da autorização
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
                          ) =>
                            updateForm(
                              'authorizationReference',
                              event.target
                                .value,
                            )
                          }
                          placeholder="Ex.: Termo de uso de imagem 2026 — turma 2º A"
                          className={
                            inputClassName
                          }
                        />

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Informe somente uma referência interna. Não anexe o termo completo neste campo.
                        </p>
                      </div>

                      <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                        <input
                          type="checkbox"
                          required
                          checked={
                            form
                              .guardianAuthorizationConfirmed
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'guardianAuthorizationConfirmed',
                              event.target
                                .checked,
                            )
                          }
                          className="mt-1 h-5 w-5 shrink-0 accent-[#0B7491]"
                        />

                        <span className="text-sm font-semibold leading-6 text-amber-950">
                          Declaro que a instituição possui autorização expressa, específica, informada e vigente do responsável legal para o registro, armazenamento e uso desta evidência na finalidade pedagógica informada.
                        </span>
                      </label>
                    </div>
                  ) : null}
                </fieldset>

                <section>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Dados do registro
                  </p>

                  <div className="mt-4 space-y-5">
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
                        ) =>
                          updateForm(
                            'title',
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
                        ) =>
                          updateForm(
                            'description',
                            event.target
                              .value,
                          )
                        }
                        className={`${inputClassName} resize-y`}
                      />
                    </div>
                  </div>
                </section>

                <fieldset>
                  <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Formato da evidência
                  </legend>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {evidenceTypeOptions.map(
                      (option) => {
                        const active =
                          form.evidenceType ===
                          option.value

                        return (
                          <label
                            key={
                              option.value
                            }
                            className={`cursor-pointer rounded-xl border p-4 transition ${
                              active
                                ? 'border-[#0B7491] bg-cyan-50'
                                : 'border-slate-200 bg-white hover:border-cyan-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="evidence-type"
                              value={
                                option.value
                              }
                              checked={
                                active
                              }
                              onChange={() =>
                                handleEvidenceTypeChange(
                                  option.value,
                                )
                              }
                              className="sr-only"
                            />

                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-[#071827]">
                                  {
                                    option.label
                                  }
                                </p>

                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                  {
                                    option.description
                                  }
                                </p>
                              </div>

                              <span
                                aria-hidden="true"
                                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                                  active
                                    ? 'bg-[#0B7491]'
                                    : 'border border-slate-300 bg-white'
                                }`}
                              />
                            </div>
                          </label>
                        )
                      },
                    )}
                  </div>
                </fieldset>

                {usesFile ? (
                  <section>
                    <label
                      htmlFor="evidence-file"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Arquivo protegido
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
                          event.target
                            .files?.[0] ??
                            null,
                        )

                        clearMessages()
                      }}
                      className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#071827] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#0B2940]"
                    />

                    <p className="mt-2 text-sm text-slate-500">
                      {form.evidenceType ===
                      'imagem'
                        ? 'Formatos aceitos: JPG, PNG ou WEBP. Máximo de 10 MB.'
                        : 'Formato aceito: PDF. Máximo de 10 MB.'}
                    </p>

                    {selectedFile ? (
                      <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                        <p className="break-words text-sm font-semibold text-[#071827]">
                          {
                            selectedFile.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatFileSize(
                            selectedFile.size,
                          )}
                        </p>
                      </div>
                    ) : null}
                  </section>
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
                      ) =>
                        updateForm(
                          'externalUrl',
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClassName
                      }
                      placeholder="https://..."
                    />
                  </div>
                ) : null}

                {formError ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
                  >
                    {formError}
                  </div>
                ) : null}

                {successMessage ? (
                  <div
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700"
                  >
                    {
                      successMessage
                    }
                  </div>
                ) : null}
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
                <button
                  type="submit"
                  disabled={
                    isSubmitDisabled
                  }
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  {submitting
                    ? 'Enviando e salvando...'
                    : 'Criar evidência'}
                </button>

                {!isMinorProtectionComplete ? (
                  <p className="mt-3 text-center text-sm font-medium text-slate-500">
                    Responda à verificação sobre identificação de menores para liberar o registro.
                  </p>
                ) : null}
              </div>
            </form>

            <section className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-[176px]">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                      Memória ativa
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                      Evidências cadastradas
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {
                        evidences.length
                      }{' '}
                      registro
                      {evidences.length === 1
                        ? ''
                        : 's'}{' '}
                      ativo
                      {evidences.length === 1
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
                      setDeletionSuccessMessage(
                        null,
                      )

                      void reload()
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? 'Atualizando...'
                      : 'Atualizar'}
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {deletionSuccessMessage ? (
                  <div
                    role="status"
                    className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700"
                  >
                    {
                      deletionSuccessMessage
                    }
                  </div>
                ) : null}

                {loading ? (
                  <div
                    role="status"
                    className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-900"
                  >
                    Carregando evidências...
                  </div>
                ) : null}

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {error}
                  </div>
                ) : null}

                {fileAccessError ? (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
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
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="font-bold text-slate-700">
                      Nenhuma evidência cadastrada
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Utilize o formulário para criar o primeiro registro pedagógico.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {evidences.map(
                    (
                      evidence,
                      index,
                    ) => {
                      const fileSize =
                        formatFileSize(
                          evidence
                            .file_size_bytes,
                        )

                      return (
                        <article
                          key={
                            evidence.id
                          }
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="font-mono text-xs font-bold text-[#0B7491]">
                                  {String(
                                    index +
                                      1,
                                  ).padStart(
                                    2,
                                    '0',
                                  )}
                                </span>

                                <div className="min-w-0">
                                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
                                    {getEvidenceTypeLabel(
                                      evidence
                                        .evidence_type,
                                    )}
                                  </p>

                                  <h3 className="mt-2 break-words text-lg font-bold text-[#071827]">
                                    {
                                      evidence.title
                                    }
                                  </h3>
                                </div>
                              </div>

                              <span className="shrink-0 rounded-lg bg-[#071827] px-3 py-2 text-xs font-bold text-white">
                                {formatDate(
                                  evidence
                                    .created_at,
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4 p-5">
                            {evidence.description ? (
                              <p className="break-words text-sm leading-6 text-slate-600">
                                {
                                  evidence.description
                                }
                              </p>
                            ) : null}

                            {evidence
                              .contains_identifiable_minor ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm font-bold text-amber-950">
                                  Menor identificável declarado
                                </p>

                                <p className="mt-1 text-sm leading-6 text-amber-900">
                                  A declaração de autorização foi registrada pelo usuário responsável.
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
                              <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                                Sem menor identificável declarado
                              </span>
                            )}

                            {evidence
                              .original_file_name ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                  Arquivo
                                </p>

                                <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                                  {
                                    evidence
                                      .original_file_name
                                  }
                                </p>

                                {fileSize ? (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      fileSize
                                    }
                                  </p>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap">
                              {evidence.file_url ? (
                                <a
                                  href={
                                    evidence
                                      .file_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0B2940]"
                                >
                                  Abrir arquivo
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
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-wait disabled:bg-slate-400"
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
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0B7491] bg-white px-5 py-3 text-sm font-semibold text-[#075F78] transition hover:bg-cyan-50"
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
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 sm:ml-auto"
                              >
                                Excluir evidência
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    },
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </AgendaPageShell>

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
    </>
  )
}
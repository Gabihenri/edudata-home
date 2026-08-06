'use client'

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import {
  useSearchParams,
} from 'next/navigation'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

import {
  EvidenceIntelligencePanel,
} from '@/components/agenda/EvidenceIntelligencePanel'

import {
  useEvidences,
} from '@/lib/agenda/hooks/useEvidences'

import {
  useLessonObjectives,
} from '@/lib/agenda/hooks/useLessonObjectives'

import {
  useLessons,
} from '@/lib/agenda/hooks/useLessons'

import type {
  AgendaEvidence,
  AgendaEvidenceType,
  CreateAgendaEvidenceInput,
} from '@/lib/agenda/repository/evidences.repository'

import type {
  AgendaLesson,
} from '@/lib/agenda/repository/lessons.repository'

type EvidenceFormState = {
  title:
    string

  description:
    string

  evidenceType:
    AgendaEvidenceType

  externalUrl:
    string

  containsIdentifiableMinor:
    boolean | null

  guardianAuthorizationConfirmed:
    boolean

  authorizationReference:
    string
}

type EvidenceContextSource =
  | 'lesson'
  | 'planning'
  | 'objective'
  | 'reflection'
  | null

const PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

const INITIAL_FORM:
  EvidenceFormState = {
    title:
      '',

    description:
      '',

    evidenceType:
      'texto',

    externalUrl:
      '',

    containsIdentifiableMinor:
      null,

    guardianAuthorizationConfirmed:
      false,

    authorizationReference:
      '',
  }

const INPUT_CLASS_NAME = [
  'min-h-12 w-full rounded-xl',
  'border border-slate-300 bg-white',
  'px-4 py-3 text-sm text-slate-950',
  'outline-none transition',
  'placeholder:text-slate-400',
  'focus:border-[#0B7491]',
  'focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed',
  'disabled:bg-slate-100',
  'disabled:text-slate-500',
].join(' ')

const EVIDENCE_TYPE_OPTIONS:
  Array<{
    value:
      AgendaEvidenceType

    label:
      string

    description:
      string
  }> = [
    {
      value:
        'texto',

      label:
        'Texto',

      description:
        'Registro descritivo sem arquivo.',
    },
    {
      value:
        'imagem',

      label:
        'Imagem',

      description:
        'Imagem JPG, PNG ou WEBP armazenada de forma protegida.',
    },
    {
      value:
        'pdf',

      label:
        'PDF',

      description:
        'Documento pedagógico armazenado de forma protegida.',
    },
    {
      value:
        'link',

      label:
        'Link',

      description:
        'Referência externa autorizada.',
    },
  ]

function normalizeContextSource(
  value:
    string | null,
): EvidenceContextSource {
  if (
    value ===
      'lesson' ||
    value ===
      'planning' ||
    value ===
      'objective' ||
    value ===
      'reflection'
  ) {
    return value
  }

  return null
}

function formatDate(
  value:
    string | null,
): string {
  if (!value) {
    return 'Data não informada'
  }

  const date =
    new Date(
      `${value}T12:00:00`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',
    },
  )
}

function formatDateTime(
  value:
    string,
): string {
  const date =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data indisponível'
  }

  return date.toLocaleString(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  )
}

function formatTime(
  value:
    string | null,
): string {
  if (!value) {
    return ''
  }

  return value.slice(
    0,
    5,
  )
}

function buildTimeRange(
  startTime:
    string | null,

  endTime:
    string | null,
): string {
  const start =
    formatTime(
      startTime,
    )

  const end =
    formatTime(
      endTime,
    )

  if (
    start &&
    end
  ) {
    return `${start}–${end}`
  }

  return (
    start ||
    end ||
    'Horário não informado'
  )
}

function formatFileSize(
  value:
    | number
    | null
    | undefined,
): string | null {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(
      value,
    ) ||
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
  type:
    AgendaEvidenceType,
): string {
  return (
    EVIDENCE_TYPE_OPTIONS
      .find(
        option =>
          option.value ===
          type,
      )
      ?.label ??
    type
  )
}

function getEvidenceTypeClasses(
  type:
    AgendaEvidenceType,
): string {
  if (
    type ===
      'imagem'
  ) {
    return [
      'border-violet-200',
      'bg-violet-50',
      'text-violet-800',
    ].join(' ')
  }

  if (
    type ===
      'pdf'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-800',
    ].join(' ')
  }

  if (
    type ===
      'link'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-800',
    ].join(' ')
  }

  return [
    'border-cyan-200',
    'bg-cyan-50',
    'text-[#075F78]',
  ].join(' ')
}

function getLessonStatusLabel(
  status:
    AgendaLesson['status'],
): string {
  if (
    status ===
      'planejada'
  ) {
    return 'Planejada'
  }

  if (
    status ===
      'em_preparacao'
  ) {
    return 'Em preparação'
  }

  if (
    status ===
      'realizada'
  ) {
    return 'Realizada'
  }

  if (
    status ===
      'parcialmente_realizada'
  ) {
    return 'Parcialmente realizada'
  }

  if (
    status ===
      'reagendada'
  ) {
    return 'Reagendada'
  }

  if (
    status ===
      'cancelada'
  ) {
    return 'Cancelada'
  }

  return status
}

function buildContextMetadata(
  lesson:
    AgendaLesson | null,

  inheritedObjectiveIds:
    string[],

  primaryObjectiveId:
    string | null,
): Record<string, unknown> {
  if (!lesson) {
    return {
      source:
        'agenda-evidence-manual',

      createdThrough:
        'agenda-evidence-interface',
    }
  }

  return {
    source:
      'lesson',

    sourceId:
      lesson.id,

    inheritedFromLesson:
      true,

    inheritedObjectiveIds,

    primaryObjectiveId,

    lessonTitle:
      lesson.title,

    lessonStatus:
      lesson.status,

    subject:
      lesson.subject,

    scheduledDate:
      lesson.scheduled_date,

    createdThrough:
      'agenda-evidence-interface',
  }
}

export function AgendaEvidence() {
  const searchParams =
    useSearchParams()

  const contextSource =
    normalizeContextSource(
      searchParams.get(
        'source',
      ),
    )

  const contextId =
    searchParams
      .get(
        'id',
      )
      ?.trim() ??
    ''

  const hasLessonContext =
    contextSource ===
      'lesson' &&
    Boolean(
      contextId,
    )

  const {
    getLesson,
  } = useLessons()

  const {
    relationships:
      lessonObjectiveRelationships,

    loading:
      lessonObjectivesLoading,

    error:
      lessonObjectivesError,
  } = useLessonObjectives(
    hasLessonContext
      ? contextId
      : null,

    {
      autoLoad:
        hasLessonContext,
    },
  )

  const {
    evidences,
    loading,
    mutating,
    error,

    clearError,
    reload,

    createEvidence,
    deleteEvidence,

    uploadEvidenceFile,
    getEvidenceFileUrl,
  } = useEvidences({
    initialFilters:
      hasLessonContext
        ? {
            lessonId:
              contextId,
          }
        : {},
  })

  const [
    contextLesson,
    setContextLesson,
  ] = useState<
    AgendaLesson | null
  >(null)

  const [
    contextLoading,
    setContextLoading,
  ] = useState(
    hasLessonContext,
  )

  const [
    contextError,
    setContextError,
  ] = useState<
    string | null
  >(null)

  const [
    form,
    setForm,
  ] = useState<
    EvidenceFormState
  >(INITIAL_FORM)

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<
    File | null
  >(null)

  const [
    fileInputKey,
    setFileInputKey,
  ] = useState(
    0,
  )

  const [
    submitting,
    setSubmitting,
  ] = useState(
    false,
  )

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
    deletingEvidenceId,
    setDeletingEvidenceId,
  ] = useState<
    string | null
  >(null)

  const [
    fileAccessError,
    setFileAccessError,
  ] = useState<
    string | null
  >(null)

  const primaryObjectiveRelationship =
    useMemo(
      () =>
        lessonObjectiveRelationships
          .find(
            relationship =>
              relationship
                .relationship_role ===
              'primary',
          ) ??
        lessonObjectiveRelationships[0] ??
        null,
      [
        lessonObjectiveRelationships,
      ],
    )

  const primaryObjectiveId =
    primaryObjectiveRelationship
      ?.objective_id ??
    null

  const inheritedObjectiveIds =
    useMemo(
      () =>
        Array.from(
          new Set(
            lessonObjectiveRelationships
              .map(
                relationship =>
                  relationship
                    .objective_id,
              )
              .filter(
                Boolean,
              ),
          ),
        ),
      [
        lessonObjectiveRelationships,
      ],
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
      form.guardianAuthorizationConfirmed,
    ])

  const isSubmitDisabled =
    useMemo(() => {
      if (
        submitting ||
        mutating
      ) {
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
        !form.externalUrl
          .trim()
      ) {
        return true
      }

      if (
        hasLessonContext &&
        (
          contextLoading ||
          !contextLesson
        )
      ) {
        return true
      }

      return (
        !isMinorProtectionComplete
      )
    }, [
      contextLesson,
      contextLoading,
      form.evidenceType,
      form.externalUrl,
      form.title,
      hasLessonContext,
      isMinorProtectionComplete,
      mutating,
      selectedFile,
      submitting,
      usesFile,
    ])

  const evidenceSummary =
    useMemo(() => {
      const protectedFiles =
        evidences.filter(
          evidence =>
            Boolean(
              evidence.storage_path,
            ),
        ).length

      const externalLinks =
        evidences.filter(
          evidence =>
            Boolean(
              evidence.external_url,
            ),
        ).length

      const identifiableMinors =
        evidences.filter(
          evidence =>
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
    }, [
      evidences,
    ])

  useEffect(() => {
    if (
      !hasLessonContext
    ) {
      setContextLesson(
        null,
      )

      setContextLoading(
        false,
      )

      setContextError(
        null,
      )

      return
    }

    let active =
      true

    async function loadContextLesson():
      Promise<void> {
      setContextLoading(
        true,
      )

      setContextError(
        null,
      )

      try {
        const lesson =
          await getLesson(
            contextId,
          )

        if (!active) {
          return
        }

        setContextLesson(
          lesson,
        )
      } catch (
        loadError
      ) {
        if (!active) {
          return
        }

        setContextLesson(
          null,
        )

        setContextError(
          loadError instanceof
            Error
            ? loadError.message
            : 'Não foi possível carregar o contexto da aula.',
        )
      } finally {
        if (active) {
          setContextLoading(
            false,
          )
        }
      }
    }

    void loadContextLesson()

    return () => {
      active =
        false
    }
  }, [
    contextId,
    getLesson,
    hasLessonContext,
  ])

  function clearMessages():
    void {
    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )

    clearError()
  }

  function resetForm():
    void {
    setForm(
      INITIAL_FORM,
    )

    setSelectedFile(
      null,
    )

    setFileInputKey(
      current =>
        current +
        1,
    )
  }

  function updateForm<
    Key extends
      keyof EvidenceFormState,
  >(
    key:
      Key,

    value:
      EvidenceFormState[Key],
  ): void {
    setForm(
      current => ({
        ...current,

        [key]:
          value,
      }),
    )

    clearMessages()
  }

  function handleEvidenceTypeChange(
    value:
      AgendaEvidenceType,
  ): void {
    setForm(
      current => ({
        ...current,

        evidenceType:
          value,

        externalUrl:
          value ===
            'link'
            ? current.externalUrl
            : '',
      }),
    )

    setSelectedFile(
      null,
    )

    setFileInputKey(
      current =>
        current +
        1,
    )

    clearMessages()
  }

  function handleMinorAnswer(
    value:
      boolean,
  ): void {
    setForm(
      current => ({
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

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(
      true,
    )

    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )

    clearError()

    try {
      let uploadedFile:
        Awaited<
          ReturnType<
            typeof uploadEvidenceFile
          >
        > |
        null = null

      if (
        usesFile
      ) {
        if (!selectedFile) {
          throw new Error(
            'Selecione o arquivo da evidência.',
          )
        }

        if (
          form.evidenceType ===
            'imagem' &&
          !selectedFile.type
            .startsWith(
              'image/',
            )
        ) {
          throw new Error(
            'Para uma evidência de imagem, selecione um arquivo JPG, PNG ou WEBP.',
          )
        }

        if (
          form.evidenceType ===
            'pdf' &&
          selectedFile.type !==
            'application/pdf'
        ) {
          throw new Error(
            'Para uma evidência em PDF, selecione um documento PDF.',
          )
        }

        uploadedFile =
          await uploadEvidenceFile(
            selectedFile,
          )
      }

      const metadata =
        buildContextMetadata(
          contextLesson,
          inheritedObjectiveIds,
          primaryObjectiveId,
        )

      const input:
        CreateAgendaEvidenceInput = {
          title:
            form.title
              .trim(),

          description:
            form.description
              .trim() ||
            null,

          evidence_type:
            form.evidenceType,

          external_url:
            form.evidenceType ===
              'link'
              ? form.externalUrl
                  .trim()
              : null,

          file_url:
            uploadedFile
              ?.publicUrl ??
            null,

          storage_bucket:
            uploadedFile
              ?.bucket ??
            null,

          storage_path:
            uploadedFile
              ?.path ??
            null,

          original_file_name:
            uploadedFile
              ?.originalFileName ??
            null,

          file_mime_type:
            uploadedFile
              ?.mimeType ??
            null,

          file_size_bytes:
            uploadedFile
              ?.sizeBytes ??
            null,

          lesson_id:
            contextLesson
              ?.id ??
            null,

          planning_id:
            contextLesson
              ?.planning_id ??
            null,

          objective_id:
            primaryObjectiveId,

          class_id:
            contextLesson
              ?.class_id ??
            null,

          academic_period_id:
            contextLesson
              ?.academic_period_id ??
            null,

          organization_id:
            contextLesson
              ?.organization_id ??
            null,

          school_id:
            contextLesson
              ?.school_id ??
            null,

          contains_identifiable_minor:
            form
              .containsIdentifiableMinor ===
            true,

          guardian_authorization_confirmed:
            form
              .containsIdentifiableMinor ===
              true &&
            form
              .guardianAuthorizationConfirmed,

          authorization_reference:
            form
              .containsIdentifiableMinor ===
              true
              ? form
                  .authorizationReference
                  .trim() ||
                null
              : null,

          privacy_notice_version:
            PRIVACY_NOTICE_VERSION,

          metadata,
        }

      await createEvidence(
        input,
      )

      resetForm()

      setSuccessMessage(
        contextLesson
          ? 'Evidência registrada e vinculada à aula com sucesso.'
          : 'Evidência registrada com sucesso.',
      )
    } catch (
      submitError
    ) {
      setFormError(
        submitError instanceof
          Error
          ? submitError.message
          : 'Não foi possível registrar a evidência.',
      )
    } finally {
      setSubmitting(
        false,
      )
    }
  }

  async function handleOpenProtectedFile(
    evidenceId:
      string,
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
        'O navegador bloqueou a abertura do arquivo. Permita novas janelas para este site.',
      )

      return
    }

    try {
      const signedUrl =
        await getEvidenceFileUrl(
          evidenceId,
        )

      fileWindow.location.href =
        signedUrl
    } catch (
      openError
    ) {
      fileWindow.close()

      setFileAccessError(
        openError instanceof
          Error
          ? openError.message
          : 'Não foi possível abrir o arquivo protegido.',
      )
    } finally {
      setOpeningEvidenceId(
        null,
      )
    }
  }

  async function handleDeleteEvidence(
    evidence:
      AgendaEvidence,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        `Deseja excluir a evidência “${evidence.title}”?`,
      )

    if (!confirmed) {
      return
    }

    const reason =
      window.prompt(
        'Informe o motivo da exclusão:',
      )
        ?.trim()

    if (!reason) {
      return
    }

    setDeletingEvidenceId(
      evidence.id,
    )

    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )

    try {
      const message =
        await deleteEvidence(
          evidence.id,
          reason,
        )

      setSuccessMessage(
        message,
      )
    } catch (
      deleteError
    ) {
      setFormError(
        deleteError instanceof
          Error
          ? deleteError.message
          : 'Não foi possível excluir a evidência.',
      )
    } finally {
      setDeletingEvidenceId(
        null,
      )
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Documentação pedagógica"
      title="Evidências"
      description="Registre evidências do trabalho pedagógico com rastreabilidade, proteção de dados e integração ao ciclo operacional do Framework EDI."
    >
      <div
        className="space-y-6 sm:space-y-8"
      >
        {hasLessonContext ? (
          <section
            className={[
              'overflow-hidden',
              'rounded-[1.75rem]',
              'border border-cyan-200',
              'bg-cyan-50 shadow-sm',
            ].join(' ')}
          >
            <header
              className={[
                'border-b',
                'border-cyan-200',
                'px-5 py-5',
                'sm:px-7',
              ].join(' ')}
            >
              <div
                className={[
                  'flex flex-col gap-4',
                  'lg:flex-row',
                  'lg:items-start',
                  'lg:justify-between',
                ].join(' ')}
              >
                <div>
                  <p
                    className={[
                      'text-xs font-bold',
                      'uppercase',
                      'tracking-[0.18em]',
                      'text-[#075F78]',
                    ].join(' ')}
                  >
                    Contexto herdado
                  </p>

                  <h2
                    className={[
                      'mt-2 text-2xl',
                      'font-bold',
                      'text-[#071827]',
                    ].join(' ')}
                  >
                    Evidência vinculada à aula
                  </h2>

                  <p
                    className={[
                      'mt-2 max-w-3xl',
                      'text-sm leading-6',
                      'text-slate-600',
                    ].join(' ')}
                  >
                    A plataforma preencherá automaticamente os vínculos com aula, planejamento, objetivos, turma, escola, organização e período.
                  </p>
                </div>

                <Link
                  href="/agenda/aulas"
                  className={[
                    'inline-flex min-h-11',
                    'items-center justify-center',
                    'rounded-xl border',
                    'border-cyan-300',
                    'bg-white px-5 py-3',
                    'text-sm font-bold',
                    'text-[#075F78]',
                    'transition',
                    'hover:bg-cyan-100',
                  ].join(' ')}
                >
                  Voltar para aulas
                </Link>
              </div>
            </header>

            {contextLoading ? (
              <div
                className={[
                  'p-6 text-sm',
                  'font-semibold',
                  'text-slate-600',
                  'sm:px-7',
                ].join(' ')}
              >
                Carregando o contexto da aula...
              </div>
            ) : contextError ? (
              <div
                className={[
                  'border-t',
                  'border-rose-200',
                  'bg-rose-50 p-6',
                  'text-sm font-semibold',
                  'text-rose-800',
                  'sm:px-7',
                ].join(' ')}
              >
                {contextError}
              </div>
            ) : contextLesson ? (
              <div
                className={[
                  'grid gap-4 p-5',
                  'sm:grid-cols-2',
                  'sm:p-7',
                  'xl:grid-cols-4',
                ].join(' ')}
              >
                <article
                  className={[
                    'rounded-xl border',
                    'border-cyan-200',
                    'bg-white p-4',
                    'sm:col-span-2',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-[10px]',
                      'font-bold uppercase',
                      'tracking-[0.14em]',
                      'text-slate-400',
                    ].join(' ')}
                  >
                    Aula
                  </p>

                  <h3
                    className={[
                      'mt-2 text-lg',
                      'font-bold',
                      'text-[#071827]',
                    ].join(' ')}
                  >
                    {contextLesson.title}
                  </h3>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'font-semibold',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    {contextLesson.subject ||
                      'Componente não informado'}
                  </p>
                </article>

                <article
                  className={[
                    'rounded-xl border',
                    'border-cyan-200',
                    'bg-white p-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-[10px]',
                      'font-bold uppercase',
                      'tracking-[0.14em]',
                      'text-slate-400',
                    ].join(' ')}
                  >
                    Data e horário
                  </p>

                  <p
                    className={[
                      'mt-2 text-sm',
                      'font-bold',
                      'text-[#071827]',
                    ].join(' ')}
                  >
                    {formatDate(
                      contextLesson
                        .scheduled_date,
                    )}
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    {buildTimeRange(
                      contextLesson
                        .start_time,

                      contextLesson
                        .end_time,
                    )}
                  </p>
                </article>

                <article
                  className={[
                    'rounded-xl border',
                    'border-cyan-200',
                    'bg-white p-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-[10px]',
                      'font-bold uppercase',
                      'tracking-[0.14em]',
                      'text-slate-400',
                    ].join(' ')}
                  >
                    Status
                  </p>

                  <p
                    className={[
                      'mt-2 text-sm',
                      'font-bold',
                      'text-[#071827]',
                    ].join(' ')}
                  >
                    {getLessonStatusLabel(
                      contextLesson.status,
                    )}
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    {inheritedObjectiveIds.length}{' '}
                    objetivo(s) herdado(s)
                  </p>
                </article>

                {lessonObjectivesLoading ? (
                  <div
                    className={[
                      'rounded-xl border',
                      'border-cyan-200',
                      'bg-white p-4',
                      'text-sm font-semibold',
                      'text-slate-500',
                      'sm:col-span-2',
                      'xl:col-span-4',
                    ].join(' ')}
                  >
                    Carregando objetivos da aula...
                  </div>
                ) : null}

                {lessonObjectivesError ? (
                  <div
                    className={[
                      'rounded-xl border',
                      'border-amber-200',
                      'bg-amber-50 p-4',
                      'text-sm font-semibold',
                      'text-amber-900',
                      'sm:col-span-2',
                      'xl:col-span-4',
                    ].join(' ')}
                  >
                    Não foi possível carregar os objetivos relacionados à aula.
                  </div>
                ) : null}

                {!lessonObjectivesLoading &&
                !lessonObjectivesError &&
                lessonObjectiveRelationships.length >
                  0 ? (
                  <section
                    className={[
                      'rounded-xl border',
                      'border-cyan-200',
                      'bg-white p-4',
                      'sm:col-span-2',
                      'xl:col-span-4',
                    ].join(' ')}
                  >
                    <p
                      className={[
                        'text-[10px]',
                        'font-bold uppercase',
                        'tracking-[0.14em]',
                        'text-slate-400',
                      ].join(' ')}
                    >
                      Objetivos relacionados
                    </p>

                    <div
                      className={[
                        'mt-3 flex',
                        'flex-wrap gap-2',
                      ].join(' ')}
                    >
                      {lessonObjectiveRelationships.map(
                        relationship => (
                          <span
                            key={
                              relationship.id
                            }
                            className={[
                              'rounded-full border',
                              'px-3 py-2',
                              'text-xs font-bold',
                              relationship
                                .relationship_role ===
                              'primary'
                                ? [
                                    'border-cyan-300',
                                    'bg-cyan-100',
                                    'text-[#075F78]',
                                  ].join(' ')
                                : [
                                    'border-slate-200',
                                    'bg-slate-100',
                                    'text-slate-700',
                                  ].join(' '),
                            ].join(' ')}
                          >
                            {relationship
                              .objective
                              ?.title ??
                              'Objetivo relacionado'}

                            {relationship
                              .relationship_role ===
                            'primary'
                              ? ' — principal'
                              : ''}
                          </span>
                        ),
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <section
          aria-label="Resumo das evidências"
          className={[
            'grid overflow-hidden',
            'rounded-[1.5rem]',
            'border border-slate-200',
            'bg-white shadow-sm',
            'sm:grid-cols-2',
            'xl:grid-cols-4',
          ].join(' ')}
        >
          <article
            className={[
              'border-b',
              'border-slate-200',
              'p-5 sm:border-r',
              'xl:border-b-0',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.16em]',
                'text-slate-500',
              ].join(' ')}
            >
              Evidências
            </p>

            <p
              className={[
                'mt-3 text-3xl',
                'font-bold',
                'text-[#071827]',
              ].join(' ')}
            >
              {evidenceSummary.total}
            </p>

            <p
              className={[
                'mt-1 text-sm',
                'text-slate-500',
              ].join(' ')}
            >
              Registros ativos
            </p>
          </article>

          <article
            className={[
              'border-b',
              'border-slate-200',
              'p-5',
              'xl:border-b-0',
              'xl:border-r',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.16em]',
                'text-slate-500',
              ].join(' ')}
            >
              Arquivos protegidos
            </p>

            <p
              className={[
                'mt-3 text-3xl',
                'font-bold',
                'text-[#071827]',
              ].join(' ')}
            >
              {
                evidenceSummary
                  .protectedFiles
              }
            </p>

            <p
              className={[
                'mt-1 text-sm',
                'text-slate-500',
              ].join(' ')}
            >
              Storage privado
            </p>
          </article>

          <article
            className={[
              'border-b',
              'border-slate-200',
              'p-5 sm:border-r',
              'sm:border-b-0',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.16em]',
                'text-slate-500',
              ].join(' ')}
            >
              Links
            </p>

            <p
              className={[
                'mt-3 text-3xl',
                'font-bold',
                'text-[#071827]',
              ].join(' ')}
            >
              {
                evidenceSummary
                  .externalLinks
              }
            </p>

            <p
              className={[
                'mt-1 text-sm',
                'text-slate-500',
              ].join(' ')}
            >
              Referências externas
            </p>
          </article>

          <article
            className="p-5"
          >
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.16em]',
                'text-slate-500',
              ].join(' ')}
            >
              Proteção de menores
            </p>

            <p
              className={[
                'mt-3 text-3xl',
                'font-bold',
                'text-[#071827]',
              ].join(' ')}
            >
              {
                evidenceSummary
                  .identifiableMinors
              }
            </p>

            <p
              className={[
                'mt-1 text-sm',
                'text-slate-500',
              ].join(' ')}
            >
              Com autorização registrada
            </p>
          </article>
        </section>

        <section
          className={[
            'overflow-hidden',
            'rounded-[1.75rem]',
            'border border-slate-200',
            'bg-white shadow-sm',
          ].join(' ')}
        >
          <header
            className={[
              'border-b',
              'border-slate-200',
              'px-5 py-5',
              'sm:px-7',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.18em]',
                'text-[#0B7491]',
              ].join(' ')}
            >
              Novo registro
            </p>

            <h2
              className={[
                'mt-2 text-2xl',
                'font-bold',
                'text-[#071827]',
              ].join(' ')}
            >
              Registrar evidência
            </h2>

            <p
              className={[
                'mt-2 max-w-3xl',
                'text-sm leading-6',
                'text-slate-500',
              ].join(' ')}
            >
              Registre apenas informações necessárias e evite dados pessoais desnecessários, nomes completos de estudantes, localização ou outros elementos de identificação.
            </p>
          </header>

          <form
            onSubmit={
              handleSubmit
            }
            className={[
              'space-y-6',
              'p-5 sm:p-7',
            ].join(' ')}
          >
            <fieldset>
              <legend
                className={[
                  'text-sm font-bold',
                  'text-slate-700',
                ].join(' ')}
              >
                Tipo de evidência
              </legend>

              <div
                className={[
                  'mt-3 grid gap-3',
                  'sm:grid-cols-2',
                  'xl:grid-cols-4',
                ].join(' ')}
              >
                {EVIDENCE_TYPE_OPTIONS.map(
                  option => {
                    const selected =
                      form.evidenceType ===
                      option.value

                    return (
                      <label
                        key={
                          option.value
                        }
                        className={[
                          'cursor-pointer',
                          'rounded-xl border',
                          'p-4 transition',
                          selected
                            ? [
                                'border-cyan-400',
                                'bg-cyan-50',
                                'ring-2',
                                'ring-cyan-100',
                              ].join(' ')
                            : [
                                'border-slate-200',
                                'bg-white',
                                'hover:bg-slate-50',
                              ].join(' '),
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="evidence-type"
                          value={
                            option.value
                          }
                          checked={
                            selected
                          }
                          onChange={() =>
                            handleEvidenceTypeChange(
                              option.value,
                            )
                          }
                          className="sr-only"
                        />

                        <span
                          className={[
                            'block font-bold',
                            'text-[#071827]',
                          ].join(' ')}
                        >
                          {option.label}
                        </span>

                        <span
                          className={[
                            'mt-1 block',
                            'text-sm leading-5',
                            'text-slate-500',
                          ].join(' ')}
                        >
                          {
                            option.description
                          }
                        </span>
                      </label>
                    )
                  },
                )}
              </div>
            </fieldset>

            <div
              className={[
                'grid gap-5',
                'lg:grid-cols-2',
              ].join(' ')}
            >
              <label
                className={[
                  'block',
                  'lg:col-span-2',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-sm font-bold',
                    'text-slate-700',
                  ].join(' ')}
                >
                  Título
                </span>

                <input
                  type="text"
                  required
                  maxLength={
                    240
                  }
                  value={
                    form.title
                  }
                  onChange={
                    event =>
                      updateForm(
                        'title',
                        event
                          .target
                          .value,
                      )
                  }
                  className={`mt-2 ${INPUT_CLASS_NAME}`}
                />
              </label>

              <label
                className={[
                  'block',
                  'lg:col-span-2',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-sm font-bold',
                    'text-slate-700',
                  ].join(' ')}
                >
                  Descrição
                </span>

                <textarea
                  rows={
                    5
                  }
                  maxLength={
                    5000
                  }
                  value={
                    form.description
                  }
                  onChange={
                    event =>
                      updateForm(
                        'description',
                        event
                          .target
                          .value,
                      )
                  }
                  placeholder="Descreva objetivamente o que esta evidência demonstra."
                  className={`mt-2 ${INPUT_CLASS_NAME}`}
                />
              </label>

              {form.evidenceType ===
              'link' ? (
                <label
                  className={[
                    'block',
                    'lg:col-span-2',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'text-sm font-bold',
                      'text-slate-700',
                    ].join(' ')}
                  >
                    Endereço externo
                  </span>

                  <input
                    type="url"
                    required
                    value={
                      form.externalUrl
                    }
                    onChange={
                      event =>
                        updateForm(
                          'externalUrl',
                          event
                            .target
                            .value,
                        )
                    }
                    placeholder="https://"
                    className={`mt-2 ${INPUT_CLASS_NAME}`}
                  />
                </label>
              ) : null}

              {usesFile ? (
                <label
                  className={[
                    'block',
                    'lg:col-span-2',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'text-sm font-bold',
                      'text-slate-700',
                    ].join(' ')}
                  >
                    Arquivo protegido
                  </span>

                  <input
                    key={
                      fileInputKey
                    }
                    type="file"
                    required
                    accept={
                      form.evidenceType ===
                        'imagem'
                        ? 'image/jpeg,image/png,image/webp'
                        : 'application/pdf'
                    }
                    onChange={
                      event =>
                        setSelectedFile(
                          event
                            .target
                            .files?.[0] ??
                          null,
                        )
                    }
                    className={[
                      'mt-2 block w-full',
                      'rounded-xl border',
                      'border-slate-300',
                      'bg-white p-3',
                      'text-sm',
                      'text-slate-700',
                      'file:mr-4',
                      'file:rounded-lg',
                      'file:border-0',
                      'file:bg-cyan-50',
                      'file:px-4',
                      'file:py-2',
                      'file:font-bold',
                      'file:text-[#075F78]',
                    ].join(' ')}
                  />

                  <span
                    className={[
                      'mt-2 block',
                      'text-xs leading-5',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    Formatos autorizados: JPG, PNG, WEBP ou PDF, conforme o tipo selecionado. Limite máximo de 10 MB.
                  </span>
                </label>
              ) : null}
            </div>

            <section
              className={[
                'overflow-hidden',
                'rounded-2xl border',
                'border-amber-200',
                'bg-amber-50',
              ].join(' ')}
            >
              <header
                className={[
                  'border-b',
                  'border-amber-200',
                  'px-5 py-4',
                ].join(' ')}
              >
                <p
                  className={[
                    'text-xs font-bold',
                    'uppercase',
                    'tracking-[0.16em]',
                    'text-amber-800',
                  ].join(' ')}
                >
                  Proteção de crianças e adolescentes
                </p>

                <h3
                  className={[
                    'mt-2 text-lg',
                    'font-bold',
                    'text-amber-950',
                  ].join(' ')}
                >
                  A evidência contém criança ou adolescente identificável?
                </h3>

                <p
                  className={[
                    'mt-2 text-sm',
                    'leading-6',
                    'text-amber-900',
                  ].join(' ')}
                >
                  Considere rosto, voz, nome, uniforme, localização, documento, produção identificada ou qualquer combinação que permita reconhecer o estudante.
                </p>
              </header>

              <div
                className={[
                  'space-y-5',
                  'p-5',
                ].join(' ')}
              >
                <div
                  className={[
                    'grid gap-3',
                    'sm:grid-cols-2',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleMinorAnswer(
                        false,
                      )
                    }
                    className={[
                      'min-h-12',
                      'rounded-xl border',
                      'px-4 py-3',
                      'text-sm font-bold',
                      'transition',
                      form
                        .containsIdentifiableMinor ===
                      false
                        ? [
                            'border-emerald-400',
                            'bg-emerald-100',
                            'text-emerald-900',
                            'ring-2',
                            'ring-emerald-100',
                          ].join(' ')
                        : [
                            'border-amber-300',
                            'bg-white',
                            'text-amber-900',
                            'hover:bg-amber-100',
                          ].join(' '),
                    ].join(' ')}
                  >
                    Não contém menor identificável
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleMinorAnswer(
                        true,
                      )
                    }
                    className={[
                      'min-h-12',
                      'rounded-xl border',
                      'px-4 py-3',
                      'text-sm font-bold',
                      'transition',
                      form
                        .containsIdentifiableMinor ===
                      true
                        ? [
                            'border-amber-500',
                            'bg-amber-200',
                            'text-amber-950',
                            'ring-2',
                            'ring-amber-100',
                          ].join(' ')
                        : [
                            'border-amber-300',
                            'bg-white',
                            'text-amber-900',
                            'hover:bg-amber-100',
                          ].join(' '),
                    ].join(' ')}
                  >
                    Sim, contém menor identificável
                  </button>
                </div>

                {form
                  .containsIdentifiableMinor ===
                true ? (
                  <div
                    className={[
                      'space-y-4',
                      'rounded-xl border',
                      'border-amber-300',
                      'bg-white p-4',
                    ].join(' ')}
                  >
                    <label
                      className={[
                        'flex items-start',
                        'gap-3',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        checked={
                          form
                            .guardianAuthorizationConfirmed
                        }
                        onChange={
                          event =>
                            updateForm(
                              'guardianAuthorizationConfirmed',
                              event
                                .target
                                .checked,
                            )
                        }
                        className={[
                          'mt-1 h-4 w-4',
                          'accent-amber-700',
                        ].join(' ')}
                      />

                      <span
                        className={[
                          'text-sm font-semibold',
                          'leading-6',
                          'text-amber-950',
                        ].join(' ')}
                      >
                        Confirmo que a instituição possui autorização vigente do responsável legal para este registro e para a finalidade informada.
                      </span>
                    </label>

                    <label
                      className="block"
                    >
                      <span
                        className={[
                          'text-sm font-bold',
                          'text-amber-950',
                        ].join(' ')}
                      >
                        Referência da autorização
                      </span>

                      <input
                        type="text"
                        required
                        maxLength={
                          1000
                        }
                        value={
                          form
                            .authorizationReference
                        }
                        onChange={
                          event =>
                            updateForm(
                              'authorizationReference',
                              event
                                .target
                                .value,
                            )
                        }
                        placeholder="Ex.: termo institucional, código interno ou data do documento"
                        className={`mt-2 ${INPUT_CLASS_NAME}`}
                      />
                    </label>

                    <p
                      className={[
                        'text-xs leading-5',
                        'text-amber-800',
                      ].join(' ')}
                    >
                      A plataforma registrará automaticamente o usuário responsável pela confirmação, a data e a versão da política de privacidade.
                    </p>
                  </div>
                ) : null}

                <div
                  className={[
                    'rounded-xl border',
                    'border-amber-200',
                    'bg-amber-100/70',
                    'p-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-sm font-bold',
                      'text-amber-950',
                    ].join(' ')}
                  >
                    Recomendações de segurança
                  </p>

                  <p
                    className={[
                      'mt-2 text-sm',
                      'leading-6',
                      'text-amber-900',
                    ].join(' ')}
                  >
                    Prefira enquadramentos sem rostos, remova nomes, evite localização e documentos pessoais e aplique desfoque quando a identificação não for necessária.
                  </p>
                </div>
              </div>
            </section>

            {formError ? (
              <div
                className={[
                  'rounded-xl border',
                  'border-rose-200',
                  'bg-rose-50 p-4',
                  'text-sm font-semibold',
                  'text-rose-800',
                ].join(' ')}
              >
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div
                className={[
                  'rounded-xl border',
                  'border-emerald-200',
                  'bg-emerald-50 p-4',
                  'text-sm font-semibold',
                  'text-emerald-800',
                ].join(' ')}
              >
                {successMessage}
              </div>
            ) : null}

            <div
              className={[
                'flex flex-col',
                'gap-3',
                'sm:flex-row',
                'sm:justify-end',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={
                  resetForm
                }
                disabled={
                  submitting ||
                  mutating
                }
                className={[
                  'inline-flex min-h-12',
                  'items-center justify-center',
                  'rounded-xl border',
                  'border-slate-300',
                  'bg-white px-5 py-3',
                  'text-sm font-bold',
                  'text-slate-700',
                  'transition',
                  'hover:bg-slate-100',
                  'disabled:opacity-60',
                ].join(' ')}
              >
                Limpar
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitDisabled
                }
                className={[
                  'inline-flex min-h-12',
                  'items-center justify-center',
                  'rounded-xl',
                  'bg-[#071827]',
                  'px-6 py-3',
                  'text-sm font-bold',
                  'text-white transition',
                  'hover:bg-[#0B7491]',
                  'disabled:cursor-not-allowed',
                  'disabled:opacity-50',
                ].join(' ')}
              >
                {submitting
                  ? 'Registrando...'
                  : 'Registrar evidência'}
              </button>
            </div>
          </form>
        </section>

        <section
          className={[
            'overflow-hidden',
            'rounded-[1.75rem]',
            'border border-slate-200',
            'bg-white shadow-sm',
          ].join(' ')}
        >
          <header
            className={[
              'border-b',
              'border-slate-200',
              'px-5 py-5',
              'sm:px-7',
            ].join(' ')}
          >
            <div
              className={[
                'flex flex-col gap-4',
                'sm:flex-row',
                'sm:items-center',
                'sm:justify-between',
              ].join(' ')}
            >
              <div>
                <p
                  className={[
                    'text-xs font-bold',
                    'uppercase',
                    'tracking-[0.18em]',
                    'text-[#0B7491]',
                  ].join(' ')}
                >
                  Histórico
                </p>

                <h2
                  className={[
                    'mt-2 text-2xl',
                    'font-bold',
                    'text-[#071827]',
                  ].join(' ')}
                >
                  Evidências registradas
                </h2>

                <p
                  className={[
                    'mt-2 text-sm',
                    'leading-6',
                    'text-slate-500',
                  ].join(' ')}
                >
                  {hasLessonContext
                    ? 'Exibindo apenas evidências relacionadas à aula selecionada.'
                    : 'Exibindo as evidências registradas pelo usuário.'}
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
                className={[
                  'inline-flex min-h-11',
                  'items-center justify-center',
                  'rounded-xl border',
                  'border-cyan-200',
                  'bg-cyan-50 px-5 py-3',
                  'text-sm font-bold',
                  'text-[#075F78]',
                  'transition',
                  'hover:bg-cyan-100',
                  'disabled:opacity-60',
                ].join(' ')}
              >
                Atualizar
              </button>
            </div>
          </header>

          {error ? (
            <div
              className={[
                'border-b',
                'border-rose-200',
                'bg-rose-50',
                'px-5 py-4',
                'text-sm font-semibold',
                'text-rose-800',
                'sm:px-7',
              ].join(' ')}
            >
              {error}
            </div>
          ) : null}

          {fileAccessError ? (
            <div
              className={[
                'border-b',
                'border-amber-200',
                'bg-amber-50',
                'px-5 py-4',
                'text-sm font-semibold',
                'text-amber-900',
                'sm:px-7',
              ].join(' ')}
            >
              {fileAccessError}
            </div>
          ) : null}

          {loading ? (
            <div
              className={[
                'p-8 text-center',
                'text-sm font-semibold',
                'text-slate-500',
              ].join(' ')}
            >
              Carregando evidências...
            </div>
          ) : evidences.length ===
            0 ? (
            <div
              className={[
                'p-8 text-center',
              ].join(' ')}
            >
              <p
                className={[
                  'text-lg font-bold',
                  'text-[#071827]',
                ].join(' ')}
              >
                Nenhuma evidência registrada
              </p>

              <p
                className={[
                  'mt-2 text-sm',
                  'text-slate-500',
                ].join(' ')}
              >
                Registre uma evidência para iniciar a documentação pedagógica.
              </p>
            </div>
          ) : (
            <div
              className={[
                'grid gap-4 p-5',
                'sm:p-7',
                'xl:grid-cols-2',
              ].join(' ')}
            >
              {evidences.map(
                evidence => {
                  const fileSize =
                    formatFileSize(
                      evidence
                        .file_size_bytes,
                    )

                  const hasProtectedFile =
                    Boolean(
                      evidence
                        .storage_bucket &&
                      evidence
                        .storage_path,
                    )

                  return (
                    <article
                      key={
                        evidence.id
                      }
                      className={[
                        'overflow-hidden',
                        'rounded-2xl border',
                        'border-slate-200',
                        'bg-white',
                      ].join(' ')}
                    >
                      <header
                        className={[
                          'border-b',
                          'border-slate-200',
                          'bg-slate-50',
                          'px-5 py-4',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'flex items-start',
                            'justify-between',
                            'gap-4',
                          ].join(' ')}
                        >
                          <div
                            className="min-w-0"
                          >
                            <h3
                              className={[
                                'break-words',
                                'text-lg font-bold',
                                'text-[#071827]',
                              ].join(' ')}
                            >
                              {evidence.title}
                            </h3>

                            <p
                              className={[
                                'mt-1 text-xs',
                                'font-semibold',
                                'text-slate-500',
                              ].join(' ')}
                            >
                              {formatDateTime(
                                evidence
                                  .created_at,
                              )}
                            </p>
                          </div>

                          <span
                            className={[
                              'shrink-0',
                              'rounded-lg border',
                              'px-3 py-2',
                              'text-xs font-bold',
                              getEvidenceTypeClasses(
                                evidence
                                  .evidence_type,
                              ),
                            ].join(' ')}
                          >
                            {getEvidenceTypeLabel(
                              evidence
                                .evidence_type,
                            )}
                          </span>
                        </div>
                      </header>

                      <div
                        className={[
                          'space-y-4',
                          'p-5',
                        ].join(' ')}
                      >
                        {evidence.description ? (
                          <p
                            className={[
                              'whitespace-pre-wrap',
                              'text-sm leading-6',
                              'text-slate-600',
                            ].join(' ')}
                          >
                            {
                              evidence.description
                            }
                          </p>
                        ) : null}

                        <div
                          className={[
                            'flex flex-wrap',
                            'gap-2',
                          ].join(' ')}
                        >
                          {evidence.lesson_id ? (
                            <span
                              className={[
                                'rounded-full border',
                                'border-cyan-200',
                                'bg-cyan-50',
                                'px-3 py-1',
                                'text-xs font-bold',
                                'text-[#075F78]',
                              ].join(' ')}
                            >
                              Vinculada à aula
                            </span>
                          ) : null}

                          {evidence.objective_id ? (
                            <span
                              className={[
                                'rounded-full border',
                                'border-blue-200',
                                'bg-blue-50',
                                'px-3 py-1',
                                'text-xs font-bold',
                                'text-blue-800',
                              ].join(' ')}
                            >
                              Objetivo principal vinculado
                            </span>
                          ) : null}

                          {evidence
                            .contains_identifiable_minor ? (
                            <span
                              className={[
                                'rounded-full border',
                                'border-amber-300',
                                'bg-amber-100',
                                'px-3 py-1',
                                'text-xs font-bold',
                                'text-amber-900',
                              ].join(' ')}
                            >
                              Autorização registrada
                            </span>
                          ) : null}

                          {hasProtectedFile ? (
                            <span
                              className={[
                                'rounded-full border',
                                'border-violet-200',
                                'bg-violet-50',
                                'px-3 py-1',
                                'text-xs font-bold',
                                'text-violet-800',
                              ].join(' ')}
                            >
                              Arquivo protegido
                            </span>
                          ) : null}
                        </div>

                        {evidence
                          .contains_identifiable_minor ? (
                          <section
                            className={[
                              'rounded-xl border',
                              'border-amber-200',
                              'bg-amber-50 p-4',
                            ].join(' ')}
                          >
                            <p
                              className={[
                                'text-xs font-bold',
                                'uppercase',
                                'tracking-[0.14em]',
                                'text-amber-800',
                              ].join(' ')}
                            >
                              Proteção de menores
                            </p>

                            <p
                              className={[
                                'mt-2 text-sm',
                                'leading-6',
                                'text-amber-950',
                              ].join(' ')}
                            >
                              Autorização confirmada e registrada conforme a política{' '}
                              {
                                evidence
                                  .privacy_notice_version
                              }
                              .
                            </p>

                            {evidence
                              .authorization_reference ? (
                              <p
                                className={[
                                  'mt-2 break-words',
                                  'text-xs font-semibold',
                                  'text-amber-800',
                                ].join(' ')}
                              >
                                Referência:{' '}
                                {
                                  evidence
                                    .authorization_reference
                                }
                              </p>
                            ) : null}
                          </section>
                        ) : null}

                        {evidence.external_url ? (
                          <a
                            href={
                              evidence.external_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className={[
                              'inline-flex min-h-11',
                              'w-full items-center',
                              'justify-center',
                              'rounded-xl border',
                              'border-blue-200',
                              'bg-blue-50',
                              'px-4 py-3',
                              'text-sm font-bold',
                              'text-blue-800',
                              'transition',
                              'hover:bg-blue-100',
                            ].join(' ')}
                          >
                            Abrir link externo
                          </a>
                        ) : null}

                        {hasProtectedFile ? (
                          <button
                            type="button"
                            disabled={
                              openingEvidenceId ===
                              evidence.id
                            }
                            onClick={() =>
                              void handleOpenProtectedFile(
                                evidence.id,
                              )
                            }
                            className={[
                              'inline-flex min-h-11',
                              'w-full items-center',
                              'justify-center',
                              'rounded-xl border',
                              'border-violet-200',
                              'bg-violet-50',
                              'px-4 py-3',
                              'text-sm font-bold',
                              'text-violet-800',
                              'transition',
                              'hover:bg-violet-100',
                              'disabled:opacity-60',
                            ].join(' ')}
                          >
                            {openingEvidenceId ===
                            evidence.id
                              ? 'Gerando acesso seguro...'
                              : 'Abrir arquivo protegido'}
                          </button>
                        ) : null}

                        {evidence
                          .original_file_name ? (
                          <p
                            className={[
                              'break-words',
                              'text-xs',
                              'text-slate-500',
                            ].join(' ')}
                          >
                            Arquivo:{' '}
                            {
                              evidence
                                .original_file_name
                            }

                            {fileSize
                              ? ` • ${fileSize}`
                              : ''}
                          </p>
                        ) : null}

                        <EvidenceIntelligencePanel
                          evidenceId={
                            evidence.id
                          }
                          evidenceTitle={
                            evidence.title
                          }
                        />

                        <button
                          type="button"
                          disabled={
                            deletingEvidenceId ===
                            evidence.id
                          }
                          onClick={() =>
                            void handleDeleteEvidence(
                              evidence,
                            )
                          }
                          className={[
                            'inline-flex min-h-11',
                            'w-full items-center',
                            'justify-center',
                            'rounded-xl border',
                            'border-rose-200',
                            'bg-rose-50',
                            'px-4 py-3',
                            'text-sm font-bold',
                            'text-rose-800',
                            'transition',
                            'hover:bg-rose-100',
                            'disabled:opacity-60',
                          ].join(' ')}
                        >
                          {deletingEvidenceId ===
                          evidence.id
                            ? 'Excluindo...'
                            : 'Excluir evidência'}
                        </button>
                      </div>
                    </article>
                  )
                },
              )}
            </div>
          )}
        </section>

        <aside
          className={[
            'overflow-hidden',
            'rounded-[1.75rem]',
            'border border-slate-200',
            'bg-[#071827]',
            'text-white shadow-sm',
          ].join(' ')}
        >
          <header
            className={[
              'border-b',
              'border-white/10',
              'px-5 py-5',
              'sm:px-7',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.18em]',
                'text-cyan-300',
              ].join(' ')}
            >
              Framework EDI
            </p>

            <h2
              className={[
                'mt-2 text-2xl',
                'font-bold',
              ].join(' ')}
            >
              Da execução à inteligência
            </h2>
          </header>

          <div
            className={[
              'grid divide-y',
              'divide-white/10',
              'sm:grid-cols-2',
              'sm:divide-x',
              'sm:divide-y-0',
              'xl:grid-cols-4',
            ].join(' ')}
          >
            {[
              {
                code:
                  '01',

                title:
                  'Aula',

                description:
                  'Define o contexto real da execução pedagógica.',
              },
              {
                code:
                  '02',

                title:
                  'Evidência',

                description:
                  'Documenta o que aconteceu sem duplicar cadastros.',
              },
              {
                code:
                  '03',

                title:
                  'Objetivos',

                description:
                  'Relaciona o registro aos objetivos trabalhados.',
              },
              {
                code:
                  '04',

                title:
                  'Indicadores',

                description:
                  'Prepara os dados para análise e apoio à decisão.',
              },
            ].map(
              item => (
                <article
                  key={
                    item.code
                  }
                  className={[
                    'px-5 py-5',
                    'sm:px-7',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'font-mono text-xs',
                      'font-bold',
                      'text-cyan-300',
                    ].join(' ')}
                  >
                    {item.code}
                  </span>

                  <h3
                    className={[
                      'mt-3 font-bold',
                    ].join(' ')}
                  >
                    {item.title}
                  </h3>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'leading-6',
                      'text-slate-300',
                    ].join(' ')}
                  >
                    {item.description}
                  </p>
                </article>
              ),
            )}
          </div>
        </aside>
      </div>
    </AgendaPageShell>
  )
}
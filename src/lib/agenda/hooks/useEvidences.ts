'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  AgendaEvidence,
  AgendaEvidenceMetadata,
  AgendaEvidenceType,
  CreateAgendaEvidenceInput,
} from '@/lib/agenda/repository/evidences.repository'

import {
  supabase,
} from '@/lib/supabaseClient'

type EvidencesResponse = {
  success: boolean
  total?: number

  data?:
    | AgendaEvidence[]
    | AgendaEvidence

  message?: string
  error?: string
}

type UploadApiData = {
  bucket: string
  path: string
  token: string
  publicUrl: string | null
}

type UploadResponse = {
  success: boolean
  data?: UploadApiData
  error?: string
}

type CleanupResponse = {
  success: boolean
  message?: string
  error?: string
}

type DeleteEvidenceResponse = {
  success: boolean

  message?: string
  error?: string

  data?: {
    evidenceId: string
    deletedAt: string
  }
}

type EvidenceFileApiData = {
  signedUrl: string
  expiresIn: number

  evidenceId: string

  fileName: string | null
  mimeType: string | null
}

type EvidenceFileResponse = {
  success: boolean
  data?: EvidenceFileApiData

  error?: string
  code?: string
}

export type EvidenceUploadResult = {
  bucket: string
  path: string

  publicUrl: string | null

  originalFileName: string
  mimeType: string
  sizeBytes: number
}

type TemporaryEvidenceFile = {
  bucket: string
  path: string
}

export type EvidenceFilters = {
  organizationId?: string | null
  schoolId?: string | null

  planningId?: string | null
  eventId?: string | null

  lessonId?: string | null
  objectiveId?: string | null
  classId?: string | null

  reflectionId?: string | null
  academicPeriodId?: string | null

  evidenceType?:
    AgendaEvidenceType | null

  containsIdentifiableMinor?:
    boolean | null

  search?: string | null
}

export type CreateEvidencePayload = {
  title: string
  description?: string | null

  evidenceType?:
    AgendaEvidenceType

  fileUrl?: string | null
  externalUrl?: string | null

  planningId?: string | null
  eventId?: string | null

  lessonId?: string | null
  objectiveId?: string | null
  classId?: string | null

  reflectionId?: string | null
  academicPeriodId?: string | null

  organizationId?: string | null
  schoolId?: string | null

  containsIdentifiableMinor?: boolean

  guardianAuthorizationConfirmed?: boolean
  authorizationReference?: string | null

  privacyNoticeVersion?: string | null

  storageBucket?: string | null
  storagePath?: string | null

  originalFileName?: string | null
  fileMimeType?: string | null
  fileSizeBytes?: number | null

  metadata?:
    AgendaEvidenceMetadata
}

export type UseEvidencesOptions = {
  autoLoad?: boolean
  initialFilters?: EvidenceFilters
}

const MAX_DELETION_REASON_LENGTH =
  500

const DEFAULT_PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

async function parseJsonResponse<T>(
  response: Response,
): Promise<T> {
  const contentType =
    response.headers.get(
      'content-type',
    )

  if (
    !contentType?.includes(
      'application/json',
    )
  ) {
    throw new Error(
      'O servidor retornou uma resposta inválida.',
    )
  }

  return await response.json() as T
}

function getResponseError(
  response: Response,
  errorMessage: string | undefined,
  fallbackMessage: string,
): string {
  if (errorMessage) {
    return errorMessage
  }

  if (
    response.status ===
    401
  ) {
    return (
      'Sua sessão expirou. Entre novamente para continuar.'
    )
  }

  if (
    response.status ===
    403
  ) {
    return (
      'Você não possui permissão para realizar esta operação.'
    )
  }

  if (
    response.status ===
    404
  ) {
    return (
      'A evidência não foi encontrada ou já foi excluída.'
    )
  }

  if (
    response.status ===
    409
  ) {
    return (
      'A operação não pôde ser concluída porque existe um conflito com os dados atuais.'
    )
  }

  if (
    response.status ===
    413
  ) {
    return (
      'O arquivo ultrapassou o limite permitido para envio.'
    )
  }

  return fallbackMessage
}

/*
 * Política ECA Digital preservada.
 *
 * Formatos aceitos:
 *
 * image/jpeg
 * image/png
 * image/webp
 * application/pdf
 *
 * Limite:
 *
 * 10 MB
 */
function validateFile(
  file: File,
): void {
  if (
    !file.name.trim()
  ) {
    throw new Error(
      'O arquivo selecionado não possui nome.',
    )
  }

  if (
    file.size <=
    0
  ) {
    throw new Error(
      'O arquivo selecionado está vazio.',
    )
  }

  const maximumFileSize =
    10 *
    1024 *
    1024

  if (
    file.size >
    maximumFileSize
  ) {
    throw new Error(
      'O arquivo deve ter no máximo 10 MB.',
    )
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]

  if (
    !allowedMimeTypes.includes(
      file.type,
    )
  ) {
    throw new Error(
      'Formato não permitido. Envie uma imagem JPG, PNG, WEBP ou um PDF.',
    )
  }
}

function validateUploadAuthorization(
  data: UploadApiData,
): void {
  if (
    !data.bucket?.trim()
  ) {
    throw new Error(
      'O servidor não informou o bucket de armazenamento.',
    )
  }

  if (
    !data.path?.trim()
  ) {
    throw new Error(
      'O servidor não informou o caminho do arquivo.',
    )
  }

  if (
    !data.token?.trim()
  ) {
    throw new Error(
      'O servidor não retornou o token temporário de envio.',
    )
  }
}

function normalizeEvidenceId(
  value: string,
): string {
  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      'Identificador da evidência não informado.',
    )
  }

  return normalizedValue
}

function normalizeDeletionReason(
  value: string,
): string {
  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      'Informe o motivo da exclusão.',
    )
  }

  if (
    normalizedValue.length >
    MAX_DELETION_REASON_LENGTH
  ) {
    throw new Error(
      `O motivo da exclusão não pode ultrapassar ${MAX_DELETION_REASON_LENGTH} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalText(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  return value.trim() ||
    null
}

function hasTemporaryFileReference(
  input:
    CreateAgendaEvidenceInput,
): input is CreateAgendaEvidenceInput & {
  storage_bucket: string
  storage_path: string
} {
  return Boolean(
    input.storage_bucket?.trim() &&
    input.storage_path?.trim(),
  )
}

function appendQueryParameter(
  searchParams:
    URLSearchParams,

  key: string,

  value:
    | string
    | null
    | undefined,
): void {
  const normalizedValue =
    normalizeOptionalText(
      value,
    )

  if (normalizedValue) {
    searchParams.set(
      key,
      normalizedValue,
    )
  }
}

function createEvidenceQuery(
  filters:
    EvidenceFilters,
): string {
  const searchParams =
    new URLSearchParams()

  appendQueryParameter(
    searchParams,
    'organizationId',
    filters.organizationId,
  )

  appendQueryParameter(
    searchParams,
    'schoolId',
    filters.schoolId,
  )

  appendQueryParameter(
    searchParams,
    'planningId',
    filters.planningId,
  )

  appendQueryParameter(
    searchParams,
    'eventId',
    filters.eventId,
  )

  appendQueryParameter(
    searchParams,
    'lessonId',
    filters.lessonId,
  )

  appendQueryParameter(
    searchParams,
    'objectiveId',
    filters.objectiveId,
  )

  appendQueryParameter(
    searchParams,
    'classId',
    filters.classId,
  )

  appendQueryParameter(
    searchParams,
    'reflectionId',
    filters.reflectionId,
  )

  appendQueryParameter(
    searchParams,
    'academicPeriodId',
    filters.academicPeriodId,
  )

  appendQueryParameter(
    searchParams,
    'evidenceType',
    filters.evidenceType,
  )

  appendQueryParameter(
    searchParams,
    'search',
    filters.search,
  )

  if (
    typeof
      filters
        .containsIdentifiableMinor ===
    'boolean'
  ) {
    searchParams.set(
      'containsIdentifiableMinor',
      String(
        filters
          .containsIdentifiableMinor,
      ),
    )
  }

  const query =
    searchParams.toString()

  return query
    ? `/api/agenda/evidences?${query}`
    : '/api/agenda/evidences'
}

function convertLegacyCreateInput(
  input:
    CreateAgendaEvidenceInput,
): CreateEvidencePayload {
  return {
    title:
      input.title,

    description:
      input.description ??
      null,

    evidenceType:
      input.evidence_type ??
      'texto',

    fileUrl:
      input.file_url ??
      null,

    externalUrl:
      input.external_url ??
      null,

    planningId:
      input.planning_id ??
      null,

    eventId:
      input.event_id ??
      null,

    lessonId:
      input.lesson_id ??
      null,

    objectiveId:
      input.objective_id ??
      null,

    classId:
      input.class_id ??
      null,

    reflectionId:
      input.reflection_id ??
      null,

    academicPeriodId:
      input.academic_period_id ??
      null,

    organizationId:
      input.organization_id ??
      null,

    schoolId:
      input.school_id ??
      null,

    containsIdentifiableMinor:
      input
        .contains_identifiable_minor ??
      false,

    guardianAuthorizationConfirmed:
      input
        .guardian_authorization_confirmed ??
      false,

    authorizationReference:
      input
        .authorization_reference ??
      null,

    privacyNoticeVersion:
      input
        .privacy_notice_version ??
      DEFAULT_PRIVACY_NOTICE_VERSION,

    storageBucket:
      input.storage_bucket ??
      null,

    storagePath:
      input.storage_path ??
      null,

    originalFileName:
      input
        .original_file_name ??
      null,

    fileMimeType:
      input.file_mime_type ??
      null,

    fileSizeBytes:
      input.file_size_bytes ??
      null,

    metadata:
      input.metadata ??
      {},
  }
}

function createRequestPayload(
  input:
    CreateEvidencePayload,
): Record<string, unknown> {
  return {
    title:
      input.title,

    description:
      input.description ??
      null,

    evidenceType:
      input.evidenceType ??
      'texto',

    fileUrl:
      input.fileUrl ??
      null,

    externalUrl:
      input.externalUrl ??
      null,

    planningId:
      input.planningId ??
      null,

    eventId:
      input.eventId ??
      null,

    lessonId:
      input.lessonId ??
      null,

    objectiveId:
      input.objectiveId ??
      null,

    classId:
      input.classId ??
      null,

    reflectionId:
      input.reflectionId ??
      null,

    academicPeriodId:
      input.academicPeriodId ??
      null,

    organizationId:
      input.organizationId ??
      null,

    schoolId:
      input.schoolId ??
      null,

    /*
     * Política ECA Digital preservada.
     *
     * O hook envia apenas a declaração e a referência.
     * A API determina o usuário e a data da confirmação.
     */
    containsIdentifiableMinor:
      input
        .containsIdentifiableMinor ??
      false,

    guardianAuthorizationConfirmed:
      input
        .guardianAuthorizationConfirmed ??
      false,

    authorizationReference:
      input
        .authorizationReference ??
      null,

    privacyNoticeVersion:
      input
        .privacyNoticeVersion ??
      DEFAULT_PRIVACY_NOTICE_VERSION,

    storageBucket:
      input.storageBucket ??
      null,

    storagePath:
      input.storagePath ??
      null,

    originalFileName:
      input.originalFileName ??
      null,

    fileMimeType:
      input.fileMimeType ??
      null,

    fileSizeBytes:
      input.fileSizeBytes ??
      null,

    metadata:
      input.metadata ??
      {},
  }
}

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof
    Error
    ? error.message
    : fallbackMessage
}

export function useEvidences(
  options:
    UseEvidencesOptions = {},
) {
  const autoLoad =
    options.autoLoad ??
    true

  const [
    evidences,
    setEvidences,
  ] = useState<
    AgendaEvidence[]
  >([])

  const [
    filters,
    setFilters,
  ] = useState<
    EvidenceFilters
  >(
    options.initialFilters ??
    {},
  )

  const [
    loading,
    setLoading,
  ] = useState(
    autoLoad,
  )

  const [
    mutating,
    setMutating,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const queryUrl =
    useMemo(
      () =>
        createEvidenceQuery(
          filters,
        ),
      [
        filters,
      ],
    )

  const clearError =
    useCallback(() => {
      setError(null)
    }, [])

  const loadEvidences =
    useCallback(
      async (
        overrideFilters?:
          EvidenceFilters,
      ): Promise<
        AgendaEvidence[]
      > => {
        const activeFilters =
          overrideFilters ??
          filters

        const url =
          createEvidenceQuery(
            activeFilters,
          )

        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              url,
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',
              },
            )

          const result =
            await parseJsonResponse<
              EvidencesResponse
            >(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            !Array.isArray(
              result.data,
            )
          ) {
            throw new Error(
              getResponseError(
                response,
                result.error,
                'Não foi possível carregar as evidências.',
              ),
            )
          }

          setEvidences(
            result.data,
          )

          return result.data
        } catch (
          loadError
        ) {
          const message =
            getErrorMessage(
              loadError,
              'Erro inesperado ao carregar evidências.',
            )

          setError(
            message,
          )

          throw loadError
        } finally {
          setLoading(false)
        }
      },
      [
        filters,
      ],
    )

  const updateFilters =
    useCallback(
      (
        nextFilters:
          EvidenceFilters,
      ): void => {
        setFilters(
          currentFilters => ({
            ...currentFilters,
            ...nextFilters,
          }),
        )
      },
      [],
    )

  const replaceFilters =
    useCallback(
      (
        nextFilters:
          EvidenceFilters,
      ): void => {
        setFilters(
          nextFilters,
        )
      },
      [],
    )

  const clearFilters =
    useCallback((): void => {
      setFilters({})
    }, [])

  const deleteTemporaryEvidenceFile =
    useCallback(
      async ({
        bucket,
        path,
      }: TemporaryEvidenceFile): Promise<void> => {
        const normalizedBucket =
          bucket.trim()

        const normalizedPath =
          path.trim()

        if (
          !normalizedBucket ||
          !normalizedPath
        ) {
          return
        }

        const response =
          await fetch(
            '/api/agenda/evidences/upload',
            {
              method:
                'DELETE',

              headers: {
                'Content-Type':
                  'application/json',
              },

              credentials:
                'include',

              cache:
                'no-store',

              body:
                JSON.stringify({
                  bucket:
                    normalizedBucket,

                  path:
                    normalizedPath,
                }),
            },
          )

        const result =
          await parseJsonResponse<
            CleanupResponse
          >(
            response,
          )

        /*
         * O status 409 indica que o arquivo já foi
         * relacionado a uma evidência e deve ser
         * preservado.
         */
        if (
          response.status ===
          409
        ) {
          return
        }

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            getResponseError(
              response,
              result.error,
              'Não foi possível remover o arquivo temporário.',
            ),
          )
        }
      },
      [],
    )

  const uploadEvidenceFile =
    useCallback(
      async (
        file: File,
      ): Promise<
        EvidenceUploadResult
      > => {
        validateFile(
          file,
        )

        const authorizationResponse =
          await fetch(
            '/api/agenda/evidences/upload',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              credentials:
                'include',

              cache:
                'no-store',

              body:
                JSON.stringify({
                  fileName:
                    file.name,

                  contentType:
                    file.type,

                  sizeBytes:
                    file.size,
                }),
            },
          )

        const authorizationResult =
          await parseJsonResponse<
            UploadResponse
          >(
            authorizationResponse,
          )

        if (
          !authorizationResponse.ok ||
          !authorizationResult.success ||
          !authorizationResult.data
        ) {
          throw new Error(
            getResponseError(
              authorizationResponse,
              authorizationResult.error,
              'Não foi possível autorizar o envio do arquivo.',
            ),
          )
        }

        validateUploadAuthorization(
          authorizationResult.data,
        )

        const {
          bucket,
          path,
          token,
          publicUrl,
        } =
          authorizationResult.data

        const {
          error:
            uploadError,
        } =
          await supabase
            .storage
            .from(
              bucket,
            )
            .uploadToSignedUrl(
              path,
              token,
              file,
              {
                contentType:
                  file.type,

                cacheControl:
                  '3600',
              },
            )

        if (uploadError) {
          throw new Error(
            `Não foi possível enviar o arquivo: ${uploadError.message}`,
          )
        }

        return {
          bucket,
          path,

          publicUrl:
            publicUrl ??
            null,

          originalFileName:
            file.name,

          mimeType:
            file.type ||
            'application/octet-stream',

          sizeBytes:
            file.size,
        }
      },
      [],
    )

  /*
   * Compatibilidade temporária com componentes antigos que
   * ainda aguardam uma URL pública.
   *
   * O fluxo oficial utiliza bucket e path privados.
   */
  const uploadEvidence =
    useCallback(
      async (
        file: File,
      ): Promise<string> => {
        const uploadedFile =
          await uploadEvidenceFile(
            file,
          )

        if (
          !uploadedFile
            .publicUrl
        ) {
          try {
            await deleteTemporaryEvidenceFile({
              bucket:
                uploadedFile.bucket,

              path:
                uploadedFile.path,
            })
          } catch (
            cleanupError
          ) {
            console.error(
              'Erro ao remover arquivo privado após tentativa de uso legado:',
              cleanupError,
            )
          }

          throw new Error(
            'O arquivo foi enviado de forma protegida e não possui URL pública.',
          )
        }

        return uploadedFile
          .publicUrl
      },
      [
        deleteTemporaryEvidenceFile,
        uploadEvidenceFile,
      ],
    )

  const createEvidenceFromPayload =
    useCallback(
      async (
        input:
          CreateEvidencePayload,
      ): Promise<
        AgendaEvidence
      > => {
        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              '/api/agenda/evidences',
              {
                method:
                  'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials:
                  'include',

                cache:
                  'no-store',

                body:
                  JSON.stringify(
                    createRequestPayload(
                      input,
                    ),
                  ),
              },
            )

          const result =
            await parseJsonResponse<
              EvidencesResponse
            >(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            !result.data ||
            Array.isArray(
              result.data,
            )
          ) {
            throw new Error(
              getResponseError(
                response,
                result.error,
                'Não foi possível criar a evidência.',
              ),
            )
          }

          const createdEvidence =
            result.data

          setEvidences(
            currentEvidences => [
              createdEvidence,
              ...currentEvidences,
            ],
          )

          return createdEvidence
        } catch (
          createError
        ) {
          const temporaryBucket =
            normalizeOptionalText(
              input.storageBucket,
            )

          const temporaryPath =
            normalizeOptionalText(
              input.storagePath,
            )

          /*
           * Compensação:
           *
           * caso o upload tenha sido concluído, mas o
           * registro da evidência falhe, o arquivo temporário
           * é removido.
           *
           * Se ele já estiver vinculado, a API responderá
           * com conflito e o arquivo será preservado.
           */
          if (
            temporaryBucket &&
            temporaryPath
          ) {
            try {
              await deleteTemporaryEvidenceFile({
                bucket:
                  temporaryBucket,

                path:
                  temporaryPath,
              })
            } catch (
              cleanupError
            ) {
              console.error(
                'Erro ao compensar upload de evidência:',
                cleanupError,
              )
            }
          }

          const message =
            getErrorMessage(
              createError,
              'Erro inesperado ao criar evidência.',
            )

          setError(
            message,
          )

          throw createError
        } finally {
          setMutating(false)
        }
      },
      [
        deleteTemporaryEvidenceFile,
      ],
    )

  /*
   * Mantém compatibilidade com a interface já existente,
   * que envia CreateAgendaEvidenceInput em snake_case.
   */
  const createEvidence =
    useCallback(
      async (
        input:
          CreateAgendaEvidenceInput,
      ): Promise<
        AgendaEvidence
      > => {
        try {
          return await createEvidenceFromPayload(
            convertLegacyCreateInput(
              input,
            ),
          )
        } catch (
          createError
        ) {
          if (
            hasTemporaryFileReference(
              input,
            )
          ) {
            /*
             * A compensação já é executada pelo método
             * createEvidenceFromPayload.
             */
          }

          throw createError
        }
      },
      [
        createEvidenceFromPayload,
      ],
    )

  const createTextEvidence =
    useCallback(
      async (
        input:
          Omit<
            CreateEvidencePayload,
            'evidenceType'
          >,
      ): Promise<
        AgendaEvidence
      > => {
        return createEvidenceFromPayload({
          ...input,

          evidenceType:
            'texto',
        })
      },
      [
        createEvidenceFromPayload,
      ],
    )

  const createLinkEvidence =
    useCallback(
      async (
        input:
          Omit<
            CreateEvidencePayload,
            'evidenceType'
          > & {
            externalUrl: string
          },
      ): Promise<
        AgendaEvidence
      > => {
        return createEvidenceFromPayload({
          ...input,

          evidenceType:
            'link',
        })
      },
      [
        createEvidenceFromPayload,
      ],
    )

  const createFileEvidence =
    useCallback(
      async (
        input:
          Omit<
            CreateEvidencePayload,
            | 'evidenceType'
            | 'storageBucket'
            | 'storagePath'
            | 'originalFileName'
            | 'fileMimeType'
            | 'fileSizeBytes'
          >,

        file: File,
      ): Promise<
        AgendaEvidence
      > => {
        const uploadedFile =
          await uploadEvidenceFile(
            file,
          )

        const evidenceType:
          AgendaEvidenceType =
            file.type ===
            'application/pdf'
              ? 'pdf'
              : 'imagem'

        return createEvidenceFromPayload({
          ...input,

          evidenceType,

          storageBucket:
            uploadedFile.bucket,

          storagePath:
            uploadedFile.path,

          fileUrl:
            uploadedFile.publicUrl,

          originalFileName:
            uploadedFile
              .originalFileName,

          fileMimeType:
            uploadedFile.mimeType,

          fileSizeBytes:
            uploadedFile.sizeBytes,
        })
      },
      [
        createEvidenceFromPayload,
        uploadEvidenceFile,
      ],
    )

  const deleteEvidence =
    useCallback(
      async (
        evidenceId: string,
        reason: string,
      ): Promise<string> => {
        const normalizedEvidenceId =
          normalizeEvidenceId(
            evidenceId,
          )

        const normalizedReason =
          normalizeDeletionReason(
            reason,
          )

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/evidences/${encodeURIComponent(normalizedEvidenceId)}`,
              {
                method:
                  'DELETE',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials:
                  'include',

                cache:
                  'no-store',

                body:
                  JSON.stringify({
                    reason:
                      normalizedReason,
                  }),
              },
            )

          const result =
            await parseJsonResponse<
              DeleteEvidenceResponse
            >(
              response,
            )

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              getResponseError(
                response,
                result.error,
                'Não foi possível excluir a evidência.',
              ),
            )
          }

          setEvidences(
            currentEvidences =>
              currentEvidences.filter(
                evidence =>
                  evidence.id !==
                  normalizedEvidenceId,
              ),
          )

          return (
            result.message ??
            'Evidência excluída de forma governada.'
          )
        } catch (
          deleteError
        ) {
          const message =
            getErrorMessage(
              deleteError,
              'Erro inesperado ao excluir evidência.',
            )

          setError(
            message,
          )

          throw deleteError
        } finally {
          setMutating(false)
        }
      },
      [],
    )

  const getEvidenceFileUrl =
    useCallback(
      async (
        evidenceId: string,
      ): Promise<string> => {
        const normalizedEvidenceId =
          normalizeEvidenceId(
            evidenceId,
          )

        const response =
          await fetch(
            `/api/agenda/evidences/${encodeURIComponent(normalizedEvidenceId)}/file`,
            {
              method:
                'GET',

              credentials:
                'include',

              cache:
                'no-store',
            },
          )

        const result =
          await parseJsonResponse<
            EvidenceFileResponse
          >(
            response,
          )

        if (
          !response.ok ||
          !result.success ||
          !result.data?.signedUrl
        ) {
          throw new Error(
            getResponseError(
              response,
              result.error,
              'Não foi possível abrir o arquivo protegido.',
            ),
          )
        }

        if (
          !result.data
            .signedUrl
            .startsWith(
              'https://',
            )
        ) {
          throw new Error(
            'O servidor retornou um endereço de arquivo inválido.',
          )
        }

        return result.data
          .signedUrl
      },
      [],
    )

  useEffect(() => {
    if (!autoLoad) {
      setLoading(false)

      return
    }

    void loadEvidences()
  }, [
    autoLoad,
    queryUrl,
    loadEvidences,
  ])

  return {
    evidences,
    setEvidences,

    filters,
    setFilters,

    updateFilters,
    replaceFilters,
    clearFilters,

    loading,
    mutating,
    error,

    clearError,

    reload:
      loadEvidences,

    loadEvidences,

    createEvidence,
    createEvidenceFromPayload,

    createTextEvidence,
    createLinkEvidence,
    createFileEvidence,

    deleteEvidence,

    uploadEvidence,
    uploadEvidenceFile,

    getEvidenceFileUrl,
  }
}
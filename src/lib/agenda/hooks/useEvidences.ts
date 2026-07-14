'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaEvidence,
  CreateAgendaEvidenceInput,
} from '@/lib/agenda'

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
  publicUrl: string | null
}

type UploadResponse = {
  success: boolean
  data?: UploadApiData
  error?: string
}

export type EvidenceUploadResult = {
  bucket: string
  path: string
  publicUrl: string | null

  originalFileName: string
  mimeType: string
  sizeBytes: number
}

async function parseJsonResponse<T>(
  response: Response,
): Promise<T> {
  const contentType =
    response.headers.get('content-type')

  if (
    !contentType?.includes(
      'application/json',
    )
  ) {
    throw new Error(
      'O servidor retornou uma resposta inválida.',
    )
  }

  return (await response.json()) as T
}

function getResponseError(
  response: Response,
  errorMessage: string | undefined,
  fallbackMessage: string,
): string {
  if (errorMessage) {
    return errorMessage
  }

  if (response.status === 401) {
    return (
      'Sua sessão expirou. Entre novamente ' +
      'para continuar.'
    )
  }

  if (response.status === 403) {
    return (
      'Seu plano atual não permite realizar ' +
      'esta operação.'
    )
  }

  return fallbackMessage
}

function validateFile(
  file: File,
): void {
  if (!file.name.trim()) {
    throw new Error(
      'O arquivo selecionado não possui nome.',
    )
  }

  if (file.size <= 0) {
    throw new Error(
      'O arquivo selecionado está vazio.',
    )
  }

  const maximumFileSize =
    10 * 1024 * 1024

  if (file.size > maximumFileSize) {
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
    !allowedMimeTypes.includes(file.type)
  ) {
    throw new Error(
      'Formato não permitido. Envie uma imagem JPG, PNG, WEBP ou um PDF.',
    )
  }
}

export function useEvidences() {
  const [
    evidences,
    setEvidences,
  ] = useState<AgendaEvidence[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const loadEvidences =
    useCallback(
      async (): Promise<void> => {
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(
            '/api/agenda/evidences',
            {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            },
          )

          const result =
            await parseJsonResponse<EvidencesResponse>(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            !Array.isArray(result.data)
          ) {
            throw new Error(
              getResponseError(
                response,
                result.error,
                'Não foi possível carregar as evidências.',
              ),
            )
          }

          setEvidences(result.data)
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Erro inesperado ao carregar evidências.',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  const uploadEvidenceFile =
    useCallback(
      async (
        file: File,
      ): Promise<EvidenceUploadResult> => {
        validateFile(file)

        const formData = new FormData()

        formData.append('file', file)

        const response = await fetch(
          '/api/agenda/evidences/upload',
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          },
        )

        const result =
          await parseJsonResponse<UploadResponse>(
            response,
          )

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            getResponseError(
              response,
              result.error,
              'Erro ao enviar o arquivo.',
            ),
          )
        }

        if (
          !result.data.bucket?.trim() ||
          !result.data.path?.trim()
        ) {
          throw new Error(
            'O arquivo foi enviado, mas sua referência de armazenamento não foi retornada.',
          )
        }

        return {
          bucket: result.data.bucket,
          path: result.data.path,
          publicUrl:
            result.data.publicUrl ?? null,

          originalFileName: file.name,
          mimeType:
            file.type ||
            'application/octet-stream',
          sizeBytes: file.size,
        }
      },
      [],
    )

  /*
   * Compatibilidade temporária com a tela atual.
   *
   * A próxima atualização do componente
   * AgendaEvidence utilizará uploadEvidenceFile
   * e não dependerá mais exclusivamente da
   * URL pública.
   */
  const uploadEvidence =
    useCallback(
      async (
        file: File,
      ): Promise<string> => {
        const uploadedFile =
          await uploadEvidenceFile(file)

        if (!uploadedFile.publicUrl) {
          throw new Error(
            'O arquivo foi enviado, mas nenhuma URL pública foi retornada.',
          )
        }

        return uploadedFile.publicUrl
      },
      [uploadEvidenceFile],
    )

  const createEvidence =
    useCallback(
      async (
        input: CreateAgendaEvidenceInput,
      ): Promise<AgendaEvidence> => {
        const response = await fetch(
          '/api/agenda/evidences',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            credentials: 'include',

            body: JSON.stringify({
              title: input.title,

              description:
                input.description ?? null,

              evidenceType:
                input.evidence_type ??
                'texto',

              fileUrl:
                input.file_url ?? null,

              externalUrl:
                input.external_url ?? null,

              planningId:
                input.planning_id ?? null,

              eventId:
                input.event_id ?? null,

              schoolId:
                input.school_id ?? null,

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
                'edi-protecao-menores-v1.0',

              storageBucket:
                input.storage_bucket ?? null,

              storagePath:
                input.storage_path ?? null,

              originalFileName:
                input.original_file_name ??
                null,

              fileMimeType:
                input.file_mime_type ??
                null,

              fileSizeBytes:
                input.file_size_bytes ??
                null,
            }),
          },
        )

        const result =
          await parseJsonResponse<EvidencesResponse>(
            response,
          )

        if (
          !response.ok ||
          !result.success ||
          !result.data ||
          Array.isArray(result.data)
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
          (currentEvidences) => [
            createdEvidence,
            ...currentEvidences,
          ],
        )

        return createdEvidence
      },
      [],
    )

  useEffect(() => {
    void loadEvidences()
  }, [loadEvidences])

  return {
    evidences,
    loading,
    error,

    reload: loadEvidences,

    createEvidence,

    uploadEvidence,
    uploadEvidenceFile,
  }
}
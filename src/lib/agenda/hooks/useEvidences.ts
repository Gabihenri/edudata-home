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
import { supabase } from '@/lib/supabaseClient'

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

  if (response.status === 413) {
    return (
      'O arquivo ultrapassou o limite permitido ' +
      'para envio.'
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

function validateUploadAuthorization(
  data: UploadApiData,
): void {
  if (!data.bucket?.trim()) {
    throw new Error(
      'O servidor não informou o bucket de armazenamento.',
    )
  }

  if (!data.path?.trim()) {
    throw new Error(
      'O servidor não informou o caminho do arquivo.',
    )
  }

  if (!data.token?.trim()) {
    throw new Error(
      'O servidor não retornou o token temporário de envio.',
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

        const authorizationResponse =
          await fetch(
            '/api/agenda/evidences/upload',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              credentials: 'include',

              body: JSON.stringify({
                fileName: file.name,
                contentType: file.type,
                sizeBytes: file.size,
              }),
            },
          )

        const authorizationResult =
          await parseJsonResponse<UploadResponse>(
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
        } = authorizationResult.data

        const {
          error: uploadError,
        } = await supabase.storage
          .from(bucket)
          .uploadToSignedUrl(
            path,
            token,
            file,
            {
              contentType: file.type,
              cacheControl: '3600',
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
          publicUrl: publicUrl ?? null,

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
   * Compatibilidade temporária com componentes
   * que ainda esperam uma URL pública.
   *
   * Evidências protegidas devem utilizar
   * uploadEvidenceFile e armazenar bucket/path.
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
            'O arquivo foi enviado de forma protegida e não possui URL pública.',
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

  const getEvidenceFileUrl =
    useCallback(
      async (
        evidenceId: string,
      ): Promise<string> => {
        const normalizedEvidenceId =
          evidenceId.trim()

        if (!normalizedEvidenceId) {
          throw new Error(
            'Identificador da evidência não informado.',
          )
        }

        const response = await fetch(
          `/api/agenda/evidences/${encodeURIComponent(normalizedEvidenceId)}/file`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          },
        )

        const result =
          await parseJsonResponse<EvidenceFileResponse>(
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
          !result.data.signedUrl.startsWith(
            'https://',
          )
        ) {
          throw new Error(
            'O servidor retornou um endereço de arquivo inválido.',
          )
        }

        return result.data.signedUrl
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
    getEvidenceFileUrl,
  }
}
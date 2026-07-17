import { NextResponse } from 'next/server'

import { requireSessionUser } from '@/lib/auth'
import {
  createStoragePath,
  deleteFile,
  getStorageClient,
  STORAGE_BUCKETS,
} from '@/lib/storage'

export const runtime = 'nodejs'

const MAX_FILE_SIZE =
  10 * 1024 * 1024

const ALLOWED_CONTENT_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ])

type CreateUploadRequestBody = {
  fileName?: unknown
  contentType?: unknown
  sizeBytes?: unknown
}

type DeleteUploadRequestBody = {
  bucket?: unknown
  path?: unknown
}

function normalizeRequiredText(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

function normalizeFileSize(
  value: unknown,
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value)
  ) {
    return null
  }

  return value
}

function getErrorStatus(
  message: string,
): number {
  const normalizedMessage =
    message.toLowerCase()

  if (
    normalizedMessage.includes(
      'autenticado',
    ) ||
    normalizedMessage.includes(
      'sessão',
    )
  ) {
    return 401
  }

  return 500
}

function jsonError(
  error: string,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
    },
  )
}

export async function POST(
  request: Request,
) {
  try {
    const user =
      await requireSessionUser()

    let body:
      CreateUploadRequestBody

    try {
      body =
        (await request.json()) as
          CreateUploadRequestBody
    } catch {
      return jsonError(
        'Os dados do arquivo são inválidos.',
        400,
      )
    }

    const fileName =
      normalizeRequiredText(
        body.fileName,
      )

    const contentType =
      normalizeRequiredText(
        body.contentType,
      )

    const sizeBytes =
      normalizeFileSize(
        body.sizeBytes,
      )

    if (!fileName) {
      return jsonError(
        'O nome do arquivo é obrigatório.',
        400,
      )
    }

    if (!contentType) {
      return jsonError(
        'O tipo do arquivo é obrigatório.',
        400,
      )
    }

    if (
      sizeBytes === null ||
      sizeBytes <= 0
    ) {
      return jsonError(
        'O arquivo está vazio ou possui tamanho inválido.',
        400,
      )
    }

    if (
      sizeBytes >
      MAX_FILE_SIZE
    ) {
      return jsonError(
        'O arquivo deve ter no máximo 10 MB.',
        400,
      )
    }

    if (
      !ALLOWED_CONTENT_TYPES.has(
        contentType,
      )
    ) {
      return jsonError(
        'Formato não permitido. Envie imagem JPG, PNG, WEBP ou PDF.',
        400,
      )
    }

    const bucket =
      STORAGE_BUCKETS.EVIDENCES

    const path =
      createStoragePath({
        userId: user.id,
        folder: 'evidences',
        fileName,
      })

    const storage =
      getStorageClient()

    const {
      data,
      error,
    } = await storage.storage
      .from(bucket)
      .createSignedUploadUrl(
        path,
        {
          upsert: false,
        },
      )

    if (error) {
      throw new Error(
        `Não foi possível autorizar o envio do arquivo: ${error.message}`,
      )
    }

    if (!data?.token) {
      throw new Error(
        'O servidor não retornou o token temporário de envio.',
      )
    }

    return NextResponse.json(
      {
        success: true,

        data: {
          bucket,
          path,
          token: data.token,
          publicUrl: null,
        },
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao autorizar o envio da evidência.'

    return jsonError(
      message,
      getErrorStatus(message),
    )
  }
}

export async function DELETE(
  request: Request,
) {
  try {
    const user =
      await requireSessionUser()

    let body:
      DeleteUploadRequestBody

    try {
      body =
        (await request.json()) as
          DeleteUploadRequestBody
    } catch {
      return jsonError(
        'Os dados para remoção do arquivo são inválidos.',
        400,
      )
    }

    const bucket =
      normalizeRequiredText(
        body.bucket,
      )

    const path =
      normalizeRequiredText(
        body.path,
      )

    if (
      bucket !==
      STORAGE_BUCKETS.EVIDENCES
    ) {
      return jsonError(
        'O bucket informado é inválido.',
        400,
      )
    }

    if (!path) {
      return jsonError(
        'O caminho do arquivo é obrigatório.',
        400,
      )
    }

    const expectedPrefix =
      `${user.id}/evidences/`

    if (
      !path.startsWith(
        expectedPrefix,
      )
    ) {
      return jsonError(
        'Você não possui permissão para remover este arquivo.',
        403,
      )
    }

    const storage =
      getStorageClient()

    const {
      data: evidenceReferences,
      error: referenceError,
    } = await storage
      .from('agenda_evidences')
      .select('id')
      .eq(
        'storage_bucket',
        STORAGE_BUCKETS.EVIDENCES,
      )
      .eq(
        'storage_path',
        path,
      )
      .limit(1)

    if (referenceError) {
      throw new Error(
        `Não foi possível verificar o vínculo do arquivo: ${referenceError.message}`,
      )
    }

    if (
      evidenceReferences &&
      evidenceReferences.length > 0
    ) {
      return jsonError(
        'O arquivo já está associado a uma evidência e não pode ser removido como temporário.',
        409,
      )
    }

    await deleteFile({
      bucket:
        STORAGE_BUCKETS.EVIDENCES,
      path,
    })

    return NextResponse.json({
      success: true,

      message:
        'Arquivo temporário removido com sucesso.',
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao remover o arquivo temporário.'

    return jsonError(
      message,
      getErrorStatus(message),
    )
  }
}
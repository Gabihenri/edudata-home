import { NextResponse } from 'next/server'

import { requireSessionUser } from '@/lib/auth'
import {
  createStoragePath,
  getStorageClient,
  STORAGE_BUCKETS,
} from '@/lib/storage'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_CONTENT_TYPES = new Set([
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

export async function POST(
  request: Request,
) {
  try {
    const user = await requireSessionUser()

    let body: CreateUploadRequestBody

    try {
      body =
        (await request.json()) as CreateUploadRequestBody
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            'Os dados do arquivo são inválidos.',
        },
        {
          status: 400,
        },
      )
    }

    const fileName =
      normalizeRequiredText(body.fileName)

    const contentType =
      normalizeRequiredText(body.contentType)

    const sizeBytes =
      normalizeFileSize(body.sizeBytes)

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O nome do arquivo é obrigatório.',
        },
        {
          status: 400,
        },
      )
    }

    if (!contentType) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O tipo do arquivo é obrigatório.',
        },
        {
          status: 400,
        },
      )
    }

    if (
      sizeBytes === null ||
      sizeBytes <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O arquivo está vazio ou possui tamanho inválido.',
        },
        {
          status: 400,
        },
      )
    }

    if (sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O arquivo deve ter no máximo 10 MB.',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !ALLOWED_CONTENT_TYPES.has(
        contentType,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Formato não permitido. Envie imagem JPG, PNG, WEBP ou PDF.',
        },
        {
          status: 400,
        },
      )
    }

    const bucket =
      STORAGE_BUCKETS.EVIDENCES

    const path = createStoragePath({
      userId: user.id,
      folder: 'evidences',
      fileName,
    })

    const storage = getStorageClient()

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

    const normalizedMessage =
      message.toLowerCase()

    const status =
      normalizedMessage.includes(
        'autenticado',
      ) ||
      normalizedMessage.includes(
        'sessão',
      )
        ? 401
        : 500

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status,
      },
    )
  }
}
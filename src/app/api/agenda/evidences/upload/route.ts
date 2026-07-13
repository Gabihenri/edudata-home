import { NextResponse } from 'next/server'

import { requireSessionUser } from '@/lib/auth'
import {
  STORAGE_BUCKETS,
  uploadFile,
} from '@/lib/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser()
    const formData = await request.formData()

    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Arquivo não enviado.',
        },
        {
          status: 400,
        },
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'O arquivo está vazio.',
        },
        {
          status: 400,
        },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'O arquivo deve ter no máximo 10 MB.',
        },
        {
          status: 400,
        },
      )
    }

    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
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

    const result = await uploadFile({
      bucket: STORAGE_BUCKETS.EVIDENCES,
      userId: user.id,
      folder: 'evidences',
      fileName: file.name,
      file: await file.arrayBuffer(),
      contentType: file.type,
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao enviar evidência.'

    const status =
      message.toLowerCase().includes('autenticado') ? 401 : 500

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
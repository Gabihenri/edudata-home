import {
  createStoragePath,
  getStorageClient,
  type StorageBucket,
} from './storage'

export type UploadFileInput = {
  bucket: StorageBucket
  userId: string
  folder: string
  fileName: string
  file: ArrayBuffer
  contentType: string
  upsert?: boolean
}

export type UploadFileResult = {
  bucket: StorageBucket
  path: string
  publicUrl: string | null
}

export async function uploadFile({
  bucket,
  userId,
  folder,
  fileName,
  file,
  contentType,
  upsert = false,
}: UploadFileInput): Promise<UploadFileResult> {
  if (!contentType.trim()) {
    throw new Error(
      'Tipo do arquivo é obrigatório.',
    )
  }

  if (file.byteLength === 0) {
    throw new Error(
      'O arquivo está vazio.',
    )
  }

  const storage = getStorageClient()

  const path = createStoragePath({
    userId,
    folder,
    fileName,
  })

  const { error } = await storage.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert,
      cacheControl: '3600',
    })

  if (error) {
    throw new Error(
      `Erro ao enviar arquivo: ${error.message}`,
    )
  }

  return {
    bucket,
    path,
    publicUrl: null,
  }
}
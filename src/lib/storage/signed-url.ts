import {
  getStorageClient,
  type StorageBucket,
} from './storage'

export type CreateSignedUrlInput = {
  bucket: StorageBucket
  path: string
  expiresIn?: number
}

export type CreateSignedUrlResult = {
  signedUrl: string
  expiresIn: number
}

export async function createSignedUrl({
  bucket,
  path,
  expiresIn = 60 * 60,
}: CreateSignedUrlInput): Promise<CreateSignedUrlResult> {
  if (!path.trim()) {
    throw new Error('Caminho do arquivo é obrigatório.')
  }

  if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
    throw new Error(
      'O tempo de expiração deve ser um número inteiro maior que zero.',
    )
  }

  const storage = getStorageClient()

  const { data, error } = await storage.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(
      `Erro ao gerar URL assinada: ${error.message}`,
    )
  }

  if (!data?.signedUrl) {
    throw new Error('Não foi possível gerar a URL assinada.')
  }

  return {
    signedUrl: data.signedUrl,
    expiresIn,
  }
}
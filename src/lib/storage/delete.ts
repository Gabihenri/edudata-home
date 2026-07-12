import {
  getStorageClient,
  type StorageBucket,
} from './storage'

export type DeleteFileInput = {
  bucket: StorageBucket
  path: string
}

export async function deleteFile({
  bucket,
  path,
}: DeleteFileInput): Promise<void> {
  if (!path.trim()) {
    throw new Error('Caminho do arquivo é obrigatório.')
  }

  const storage = getStorageClient()

  const { error } = await storage.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw new Error(
      `Erro ao excluir arquivo: ${error.message}`,
    )
  }
}
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function runEiosPipeline(payload: Record<string, unknown>) {
  const response = await fetch(`${API_URL}/api/v1/engine/pipeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Erro ao executar pipeline do EIOS.')
  }

  return response.json()
}

export async function getEiosHealth() {
  const response = await fetch(`${API_URL}/api/v1/engine/health`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Erro ao verificar status do EIOS.')
  }

  return response.json()
}
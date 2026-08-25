export type ProfessionalMemory = {
  context: unknown
  knowledge: unknown[]
  production: unknown[]
  developmentChoices: unknown[]
  consent: {
    eios: boolean
    academy: boolean
  }
  updatedAt?: string
}

const defaultMemory: ProfessionalMemory = {
  context: {},
  knowledge: [],
  production: [],
  developmentChoices: [],
  consent: {
    eios: true,
    academy: false,
  },
}

export async function loadProfessionalMemory(): Promise<ProfessionalMemory | null> {
  const response = await fetch('/api/professor-digital/memory', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  if (!response.ok) return null

  const result = (await response.json()) as {
    success?: boolean
    memory?: ProfessionalMemory | null
  }

  return result.success ? result.memory ?? null : null
}

export async function saveProfessionalMemory(
  memory: Partial<ProfessionalMemory>,
): Promise<boolean> {
  const response = await fetch('/api/professor-digital/memory', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...defaultMemory,
      ...memory,
      consent: {
        ...defaultMemory.consent,
        ...memory.consent,
      },
    }),
  })

  return response.ok
}

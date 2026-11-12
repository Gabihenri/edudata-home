import { cookies } from 'next/headers'
import { getCurrentUser } from './auth'

export async function getSessionAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()

  return (
    cookieStore.get('sb-access-token')?.value ??
    cookieStore.get('access_token')?.value ??
    null
  )
}

export async function requireSessionAccessToken(): Promise<string> {
  const token = await getSessionAccessToken()

  if (!token) {
    throw new Error('Usuário não autenticado.')
  }

  return token
}

export async function getSessionUser() {
  const token = await getSessionAccessToken()

  if (!token) {
    return null
  }

  try {
    return await getCurrentUser(token)
  } catch {
    return null
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser()

  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  return user
}

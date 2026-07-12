import { cookies } from 'next/headers'
import { getCurrentUser } from './auth'

export async function getSessionUser() {
  const cookieStore = await cookies()

  const token =
    cookieStore.get('sb-access-token')?.value ??
    cookieStore.get('access_token')?.value

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
import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  UserProfileDto,
} from './profile.dto'

type DatabaseRecord =
  Record<string, unknown>

function createProfileClient(
  accessToken: string,
): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Configuração pública do Supabase indisponível.',
    )
  }

  if (
    typeof accessToken !== 'string' ||
    !accessToken.trim()
  ) {
    throw new Error(
      'Usuário não autenticado.',
    )
  }

  return createClient(
    url,
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  )
}

function isRecord(
  value: unknown,
): value is DatabaseRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function readRequiredString(
  record: DatabaseRecord,
  key: string,
): string {
  const value = record[key]

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `Campo obrigatório ausente no perfil: ${key}.`,
    )
  }

  return value.trim()
}

function readOptionalString(
  record: DatabaseRecord,
  key: string,
): string | null {
  const value = record[key]

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return null
  }

  return value.trim()
}

function readBoolean(
  record: DatabaseRecord,
  key: string,
  fallback = false,
): boolean {
  const value = record[key]

  if (typeof value === 'boolean') {
    return value
  }

  return fallback
}

function parseUserProfile(
  value: unknown,
): UserProfileDto | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    user_id:
      readRequiredString(
        value,
        'user_id',
      ),

    display_name:
      readOptionalString(
        value,
        'display_name',
      ),

    phone:
      readOptionalString(
        value,
        'phone',
      ),

    role:
      readRequiredString(
        value,
        'role',
      ),

    status:
      readRequiredString(
        value,
        'status',
      ),

    onboarding_completed:
      readBoolean(
        value,
        'onboarding_completed',
        false,
      ),
  }
}

class ProfileRepository {
  async findByUserId(
    accessToken: string,
    userId: string,
  ): Promise<UserProfileDto | null> {
    const { data, error } =
      await createProfileClient(accessToken)
        .from('user_profiles')
        .select(
          [
            'user_id',
            'display_name',
            'phone',
            'role',
            'status',
            'onboarding_completed',
          ].join(','),
        )
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar perfil: ${error.message}`,
      )
    }

    return parseUserProfile(data)
  }


}

export const profileRepository =
  new ProfileRepository()

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  UpdateUserProfileDto,
  UserProfileDto,
} from './profile.dto'

type DatabaseRecord =
  Record<string, unknown>

function createProfileClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL não configurada.',
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada.',
    )
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
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
  private get client(): SupabaseClient {
    return createProfileClient()
  }

  async findByUserId(
    userId: string,
  ): Promise<UserProfileDto | null> {
    const { data, error } =
      await this.client
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

  async createDefault(
    userId: string,
    displayName: string | null,
  ): Promise<UserProfileDto> {
    const { data, error } =
      await this.client
        .from('user_profiles')
        .insert({
          user_id: userId,
          role: 'professor',
          status: 'active',
          display_name:
            displayName,
          phone: null,
          onboarding_completed:
            false,
        })
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
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar perfil: ${error.message}`,
      )
    }

    const profile =
      parseUserProfile(data)

    if (!profile) {
      throw new Error(
        'O perfil foi criado, mas os dados retornados são inválidos.',
      )
    }

    return profile
  }

  async updateByUserId(
    userId: string,
    input: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const { data, error } =
      await this.client
        .from('user_profiles')
        .update({
          display_name:
            input.display_name,

          phone:
            input.phone || null,

          onboarding_completed:
            input.onboarding_completed ??
            true,
        })
        .eq('user_id', userId)
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
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar perfil: ${error.message}`,
      )
    }

    const profile =
      parseUserProfile(data)

    if (!profile) {
      throw new Error(
        'O perfil foi atualizado, mas os dados retornados são inválidos.',
      )
    }

    return profile
  }
}

export const profileRepository =
  new ProfileRepository()
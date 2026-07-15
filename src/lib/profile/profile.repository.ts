import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  UpdateUserProfileDto,
  UserProfileDto,
} from './profile.dto'

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

    return data as UserProfileDto | null
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
          display_name: displayName,
          phone: null,
          onboarding_completed: false,
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

    return data as UserProfileDto
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

    return data as UserProfileDto
  }
}

export const profileRepository =
  new ProfileRepository()
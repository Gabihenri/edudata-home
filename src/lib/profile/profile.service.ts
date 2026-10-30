import type {
  UserProfileDto,
} from './profile.dto'

import { profileRepository } from './profile.repository'

function normalizeAccessToken(
  accessToken: string,
): string {
  const normalized = accessToken.trim()

  if (!normalized) {
    throw new Error('Usuário não autenticado.')
  }

  return normalized
}

function normalizeUserId(
  userId: string,
): string {
  const normalizedUserId =
    userId.trim()

  if (!normalizedUserId) {
    throw new Error(
      'ID do usuário é obrigatório.',
    )
  }

  return normalizedUserId
}

class ProfileService {
  async getByUserId(
    accessToken: string,
    userId: string,
  ): Promise<UserProfileDto | null> {
    return profileRepository.findByUserId(
      normalizeAccessToken(accessToken),
      normalizeUserId(userId),
    )
  }

  async getOrCreate(
    accessToken: string,
    userId: string,
  ): Promise<UserProfileDto> {
    const profile = await profileRepository.findByUserId(
      normalizeAccessToken(accessToken),
      normalizeUserId(userId),
    )

    if (!profile) {
      throw new Error(
        'Perfil individual ainda não foi provisionado pelo Supabase Auth.',
      )
    }

    return profile
  }


}

export const profileService =
  new ProfileService()

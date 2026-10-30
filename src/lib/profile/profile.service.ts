import type {
  UpdateUserProfileDto,
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

function normalizeDisplayName(
  displayName: string,
): string {
  const normalizedDisplayName =
    displayName.trim()

  if (!normalizedDisplayName) {
    throw new Error(
      'Nome de exibição é obrigatório.',
    )
  }

  if (
    normalizedDisplayName.length < 3
  ) {
    throw new Error(
      'Nome de exibição deve ter pelo menos 3 caracteres.',
    )
  }

  if (
    normalizedDisplayName.length > 120
  ) {
    throw new Error(
      'Nome de exibição deve ter no máximo 120 caracteres.',
    )
  }

  return normalizedDisplayName
}

function normalizePhone(
  phone: string,
): string {
  const normalizedPhone =
    phone.trim()

  if (!normalizedPhone) {
    return ''
  }

  const digits =
    normalizedPhone.replace(
      /\\D/g,
      '',
    )

  if (
    digits.length < 10 ||
    digits.length > 15
  ) {
    throw new Error(
      'Telefone inválido.',
    )
  }

  return normalizedPhone
}

function normalizeDefaultName(
  displayName:
    | string
    | null
    | undefined,
): string | null {
  const normalizedDisplayName =
    displayName?.trim()

  return (
    normalizedDisplayName ||
    null
  )
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
    _defaultDisplayName?: string | null,
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

  async updateOwnProfile(
    accessToken: string,
    userId: string,
    input: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const token = normalizeAccessToken(accessToken)
    const normalizedUserId = normalizeUserId(userId)

    const existingProfile =
      await profileRepository.findByUserId(
        token,
        normalizedUserId,
      )

    if (!existingProfile) {
      throw new Error(
        'Perfil do usuário não encontrado.',
      )
    }

    const normalizedInput: UpdateUserProfileDto = {
      display_name: normalizeDisplayName(input.display_name),
      phone: normalizePhone(input.phone),
      onboarding_completed: true,
    }

    return profileRepository.updateByUserId(
      token,
      normalizedUserId,
      normalizedInput,
    )
  }
}

export const profileService =
  new ProfileService()

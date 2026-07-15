export interface UserProfileDto {
  user_id: string

  display_name: string | null

  phone: string | null

  role: string

  status: string

  onboarding_completed: boolean
}

export interface UpdateUserProfileDto {
  display_name: string

  phone: string

  onboarding_completed?: boolean
}
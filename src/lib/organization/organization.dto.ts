export type OrganizationStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'archived'

export interface OrganizationDto {
  id: string

  name: string

  short_name: string | null

  organization_type: string

  document: string | null

  email: string | null

  phone: string | null

  website: string | null

  logo_url: string | null

  address: string | null

  city: string | null

  state: string | null

  zip_code: string | null

  country: string

  status: OrganizationStatus

  created_at: string

  updated_at: string
}

export interface CreateOrganizationDto {
  name: string

  short_name?: string

  organization_type: string

  document?: string

  email?: string

  phone?: string

  website?: string

  logo_url?: string

  address?: string

  city?: string

  state?: string

  zip_code?: string

  country?: string

  status?: OrganizationStatus
}

export interface UpdateOrganizationDto
  extends Partial<CreateOrganizationDto> {}
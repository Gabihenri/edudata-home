export type SchoolStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'archived'

export type EducationNetwork =
  | 'municipal'
  | 'state'
  | 'federal'
  | 'private'
  | 'community'
  | 'other'

export type AdministrativeType =
  | 'public'
  | 'private'
  | 'philanthropic'
  | 'community'
  | 'other'

export interface SchoolDto {
  id: string
  organization_id: string
  inep_code: string | null
  name: string
  short_name: string | null
  education_network: EducationNetwork
  administrative_type: AdministrativeType
  principal_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  postal_code: string | null
  address: string | null
  number: string | null
  complement: string | null
  district: string | null
  city: string | null
  state: string | null
  country: string
  status: SchoolStatus
  created_at: string
  updated_at: string
}

export interface CreateSchoolDto {
  organization_id: string
  name: string
  inep_code?: string
  short_name?: string
  education_network: EducationNetwork
  administrative_type: AdministrativeType
  principal_name?: string
  email?: string
  phone?: string
  website?: string
  postal_code?: string
  address?: string
  number?: string
  complement?: string
  district?: string
  city?: string
  state?: string
  country?: string
  status?: SchoolStatus
}

export type UpdateSchoolDto =
  Partial<CreateSchoolDto>
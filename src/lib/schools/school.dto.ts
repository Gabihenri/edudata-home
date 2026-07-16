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

export type InstitutionType =
  | 'school'
  | 'institute'
  | 'college'
  | 'university'
  | 'company'
  | 'training_center'
  | 'ngo'
  | 'government_agency'
  | 'education_department'
  | 'research_center'
  | 'other'

export type RegistrationOrigin =
  | 'inep'
  | 'manual'

export interface SchoolDto {
  id: string
  organization_id: string
  registry_id?: string | null
  registration_origin?: RegistrationOrigin
  institution_type?: InstitutionType
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
  registry_id?: string
  registration_origin?: RegistrationOrigin
  institution_type?: InstitutionType
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
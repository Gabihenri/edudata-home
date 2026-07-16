export interface SchoolRegistryDto {
  id: string
  inep_code: string
  name: string
  state: string | null
  city: string | null
  service_restriction: string | null
  location: string | null
  differentiated_location: string | null
  administrative_category: string | null
  address: string | null
  phone: string | null
  administrative_dependency: string | null
  private_school_category: string | null
  public_authority_partner: string | null
  education_council_regulation: string | null
  school_size: string | null
  education_stages: string | null
  other_educational_offerings: string | null
  latitude: number | null
  longitude: number | null
  source_file: string | null
  imported_at: string
  created_at: string
  updated_at: string
}

export interface SchoolRegistrySearchItemDto {
  id: string
  inep_code: string
  name: string
  state: string | null
  city: string | null
  location: string | null
  address: string | null
  phone: string | null
  administrative_category: string | null
  administrative_dependency: string | null
  latitude: number | null
  longitude: number | null
}

export interface SchoolRegistrySearchQueryDto {
  query: string
  state?: string
  city?: string
  limit: number
}

export interface SchoolRegistrySearchResultDto {
  query: string
  total: number
  data: SchoolRegistrySearchItemDto[]
}
import { organizationRepository } from '@/lib/organization/organization.repository'
import { schoolRegistryRepository } from '@/lib/school-registry/school-registry.repository'

import type {
  AdministrativeType,
  CreateSchoolDto,
  EducationNetwork,
  RegistrationOrigin,
  SchoolDto,
  UpdateSchoolDto,
} from './school.dto'
import { schoolRepository } from './school.repository'
import {
  validateCreateSchool,
  validateOrganizationId,
  validateSchoolId,
  validateUpdateSchool,
} from './school.validators'

function mapEducationNetwork(
  dependency: string | null,
): EducationNetwork {
  const normalized =
    dependency
      ?.trim()
      .toLowerCase() ?? ''

  if (
    normalized.includes('municipal')
  ) {
    return 'municipal'
  }

  if (
    normalized.includes('estadual') ||
    normalized.includes('state')
  ) {
    return 'state'
  }

  if (
    normalized.includes('federal')
  ) {
    return 'federal'
  }

  if (
    normalized.includes('privada') ||
    normalized.includes('private') ||
    normalized.includes('particular')
  ) {
    return 'private'
  }

  if (
    normalized.includes('comunit')
  ) {
    return 'community'
  }

  return 'other'
}

function mapAdministrativeType(
  dependency: string | null,
  category: string | null,
): AdministrativeType {
  const normalized = [
    dependency,
    category,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase()

  if (
    normalized.includes('privada') ||
    normalized.includes('private') ||
    normalized.includes('particular')
  ) {
    return 'private'
  }

  if (
    normalized.includes('filantr')
  ) {
    return 'philanthropic'
  }

  if (
    normalized.includes('comunit')
  ) {
    return 'community'
  }

  if (
    normalized.includes('municipal') ||
    normalized.includes('estadual') ||
    normalized.includes('state') ||
    normalized.includes('federal') ||
    normalized.includes('pública') ||
    normalized.includes('publica') ||
    normalized.includes('public')
  ) {
    return 'public'
  }

  return 'other'
}

async function ensureOrganizationAvailable(
  organizationId: string,
): Promise<void> {
  const organization =
    await organizationRepository.findById(
      organizationId,
    )

  if (!organization) {
    throw new Error(
      'Organização não encontrada.',
    )
  }

  if (
    organization.status === 'archived'
  ) {
    throw new Error(
      'Não é possível vincular uma instituição a uma organização arquivada.',
    )
  }
}

async function buildRegistryCreateInput(
  input: CreateSchoolDto,
): Promise<CreateSchoolDto> {
  if (
    input.registration_origin !== 'inep'
  ) {
    return {
      ...input,
      registration_origin: 'manual',
      registry_id: undefined,
    }
  }

  if (!input.registry_id) {
    throw new Error(
      'Selecione uma instituição do cadastro nacional.',
    )
  }

  const registry =
    await schoolRegistryRepository.findById(
      input.registry_id,
    )

  if (!registry) {
    throw new Error(
      'Instituição não encontrada no cadastro nacional.',
    )
  }

  const existingLink =
    await schoolRepository.findByOrganizationAndRegistry(
      input.organization_id,
      registry.id,
    )

  if (existingLink) {
    throw new Error(
      'Esta instituição já está vinculada à organização selecionada.',
    )
  }

  const existingInep =
    await schoolRepository.findByInepCode(
      registry.inep_code,
    )

  if (existingInep) {
    throw new Error(
      'Esta instituição já está cadastrada na plataforma.',
    )
  }

  return {
    ...input,
    registry_id: registry.id,
    registration_origin: 'inep',
    institution_type: 'school',
    inep_code: registry.inep_code,
    name: registry.name,
    education_network:
      mapEducationNetwork(
        registry.administrative_dependency,
      ),
    administrative_type:
      mapAdministrativeType(
        registry.administrative_dependency,
        registry.administrative_category,
      ),
    phone:
      registry.phone ?? undefined,
    address:
      registry.address ?? undefined,
    city:
      registry.city ?? undefined,
    state:
      registry.state ?? undefined,
    country: 'Brasil',
  }
}

class SchoolService {
  async listAll(): Promise<SchoolDto[]> {
    return schoolRepository.findAll()
  }

  async listByOrganizationId(
    organizationId: unknown,
  ): Promise<SchoolDto[]> {
    const validatedOrganizationId =
      validateOrganizationId(
        organizationId,
      )

    await ensureOrganizationAvailable(
      validatedOrganizationId,
    )

    return schoolRepository.findByOrganizationId(
      validatedOrganizationId,
    )
  }

  async getById(
    schoolId: unknown,
  ): Promise<SchoolDto> {
    const validatedSchoolId =
      validateSchoolId(schoolId)

    const school =
      await schoolRepository.findById(
        validatedSchoolId,
      )

    if (!school) {
      throw new Error(
        'Instituição não encontrada.',
      )
    }

    return school
  }

  async create(
    value: unknown,
  ): Promise<SchoolDto> {
    const validatedInput =
      validateCreateSchool(value)

    await ensureOrganizationAvailable(
      validatedInput.organization_id,
    )

    const input =
      await buildRegistryCreateInput(
        validatedInput,
      )

    if (
      input.registration_origin ===
        'manual' &&
      input.inep_code
    ) {
      const existingSchool =
        await schoolRepository.findByInepCode(
          input.inep_code,
        )

      if (existingSchool) {
        throw new Error(
          'Já existe uma instituição cadastrada com esse código INEP.',
        )
      }
    }

    return schoolRepository.create(input)
  }

  async update(
    schoolId: unknown,
    value: unknown,
  ): Promise<SchoolDto> {
    const validatedSchoolId =
      validateSchoolId(schoolId)

    const input: UpdateSchoolDto =
      validateUpdateSchool(value)

    const currentSchool =
      await schoolRepository.findById(
        validatedSchoolId,
      )

    if (!currentSchool) {
      throw new Error(
        'Instituição não encontrada.',
      )
    }

    const organizationId =
      input.organization_id ??
      currentSchool.organization_id

    await ensureOrganizationAvailable(
      organizationId,
    )

    const finalOrigin:
      RegistrationOrigin =
        input.registration_origin ??
        currentSchool.registration_origin ??
        'manual'

    if (finalOrigin === 'inep') {
      const registryId =
        input.registry_id ||
        currentSchool.registry_id

      if (!registryId) {
        throw new Error(
          'Instituição vinculada ao INEP deve possuir um registro nacional.',
        )
      }

      const registry =
        await schoolRegistryRepository.findById(
          registryId,
        )

      if (!registry) {
        throw new Error(
          'Instituição não encontrada no cadastro nacional.',
        )
      }

      const existingLink =
        await schoolRepository.findByOrganizationAndRegistry(
          organizationId,
          registry.id,
        )

      if (
        existingLink &&
        existingLink.id !==
          validatedSchoolId
      ) {
        throw new Error(
          'Esta instituição já está vinculada à organização selecionada.',
        )
      }

      input.registry_id =
        registry.id

      input.registration_origin =
        'inep'

      input.institution_type =
        'school'

      input.inep_code =
        registry.inep_code

      input.name =
        registry.name

      input.education_network =
        mapEducationNetwork(
          registry.administrative_dependency,
        )

      input.administrative_type =
        mapAdministrativeType(
          registry.administrative_dependency,
          registry.administrative_category,
        )

      input.phone =
        registry.phone ?? ''

      input.address =
        registry.address ?? ''

      input.city =
        registry.city ?? ''

      input.state =
        registry.state ?? ''

      input.country =
        'Brasil'
    } else {
      input.registration_origin =
        'manual'

      input.registry_id = ''
    }

    if (input.inep_code) {
      const existingSchool =
        await schoolRepository.findByInepCode(
          input.inep_code,
        )

      if (
        existingSchool &&
        existingSchool.id !==
          validatedSchoolId
      ) {
        throw new Error(
          'Já existe outra instituição cadastrada com esse código INEP.',
        )
      }
    }

    return schoolRepository.updateById(
      validatedSchoolId,
      input,
    )
  }

  async archive(
    schoolId: unknown,
  ): Promise<SchoolDto> {
    const validatedSchoolId =
      validateSchoolId(schoolId)

    const currentSchool =
      await schoolRepository.findById(
        validatedSchoolId,
      )

    if (!currentSchool) {
      throw new Error(
        'Instituição não encontrada.',
      )
    }

    if (
      currentSchool.status === 'archived'
    ) {
      return currentSchool
    }

    return schoolRepository.archiveById(
      validatedSchoolId,
    )
  }
}

export const schoolService =
  new SchoolService()
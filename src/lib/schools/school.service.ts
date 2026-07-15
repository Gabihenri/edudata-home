import { organizationRepository } from '@/lib/organization/organization.repository'

import type {
  CreateSchoolDto,
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

    const organization =
      await organizationRepository.findById(
        validatedOrganizationId,
      )

    if (!organization) {
      throw new Error(
        'Organização não encontrada.',
      )
    }

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
        'Escola não encontrada.',
      )
    }

    return school
  }

  async create(
    value: unknown,
  ): Promise<SchoolDto> {
    const input: CreateSchoolDto =
      validateCreateSchool(value)

    const organization =
      await organizationRepository.findById(
        input.organization_id,
      )

    if (!organization) {
      throw new Error(
        'Organização não encontrada.',
      )
    }

    if (
      organization.status ===
      'archived'
    ) {
      throw new Error(
        'Não é possível cadastrar uma escola em uma organização arquivada.',
      )
    }

    if (input.inep_code) {
      const existingSchool =
        await schoolRepository.findByInepCode(
          input.inep_code,
        )

      if (existingSchool) {
        throw new Error(
          'Já existe uma escola cadastrada com esse código INEP.',
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
        'Escola não encontrada.',
      )
    }

    if (input.organization_id) {
      const organization =
        await organizationRepository.findById(
          input.organization_id,
        )

      if (!organization) {
        throw new Error(
          'Organização não encontrada.',
        )
      }

      if (
        organization.status ===
        'archived'
      ) {
        throw new Error(
          'Não é possível vincular a escola a uma organização arquivada.',
        )
      }
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
          'Já existe outra escola cadastrada com esse código INEP.',
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
        'Escola não encontrada.',
      )
    }

    if (
      currentSchool.status ===
      'archived'
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
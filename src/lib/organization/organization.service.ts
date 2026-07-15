import type {
  CreateOrganizationDto,
  OrganizationDto,
  UpdateOrganizationDto,
} from './organization.dto'

import { organizationRepository } from './organization.repository'

import {
  validateCreateOrganization,
  validateOrganizationId,
  validateUpdateOrganization,
} from './organization.validators'

class OrganizationService {
  async listAll(): Promise<
    OrganizationDto[]
  > {
    return organizationRepository.findAll()
  }

  async getById(
    id: unknown,
  ): Promise<OrganizationDto> {
    const organizationId =
      validateOrganizationId(id)

    const organization =
      await organizationRepository.findById(
        organizationId,
      )

    if (!organization) {
      throw new Error(
        'Organização não encontrada.',
      )
    }

    return organization
  }

  async create(
    input: unknown,
  ): Promise<OrganizationDto> {
    const validatedInput:
      CreateOrganizationDto =
        validateCreateOrganization(input)

    await this.ensureDocumentAvailable(
      validatedInput.document,
    )

    return organizationRepository.create(
      validatedInput,
    )
  }

  async update(
    id: unknown,
    input: unknown,
  ): Promise<OrganizationDto> {
    const organizationId =
      validateOrganizationId(id)

    const currentOrganization =
      await organizationRepository.findById(
        organizationId,
      )

    if (!currentOrganization) {
      throw new Error(
        'Organização não encontrada.',
      )
    }

    const validatedInput:
      UpdateOrganizationDto =
        validateUpdateOrganization(input)

    await this.ensureDocumentAvailable(
      validatedInput.document,
      organizationId,
    )

    return organizationRepository.update(
      organizationId,
      validatedInput,
    )
  }

  async archive(
    id: unknown,
  ): Promise<OrganizationDto> {
    const organizationId =
      validateOrganizationId(id)

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
      organization.status ===
      'archived'
    ) {
      throw new Error(
        'A organização já está arquivada.',
      )
    }

    return organizationRepository.archive(
      organizationId,
    )
  }

  private async ensureDocumentAvailable(
    document:
      | string
      | undefined,
    currentOrganizationId?: string,
  ): Promise<void> {
    const normalizedDocument =
      document?.trim()

    if (!normalizedDocument) {
      return
    }

    const existingOrganization =
      await organizationRepository.findByDocument(
        normalizedDocument,
      )

    if (
      existingOrganization &&
      existingOrganization.id !==
        currentOrganizationId
    ) {
      throw new Error(
        'Já existe uma organização cadastrada com esse documento.',
      )
    }
  }
}

export const organizationService =
  new OrganizationService()
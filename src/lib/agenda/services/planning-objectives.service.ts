import {
  PlanningObjectivesRepository,
  type AgendaPlanningObjective,
  type AgendaPlanningObjectiveMetadata,
  type AgendaPlanningObjectiveRole,
  type AgendaPlanningObjectiveWithObjective,
  type CreateAgendaPlanningObjectiveInput,
  type UpdateAgendaPlanningObjectiveInput,
} from '@/lib/agenda/repository/planning-objectives.repository'

export type PlanningObjectiveSelection = {
  objectiveId: string

  role?:
    AgendaPlanningObjectiveRole

  sequence?: number

  metadata?:
    AgendaPlanningObjectiveMetadata
}

export type LinkPlanningObjectiveInput = {
  planningId: string
  objectiveId: string

  role?:
    AgendaPlanningObjectiveRole

  sequence?: number

  userId: string

  organizationId?: string | null
  schoolId?: string | null

  metadata?:
    AgendaPlanningObjectiveMetadata
}

export type UpdatePlanningObjectiveLinkInput = {
  role?:
    AgendaPlanningObjectiveRole

  sequence?: number

  organizationId?: string | null
  schoolId?: string | null

  metadata?:
    AgendaPlanningObjectiveMetadata
}

export type SynchronizePlanningObjectivesInput = {
  planningId: string

  objectives:
    PlanningObjectiveSelection[]

  userId: string

  organizationId?: string | null
  schoolId?: string | null
}

export type RemovePlanningObjectiveInput = {
  relationshipId: string
  userId: string
  reason: string
}

export type RemoveAllPlanningObjectivesInput = {
  planningId: string
  userId: string
  reason: string
}

function normalizeRequiredText(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalId(
  value:
    | string
    | null
    | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue ||
    null
}

function normalizeRole(
  value:
    | AgendaPlanningObjectiveRole
    | null
    | undefined,
): AgendaPlanningObjectiveRole {
  if (
    value === undefined ||
    value === null
  ) {
    return 'supporting'
  }

  if (
    value !== 'primary' &&
    value !== 'supporting'
  ) {
    throw new Error(
      'O papel do objetivo no planejamento é inválido.',
    )
  }

  return value
}

function normalizeSequence(
  value:
    | number
    | null
    | undefined,

  fallbackValue: number,
): number {
  if (
    value === undefined ||
    value === null
  ) {
    return fallbackValue
  }

  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      'A sequência deve ser um número inteiro maior ou igual a 1.',
    )
  }

  return value
}

function normalizeReason(
  value:
    | string
    | null
    | undefined,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      'Motivo da remoção',
    )

  if (
    normalizedValue.length >
    2000
  ) {
    throw new Error(
      'O motivo da remoção não pode ultrapassar 2000 caracteres.',
    )
  }

  return normalizedValue
}

function ensureRelationshipOwnership(
  relationship:
    AgendaPlanningObjective,

  userId: string,
): void {
  if (
    relationship.user_id !==
    userId
  ) {
    throw new Error(
      'O vínculo informado não pertence ao usuário autenticado.',
    )
  }
}

function removeDuplicateSelections(
  selections:
    PlanningObjectiveSelection[],
): PlanningObjectiveSelection[] {
  const uniqueSelections =
    new Map<
      string,
      PlanningObjectiveSelection
    >()

  for (
    const selection
    of selections
  ) {
    const objectiveId =
      normalizeRequiredText(
        selection.objectiveId,
        'ID do objetivo',
      )

    if (
      uniqueSelections.has(
        objectiveId,
      )
    ) {
      throw new Error(
        'Um mesmo objetivo não pode ser vinculado mais de uma vez ao planejamento.',
      )
    }

    uniqueSelections.set(
      objectiveId,
      {
        ...selection,

        objectiveId,
      },
    )
  }

  return Array.from(
    uniqueSelections.values(),
  )
}

function normalizeSelections(
  selections:
    PlanningObjectiveSelection[],
): PlanningObjectiveSelection[] {
  if (
    !Array.isArray(
      selections,
    )
  ) {
    throw new Error(
      'A lista de objetivos possui formato inválido.',
    )
  }

  const uniqueSelections =
    removeDuplicateSelections(
      selections,
    )

  let primaryCount =
    0

  const normalizedSelections =
    uniqueSelections.map(
      (
        selection,
        index,
      ) => {
        const role =
          normalizeRole(
            selection.role,
          )

        if (
          role ===
          'primary'
        ) {
          primaryCount +=
            1
        }

        return {
          objectiveId:
            selection.objectiveId,

          role,

          sequence:
            normalizeSequence(
              selection.sequence,
              index + 1,
            ),

          metadata:
            selection.metadata ??
            {},
        }
      },
    )

  if (
    primaryCount >
    1
  ) {
    throw new Error(
      'Um planejamento pode possuir apenas um objetivo principal.',
    )
  }

  return normalizedSelections
}

export class PlanningObjectivesService {
  constructor(
    private readonly repository:
      PlanningObjectivesRepository =
        new PlanningObjectivesRepository(),
  ) {}

  async listByPlanning(
    planningId: string,
    userId: string,
  ): Promise<
    AgendaPlanningObjective[]
  > {
    const normalizedPlanningId =
      normalizeRequiredText(
        planningId,
        'ID do planejamento',
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    return this.repository.findAll({
      planningId:
        normalizedPlanningId,

      userId:
        normalizedUserId,
    })
  }

  async listObjectivesByPlanning(
    planningId: string,
    userId: string,
  ): Promise<
    AgendaPlanningObjectiveWithObjective[]
  > {
    const normalizedPlanningId =
      normalizeRequiredText(
        planningId,
        'ID do planejamento',
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    const relationships =
      await this.repository
        .findObjectivesByPlanningId(
          normalizedPlanningId,
        )

    return relationships.filter(
      relationship =>
        relationship.user_id ===
        normalizedUserId,
    )
  }

  async listByObjective(
    objectiveId: string,
    userId: string,
  ): Promise<
    AgendaPlanningObjective[]
  > {
    const normalizedObjectiveId =
      normalizeRequiredText(
        objectiveId,
        'ID do objetivo',
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    return this.repository.findAll({
      objectiveId:
        normalizedObjectiveId,

      userId:
        normalizedUserId,
    })
  }

  async getById(
    relationshipId: string,
    userId: string,
  ): Promise<
    AgendaPlanningObjective
  > {
    const normalizedRelationshipId =
      normalizeRequiredText(
        relationshipId,
        'ID do vínculo',
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    const relationship =
      await this.repository
        .findById(
          normalizedRelationshipId,
        )

    if (!relationship) {
      throw new Error(
        'Vínculo entre planejamento e objetivo não encontrado.',
      )
    }

    ensureRelationshipOwnership(
      relationship,
      normalizedUserId,
    )

    return relationship
  }

  async link(
    input:
      LinkPlanningObjectiveInput,
  ): Promise<
    AgendaPlanningObjective
  > {
    const planningId =
      normalizeRequiredText(
        input.planningId,
        'ID do planejamento',
      )

    const objectiveId =
      normalizeRequiredText(
        input.objectiveId,
        'ID do objetivo',
      )

    const userId =
      normalizeRequiredText(
        input.userId,
        'ID do usuário',
      )

    const role =
      normalizeRole(
        input.role,
      )

    if (
      role ===
      'primary'
    ) {
      const currentPrimaryObjectives =
        await this.repository
          .findAll({
            planningId,

            userId,

            relationshipRole:
              'primary',
          })

      const differentPrimary =
        currentPrimaryObjectives
          .find(
            relationship =>
              relationship.objective_id !==
              objectiveId,
          )

      if (
        differentPrimary
      ) {
        throw new Error(
          'O planejamento já possui um objetivo principal.',
        )
      }
    }

    const repositoryInput:
      CreateAgendaPlanningObjectiveInput = {
        planning_id:
          planningId,

        objective_id:
          objectiveId,

        relationship_role:
          role,

        sequence:
          normalizeSequence(
            input.sequence,
            1,
          ),

        user_id:
          userId,

        organization_id:
          normalizeOptionalId(
            input.organizationId,
          ) ?? null,

        school_id:
          normalizeOptionalId(
            input.schoolId,
          ) ?? null,

        created_by:
          userId,

        updated_by:
          userId,

        metadata:
          input.metadata ??
          {},
      }

    return this.repository.create(
      repositoryInput,
    )
  }

  async update(
    relationshipId: string,

    input:
      UpdatePlanningObjectiveLinkInput,

    userId: string,
  ): Promise<
    AgendaPlanningObjective
  > {
    const currentRelationship =
      await this.getById(
        relationshipId,
        userId,
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    if (
      input.role ===
      'primary'
    ) {
      const currentPrimaryObjectives =
        await this.repository
          .findAll({
            planningId:
              currentRelationship
                .planning_id,

            userId:
              normalizedUserId,

            relationshipRole:
              'primary',
          })

      const differentPrimary =
        currentPrimaryObjectives
          .find(
            relationship =>
              relationship.id !==
              currentRelationship.id,
          )

      if (
        differentPrimary
      ) {
        throw new Error(
          'O planejamento já possui um objetivo principal.',
        )
      }
    }

    const repositoryInput:
      UpdateAgendaPlanningObjectiveInput = {
        updated_by:
          normalizedUserId,
    }

    if (
      input.role !==
      undefined
    ) {
      repositoryInput
        .relationship_role =
          normalizeRole(
            input.role,
          )
    }

    if (
      input.sequence !==
      undefined
    ) {
      repositoryInput.sequence =
        normalizeSequence(
          input.sequence,
          1,
        )
    }

    if (
      input.organizationId !==
      undefined
    ) {
      repositoryInput
        .organization_id =
          normalizeOptionalId(
            input.organizationId,
          ) ?? null
    }

    if (
      input.schoolId !==
      undefined
    ) {
      repositoryInput.school_id =
        normalizeOptionalId(
          input.schoolId,
        ) ?? null
    }

    if (
      input.metadata !==
      undefined
    ) {
      repositoryInput.metadata =
        input.metadata
    }

    return this.repository.update(
      currentRelationship.id,
      repositoryInput,
    )
  }

  async remove(
    input:
      RemovePlanningObjectiveInput,
  ): Promise<void> {
    const relationship =
      await this.getById(
        input.relationshipId,
        input.userId,
      )

    await this.repository
      .softDelete(
        relationship.id,
        {
          actorUserId:
            normalizeRequiredText(
              input.userId,
              'ID do usuário',
            ),

          reason:
            normalizeReason(
              input.reason,
            ),
        },
      )
  }

  async removeAllFromPlanning(
    input:
      RemoveAllPlanningObjectivesInput,
  ): Promise<void> {
    const planningId =
      normalizeRequiredText(
        input.planningId,
        'ID do planejamento',
      )

    const userId =
      normalizeRequiredText(
        input.userId,
        'ID do usuário',
      )

    const currentRelationships =
      await this.repository
        .findAll({
          planningId,

          userId,
        })

    if (
      currentRelationships.length ===
      0
    ) {
      return
    }

    await this.repository
      .softDeleteByPlanningId(
        planningId,
        {
          actorUserId:
            userId,

          reason:
            normalizeReason(
              input.reason,
            ),
        },
      )
  }

  async synchronize(
    input:
      SynchronizePlanningObjectivesInput,
  ): Promise<
    AgendaPlanningObjective[]
  > {
    const planningId =
      normalizeRequiredText(
        input.planningId,
        'ID do planejamento',
      )

    const userId =
      normalizeRequiredText(
        input.userId,
        'ID do usuário',
      )

    const normalizedSelections =
      normalizeSelections(
        input.objectives,
      )

    const currentRelationships =
      await this.repository
        .findAll({
          planningId,

          userId,
        })

    const requestedObjectiveIds =
      new Set(
        normalizedSelections.map(
          selection =>
            selection.objectiveId,
        ),
      )

    for (
      const currentRelationship
      of currentRelationships
    ) {
      if (
        !requestedObjectiveIds.has(
          currentRelationship
            .objective_id,
        )
      ) {
        await this.repository
          .softDelete(
            currentRelationship.id,
            {
              actorUserId:
                userId,

              reason:
                'Vínculo removido durante a sincronização dos objetivos do planejamento.',
            },
          )
      }
    }

    const synchronizedRelationships:
      AgendaPlanningObjective[] = []

    for (
      const selection
      of normalizedSelections
    ) {
      const existingRelationship =
        currentRelationships.find(
          relationship =>
            relationship.objective_id ===
            selection.objectiveId,
        )

      if (
        existingRelationship
      ) {
        const updatedRelationship =
          await this.repository
            .update(
              existingRelationship.id,
              {
                relationship_role:
                  selection.role,

                sequence:
                  selection.sequence,

                organization_id:
                  normalizeOptionalId(
                    input.organizationId,
                  ) ?? null,

                school_id:
                  normalizeOptionalId(
                    input.schoolId,
                  ) ?? null,

                updated_by:
                  userId,

                metadata:
                  selection.metadata ??
                  {},
              },
            )

        synchronizedRelationships.push(
          updatedRelationship,
        )

        continue
      }

      const createdRelationship =
        await this.repository
          .create({
            planning_id:
              planningId,

            objective_id:
              selection.objectiveId,

            relationship_role:
              selection.role,

            sequence:
              selection.sequence,

            user_id:
              userId,

            organization_id:
              normalizeOptionalId(
                input.organizationId,
              ) ?? null,

            school_id:
              normalizeOptionalId(
                input.schoolId,
              ) ?? null,

            created_by:
              userId,

            updated_by:
              userId,

            metadata:
              selection.metadata ??
              {},
          })

      synchronizedRelationships.push(
        createdRelationship,
      )
    }

    return synchronizedRelationships
      .sort(
        (
          firstRelationship,
          secondRelationship,
        ) =>
          firstRelationship.sequence -
          secondRelationship.sequence,
      )
  }
}

export const planningObjectivesService =
  new PlanningObjectivesService()
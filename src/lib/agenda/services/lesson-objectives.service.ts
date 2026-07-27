import {
  LessonObjectivesRepository,
  type AgendaLessonObjective,
  type AgendaLessonObjectiveMetadata,
  type AgendaLessonObjectiveRole,
  type AgendaLessonObjectiveWithObjective,
  type CreateAgendaLessonObjectiveInput,
  type UpdateAgendaLessonObjectiveInput,
} from '@/lib/agenda/repository/lesson-objectives.repository'

export type LessonObjectiveSelection = {
  objectiveId: string

  role?:
    AgendaLessonObjectiveRole

  sequence?: number

  metadata?:
    AgendaLessonObjectiveMetadata
}

export type LinkLessonObjectiveInput = {
  lessonId: string
  objectiveId: string

  role?:
    AgendaLessonObjectiveRole

  sequence?: number

  userId: string

  organizationId?: string | null
  schoolId?: string | null

  metadata?:
    AgendaLessonObjectiveMetadata
}

export type UpdateLessonObjectiveLinkInput = {
  role?:
    AgendaLessonObjectiveRole

  sequence?: number

  organizationId?: string | null
  schoolId?: string | null

  metadata?:
    AgendaLessonObjectiveMetadata
}

export type SynchronizeLessonObjectivesInput = {
  lessonId: string

  objectives:
    LessonObjectiveSelection[]

  userId: string

  organizationId?: string | null
  schoolId?: string | null
}

export type RemoveLessonObjectiveInput = {
  relationshipId: string
  userId: string
  reason: string
}

export type RemoveAllLessonObjectivesInput = {
  lessonId: string
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
    | AgendaLessonObjectiveRole
    | null
    | undefined,
): AgendaLessonObjectiveRole {
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
      'O papel do objetivo na aula é inválido.',
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
    AgendaLessonObjective,

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
    LessonObjectiveSelection[],
): LessonObjectiveSelection[] {
  const uniqueSelections =
    new Map<
      string,
      LessonObjectiveSelection
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
        'Um mesmo objetivo não pode ser vinculado mais de uma vez à aula.',
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
    LessonObjectiveSelection[],
): LessonObjectiveSelection[] {
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
      'Uma aula pode possuir apenas um objetivo principal.',
    )
  }

  return normalizedSelections
}

export class LessonObjectivesService {
  constructor(
    private readonly repository:
      LessonObjectivesRepository =
        new LessonObjectivesRepository(),
  ) {}

  async listByLesson(
    lessonId: string,
    userId: string,
  ): Promise<
    AgendaLessonObjective[]
  > {
    const normalizedLessonId =
      normalizeRequiredText(
        lessonId,
        'ID da aula',
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    return this.repository.findAll({
      lessonId:
        normalizedLessonId,

      userId:
        normalizedUserId,
    })
  }

  async listObjectivesByLesson(
    lessonId: string,
    userId: string,
  ): Promise<
    AgendaLessonObjectiveWithObjective[]
  > {
    const normalizedLessonId =
      normalizeRequiredText(
        lessonId,
        'ID da aula',
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    const relationships =
      await this.repository
        .findObjectivesByLessonId(
          normalizedLessonId,
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
    AgendaLessonObjective[]
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
    AgendaLessonObjective
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
        'Vínculo entre aula e objetivo não encontrado.',
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
      LinkLessonObjectiveInput,
  ): Promise<
    AgendaLessonObjective
  > {
    const lessonId =
      normalizeRequiredText(
        input.lessonId,
        'ID da aula',
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
            lessonId,

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
          'A aula já possui um objetivo principal.',
        )
      }
    }

    const repositoryInput:
      CreateAgendaLessonObjectiveInput = {
        lesson_id:
          lessonId,

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
      UpdateLessonObjectiveLinkInput,

    userId: string,
  ): Promise<
    AgendaLessonObjective
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
            lessonId:
              currentRelationship
                .lesson_id,

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
          'A aula já possui um objetivo principal.',
        )
      }
    }

    const repositoryInput:
      UpdateAgendaLessonObjectiveInput = {
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
      RemoveLessonObjectiveInput,
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

  async removeAllFromLesson(
    input:
      RemoveAllLessonObjectivesInput,
  ): Promise<void> {
    const lessonId =
      normalizeRequiredText(
        input.lessonId,
        'ID da aula',
      )

    const userId =
      normalizeRequiredText(
        input.userId,
        'ID do usuário',
      )

    const currentRelationships =
      await this.repository
        .findAll({
          lessonId,

          userId,
        })

    if (
      currentRelationships.length ===
      0
    ) {
      return
    }

    await this.repository
      .softDeleteByLessonId(
        lessonId,
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
      SynchronizeLessonObjectivesInput,
  ): Promise<
    AgendaLessonObjective[]
  > {
    const lessonId =
      normalizeRequiredText(
        input.lessonId,
        'ID da aula',
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
          lessonId,

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
                'Vínculo removido durante a sincronização dos objetivos da aula.',
            },
          )
      }
    }

    const synchronizedRelationships:
      AgendaLessonObjective[] = []

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
            lesson_id:
              lessonId,

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

export const lessonObjectivesService =
  new LessonObjectivesService()
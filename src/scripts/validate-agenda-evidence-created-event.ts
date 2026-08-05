import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  createAgendaEvidenceCreatedEvent,
} from '@/lib/agenda/events/agenda-evidence-created.event'

function assertCondition(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(
      `Falha na validação: ${message}`,
    )
  }
}

function createBaseEvidence(): AgendaEvidence {
  const now =
    new Date()
      .toISOString()

  return {
    id:
      'agenda-evidence-event-validation-001',

    title:
      'Participação em atividade investigativa',

    description:
      'O estudante apresentou hipótese, realizou registros e participou da discussão coletiva.',

    evidence_type:
      'texto',

    file_url:
      null,

    external_url:
      null,

    planning_id:
      'planning-validation-001',

    event_id:
      null,

    lesson_id:
      'lesson-validation-001',

    objective_id:
      'objective-validation-001',

    class_id:
      'class-validation-001',

    reflection_id:
      null,

    academic_period_id:
      'academic-period-validation-001',

    organization_id:
      'organization-validation-001',

    school_id:
      'school-validation-001',

    user_id:
      'teacher-validation-001',

    contains_identifiable_minor:
      false,

    guardian_authorization_confirmed:
      false,

    authorization_reference:
      null,

    authorization_confirmed_at:
      null,

    authorization_confirmed_by:
      null,

    privacy_notice_version:
      'edi-protecao-menores-v1.0',

    storage_bucket:
      null,

    storage_path:
      null,

    original_file_name:
      null,

    file_mime_type:
      null,

    file_size_bytes:
      null,

    metadata: {
      source:
        'validate-agenda-evidence-created-event',

      studentId:
        'student-validation-001',

      componentId:
        'physics',

      normalizedValue:
        90,
    },

    created_by:
      'teacher-validation-001',

    updated_by:
      'teacher-validation-001',

    deleted_at:
      null,

    deleted_by:
      null,

    deletion_reason:
      null,

    restored_at:
      null,

    restored_by:
      null,

    restore_reason:
      null,

    created_at:
      now,

    updated_at:
      now,
  }
}

function validateBaseEvent(): void {
  const evidence =
    createBaseEvidence()

  const event =
    createAgendaEvidenceCreatedEvent({
      evidence,

      options: {
        requestedBy:
          'teacher-validation-001',

        correlationId:
          'correlation-validation-001',

        causationId:
          null,

        parentEventId:
          null,

        traceId:
          'trace-validation-001',

        sourceEnvironment:
          'test',

        metadata: {
          validationScenario:
            'base-event',
        },
      },
    })

  assertCondition(
    event.name ===
      'evidence.created',
    'O nome do evento deve ser evidence.created.',
  )

  assertCondition(
    event.domain ===
      'evidence',
    'O domínio do evento deve ser evidence.',
  )

  assertCondition(
    event.action ===
      'created',
    'A ação do evento deve ser created.',
  )

  assertCondition(
    event.sourceProduct ===
      'agenda',
    'O produto de origem deve ser Agenda.',
  )

  assertCondition(
    event.sourceService ===
      'agenda-evidence-created-event',
    'O serviço de origem deve corresponder à fábrica.',
  )

  assertCondition(
    event.sourceEnvironment ===
      'test',
    'O ambiente deve ser preservado.',
  )

  assertCondition(
    event.status ===
      'pending',
    'O evento deve ser criado com status pending.',
  )

  assertCondition(
    event.priority ===
      'normal',
    'Uma evidência comum deve ter prioridade normal.',
  )

  assertCondition(
    event.actor.id ===
      'teacher-validation-001',
    'O ator deve ser preservado.',
  )

  assertCondition(
    event.actor.type ===
      'user',
    'O ator autenticado deve ser do tipo user.',
  )

  assertCondition(
    event.primaryEntity.entityType ===
      'evidence',
    'A entidade principal deve ser uma evidência.',
  )

  assertCondition(
    event.primaryEntity.entityId ===
      evidence.id,
    'O ID da entidade principal deve ser o ID da evidência.',
  )

  assertCondition(
    event.payload.agendaEvidenceId ===
      evidence.id,
    'O payload deve preservar o ID da evidência.',
  )

  assertCondition(
    event.payload.title ===
      evidence.title,
    'O payload deve preservar o título.',
  )

  assertCondition(
    event.payload.evidenceType ===
      evidence.evidence_type,
    'O payload deve preservar o tipo da evidência.',
  )

  assertCondition(
    event.payload.userId ===
      evidence.user_id,
    'O payload deve preservar o usuário associado.',
  )

  assertCondition(
    event.payload.metadata.source ===
      'validate-agenda-evidence-created-event',
    'Os metadados da evidência devem ser preservados.',
  )

  assertCondition(
    event.correlation.correlationId ===
      'correlation-validation-001',
    'O correlationId deve ser preservado.',
  )

  assertCondition(
    event.correlation.traceId ===
      'trace-validation-001',
    'O traceId deve ser preservado.',
  )

  assertCondition(
    event.metadata.validationScenario ===
      'base-event',
    'Os metadados adicionais do evento devem ser preservados.',
  )

  assertCondition(
    event.relatedEntities.some(
      reference =>
        reference.entityType ===
          'organization' &&
        reference.entityId ===
          evidence.organization_id,
    ),
    'A organização deve estar entre as entidades relacionadas.',
  )

  assertCondition(
    event.relatedEntities.some(
      reference =>
        reference.entityType ===
          'school' &&
        reference.entityId ===
          evidence.school_id,
    ),
    'A escola deve estar entre as entidades relacionadas.',
  )

  assertCondition(
    event.relatedEntities.some(
      reference =>
        reference.entityType ===
          'class' &&
        reference.entityId ===
          evidence.class_id,
    ),
    'A turma deve estar entre as entidades relacionadas.',
  )

  assertCondition(
    event.relatedEntities.some(
      reference =>
        reference.entityType ===
          'lesson' &&
        reference.entityId ===
          evidence.lesson_id,
    ),
    'A aula deve estar entre as entidades relacionadas.',
  )

  assertCondition(
    event.relatedEntities.some(
      reference =>
        reference.entityType ===
          'planning' &&
        reference.entityId ===
          evidence.planning_id,
    ),
    'O planejamento deve estar entre as entidades relacionadas.',
  )

  assertCondition(
    event.relatedEntities.some(
      reference =>
        reference.entityType ===
          'academic-period' &&
        reference.entityId ===
          evidence.academic_period_id,
    ),
    'O período acadêmico deve estar entre as entidades relacionadas.',
  )

  assertCondition(
    event.privacy.containsMinorData ===
      false,
    'A evidência comum não deve ser marcada como dado de menor.',
  )

  assertCondition(
    event.privacy.consentRequired ===
      false,
    'A evidência comum não deve exigir consentimento.',
  )

  assertCondition(
    event.retryPolicy.enabled,
    'A política de retry deve estar habilitada.',
  )

  assertCondition(
    event.retryPolicy.maximumAttempts ===
      3,
    'A política deve permitir três tentativas.',
  )

  assertCondition(
    event.auditTrail.length ===
      1,
    'O evento deve iniciar com uma entrada de auditoria.',
  )

  assertCondition(
    event.auditTrail[0]?.action ===
      'created',
    'A primeira auditoria deve registrar a criação.',
  )
}

function validateMinorProtectionEvent(): void {
  const now =
    new Date()
      .toISOString()

  const evidence = {
    ...createBaseEvidence(),

    id:
      'agenda-evidence-event-minor-001',

    contains_identifiable_minor:
      true,

    guardian_authorization_confirmed:
      true,

    authorization_reference:
      'authorization-validation-001',

    authorization_confirmed_at:
      now,

    authorization_confirmed_by:
      'teacher-validation-001',
  } satisfies AgendaEvidence

  const event =
    createAgendaEvidenceCreatedEvent({
      evidence,

      options: {
        sourceEnvironment:
          'test',

        metadata: {
          validationScenario:
            'minor-protection',
        },
      },
    })

  assertCondition(
    event.priority ===
      'high',
    'Evidências com menor identificável devem ter prioridade alta.',
  )

  assertCondition(
    event.privacy.containsPersonalData,
    'O evento deve indicar presença de dados pessoais.',
  )

  assertCondition(
    event.privacy.containsSensitiveData,
    'O evento deve indicar presença de dados sensíveis.',
  )

  assertCondition(
    event.privacy.containsMinorData,
    'O evento deve indicar presença de dados de menor.',
  )

  assertCondition(
    event.privacy.consentRequired,
    'O consentimento deve ser obrigatório.',
  )

  assertCondition(
    event.privacy.consentConfirmed,
    'O consentimento informado deve estar confirmado.',
  )

  assertCondition(
    event.privacy.legalBasis ===
      'authorization-validation-001',
    'A referência da autorização deve ser usada como base legal.',
  )

  assertCondition(
    event.privacy.metadata.authorizationConfirmedAt ===
      now,
    'A data da autorização deve ser preservada.',
  )

  assertCondition(
    event.privacy.metadata.authorizationConfirmedBy ===
      'teacher-validation-001',
    'O responsável pelo registro da autorização deve ser preservado.',
  )
}

function validateSystemActorFallback(): void {
  const evidence = {
    ...createBaseEvidence(),

    id:
      'agenda-evidence-event-system-001',

    user_id:
      null,

    created_by:
      null,

    updated_by:
      null,
  } satisfies AgendaEvidence

  const event =
    createAgendaEvidenceCreatedEvent({
      evidence,

      options: {
        sourceEnvironment:
          'test',

        metadata: {
          validationScenario:
            'system-actor',
        },
      },
    })

  assertCondition(
    event.actor.id ===
      null,
    'O ator deve permitir ID nulo.',
  )

  assertCondition(
    event.actor.type ===
      'system',
    'Na ausência de usuário, o ator deve ser system.',
  )

  assertCondition(
    event.payload.userId ===
      null,
    'O payload deve preservar userId nulo.',
  )
}

function validateExpirationAndContext(): void {
  const evidence =
    createBaseEvidence()

  const expiresAt =
    new Date(
      Date.now() +
      60_000,
    ).toISOString()

  const event =
    createAgendaEvidenceCreatedEvent({
      evidence,

      options: {
        sourceEnvironment:
          'test',

        expiresAt,

        correlationId:
          'correlation-expiration-001',

        causationId:
          'causation-expiration-001',

        parentEventId:
          'parent-expiration-001',

        traceId:
          'trace-expiration-001',
      },
    })

  assertCondition(
    event.expiresAt ===
      expiresAt,
    'A expiração deve ser preservada.',
  )

  assertCondition(
    event.correlation.correlationId ===
      'correlation-expiration-001',
    'O correlationId deve ser preservado.',
  )

  assertCondition(
    event.correlation.causationId ===
      'causation-expiration-001',
    'O causationId deve ser preservado.',
  )

  assertCondition(
    event.correlation.parentEventId ===
      'parent-expiration-001',
    'O parentEventId deve ser preservado.',
  )

  assertCondition(
    event.correlation.traceId ===
      'trace-expiration-001',
    'O traceId deve ser preservado.',
  )
}

function runValidation(): void {
  validateBaseEvent()
  validateMinorProtectionEvent()
  validateSystemActorFallback()
  validateExpirationAndContext()

  console.log(
    [
      '====================================',
      'Agenda Evidence Created Event',
      'VALIDAÇÃO CONCLUÍDA COM SUCESSO',
      '',
      'Cenários validados:',
      '- criação do evento;',
      '- payload e contexto pedagógico;',
      '- entidades relacionadas;',
      '- correlação e rastreabilidade;',
      '- LGPD e proteção de menores;',
      '- fallback para ator de sistema;',
      '- expiração e política de retry.',
      '====================================',
    ].join('\n'),
  )
}

runValidation()
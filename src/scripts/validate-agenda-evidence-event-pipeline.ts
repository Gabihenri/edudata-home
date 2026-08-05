import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  publishAgendaEvidenceCreatedEvent,
} from '@/lib/agenda/events/publish-agenda-evidence-created-event.service'

import {
  eiosEventBus,
} from '@/lib/eios/events/eios-event-bus.service'

import {
  EIOS_EVENT_HANDLER_REGISTRATION_KEYS,
  getEiosEventHandlerRegistrations,
  isEiosEventHandlerRegistered,
  registerEiosEventHandlers,
  unregisterEiosEventHandlers,
} from '@/lib/eios/events/register-eios-event-handlers.service'

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

function createPipelineEvidence():
  AgendaEvidence {
  const now =
    new Date()
      .toISOString()

  return {
    id:
      'agenda-evidence-pipeline-validation-001',

    title:
      'Investigação experimental sobre movimento',

    description:
      'O estudante formulou hipótese, realizou medições, organizou os dados e justificou sua conclusão com base nas evidências coletadas.',

    evidence_type:
      'texto',

    file_url:
      null,

    external_url:
      null,

    planning_id:
      'planning-pipeline-validation-001',

    event_id:
      null,

    lesson_id:
      'lesson-pipeline-validation-001',

    objective_id:
      'objective-pipeline-validation-001',

    class_id:
      'class-pipeline-validation-001',

    reflection_id:
      null,

    academic_period_id:
      'academic-period-pipeline-validation-001',

    organization_id:
      'organization-pipeline-validation-001',

    school_id:
      'school-pipeline-validation-001',

    user_id:
      'teacher-pipeline-validation-001',

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
        'validate-agenda-evidence-event-pipeline',

      studentId:
        'student-pipeline-validation-001',

      componentId:
        'physics',

      normalizedValue:
        91,

      academicYear:
        new Date()
          .getUTCFullYear(),

      timezone:
        'America/Sao_Paulo',

      validationScenario:
        'agenda-evidence-event-pipeline',
    },

    created_by:
      'teacher-pipeline-validation-001',

    updated_by:
      'teacher-pipeline-validation-001',

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

function prepareIsolatedEnvironment(): void {
  /*
   * Este script roda em um processo isolado.
   *
   * A limpeza inicial evita que uma execução anterior,
   * realizada no mesmo processo, interfira na validação.
   */
  unregisterEiosEventHandlers()
  eiosEventBus.clearEvents()
}

function validateInitialState(): void {
  const registrationKey =
    EIOS_EVENT_HANDLER_REGISTRATION_KEYS
      .agendaEvidenceCreated

  const registered =
    isEiosEventHandlerRegistered({
      registrationKey,
    })

  assertCondition(
    !registered,
    'O handler não deveria estar registrado antes da preparação do pipeline.',
  )

  const registrations =
    getEiosEventHandlerRegistrations()

  assertCondition(
    registrations.length ===
      0,
    'Não deveria existir registro do handler no estado inicial.',
  )
}

function validateFirstRegistration(): string {
  const result =
    registerEiosEventHandlers()

  assertCondition(
    result.success,
    'O registro inicial dos handlers deveria ser concluído.',
  )

  assertCondition(
    result.provisional,
    'O registro deve informar que a infraestrutura ainda é provisória.',
  )

  assertCondition(
    result.storageMode ===
      'in-memory',
    'O registro deve informar armazenamento em memória.',
  )

  assertCondition(
    result.registrations.length ===
      1,
    'Deveria existir exatamente um handler registrado.',
  )

  assertCondition(
    result.registeredCount ===
      1,
    'O primeiro registro deveria contabilizar um novo handler.',
  )

  assertCondition(
    result.alreadyRegisteredCount ===
      0,
    'O primeiro registro não deveria encontrar handler já registrado.',
  )

  assertCondition(
    result.reactivatedCount ===
      0,
    'O primeiro registro não deveria reativar handler.',
  )

  const registration =
    result.registrations[0]

  assertCondition(
    registration !==
      undefined,
    'O resultado deveria conter o registro criado.',
  )

  assertCondition(
    registration.status ===
      'registered',
    'O primeiro registro deveria possuir status registered.',
  )

  assertCondition(
    registration.eventName ===
      'evidence.created',
    'O handler deve estar associado ao evento evidence.created.',
  )

  assertCondition(
    registration.sourceProduct ===
      'agenda',
    'O handler deve estar restrito ao produto Agenda.',
  )

  assertCondition(
    registration.active,
    'A assinatura criada deve estar ativa.',
  )

  assertCondition(
    Boolean(
      registration.subscriptionId,
    ),
    'A assinatura deve possuir identificador.',
  )

  return registration.subscriptionId
}

function validateIdempotentRegistration(
  expectedSubscriptionId: string,
): void {
  const result =
    registerEiosEventHandlers()

  assertCondition(
    result.success,
    'O segundo registro deveria ser concluído sem erro.',
  )

  assertCondition(
    result.registeredCount ===
      0,
    'O segundo registro não deveria criar outra assinatura.',
  )

  assertCondition(
    result.alreadyRegisteredCount ===
      1,
    'O segundo registro deveria reconhecer a assinatura existente.',
  )

  assertCondition(
    result.reactivatedCount ===
      0,
    'O segundo registro não deveria reativar assinatura ativa.',
  )

  assertCondition(
    result.registrations.length ===
      1,
    'O registro idempotente deve retornar uma única assinatura.',
  )

  const registration =
    result.registrations[0]

  assertCondition(
    registration !==
      undefined,
    'O registro idempotente deveria retornar a assinatura.',
  )

  assertCondition(
    registration.status ===
      'already_registered',
    'A segunda execução deve retornar already_registered.',
  )

  assertCondition(
    registration.subscriptionId ===
      expectedSubscriptionId,
    'O registro idempotente deve preservar o mesmo ID da assinatura.',
  )

  const matchingSubscriptions =
    eiosEventBus
      .listSubscriptions()
      .filter(
        subscription =>
          subscription
            .metadata
            .registrationKey ===
          EIOS_EVENT_HANDLER_REGISTRATION_KEYS
            .agendaEvidenceCreated,
      )

  assertCondition(
    matchingSubscriptions.length ===
      1,
    'O registro idempotente não pode criar assinaturas duplicadas.',
  )
}

async function validateCompletePipeline():
  Promise<string> {
  const evidence =
    createPipelineEvidence()

  const publication =
    await publishAgendaEvidenceCreatedEvent({
      evidence,

      options: {
        requestedBy:
          evidence.user_id,

        sourceEnvironment:
          'test',

        correlationId:
          'correlation-pipeline-validation-001',

        traceId:
          'trace-pipeline-validation-001',

        stopOnHandlerError:
          true,

        storeEvent:
          true,

        metadata: {
          validationScript:
            'validate-agenda-evidence-event-pipeline',

          validationScenario:
            'complete-pipeline',
        },
      },
    })

  assertCondition(
    publication.success,
    `O pipeline deveria ser concluído com sucesso: ${publication.processing.errors.join(' | ')}`,
  )

  assertCondition(
    publication.processing.success,
    'O Event Bus deveria informar processamento bem-sucedido.',
  )

  assertCondition(
    publication.processing.status ===
      'processed',
    'O evento deveria terminar com status processed.',
  )

  assertCondition(
    publication.processing.errors.length ===
      0,
    'O pipeline não deveria registrar erros.',
  )

  assertCondition(
    !publication.processing.warnings.some(
      warning =>
        warning.includes(
          'Nenhum assinante',
        ),
    ),
    'O Event Bus deveria localizar o handler registrado.',
  )

  assertCondition(
    publication.event.name ===
      'evidence.created',
    'O publisher deveria criar o evento evidence.created.',
  )

  assertCondition(
    publication.event.sourceProduct ===
      'agenda',
    'O evento deveria possuir Agenda como produto de origem.',
  )

  assertCondition(
    publication.event.payload
      .agendaEvidenceId ===
      evidence.id,
    'O evento deve preservar o identificador da evidência.',
  )

  assertCondition(
    publication.event.correlation
      .correlationId ===
      'correlation-pipeline-validation-001',
    'O pipeline deve preservar o correlationId.',
  )

  assertCondition(
    publication.event.correlation
      .traceId ===
      'trace-pipeline-validation-001',
    'O pipeline deve preservar o traceId.',
  )

  const processedEvent =
    publication.processing
      .event

  assertCondition(
    processedEvent.status ===
      'processed',
    'O evento retornado pelo barramento deve estar processado.',
  )

  assertCondition(
    processedEvent.publishedAt !==
      null,
    'O Event Bus deve registrar a data de publicação.',
  )

  assertCondition(
    processedEvent.processingStartedAt !==
      null,
    'O Event Bus deve registrar o início do processamento.',
  )

  assertCondition(
    processedEvent.processedAt !==
      null,
    'O Event Bus deve registrar o fim do processamento.',
  )

  assertCondition(
    processedEvent.auditTrail.some(
      entry =>
        entry.action ===
        'processing-started',
    ),
    'A auditoria deve registrar o início do processamento.',
  )

  assertCondition(
    processedEvent.auditTrail.some(
      entry =>
        entry.action ===
        'processed',
    ),
    'A auditoria deve registrar o processamento concluído.',
  )

  const processedAuditEntry =
    processedEvent.auditTrail.find(
      entry =>
        entry.action ===
        'processed',
    )

  assertCondition(
    processedAuditEntry !==
      undefined,
    'A auditoria final do evento deveria existir.',
  )

  assertCondition(
    processedAuditEntry
      ?.metadata
      .subscriptionCount ===
      1,
    'O evento deveria ser processado por exatamente uma assinatura.',
  )

  const storedEvent =
    eiosEventBus.getEvent(
      publication.event.id,
    )

  assertCondition(
    storedEvent !==
      null,
    'O evento processado deveria estar armazenado no barramento.',
  )

  assertCondition(
    storedEvent?.status ===
      'processed',
    'O evento armazenado deveria possuir status processed.',
  )

  assertCondition(
    storedEvent?.primaryEntity
      .entityId ===
      evidence.id,
    'O evento armazenado deve preservar a entidade principal.',
  )

  const statistics =
    eiosEventBus.getStatistics()

  assertCondition(
    statistics.storedEvents ===
      1,
    'O barramento deveria possuir um evento armazenado.',
  )

  assertCondition(
    statistics.processedEvents ===
      1,
    'O barramento deveria contabilizar um evento processado.',
  )

  assertCondition(
    statistics.failedEvents ===
      0,
    'O barramento não deveria contabilizar falhas.',
  )

  assertCondition(
    statistics.activeSubscriptions ===
      1,
    'Deveria existir uma assinatura ativa durante o pipeline.',
  )

  return publication.event.id
}

function validateUnregistration(
  processedEventId: string,
): void {
  const result =
    unregisterEiosEventHandlers()

  assertCondition(
    result.success,
    'A remoção do handler deveria ser concluída.',
  )

  assertCondition(
    result.removedCount ===
      1,
    'Deveria ser removida exatamente uma assinatura.',
  )

  assertCondition(
    result.removedSubscriptionIds.length ===
      1,
    'O resultado deve informar o ID da assinatura removida.',
  )

  const registrationKey =
    EIOS_EVENT_HANDLER_REGISTRATION_KEYS
      .agendaEvidenceCreated

  assertCondition(
    !isEiosEventHandlerRegistered({
      registrationKey,
    }),
    'O handler não deveria permanecer registrado.',
  )

  assertCondition(
    getEiosEventHandlerRegistrations()
      .length ===
      0,
    'Não deveria permanecer registro do handler após a limpeza.',
  )

  const storedEvent =
    eiosEventBus.getEvent(
      processedEventId,
    )

  assertCondition(
    storedEvent !==
      null,
    'A remoção do handler não deve apagar o evento processado.',
  )

  assertCondition(
    storedEvent?.status ===
      'processed',
    'O evento deve continuar disponível com status processed.',
  )

  const statistics =
    eiosEventBus.getStatistics()

  assertCondition(
    statistics.subscriptions ===
      0,
    'O barramento não deveria manter assinaturas após a limpeza.',
  )

  assertCondition(
    statistics.activeSubscriptions ===
      0,
    'O barramento não deveria manter assinaturas ativas.',
  )
}

function finalizeIsolatedEnvironment(): void {
  unregisterEiosEventHandlers()
  eiosEventBus.clearEvents()
}

async function runValidation():
  Promise<void> {
  prepareIsolatedEnvironment()

  try {
    validateInitialState()

    const subscriptionId =
      validateFirstRegistration()

    validateIdempotentRegistration(
      subscriptionId,
    )

    const processedEventId =
      await validateCompletePipeline()

    validateUnregistration(
      processedEventId,
    )

    console.log(
      [
        '=============================================',
        'AGENDA EVIDENCE EVENT PIPELINE',
        'VALIDAÇÃO PONTA A PONTA CONCLUÍDA COM SUCESSO',
        '',
        'Fluxo validado:',
        '- registro idempotente do handler;',
        '- criação da AgendaEvidence;',
        '- criação do evento evidence.created;',
        '- publicação no Event Bus;',
        '- localização da assinatura;',
        '- execução do handler;',
        '- processamento pelo Evidence Intelligence;',
        '- auditoria do evento;',
        '- armazenamento temporário;',
        '- estatísticas do barramento;',
        '- remoção segura da assinatura.',
        '',
        'Observação:',
        '- infraestrutura provisória em memória;',
        '- não comprova persistência serverless;',
        '- não substitui Outbox ou fila durável.',
        '=============================================',
      ].join('\n'),
    )
  } finally {
    finalizeIsolatedEnvironment()
  }
}

runValidation().catch(
  error => {
    console.error(
      'VALIDAÇÃO DO PIPELINE DE EVIDÊNCIAS FALHOU',
      error,
    )

    process.exitCode =
      1
  },
)
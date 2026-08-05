import {
  createEiosEvent,
  type EiosEvent,
} from '@/lib/eios/events/eios-event.contract'

import {
  EiosEventBusService,
} from '@/lib/eios/events/eios-event-bus.service'

type Counter = {
  value: number
}

function assertCondition(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `Falha na validação: ${message}`,
    )
  }
}

function createCounter(): Counter {
  return {
    value: 0,
  }
}

function incrementCounter(
  counter: Counter,
): void {
  counter.value += 1
}

function createEvidenceCreatedEvent({
  id,
  expiresAt = null,
}: {
  id: string
  expiresAt?: string | null
}): EiosEvent {
  return createEiosEvent({
    id,

    name:
      'evidence.created',

    domain:
      'evidence',

    action:
      'created',

    sourceProduct:
      'agenda',

    sourceService:
      'validate-eios-event-bus',

    sourceEnvironment:
      'test',

    actor: {
      id:
        'teacher-validation-001',

      type:
        'user',

      product:
        'agenda',

      organizationId:
        'organization-validation-001',

      schoolId:
        'school-validation-001',

      metadata: {
        role:
          'teacher',
      },
    },

    primaryEntity: {
      entityType:
        'evidence',

      entityId:
        'evidence-validation-001',

      role:
        'primary',

      metadata: {
        evidenceType:
          'texto',
      },
    },

    relatedEntities: [
      {
        entityType:
          'class',

        entityId:
          'class-validation-001',

        role:
          'context',

        metadata: {},
      },
    ],

    payload: {
      agendaEvidenceId:
        'evidence-validation-001',

      title:
        'Participação em atividade experimental',

      evidenceType:
        'texto',

      containsIdentifiableMinor:
        false,
    },

    privacy: {
      containsPersonalData:
        true,

      containsSensitiveData:
        false,

      containsMinorData:
        false,

      anonymized:
        false,

      pseudonymized:
        false,

      consentRequired:
        false,

      consentConfirmed:
        false,

      legalBasis:
        'execução de atividade educacional',

      accessRoles: [
        'teacher',
        'coordinator',
      ],

      metadata: {},
    },

    retryPolicy: {
      enabled:
        true,

      maximumAttempts:
        3,

      attempt:
        0,

      retryAfter:
        null,

      lastError:
        null,

      metadata: {},
    },

    expiresAt,

    metadata: {
      validationScenario:
        'event-bus',
    },
  })
}

async function validateSuccessfulPublish():
  Promise<void> {
  const eventBus =
    new EiosEventBusService()

  const handledEvents:
    string[] = []

  const subscription =
    eventBus.subscribe({
      filter: {
        eventName:
          'evidence.created',

        sourceProduct:
          'agenda',
      },

      handler:
        event => {
          handledEvents.push(
            event.id,
          )
        },

      metadata: {
        validation:
          'successful-publish',
      },
    })

  const event =
    createEvidenceCreatedEvent({
      id:
        'event-success-001',
    })

  const result =
    await eventBus.publish(
      event,
    )

  assertCondition(
    result.success,
    'A publicação deveria ser concluída com sucesso.',
  )

  assertCondition(
    result.status ===
      'processed',
    'O evento deveria terminar com status processed.',
  )

  assertCondition(
    result.event.status ===
      'processed',
    'O evento retornado deveria estar processado.',
  )

  assertCondition(
    handledEvents.includes(
      event.id,
    ),
    'O assinante deveria receber o evento publicado.',
  )

  assertCondition(
    result.errors.length ===
      0,
    'A publicação bem-sucedida não deveria registrar erros.',
  )

  assertCondition(
    result.event.publishedAt !==
      null,
    'A data de publicação deveria ser registrada.',
  )

  assertCondition(
    result.event.processingStartedAt !==
      null,
    'A data de início do processamento deveria ser registrada.',
  )

  assertCondition(
    result.event.processedAt !==
      null,
    'A data final do processamento deveria ser registrada.',
  )

  const storedEvent =
    eventBus.getEvent(
      event.id,
    )

  assertCondition(
    storedEvent !==
      null,
    'O evento deveria estar armazenado no barramento.',
  )

  assertCondition(
    storedEvent.status ===
      'processed',
    'O evento armazenado deveria estar processado.',
  )

  const subscriptions =
    eventBus.listSubscriptions()

  assertCondition(
    subscriptions.length ===
      1,
    'Deveria existir uma assinatura registrada.',
  )

  assertCondition(
    subscriptions[0]?.id ===
      subscription.id,
    'A assinatura registrada deveria ser preservada.',
  )
}

async function validateTopicAndDomainFilters():
  Promise<void> {
  const eventBus =
    new EiosEventBusService()

  const topicExecutions =
    createCounter()

  const domainExecutions =
    createCounter()

  const unrelatedExecutions =
    createCounter()

  eventBus.subscribe({
    filter: {
      topic:
        'eios.evidence.created',
    },

    handler:
      () => {
        incrementCounter(
          topicExecutions,
        )
      },
  })

  eventBus.subscribe({
    filter: {
      domain:
        'evidence',
    },

    handler:
      () => {
        incrementCounter(
          domainExecutions,
        )
      },
  })

  eventBus.subscribe({
    filter: {
      domain:
        'decision',
    },

    handler:
      () => {
        incrementCounter(
          unrelatedExecutions,
        )
      },
  })

  await eventBus.publish(
    createEvidenceCreatedEvent({
      id:
        'event-filter-001',
    }),
  )

  assertCondition(
    topicExecutions.value ===
      1,
    'O filtro por tópico deveria executar uma vez.',
  )

  assertCondition(
    domainExecutions.value ===
      1,
    'O filtro por domínio deveria executar uma vez.',
  )

  assertCondition(
    unrelatedExecutions.value ===
      0,
    'O assinante de outro domínio não deveria ser executado.',
  )
}

async function validateHandlerFailure():
  Promise<void> {
  const eventBus =
    new EiosEventBusService()

  eventBus.subscribe({
    filter: {
      eventName:
        'evidence.created',
    },

    handler:
      () => {
        throw new Error(
          'Falha controlada do assinante.',
        )
      },
  })

  const event =
    createEvidenceCreatedEvent({
      id:
        'event-failure-001',
    })

  const result =
    await eventBus.publish(
      event,
    )

  assertCondition(
    !result.success,
    'A publicação deveria falhar quando o assinante lança erro.',
  )

  assertCondition(
    result.status ===
      'failed',
    'O evento deveria terminar com status failed.',
  )

  assertCondition(
    result.errors.length ===
      1,
    'A falha deveria registrar um erro.',
  )

  assertCondition(
    result.errors[0]?.includes(
      'Falha controlada do assinante.',
    ) ===
      true,
    'A mensagem da falha deveria ser preservada.',
  )

  assertCondition(
    result.event.retryPolicy.attempt ===
      1,
    'A primeira falha deveria incrementar a tentativa para 1.',
  )

  assertCondition(
    result.event.retryPolicy.lastError !==
      null,
    'A última falha deveria ser registrada na política de retry.',
  )
}

async function validateRetry():
  Promise<void> {
  const eventBus =
    new EiosEventBusService()

  const executionCounter =
    createCounter()

  const executionControl = {
    shouldFail:
      true,
  }

  eventBus.subscribe({
    filter: {
      eventName:
        'evidence.created',
    },

    handler:
      () => {
        incrementCounter(
          executionCounter,
        )

        if (
          executionControl
            .shouldFail
        ) {
          throw new Error(
            'Falha temporária.',
          )
        }
      },
  })

  const event =
    createEvidenceCreatedEvent({
      id:
        'event-retry-001',
    })

  const firstResult =
    await eventBus.publish(
      event,
    )

  assertCondition(
    !firstResult.success,
    'A primeira tentativa deveria falhar.',
  )

  assertCondition(
    firstResult.event.retryPolicy.attempt ===
      1,
    'A primeira tentativa deveria registrar attempt 1.',
  )

  executionControl.shouldFail =
    false

  const retryResult =
    await eventBus.retry(
      event.id,
    )

  assertCondition(
    retryResult.success,
    'A repetição deveria ser concluída com sucesso.',
  )

  assertCondition(
    retryResult.status ===
      'processed',
    'O evento repetido deveria terminar processado.',
  )

  assertCondition(
    retryResult.event.retryPolicy.attempt ===
      1,
    'A tentativa acumulada deveria permanecer registrada após o sucesso.',
  )

  assertCondition(
    executionCounter.value ===
      2,
    'O assinante deveria ser executado em duas tentativas.',
  )

  assertCondition(
    retryResult.event.auditTrail.some(
      entry =>
        entry.action ===
        'retried',
    ),
    'A auditoria deveria registrar a repetição.',
  )
}

async function validateExpiredEvent():
  Promise<void> {
  const eventBus =
    new EiosEventBusService()

  const executionCounter =
    createCounter()

  eventBus.subscribe({
    filter: {
      eventName:
        'evidence.created',
    },

    handler:
      () => {
        incrementCounter(
          executionCounter,
        )
      },
  })

  const expiredDate =
    new Date(
      Date.now() -
      60_000,
    ).toISOString()

  const event =
    createEvidenceCreatedEvent({
      id:
        'event-expired-001',

      expiresAt:
        expiredDate,
    })

  const result =
    await eventBus.publish(
      event,
    )

  assertCondition(
    result.success,
    'Evento expirado deveria ser ignorado sem falha técnica.',
  )

  assertCondition(
    result.status ===
      'ignored',
    'Evento expirado deveria terminar como ignored.',
  )

  assertCondition(
    executionCounter.value ===
      0,
    'O assinante não deveria receber evento expirado.',
  )

  assertCondition(
    result.warnings.length >
      0,
    'Evento expirado deveria gerar advertência.',
  )
}

async function validateSubscriptionLifecycle():
  Promise<void> {
  const eventBus =
    new EiosEventBusService()

  /*
   * O contador é mantido dentro de um objeto.
   * Isso impede que o TypeScript estreite seu valor
   * permanentemente para o literal 0 após a primeira asserção.
   */
  const executionCounter =
    createCounter()

  const subscription =
    eventBus.subscribe({
      handler:
        () => {
          incrementCounter(
            executionCounter,
          )
        },
    })

  const deactivated =
    eventBus.deactivateSubscription(
      subscription.id,
    )

  assertCondition(
    deactivated,
    'A assinatura deveria ser desativada.',
  )

  await eventBus.publish(
    createEvidenceCreatedEvent({
      id:
        'event-subscription-disabled-001',
    }),
  )

  assertCondition(
    executionCounter.value ===
      0,
    'A assinatura desativada não deveria executar.',
  )

  const activated =
    eventBus.activateSubscription(
      subscription.id,
    )

  assertCondition(
    activated,
    'A assinatura deveria ser reativada.',
  )

  await eventBus.publish(
    createEvidenceCreatedEvent({
      id:
        'event-subscription-enabled-001',
    }),
  )

  assertCondition(
    executionCounter.value ===
      1,
    'A assinatura reativada deveria executar.',
  )

  const removed =
    eventBus.unsubscribe(
      subscription.id,
    )

  assertCondition(
    removed,
    'A assinatura deveria ser removida.',
  )

  assertCondition(
    eventBus
      .listSubscriptions()
      .length ===
      0,
    'Nenhuma assinatura deveria permanecer registrada.',
  )
}

async function validateStatisticsAndReset():
  Promise<void> {
  const eventBus =
    new EiosEventBusService()

  eventBus.subscribe({
    handler:
      () => undefined,
  })

  await eventBus.publish(
    createEvidenceCreatedEvent({
      id:
        'event-statistics-processed-001',
    }),
  )

  await eventBus.publish(
    createEvidenceCreatedEvent({
      id:
        'event-statistics-expired-001',

      expiresAt:
        new Date(
          Date.now() -
          60_000,
        ).toISOString(),
    }),
  )

  const statistics =
    eventBus.getStatistics()

  assertCondition(
    statistics.storedEvents ===
      2,
    'Deveriam existir dois eventos armazenados.',
  )

  assertCondition(
    statistics.subscriptions ===
      1,
    'Deveria existir uma assinatura.',
  )

  assertCondition(
    statistics.activeSubscriptions ===
      1,
    'A assinatura deveria estar ativa.',
  )

  assertCondition(
    statistics.processedEvents ===
      1,
    'Deveria existir um evento processado.',
  )

  assertCondition(
    statistics.ignoredEvents ===
      1,
    'Deveria existir um evento ignorado.',
  )

  eventBus.reset()

  const resetStatistics =
    eventBus.getStatistics()

  assertCondition(
    resetStatistics.storedEvents ===
      0,
    'O reset deveria remover todos os eventos.',
  )

  assertCondition(
    resetStatistics.subscriptions ===
      0,
    'O reset deveria remover todas as assinaturas.',
  )
}

async function runValidation():
  Promise<void> {
  await validateSuccessfulPublish()
  await validateTopicAndDomainFilters()
  await validateHandlerFailure()
  await validateRetry()
  await validateExpiredEvent()
  await validateSubscriptionLifecycle()
  await validateStatisticsAndReset()

  console.log(
    [
      '====================================',
      'EIOS Event Bus',
      'VALIDAÇÃO CONCLUÍDA COM SUCESSO',
      '',
      'Cenários validados:',
      '- publicação e armazenamento;',
      '- filtros por nome, domínio e tópico;',
      '- falha de assinante;',
      '- retry;',
      '- expiração;',
      '- ativação e remoção de assinaturas;',
      '- estatísticas;',
      '- reset do barramento.',
      '====================================',
    ].join('\n'),
  )
}

runValidation().catch(
  error => {
    console.error(
      'VALIDAÇÃO DO EIOS EVENT BUS FALHOU',
      error,
    )

    process.exitCode =
      1
  },
)
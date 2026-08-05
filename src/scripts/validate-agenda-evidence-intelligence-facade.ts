import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  executeAgendaEvidenceIntelligence,
} from '@/lib/agenda/services/agenda-evidence-intelligence.facade'

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

function createAgendaEvidence(): AgendaEvidence {
  const now =
    new Date()
      .toISOString()

  return {
    id:
      'facade-validation-evidence-001',

    title:
      'Participação em atividade experimental',

    description:
      'O estudante participou da investigação, registrou hipóteses e apresentou conclusão coerente.',

    evidence_type:
      'texto',

    file_url:
      null,

    external_url:
      null,

    planning_id:
      'facade-validation-planning-001',

    event_id:
      null,

    lesson_id:
      'facade-validation-lesson-001',

    objective_id:
      'facade-validation-objective-001',

    class_id:
      'facade-validation-class-001',

    reflection_id:
      null,

    academic_period_id:
      'facade-validation-period-001',

    organization_id:
      'facade-validation-organization-001',

    school_id:
      'facade-validation-school-001',

    user_id:
      'facade-validation-teacher-001',

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
      studentId:
        'facade-validation-student-001',

      componentId:
        'physics',

      normalizedValue:
        88,

      academicYear:
        new Date()
          .getUTCFullYear(),

      timezone:
        'America/Sao_Paulo',

      source:
        'facade-validation-script',
    },

    created_by:
      'facade-validation-teacher-001',

    updated_by:
      'facade-validation-teacher-001',

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

function validateFacadeExecution(): void {
  const evidence =
    createAgendaEvidence()

  const result =
    executeAgendaEvidenceIntelligence({
      evidence,

      requestedBy:
        evidence.user_id,

      source:
        'validate-agenda-evidence-intelligence-facade',

      options: {
        adapterOptions: {
          studentId:
            'facade-validation-student-001',

          componentId:
            'physics',

          timezone:
            'America/Sao_Paulo',

          additionalMetadata: {
            validationScenario:
              'facade-success',
          },
        },

        processingOptions: {
          validate:
            true,

          classifyFramework:
            true,

          evaluateQuality:
            true,

          evaluateReliability:
            true,

          detectContradictions:
            false,

          consolidate:
            false,

          linkKnowledgeGraph:
            false,

          allowAutomaticValidation:
            false,

          allowAutomaticClassification:
            true,

          requireHumanReviewForSensitiveData:
            true,

          minimumConfidenceForAutomaticValidation:
            0.9,

          metadata: {
            validationScript:
              true,
          },
        },
      },
    })

  assertCondition(
    result.context
      .agendaEvidenceId ===
      evidence.id,
    'A façade deve preservar o identificador da evidência.',
  )

  assertCondition(
    result.context
      .requestedBy ===
      evidence.user_id,
    'A façade deve preservar o usuário solicitante.',
  )

  assertCondition(
    result.context.source ===
      'validate-agenda-evidence-intelligence-facade',
    'A origem da execução deve ser preservada.',
  )

  assertCondition(
    Boolean(
      result.context
        .startedAt,
    ),
    'A data inicial deve ser registrada.',
  )

  assertCondition(
    Boolean(
      result.context
        .completedAt,
    ),
    'A data final deve ser registrada.',
  )

  assertCondition(
    result.processing
      .agendaEvidenceId ===
      evidence.id,
    'O resultado interno deve preservar o identificador da evidência.',
  )

  assertCondition(
    result.processing
      .evidence !==
      null,
    'A evidência educacional deve ser gerada.',
  )

  assertCondition(
    result.processing
      .validation !==
      null,
    'A validação do Evidence Intelligence deve existir.',
  )

  assertCondition(
    result.processing
      .errors.length ===
      0,
    `Não deveria haver erros: ${result.processing.errors.join(', ')}`,
  )

  assertCondition(
    result.processing.status ===
      'completed' ||
    result.processing.status ===
      'requires_human_review',
    'O status final da façade é inválido.',
  )

  assertCondition(
    result.success ===
      result.processing.success,
    'O sucesso da façade deve refletir o sucesso do processamento.',
  )

  assertCondition(
    result.processing
      .evidence
      ?.metadata
      .validationScenario ===
      'facade-success',
    'Os metadados adicionais devem chegar à evidência educacional.',
  )
}

function validateFallbackBehavior(): void {
  const invalidEvidence = {
    ...createAgendaEvidence(),

    id:
      '',

    title:
      '',
  } satisfies AgendaEvidence

  const result =
    executeAgendaEvidenceIntelligence({
      evidence:
        invalidEvidence,

      source:
        'validate-facade-fallback',
    })

  assertCondition(
    !result.success,
    'A façade deve retornar falha para evidência inválida.',
  )

  assertCondition(
    result.processing.status ===
      'failed',
    'O status deve ser failed.',
  )

  assertCondition(
    result.processing
      .requiresHumanReview,
    'Uma falha deve exigir revisão humana.',
  )

  assertCondition(
    result.processing
      .errors.length >
      0,
    'A falha deve registrar ao menos um erro.',
  )
}

function runValidation(): void {
  validateFacadeExecution()
  validateFallbackBehavior()

  console.log(
    [
      '====================================',
      'Agenda Evidence Intelligence Facade',
      'VALIDAÇÃO CONCLUÍDA COM SUCESSO',
      '',
      'Cenários:',
      '- execução completa;',
      '- preservação do contexto;',
      '- integração com o serviço;',
      '- tratamento de evidência inválida.',
      '====================================',
    ].join('\n'),
  )
}

runValidation()
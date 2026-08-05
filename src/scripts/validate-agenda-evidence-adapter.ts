import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  adaptAgendaEvidenceToEducationalEvidence,
} from '@/lib/eios/evidence-intelligence/adapters/agenda-evidence.adapter'

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

function createBaseAgendaEvidence(): AgendaEvidence {
  const now =
    new Date()
      .toISOString()

  return {
    id:
      'evidence-validation-001',

    title:
      'Participação durante atividade investigativa',

    description:
      'O estudante apresentou hipótese, participou da discussão e registrou a conclusão da atividade.',

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
        'adapter-validation-script',

      academicYear:
        new Date()
          .getUTCFullYear(),

      componentId:
        'physics',

      studentId:
        'student-validation-001',

      normalizedValue:
        80,

      timezone:
        'America/Sao_Paulo',
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

function validateSuccessfulAdaptation(): void {
  const agendaEvidence =
    createBaseAgendaEvidence()

  const result =
    adaptAgendaEvidenceToEducationalEvidence({
      evidence:
        agendaEvidence,

      options: {
        teacherId:
          agendaEvidence.user_id,

        studentId:
          'student-validation-001',

        componentId:
          'physics',

        timezone:
          'America/Sao_Paulo',

        additionalMetadata: {
          validationScenario:
            'successful-adaptation',
        },
      },
    })

  assertCondition(
    result.success,
    'A adaptação deveria ser concluída com sucesso.',
  )

  assertCondition(
    result.evidence !==
      null,
    'A evidência educacional deveria ter sido criada.',
  )

  const educationalEvidence =
    result.evidence

  assertCondition(
    educationalEvidence.id ===
      agendaEvidence.id,
    'O identificador original deve ser preservado.',
  )

  assertCondition(
    educationalEvidence.sourceType ===
      'agenda',
    'A origem deve ser definida como Agenda.',
  )

  assertCondition(
    educationalEvidence.type ===
      'observation',
    'Evidência textual deve ser convertida para observation.',
  )

  assertCondition(
    educationalEvidence.classId ===
      agendaEvidence.class_id,
    'O vínculo com a turma deve ser preservado.',
  )

  assertCondition(
    educationalEvidence.lessonId ===
      agendaEvidence.lesson_id,
    'O vínculo com a aula deve ser preservado.',
  )

  assertCondition(
    educationalEvidence.planningId ===
      agendaEvidence.planning_id,
    'O vínculo com o planejamento deve ser preservado.',
  )

  assertCondition(
    educationalEvidence.studentId ===
      'student-validation-001',
    'O estudante deve ser associado à evidência.',
  )

  assertCondition(
    educationalEvidence.teacherId ===
      'teacher-validation-001',
    'O professor deve ser associado à evidência.',
  )

  assertCondition(
    educationalEvidence
      .curriculumReferences
      .some(
        reference =>
          reference.learningObjectiveId ===
          agendaEvidence.objective_id,
      ),
    'O objetivo de aprendizagem deve gerar uma referência curricular.',
  )

  assertCondition(
    educationalEvidence
      .subjects
      .some(
        subject =>
          subject.subjectType ===
            'student' &&
          subject.subjectId ===
            'student-validation-001',
      ),
    'O estudante deve estar presente na lista de sujeitos.',
  )

  assertCondition(
    educationalEvidence
      .subjects
      .some(
        subject =>
          subject.subjectType ===
            'class' &&
          subject.subjectId ===
            agendaEvidence.class_id,
      ),
    'A turma deve estar presente na lista de sujeitos.',
  )

  assertCondition(
    educationalEvidence
      .privacy
      .containsMinorData ===
      false,
    'A evidência não deveria conter dados de menor identificável.',
  )

  assertCondition(
    educationalEvidence
      .privacy
      .visibility ===
      'private',
    'A visibilidade padrão deve ser privada.',
  )

  assertCondition(
    educationalEvidence
      .normalizedValue ===
      80,
    'O valor normalizado dos metadados deve ser preservado.',
  )

  assertCondition(
    educationalEvidence
      .metadata
      .validationScenario ===
      'successful-adaptation',
    'Metadados adicionais devem ser preservados.',
  )
}

function validateMinorProtection(): void {
  const agendaEvidence = {
    ...createBaseAgendaEvidence(),

    id:
      'evidence-validation-minor-001',

    contains_identifiable_minor:
      true,

    guardian_authorization_confirmed:
      true,

    authorization_reference:
      'authorization-validation-001',

    authorization_confirmed_at:
      new Date()
        .toISOString(),

    authorization_confirmed_by:
      'teacher-validation-001',
  } satisfies AgendaEvidence

  const result =
    adaptAgendaEvidenceToEducationalEvidence({
      evidence:
        agendaEvidence,
    })

  assertCondition(
    result.success,
    'A evidência com autorização válida deveria ser adaptada.',
  )

  assertCondition(
    result.evidence !==
      null,
    'A evidência protegida deveria ser criada.',
  )

  assertCondition(
    result.evidence
      .privacy
      .containsMinorData,
    'A presença de dados de menor deve ser preservada.',
  )

  assertCondition(
    result.evidence
      .privacy
      .consentRequired,
    'O consentimento deve ser obrigatório.',
  )

  assertCondition(
    result.evidence
      .privacy
      .consentConfirmed,
    'O consentimento informado deve ser preservado.',
  )

  assertCondition(
    result.evidence
      .privacy
      .visibility ===
      'restricted',
    'Evidências com menores devem possuir acesso restrito.',
  )

  assertCondition(
    result.requiresHumanReview,
    'Evidências com menores devem exigir revisão humana.',
  )
}

function validateInvalidEvidence(): void {
  const agendaEvidence = {
    ...createBaseAgendaEvidence(),

    id:
      '',

    title:
      '',
  } satisfies AgendaEvidence

  const result =
    adaptAgendaEvidenceToEducationalEvidence({
      evidence:
        agendaEvidence,
    })

  assertCondition(
    !result.success,
    'Uma evidência sem ID e título deveria falhar.',
  )

  assertCondition(
    result.evidence ===
      null,
    'Nenhuma evidência educacional deve ser criada após falha de validação.',
  )

  assertCondition(
    result.errors.length >=
      2,
    'Os erros de identificador e título devem ser registrados.',
  )

  assertCondition(
    result.requiresHumanReview,
    'Uma adaptação inválida deve exigir revisão humana.',
  )
}

function runValidation(): void {
  validateSuccessfulAdaptation()
  validateMinorProtection()
  validateInvalidEvidence()

  console.log(
    [
      'Agenda Evidence Adapter',
      'validação concluída com sucesso.',
      '',
      'Cenários validados:',
      '- adaptação textual completa;',
      '- preservação do contexto pedagógico;',
      '- proteção de dados de menores;',
      '- rejeição de evidência inválida.',
    ].join('\n'),
  )
}

runValidation()
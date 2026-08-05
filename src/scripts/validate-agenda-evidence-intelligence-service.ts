import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  processAgendaEvidenceIntelligence,
} from '@/lib/agenda/services/agenda-evidence-intelligence.service'

function assertCondition(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function createEvidence(): AgendaEvidence {
  const now = new Date().toISOString()

  return {
    id: 'validation-service-001',

    title:
      'Registro de observação pedagógica',

    description:
      'Participação ativa durante atividade experimental.',

    evidence_type:
      'texto',

    file_url: null,
    external_url: null,

    planning_id:
      'planning-001',

    event_id: null,

    lesson_id:
      'lesson-001',

    objective_id:
      'objective-001',

    class_id:
      'class-001',

    reflection_id: null,

    academic_period_id:
      'period-001',

    organization_id:
      'organization-001',

    school_id:
      'school-001',

    user_id:
      'teacher-001',

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
        'student-001',

      componentId:
        'physics',

      normalizedValue:
        92,
    },

    created_by:
      'teacher-001',

    updated_by:
      'teacher-001',

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

const result =
  processAgendaEvidenceIntelligence({
    agendaEvidence:
      createEvidence(),
  })

assertCondition(
  result.success,
  'O processamento deveria ser concluído.',
)

assertCondition(
  result.evidence !== null,
  'A evidência educacional deveria existir.',
)

assertCondition(
  result.validation !== null,
  'A validação deveria existir.',
)

assertCondition(
  result.status ===
    'completed' ||
    result.status ===
      'requires_human_review',
  'Status inesperado.',
)

assertCondition(
  result.errors.length ===
    0,
  'Não deveria haver erros.',
)

console.log('====================================')
console.log('Evidence Intelligence Service')
console.log('Status:', result.status)
console.log('Warnings:', result.warnings.length)
console.log('Framework:', result.classifications.length)
console.log('====================================')
console.log('VALIDAÇÃO CONCLUÍDA COM SUCESSO')
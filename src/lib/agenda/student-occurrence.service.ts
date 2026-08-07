/**
 * EduData IA — Agenda Inteligente EDI
 * Student Occurrence Service 1.0
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import {
  createStudentOccurrence,
} from '@/lib/eios/academic/student-occurrence.engine'

import type {
  CreateStudentOccurrenceInput,
  StudentOccurrenceListFilters,
  StudentOccurrenceStatus,
} from '@/lib/eios/academic/student-occurrence.contract'

import {
  insertStudentOccurrence,
  listStudentOccurrences,
  updateStudentOccurrenceStatus,
} from './repository/student-occurrence.repository'

import {
  persistEiosGovernanceBundle,
} from '@/lib/eios/core/governance/governance.service'

export async function createAndPersistStudentOccurrence({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: Omit<
    CreateStudentOccurrenceInput,
    'recordedByUserId'
  >
}) {
  const occurrence =
    createStudentOccurrence({
      ...input,
      recordedByUserId: userId,
    })

  const persisted =
    await insertStudentOccurrence({
      client,
      occurrence,
      userId,
    })

  const governance =
    await persistEiosGovernanceBundle({
      client,
      scope: {
        userId,
        organizationId:
          occurrence.organizationId,
        schoolId:
          occurrence.schoolId,
      },
      governance: {
        audit: {
          capability:
            'evidence_intelligence',
          action: 'create',
          severity:
            occurrence.severity === 'critical'
              ? 'critical'
              : occurrence.severity === 'high'
                ? 'warning'
                : 'info',
          actor: {
            type: 'user',
            id: userId,
            organizationId:
              occurrence.organizationId,
            schoolId:
              occurrence.schoolId,
          },
          resource: {
            type: 'custom',
            id: occurrence.id,
          },
          sourceProduct:
            'agenda_inteligente_edi',
          reason:
            'student_occurrence_created',
          newState: {
            status:
              occurrence.status,
            nature:
              occurrence.nature,
            severity:
              occurrence.severity,
            positive:
              occurrence.positive,
            requiresFollowUp:
              occurrence.requiresFollowUp,
          },
          correlationId:
            occurrence.governance
              .correlationId,
          metadata: {
            studentId:
              occurrence.studentId,
            classId:
              occurrence.classId,
            automatedLabelingProhibited:
              true,
          },
        },
        provenance: {
          resourceType:
            'student_occurrence',
          resourceId:
            occurrence.id,
          sourceProduct:
            'agenda_inteligente_edi',
          sources: [
            {
              type: 'custom',
              id: occurrence.studentId,
            },
          ],
          capabilities: [
            'academic_core',
            'governance_core',
          ],
          generatedBy:
            userId,
          correlationId:
            occurrence.governance
              .correlationId,
          metadata: {
            classId:
              occurrence.classId,
            nature:
              occurrence.nature,
          },
        },
      },
    })

  return {
    success: true,
    occurrence,
    persisted,
    governance,
  }
}

export async function getStudentOccurrences({
  client,
  userId,
  filters,
}: {
  client: SupabaseClient
  userId: string
  filters?: StudentOccurrenceListFilters
}) {
  const rows =
    await listStudentOccurrences({
      client,
      userId,
      filters,
    })

  return {
    success: true,
    rows,
    total: rows.length,
    generatedAt:
      new Date().toISOString(),
  }
}

export async function reviewStudentOccurrenceStatus({
  client,
  userId,
  occurrenceId,
  status,
}: {
  client: SupabaseClient
  userId: string
  occurrenceId: string
  status: StudentOccurrenceStatus
}) {
  const row =
    await updateStudentOccurrenceStatus({
      client,
      userId,
      occurrenceId,
      status,
      reviewedBy: userId,
    })

  return {
    success: true,
    row,
    reviewedAt:
      new Date().toISOString(),
  }
}

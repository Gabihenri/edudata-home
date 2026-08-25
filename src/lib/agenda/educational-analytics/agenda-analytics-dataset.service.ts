/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 *
 * Serviço de construção do Dataset Analítico da Agenda Inteligente EDI.
 *
 * Arquitetura:
 * Repository operacional -> Snapshot -> Adapter -> Dataset analítico
 *
 * Este serviço não executa análises estatísticas. Sua responsabilidade é
 * carregar dados operacionais autorizados, transformá-los no contrato oficial
 * do Educational Analytics e expor metadados de qualidade para a interface e
 * para os motores analíticos.
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import {
  buildAgendaEducationalAnalyticsInput,
} from './agenda-analytics.adapter'

import type {
  BuildEducationalAnalyticsInput,
} from './analytics.types'

import {
  loadAgendaOperationalSnapshot,
  type AgendaOperationalSnapshotSummary,
} from '@/lib/agenda/services/operational-snapshot.service'

export type AgendaAnalyticsDatasetQuality = {
  status:
    'empty'
    | 'insufficient'
    | 'limited'
    | 'usable'
    | 'good'

  observationCount: number
  validObservationCount: number
  excludedObservationCount: number
  variableCount: number
  populatedVariableCount: number
  missingProportion: number
  warnings: string[]
}

export type AgendaAnalyticsDatasetResult = {
  input: BuildEducationalAnalyticsInput
  generatedAt: string
  operationalSummary: AgendaOperationalSnapshotSummary
  quality: AgendaAnalyticsDatasetQuality
}

export type LoadAgendaAnalyticsDatasetInput = {
  client: SupabaseClient
  userId: string
  organizationId?: string | null
  schoolId?: string | null
  academicYear?: number | null
  analysisId?: string
  analysisKey?: string
  title?: string
  correlationId?: string
}

function normalizeUserId(
  userId: string,
): string {
  const normalized = userId.trim()

  if (!normalized) {
    throw new Error(
      'O usuário é obrigatório para carregar o Dataset Analítico da Agenda.',
    )
  }

  return normalized
}

function buildQuality(
  input: BuildEducationalAnalyticsInput,
): AgendaAnalyticsDatasetQuality {
  const observationCount = input.observations.length
  const validObservationCount = input.observations.filter(
    observation =>
      !observation.excluded &&
      observation.numericValue !== null,
  ).length
  const excludedObservationCount =
    observationCount - validObservationCount
  const variableCount =
    input.configuration.variableDefinitions.length
  const populatedVariableIds = new Set(
    input.observations
      .filter(
        observation =>
          !observation.excluded &&
          observation.numericValue !== null,
      )
      .map(
        observation => observation.variableId),
  )
  const populatedVariableCount =
    populatedVariableIds.size
  const missingProportion =
    observationCount === 0
      ? 1
      : excludedObservationCount / observationCount

  const warnings: string[] = []

  if (observationCount === 0) {
    warnings.push(
      'Nenhum registro operacional disponível para o período atual.',
    )
  }

  if (validObservationCount > 0 && validObservationCount < 3) {
    warnings.push(
      'A amostra possui menos de três observações válidas para análises de correlação.',
    )
  }

  if (populatedVariableCount < 2 && observationCount > 0) {
    warnings.push(
      'Há menos de duas variáveis numéricas com dados válidos para comparação.',
    )
  }

  if (missingProportion > 0.4 && observationCount > 0) {
    warnings.push(
      'A proporção de valores indisponíveis é superior ao limite configurado para o Educational Analytics.',
    )
  }

  let status: AgendaAnalyticsDatasetQuality['status'] = 'good'

  if (observationCount === 0) {
    status = 'empty'
  } else if (validObservationCount < 3) {
    status = 'insufficient'
  } else if (populatedVariableCount < 2 || missingProportion > 0.4) {
    status = 'limited'
  } else if (validObservationCount < 10 || missingProportion > 0.2) {
    status = 'usable'
  }

  return {
    status,
    observationCount,
    validObservationCount,
    excludedObservationCount,
    variableCount,
    populatedVariableCount,
    missingProportion,
    warnings,
  }
}

export async function loadAgendaAnalyticsDataset(
  input: LoadAgendaAnalyticsDatasetInput,
): Promise<AgendaAnalyticsDatasetResult> {
  const userId = normalizeUserId(input.userId)

  const operational = await loadAgendaOperationalSnapshot({
    client: input.client,
    userId,
  })

  const analyticsInput = buildAgendaEducationalAnalyticsInput({
    snapshot: operational.snapshot,
    userId,
    organizationId: input.organizationId ?? null,
    schoolId: input.schoolId ?? null,
    academicYear: input.academicYear ?? null,
    analysisId: input.analysisId,
    analysisKey: input.analysisKey,
    title: input.title,
    correlationId: input.correlationId,
  })

  const quality = buildQuality(analyticsInput)

  return {
    input: analyticsInput,
    generatedAt: operational.generatedAt,
    operationalSummary: operational.summary,
    quality,
  }
}

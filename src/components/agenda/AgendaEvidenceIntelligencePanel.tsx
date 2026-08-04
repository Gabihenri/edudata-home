'use client'

import {
  useMemo,
  useState,
} from 'react'

import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  createDefaultEvidenceProcessingOptions,
  createEmptyEvidenceQualityCriteria,
  type EducationalEvidence,
  type EvidenceModality,
  type EvidenceType,
} from '@/lib/eios/evidence-intelligence/evidence-intelligence.contract'

import {
  useEvidenceIntelligence,
} from '@/lib/eios/evidence-intelligence/useEvidenceIntelligence'

type AgendaEvidenceIntelligencePanelProps = {
  evidences:
    AgendaEvidence[]
}

function mapAgendaEvidenceType(
  evidence:
    AgendaEvidence,
): EvidenceType {
  if (
    evidence.evidence_type ===
    'imagem'
  ) {
    return 'image'
  }

  if (
    evidence.evidence_type ===
    'pdf'
  ) {
    return 'document'
  }

  if (
    evidence.evidence_type ===
    'link'
  ) {
    return 'external_record'
  }

  return 'observation'
}

function mapAgendaEvidenceModality(
  evidence:
    AgendaEvidence,
): EvidenceModality[] {
  if (
    evidence.evidence_type ===
    'imagem'
  ) {
    return [
      'image',
    ]
  }

  if (
    evidence.evidence_type ===
    'pdf'
  ) {
    return [
      'document',
    ]
  }

  if (
    evidence.evidence_type ===
    'link'
  ) {
    return [
      'structured_data',
    ]
  }

  return [
    'text',
  ]
}

function createEducationalEvidence(
  evidence:
    AgendaEvidence,
): EducationalEvidence {
  const containsSensitiveData =
    evidence
      .contains_identifiable_minor

  return {
    id:
      evidence.id,

    type:
      mapAgendaEvidenceType(
        evidence,
      ),

    title:
      evidence.title,

    description:
      evidence.description,

    status:
      'submitted',

    sourceType:
      'agenda',

    sourceId:
      evidence.id,

    organizationId:
      evidence.organization_id,

    institutionId:
      evidence.school_id,

    campusId:
      null,

    programId:
      null,

    courseId:
      null,

    componentId:
      null,

    offeringId:
      null,

    classId:
      evidence.class_id,

    lessonId:
      evidence.lesson_id,

    planningId:
      evidence.planning_id,

    teacherId:
      evidence.user_id,

    studentId:
      null,

    studentGroupId:
      null,

    academicPeriodId:
      evidence.academic_period_id,

    subjects: [
      ...(evidence.class_id
        ? [
            {
              subjectType:
                'class' as const,

              subjectId:
                evidence.class_id,

              role:
                'primary' as const,

              metadata:
                {},
            },
          ]
        : []),

      ...(evidence.lesson_id
        ? [
            {
              subjectType:
                'lesson' as const,

              subjectId:
                evidence.lesson_id,

              role:
                evidence.class_id
                  ? 'context' as const
                  : 'primary' as const,

              metadata:
                {},
            },
          ]
        : []),

      ...(evidence.objective_id
        ? [
            {
              subjectType:
                'learning_objective' as const,

              subjectId:
                evidence.objective_id,

              role:
                'context' as const,

              metadata:
                {},
            },
          ]
        : []),
    ],

    curriculumReferences:
      evidence.objective_id
        ? [
            {
              frameworkId:
                null,

              versionId:
                null,

              curriculumNodeId:
                null,

              competencyId:
                null,

              skillId:
                null,

              knowledgeObjectId:
                null,

              learningObjectiveId:
                evidence.objective_id,

              alignmentConfidence:
                1,

              alignmentExplanation:
                'Objetivo de aprendizagem vinculado diretamente à evidência da Agenda Inteligente EDI.',

              inferred:
                false,

              humanReviewRequired:
                false,

              metadata:
                {},
            },
          ]
        : [],

    assessmentReference:
      null,

    interventionReferences:
      [],

    frameworkClassifications:
      [],

    modalities:
      mapAgendaEvidenceModality(
        evidence,
      ),

    value:
      null,

    unit:
      null,

    normalizedValue:
      null,

    textualContent:
      evidence.description,

    temporalContext: {
      occurredAt:
        evidence.created_at,

      recordedAt:
        evidence.created_at,

      startsAt:
        null,

      endsAt:
        null,

      validFrom:
        evidence.created_at,

      validUntil:
        null,

      academicYear:
        new Date(
          evidence.created_at,
        ).getFullYear(),

      academicPeriodId:
        evidence.academic_period_id,

      sequence:
        null,

      timezone:
        'America/Sao_Paulo',

      metadata:
        {},
    },

    spatialContext:
      null,

    files:
      evidence.storage_path ||
      evidence.file_url
        ? [
            {
              id:
                `file-${evidence.id}`,

              fileName:
                evidence.original_file_name ??
                evidence.title,

              mimeType:
                evidence.file_mime_type ??
                'application/octet-stream',

              sizeBytes:
                evidence.file_size_bytes,

              storageProvider:
                evidence.storage_bucket
                  ? 'supabase'
                  : null,

              storagePath:
                evidence.storage_path,

              publicUrl:
                evidence.file_url,

              checksum:
                null,

              modality:
                evidence.evidence_type ===
                  'imagem'
                  ? 'image'
                  : 'document',

              containsPersonalData:
                evidence
                  .contains_identifiable_minor,

              containsSensitiveData,

              createdAt:
                evidence.created_at,

              metadata:
                {},
            },
          ]
        : [],

    externalReferences:
      evidence.external_url
        ? [
            {
              system:
                'external_url',

              entityType:
                'agenda_evidence',

              entityId:
                evidence.id,

              url:
                evidence.external_url,

              importedAt:
                evidence.created_at,

              metadata:
                {},
            },
          ]
        : [],

    relatedEvidenceIds:
      [],

    supersedesEvidenceId:
      null,

    supersededByEvidenceId:
      null,

    quality: {
      level:
        'not_evaluated',

      overallScore:
        null,

      criteria:
        createEmptyEvidenceQualityCriteria(),

      strengths:
        [],

      limitations:
        [],

      missingInformation:
        [],

      evaluatedAt:
        null,

      evaluatedBy:
        null,

      evaluationMethod:
        'not_evaluated',

      humanReviewRequired:
        false,

      metadata:
        {},
    },

    reliability: {
      confidence:
        null,

      confidenceLevel:
        'unknown',

      strength:
        'inconclusive',

      sourceReliability:
        null,

      internalConsistency:
        null,

      corroborationCount:
        0,

      contradictionCount:
        0,

      verified:
        false,

      verifiedBy:
        null,

      verifiedAt:
        null,

      validationMethod:
        'not_validated',

      explanation:
        null,

      limitations:
        [],

      humanReviewRequired:
        false,

      metadata:
        {},
    },

    privacy: {
      visibility:
        'restricted',

      sensitivity:
        containsSensitiveData
          ? 'sensitive'
          : 'academic',

      containsPersonalData:
        evidence
          .contains_identifiable_minor,

      containsSensitiveData,

      containsMinorData:
        evidence
          .contains_identifiable_minor,

      anonymizationRequired:
        evidence
          .contains_identifiable_minor,

      pseudonymizationRequired:
        evidence
          .contains_identifiable_minor,

      consentRequired:
        evidence
          .contains_identifiable_minor,

      consentConfirmed:
        evidence
          .guardian_authorization_confirmed,

      legalBasis:
        evidence
          .guardian_authorization_confirmed
          ? 'Autorização registrada na Agenda Inteligente EDI.'
          : null,

      retentionPolicy:
        null,

      retentionUntil:
        null,

      accessRoles: [
        'teacher',
        'coordinator',
        'institution_admin',
      ],

      metadata: {
        privacyNoticeVersion:
          evidence
            .privacy_notice_version,

        authorizationReference:
          evidence
            .authorization_reference,
      },
    },

    knowledgeGraphNodeId:
      null,

    knowledgeGraphEdgeIds:
      [],

    version:
      1,

    active:
      evidence.deleted_at ===
      null,

    createdAt:
      evidence.created_at,

    updatedAt:
      evidence.updated_at,

    createdBy:
      evidence.created_by,

    updatedBy:
      evidence.updated_by,

    auditTrail:
      [],

    metadata: {
      ...evidence.metadata,

      agendaEvidenceType:
        evidence.evidence_type,

      eventId:
        evidence.event_id,

      reflectionId:
        evidence.reflection_id,
    },
  }
}

function formatPercentage(
  value:
    number | null,
): string {
  if (
    value ===
    null
  ) {
    return 'Não calculado'
  }

  return `${value.toFixed(1)}%`
}

function formatConfidence(
  value:
    number | null,
): string {
  if (
    value ===
    null
  ) {
    return 'Não calculada'
  }

  return `${(
    value *
    100
  ).toFixed(1)}%`
}

export function AgendaEvidenceIntelligencePanel({
  evidences,
}: AgendaEvidenceIntelligencePanelProps) {
  const [
    selectedIds,
    setSelectedIds,
  ] = useState<
    string[]
  >([])

  const {
    result,
    loading,
    error,
    process,
    cancel,
    clear,
  } = useEvidenceIntelligence()

  const selectedEvidences =
    useMemo(
      () =>
        evidences.filter(
          evidence =>
            selectedIds.includes(
              evidence.id,
            ),
        ),
      [
        evidences,
        selectedIds,
      ],
    )

  const allSelected =
    evidences.length >
      0 &&
    selectedIds.length ===
      evidences.length

  function toggleEvidence(
    evidenceId:
      string,
  ): void {
    setSelectedIds(
      current =>
        current.includes(
          evidenceId,
        )
          ? current.filter(
              id =>
                id !==
                evidenceId,
            )
          : [
              ...current,
              evidenceId,
            ],
    )
  }

  function toggleAll():
    void {
    setSelectedIds(
      allSelected
        ? []
        : evidences.map(
            evidence =>
              evidence.id,
          ),
    )
  }

  async function handleProcess():
    Promise<void> {
    if (
      selectedEvidences.length ===
      0
    ) {
      return
    }

    const educationalEvidence =
      selectedEvidences.map(
        createEducationalEvidence,
      )

    await process({
      request: {
        requestId:
          `agenda-evidence-${Date.now()}`,

        evidence:
          educationalEvidence,

        consolidationGroups:
          [],

        options:
          createDefaultEvidenceProcessingOptions(),

        requestedBy:
          selectedEvidences[0]
            ?.user_id ??
          null,

        requestedAt:
          new Date()
            .toISOString(),

        metadata: {
          source:
            'agenda-evidencias',

          selectedEvidenceCount:
            educationalEvidence.length,
        },
      },

      configuration: {
        concurrency:
          4,

        stopOnFirstError:
          false,

        continueOnItemFailure:
          true,

        maximumEvidencePerBatch:
          500,

        generateKnowledgeGraphLinks:
          true,
      },
    })
  }

  const execution =
    result

  const processedEvidence =
    execution
      ?.result
      .evidence ??
    []

  const averageQuality =
    useMemo(() => {
      const values =
        processedEvidence
          .map(
            evidence =>
              evidence
                .quality
                .overallScore,
          )
          .filter(
            (
              value,
            ): value is number =>
              value !==
              null,
          )

      if (
        values.length ===
        0
      ) {
        return null
      }

      return (
        values.reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        ) /
        values.length
      )
    }, [
      processedEvidence,
    ])

  const averageConfidence =
    useMemo(() => {
      const values =
        processedEvidence
          .map(
            evidence =>
              evidence
                .reliability
                .confidence,
          )
          .filter(
            (
              value,
            ): value is number =>
              value !==
              null,
          )

      if (
        values.length ===
        0
      ) {
        return null
      }

      return (
        values.reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        ) /
        values.length
      )
    }, [
      processedEvidence,
    ])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
            EIOS · Evidence Intelligence
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Inteligência de evidências
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Selecione registros para avaliar qualidade,
            confiabilidade, consistência, contradições e
            necessidade de revisão humana.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {loading ? (
            <button
              type="button"
              onClick={cancel}
              className="min-h-11 rounded-xl border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Cancelar
            </button>
          ) : null}

          {execution ? (
            <button
              type="button"
              onClick={clear}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpar resultado
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleProcess}
            disabled={
              loading ||
              selectedIds.length ===
                0
            }
            className="min-h-11 rounded-xl bg-[#075F78] px-5 text-sm font-bold text-white transition hover:bg-[#064E63] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading
              ? 'Processando...'
              : `Processar ${selectedIds.length || ''} evidência(s)`}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300"
            />

            Selecionar todas
          </label>

          <span className="text-xs font-semibold text-slate-500">
            {selectedIds.length} de {evidences.length}
          </span>
        </div>

        {evidences.length ===
        0 ? (
          <p className="p-5 text-sm text-slate-600">
            Nenhuma evidência disponível para processamento.
          </p>
        ) : (
          <div className="max-h-80 divide-y divide-slate-200 overflow-y-auto">
            {evidences.map(
              evidence => (
                <label
                  key={evidence.id}
                  className="flex cursor-pointer items-start gap-3 px-4 py-4 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(
                      evidence.id,
                    )}
                    onChange={() =>
                      toggleEvidence(
                        evidence.id,
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900">
                      {evidence.title}
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      {evidence.evidence_type}
                      {' · '}
                      {new Date(
                        evidence.created_at,
                      ).toLocaleDateString(
                        'pt-BR',
                      )}
                    </span>
                  </span>
                </label>
              ),
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#0B7491]" />
          </div>

          <p className="mt-2 text-sm text-slate-600">
            O EIOS está validando, classificando e
            analisando as evidências selecionadas.
          </p>
        </div>
      ) : null}

      {execution ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Processadas
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950">
                {
                  execution.metrics
                    .successfulEvidenceCount
                }
              </p>
            </article>

            <article className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#075F78]">
                Qualidade média
              </p>

              <p className="mt-2 text-2xl font-black text-[#064E63]">
                {formatPercentage(
                  averageQuality,
                )}
              </p>
            </article>

            <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Confiabilidade
              </p>

              <p className="mt-2 text-2xl font-black text-blue-900">
                {formatConfidence(
                  averageConfidence,
                )}
              </p>
            </article>

            <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Revisão humana
              </p>

              <p className="mt-2 text-2xl font-black text-amber-900">
                {execution.result
                  .requiresHumanReview
                  ? 'Necessária'
                  : 'Não indicada'}
              </p>
            </article>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-950">
                Contradições
              </h3>

              {execution.result
                .contradictions
                .length ===
              0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  Nenhuma contradição foi detectada.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {execution.result
                    .contradictions
                    .map(
                      contradiction => (
                        <div
                          key={
                            contradiction.id
                          }
                          className="rounded-lg border border-rose-200 bg-rose-50 p-3"
                        >
                          <p className="text-xs font-bold uppercase text-rose-700">
                            {
                              contradiction.severity
                            }
                            {' · '}
                            {
                              contradiction.contradictionType
                            }
                          </p>

                          <p className="mt-1 text-sm text-rose-900">
                            {
                              contradiction.explanation
                            }
                          </p>
                        </div>
                      ),
                    )}
                </div>
              )}
            </article>

            <article className="rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-950">
                Consolidações
              </h3>

              {execution.result
                .consolidations
                .length ===
              0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  Nenhum grupo de consolidação foi
                  solicitado neste processamento.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {execution.result
                    .consolidations
                    .map(
                      consolidation => (
                        <div
                          key={
                            consolidation.id
                          }
                          className="rounded-lg border border-cyan-200 bg-cyan-50 p-3"
                        >
                          <p className="text-sm font-bold text-[#075F78]">
                            {
                              consolidation.explanation
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            Tendência:{' '}
                            {
                              consolidation.trend
                            }
                            {' · '}
                            Confiança:{' '}
                            {formatConfidence(
                              consolidation.confidence,
                            )}
                          </p>
                        </div>
                      ),
                    )}
                </div>
              )}
            </article>
          </div>

          <article className="rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-950">
              Evidências avaliadas
            </h3>

            <div className="mt-4 space-y-3">
              {processedEvidence.map(
                evidence => (
                  <div
                    key={evidence.id}
                    className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_auto_auto]"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {evidence.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          evidence
                            .frameworkClassifications
                            .map(
                              classification =>
                                `${classification.pillar}: ${classification.primaryDimension}`,
                            )
                            .join(' · ') ||
                          'Sem classificação'
                        }
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      Qualidade:{' '}
                      <strong className="text-slate-900">
                        {formatPercentage(
                          evidence
                            .quality
                            .overallScore,
                        )}
                      </strong>
                    </div>

                    <div className="text-sm text-slate-600">
                      Confiança:{' '}
                      <strong className="text-slate-900">
                        {formatConfidence(
                          evidence
                            .reliability
                            .confidence,
                        )}
                      </strong>
                    </div>
                  </div>
                ),
              )}
            </div>
          </article>

          {execution.result
            .warnings.length >
          0 ? (
            <article className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-900">
                Avisos do processamento
              </h3>

              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {execution.result
                  .warnings
                  .map(
                    warning => (
                      <li key={warning}>
                        {warning}
                      </li>
                    ),
                  )}
              </ul>
            </article>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
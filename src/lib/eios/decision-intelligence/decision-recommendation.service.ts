import {
  clampDecisionConfidence,
  getDecisionConfidenceLevel,
  type DecisionActionType,
  type DecisionAudience,
  type DecisionPriority,
  type DecisionRecommendation,
  type DecisionRiskAssessment,
  type DecisionRuleExecutionResult,
  type DecisionUrgency,
  type EducationalDecision,
} from './decision-intelligence.contract'

export type DecisionRecommendationGenerationOptions = {
  maximumRecommendations:
    number

  minimumConfidence:
    number

  includeMonitoringRecommendation:
    boolean

  includeHumanReviewRecommendation:
    boolean

  requireApprovalForSensitiveData:
    boolean
}

export type DecisionRecommendationGenerationResult = {
  success:
    boolean

  decisionId:
    string

  recommendations:
    DecisionRecommendation[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type DecisionRecommendationBatchResult = {
  success:
    boolean

  results:
    DecisionRecommendationGenerationResult[]

  recommendations:
    DecisionRecommendation[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

const DEFAULT_OPTIONS:
  DecisionRecommendationGenerationOptions = {
  maximumRecommendations:
    5,

  minimumConfidence:
    0.55,

  includeMonitoringRecommendation:
    true,

  includeHumanReviewRecommendation:
    true,

  requireApprovalForSensitiveData:
    true,
}

function uniqueStrings(
  values:
    string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(
          value =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  )
}

function nowIso():
  string {
  return new Date()
    .toISOString()
}

function createId(
  prefix:
    string,
): string {
  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join(
    '-',
  )
}

function normalizeOptions(
  options?:
    Partial<DecisionRecommendationGenerationOptions>,
): DecisionRecommendationGenerationOptions {
  return {
    maximumRecommendations:
      Math.max(
        1,
        Math.floor(
          options?.maximumRecommendations ??
          DEFAULT_OPTIONS.maximumRecommendations,
        ),
      ),

    minimumConfidence:
      clampDecisionConfidence(
        options?.minimumConfidence ??
        DEFAULT_OPTIONS.minimumConfidence,
      ),

    includeMonitoringRecommendation:
      options?.includeMonitoringRecommendation ??
      DEFAULT_OPTIONS.includeMonitoringRecommendation,

    includeHumanReviewRecommendation:
      options?.includeHumanReviewRecommendation ??
      DEFAULT_OPTIONS.includeHumanReviewRecommendation,

    requireApprovalForSensitiveData:
      options?.requireApprovalForSensitiveData ??
      DEFAULT_OPTIONS.requireApprovalForSensitiveData,
  }
}

function getPrimaryAudience(
  decision:
    EducationalDecision,
): DecisionAudience[] {
  if (
    decision.studentId
  ) {
    return [
      'teacher',
      'coordinator',
    ]
  }

  if (
    decision.classId
  ) {
    return [
      'teacher',
      'coordinator',
    ]
  }

  if (
    decision.teacherId
  ) {
    return [
      'coordinator',
      'school_management',
    ]
  }

  if (
    decision.institutionId
  ) {
    return [
      'school_management',
      'institutional_management',
    ]
  }

  return [
    'teacher',
  ]
}

function getPriority(
  decision:
    EducationalDecision,
): DecisionPriority {
  return decision.priority
}

function getUrgency(
  decision:
    EducationalDecision,
): DecisionUrgency {
  return decision.urgency
}

function getRiskConfidence(
  risk:
    DecisionRiskAssessment,
): number {
  if (
    risk.probability !==
    null
  ) {
    return clampDecisionConfidence(
      risk.probability >
      1
        ? risk.probability /
          100
        : risk.probability,
    )
  }

  if (
    risk.score !==
    null
  ) {
    return clampDecisionConfidence(
      risk.score /
      100,
    )
  }

  return 0.5
}

function createRecommendation({
  decision,
  title,
  description,
  actionType,
  rationale,
  expectedOutcome,
  confidence,
  audience,
  priority,
  urgency,
  requiresApproval,
  metadata = {},
}: {
  decision:
    EducationalDecision

  title:
    string

  description:
    string

  actionType:
    DecisionActionType

  rationale:
    string

  expectedOutcome:
    string | null

  confidence:
    number

  audience:
    DecisionAudience[]

  priority:
    DecisionPriority

  urgency:
    DecisionUrgency

  requiresApproval:
    boolean

  metadata?:
    Record<string, unknown>
}): DecisionRecommendation {
  const normalizedConfidence =
    clampDecisionConfidence(
      confidence,
    )

  return {
    id:
      createId(
        'recommendation',
      ),

    title,

    description,

    actionType,

    priority,

    urgency,

    audience,

    expectedOutcome,

    rationale,

    evidenceIds:
      decision
        .evidenceReferences
        .map(
          reference =>
            reference.evidenceId,
        ),

    curriculumReferences:
      decision.curriculumReferences,

    confidence:
      normalizedConfidence,

    confidenceLevel:
      getDecisionConfidenceLevel(
        normalizedConfidence,
      ),

    automaticallyGenerated:
      true,

    requiresApproval,

    approved:
      false,

    approvedBy:
      null,

    approvedAt:
      null,

    metadata: {
      generatedAt:
        nowIso(),

      generatedBy:
        'decision-recommendation-engine',

      decisionId:
        decision.id,

      decisionType:
        decision.type,

      category:
        decision.category,

      ...metadata,
    },
  }
}

function generateRiskRecommendations(
  decision:
    EducationalDecision,
): DecisionRecommendation[] {
  const recommendations:
    DecisionRecommendation[] =
      []

  const audience =
    getPrimaryAudience(
      decision,
    )

  for (
    const risk
    of decision.risks
  ) {
    const confidence =
      getRiskConfidence(
        risk,
      )

    switch (
      risk.riskType
    ) {
      case 'learning':
      case 'performance':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Revisar evidÃªncias de aprendizagem',

            description:
              'Analise as evidÃªncias recentes, identifique habilidades nÃ£o consolidadas e ajuste as prÃ³ximas aÃ§Ãµes pedagÃ³gicas.',

            actionType:
              'review_evidence',

            rationale:
              risk.explanation,

            expectedOutcome:
              'CompreensÃ£o mais precisa das dificuldades e definiÃ§Ã£o de intervenÃ§Ã£o pedagÃ³gica adequada.',

            confidence,

            audience,

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              false,

            metadata: {
              riskType:
                risk.riskType,

              riskLevel:
                risk.riskLevel,
            },
          }),
        )

        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Ajustar planejamento pedagÃ³gico',

            description:
              'Reorganize objetivos, estratÃ©gias, atividades e critÃ©rios de acompanhamento para responder Ã s dificuldades identificadas.',

            actionType:
              'adjust_planning',

            rationale:
              'Risco de aprendizagem ou desempenho identificado pelo Decision Intelligence Engine.',

            expectedOutcome:
              'Maior alinhamento entre necessidades de aprendizagem, objetivos e aÃ§Ãµes docentes.',

            confidence,

            audience,

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              false,

            metadata: {
              riskType:
                risk.riskType,
            },
          }),
        )
        break

      case 'attendance':
      case 'dropout':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Iniciar acompanhamento de frequÃªncia',

            description:
              'Verifique o padrÃ£o de ausÃªncias, registre contatos e articule aÃ§Ãµes de busca ativa conforme as regras institucionais.',

            actionType:
              'monitor',

            rationale:
              risk.explanation,

            expectedOutcome:
              'ReduÃ§Ã£o de ausÃªncias e identificaÃ§Ã£o precoce de fatores de afastamento.',

            confidence,

            audience: [
              'teacher',
              'coordinator',
              'school_management',
            ],

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              false,

            metadata: {
              riskType:
                risk.riskType,

              indicators:
                risk.indicators,
            },
          }),
        )

        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Realizar contato institucional',

            description:
              'Realize contato com o estudante e, quando aplicÃ¡vel, com a famÃ­lia, preservando os protocolos institucionais e a proteÃ§Ã£o de dados.',

            actionType:
              decision.studentId
                ? 'contact_student'
                : 'contact_family',

            rationale:
              'O risco de frequÃªncia ou abandono requer verificaÃ§Ã£o contextual e acompanhamento humano.',

            expectedOutcome:
              'CompreensÃ£o das causas das ausÃªncias e definiÃ§Ã£o de apoio adequado.',

            confidence,

            audience: [
              'teacher',
              'coordinator',
              'school_management',
            ],

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              true,

            metadata: {
              riskType:
                risk.riskType,
            },
          }),
        )
        break

      case 'engagement':
      case 'participation':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Diversificar estratÃ©gias de participaÃ§Ã£o',

            description:
              'Adote estratÃ©gias variadas de interaÃ§Ã£o, agrupamento, escolha e produÃ§Ã£o para ampliar a participaÃ§Ã£o nas atividades.',

            actionType:
              'adjust_lesson',

            rationale:
              risk.explanation,

            expectedOutcome:
              'Aumento do engajamento e da participaÃ§Ã£o observÃ¡vel.',

            confidence,

            audience,

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              false,
          }),
        )
        break

      case 'curriculum':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Revisar alinhamento curricular',

            description:
              'Verifique objetivos, habilidades, competÃªncias e evidÃªncias associadas antes de manter ou alterar a progressÃ£o curricular.',

            actionType:
              'update_curriculum_alignment',

            rationale:
              risk.explanation,

            expectedOutcome:
              'Maior coerÃªncia entre currÃ­culo planejado, currÃ­culo desenvolvido e aprendizagem evidenciada.',

            confidence,

            audience: [
              'teacher',
              'coordinator',
            ],

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              false,
          }),
        )
        break

      case 'assessment':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Revisar instrumento e critÃ©rios de avaliaÃ§Ã£o',

            description:
              'Analise o instrumento, a rubrica, os critÃ©rios de correÃ§Ã£o e a coerÃªncia entre os resultados e as evidÃªncias disponÃ­veis.',

            actionType:
              'review_assessment',

            rationale:
              risk.explanation,

            expectedOutcome:
              'Maior validade, consistÃªncia e transparÃªncia do processo avaliativo.',

            confidence,

            audience: [
              'teacher',
              'coordinator',
            ],

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              false,
          }),
        )
        break

      case 'intervention_failure':
      case 'recovery_failure':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Reavaliar a intervenÃ§Ã£o pedagÃ³gica',

            description:
              'Compare as evidÃªncias anteriores e posteriores, revise a estratÃ©gia utilizada e defina uma nova aÃ§Ã£o com critÃ©rios claros de acompanhamento.',

            actionType:
              risk.riskType ===
                'recovery_failure'
                ? 'create_recovery_plan'
                : 'create_intervention',

            rationale:
              risk.explanation,

            expectedOutcome:
              'IntervenÃ§Ã£o mais adequada Ã s necessidades identificadas e acompanhada por evidÃªncias.',

            confidence,

            audience: [
              'teacher',
              'coordinator',
            ],

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              true,
          }),
        )
        break

      case 'accessibility':
      case 'equity':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Revisar condiÃ§Ãµes de acesso e participaÃ§Ã£o',

            description:
              'Verifique barreiras, adaptaÃ§Ãµes, recursos de acessibilidade e condiÃ§Ãµes de equidade antes de definir novas aÃ§Ãµes.',

            actionType:
              'provide_accessibility_support',

            rationale:
              risk.explanation,

            expectedOutcome:
              'ReduÃ§Ã£o de barreiras e ampliaÃ§Ã£o das condiÃ§Ãµes de participaÃ§Ã£o e aprendizagem.',

            confidence,

            audience: [
              'teacher',
              'coordinator',
              'support_team',
              'multidisciplinary_team',
            ],

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              true,
          }),
        )
        break

      case 'data_quality':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Validar dados antes da decisÃ£o',

            description:
              'Revise origem, completude, consistÃªncia e rastreabilidade dos dados utilizados antes de aprovar qualquer aÃ§Ã£o.',

            actionType:
              'validate_data',

            rationale:
              risk.explanation,

            expectedOutcome:
              'DecisÃ£o baseada em dados mais confiÃ¡veis e auditÃ¡veis.',

            confidence,

            audience: [
              'coordinator',
              'school_management',
              'system_administrator',
            ],

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              true,
          }),
        )
        break

      case 'privacy':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Revisar proteÃ§Ã£o e acesso aos dados',

            description:
              'Confirme base legal, consentimento, finalidade, perfis de acesso e necessidade de anonimizaÃ§Ã£o antes de compartilhar ou executar aÃ§Ãµes.',

            actionType:
              'refer_management',

            rationale:
              risk.explanation,

            expectedOutcome:
              'Tratamento adequado dos dados e reduÃ§Ã£o do risco de exposiÃ§Ã£o indevida.',

            confidence,

            audience: [
              'school_management',
              'institutional_management',
              'system_administrator',
            ],

            priority:
              'critical',

            urgency:
              'immediate',

            requiresApproval:
              true,
          }),
        )
        break

      case 'behavior':
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Realizar anÃ¡lise contextual do comportamento',

            description:
              'ReÃºna evidÃªncias de diferentes momentos e fontes, evitando conclusÃµes isoladas ou rotulaÃ§Ãµes.',

            actionType:
              'collect_more_evidence',

            rationale:
              risk.explanation,

            expectedOutcome:
              'InterpretaÃ§Ã£o mais contextualizada e definiÃ§Ã£o de apoio proporcional.',

            confidence,

            audience: [
              'teacher',
              'coordinator',
              'support_team',
            ],

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              true,
          }),
        )
        break

      case 'operational':
      case 'other':
      default:
        recommendations.push(
          createRecommendation({
            decision,

            title:
              'Realizar acompanhamento estruturado',

            description:
              'Defina responsÃ¡vel, prazo, evidÃªncias de acompanhamento e critÃ©rio de encerramento para a situaÃ§Ã£o identificada.',

            actionType:
              'schedule_follow_up',

            rationale:
              risk.explanation,

            expectedOutcome:
              'Acompanhamento documentado e decisÃ£o revisÃ¡vel.',

            confidence,

            audience,

            priority:
              getPriority(
                decision,
              ),

            urgency:
              getUrgency(
                decision,
              ),

            requiresApproval:
              false,
          }),
        )
        break
    }
  }

  return recommendations
}

function generateDecisionTypeRecommendations(
  decision:
    EducationalDecision,
): DecisionRecommendation[] {
  const audience =
    getPrimaryAudience(
      decision,
    )

  const confidence =
    decision.confidence ??
    0.6

  switch (
    decision.type
  ) {
    case 'recovery':
      return [
        createRecommendation({
          decision,

          title:
            'Elaborar plano de recuperaÃ§Ã£o',

          description:
            'Defina habilidades prioritÃ¡rias, atividades, prazos, evidÃªncias esperadas e momentos de reavaliaÃ§Ã£o.',

          actionType:
            'create_recovery_plan',

          rationale:
            decision.explanation.rationale ||
            decision.description,

          expectedOutcome:
            'RecuperaÃ§Ã£o progressiva das aprendizagens nÃ£o consolidadas.',

          confidence,

          audience,

          priority:
            decision.priority,

          urgency:
            decision.urgency,

          requiresApproval:
            true,
        }),
      ]

    case 'recomposition':
      return [
        createRecommendation({
          decision,

          title:
            'Elaborar plano de recomposiÃ§Ã£o',

          description:
            'Organize aprendizagens essenciais, diagnÃ³stico, sequÃªncia de aÃ§Ãµes e critÃ©rios de evoluÃ§Ã£o.',

          actionType:
            'create_recomposition_plan',

          rationale:
            decision.explanation.rationale ||
            decision.description,

          expectedOutcome:
            'ReduÃ§Ã£o de lacunas acumuladas e retomada da progressÃ£o curricular.',

          confidence,

          audience,

          priority:
            decision.priority,

          urgency:
            decision.urgency,

          requiresApproval:
            true,
        }),
      ]

    case 'planning_adjustment':
      return [
        createRecommendation({
          decision,

          title:
            'Atualizar o planejamento',

          description:
            'Ajuste objetivos, estratÃ©gias, recursos, tempos e evidÃªncias esperadas conforme os dados analisados.',

          actionType:
            'adjust_planning',

          rationale:
            decision.explanation.rationale ||
            decision.description,

          expectedOutcome:
            'Planejamento mais responsivo Ã s necessidades identificadas.',

          confidence,

          audience,

          priority:
            decision.priority,

          urgency:
            decision.urgency,

          requiresApproval:
            false,
        }),
      ]

    case 'lesson_adjustment':
      return [
        createRecommendation({
          decision,

          title:
            'Ajustar a prÃ³xima aula',

          description:
            'Reorganize a abordagem, os agrupamentos, os recursos e a verificaÃ§Ã£o da aprendizagem na prÃ³xima aula.',

          actionType:
            'adjust_lesson',

          rationale:
            decision.explanation.rationale ||
            decision.description,

          expectedOutcome:
            'Resposta pedagÃ³gica imediata e verificÃ¡vel.',

          confidence,

          audience,

          priority:
            decision.priority,

          urgency:
            decision.urgency,

          requiresApproval:
            false,
        }),
      ]

    case 'teacher_support':
      return [
        createRecommendation({
          decision,

          title:
            'Oferecer apoio pedagÃ³gico ao professor',

          description:
            'Organize apoio tÃ©cnico-pedagÃ³gico, devolutiva, recurso ou acompanhamento relacionado Ã  necessidade identificada.',

          actionType:
            'provide_teacher_support',

          rationale:
            decision.explanation.rationale ||
            decision.description,

          expectedOutcome:
            'Fortalecimento da prÃ¡tica docente e da resposta pedagÃ³gica.',

          confidence,

          audience: [
            'coordinator',
            'school_management',
          ],

          priority:
            decision.priority,

          urgency:
            decision.urgency,

          requiresApproval:
            false,
        }),
      ]

    case 'resource_recommendation':
      return [
        createRecommendation({
          decision,

          title:
            'Selecionar recurso de aprendizagem',

          description:
            'Escolha recurso compatÃ­vel com o objetivo, o nÃ­vel de aprendizagem, a acessibilidade e o contexto da turma.',

          actionType:
            'provide_learning_resource',

          rationale:
            decision.explanation.rationale ||
            decision.description,

          expectedOutcome:
            'Apoio adicional alinhado Ã s necessidades e ao currÃ­culo.',

          confidence,

          audience,

          priority:
            decision.priority,

          urgency:
            decision.urgency,

          requiresApproval:
            false,
        }),
      ]

    case 'human_review':
      return [
        createRecommendation({
          decision,

          title:
            'Encaminhar para revisÃ£o humana',

          description:
            'Revise evidÃªncias, contradiÃ§Ãµes, riscos e contexto antes de aprovar ou executar qualquer aÃ§Ã£o.',

          actionType:
            'review_evidence',

          rationale:
            decision.explanation.rationale ||
            decision.description,

          expectedOutcome:
            'DecisÃ£o validada por responsÃ¡vel autorizado.',

          confidence,

          audience: [
            'coordinator',
            'school_management',
          ],

          priority:
            decision.priority,

          urgency:
            decision.urgency,

          requiresApproval:
            true,
        }),
      ]

    default:
      return []
  }
}

function generateRuleRecommendations({
  decision,
  ruleExecutions,
}: {
  decision:
    EducationalDecision

  ruleExecutions:
    DecisionRuleExecutionResult[]
}): DecisionRecommendation[] {
  const recommendations:
    DecisionRecommendation[] =
      []

  for (
    const execution
    of ruleExecutions
  ) {
    if (
      !execution.matched ||
      execution.decisionId !==
        decision.id
    ) {
      continue
    }

    const confidence =
      clampDecisionConfidence(
        execution.conditionScore /
        100,
      )

    recommendations.push(
      createRecommendation({
        decision,

        title:
          'Aplicar aÃ§Ã£o orientada por regra decisÃ³ria',

        description:
          `A regra ${execution.ruleId} foi satisfeita e indica necessidade de resposta pedagÃ³gica estruturada.`,

        actionType:
          'schedule_follow_up',

        rationale:
          `PontuaÃ§Ã£o da regra: ${execution.conditionScore.toFixed(2)}%. CondiÃ§Ãµes satisfeitas: ${execution.matchedConditionIds.join(', ') || 'nÃ£o informadas'}.`,

        expectedOutcome:
          'Tratamento consistente da situaÃ§Ã£o identificada pela regra.',

        confidence,

        audience:
          getPrimaryAudience(
            decision,
          ),

        priority:
          decision.priority,

        urgency:
          decision.urgency,

        requiresApproval:
          decision
            .humanReviewRequired,

        metadata: {
          ruleId:
            execution.ruleId,

          conditionScore:
            execution.conditionScore,

          generatedDecisionType:
            execution
              .generatedDecisionType,
        },
      }),
    )
  }

  return recommendations
}

function deduplicateRecommendations(
  recommendations:
    DecisionRecommendation[],
): DecisionRecommendation[] {
  const signatures =
    new Set<string>()

  const result:
    DecisionRecommendation[] =
      []

  for (
    const recommendation
    of recommendations
  ) {
    const signature = [
      recommendation.actionType,
      recommendation.title
        .trim()
        .toLocaleLowerCase(
          'pt-BR',
        ),
      recommendation.audience
        .slice()
        .sort()
        .join(','),
    ].join(
      '|',
    )

    if (
      signatures.has(
        signature,
      )
    ) {
      continue
    }

    signatures.add(
      signature,
    )

    result.push(
      recommendation,
    )
  }

  return result
}

function sortRecommendations(
  recommendations:
    DecisionRecommendation[],
): DecisionRecommendation[] {
  const priorityWeight:
    Record<
      DecisionPriority,
      number
    > = {
    low:
      1,

    medium:
      2,

    high:
      3,

    urgent:
      4,

    critical:
      5,
  }

  const urgencyWeight:
    Record<
      DecisionUrgency,
      number
    > = {
    no_deadline:
      1,

    monitor:
      2,

    within_30_days:
      3,

    within_15_days:
      4,

    within_7_days:
      5,

    within_72_hours:
      6,

    immediate:
      7,
  }

  return [
    ...recommendations,
  ].sort(
    (
      first,
      second,
    ) => {
      const priorityDifference =
        priorityWeight[
          second.priority
        ] -
        priorityWeight[
          first.priority
        ]

      if (
        priorityDifference !==
        0
      ) {
        return priorityDifference
      }

      const urgencyDifference =
        urgencyWeight[
          second.urgency
        ] -
        urgencyWeight[
          first.urgency
        ]

      if (
        urgencyDifference !==
        0
      ) {
        return urgencyDifference
      }

      return (
        (
          second.confidence ??
          0
        ) -
        (
          first.confidence ??
          0
        )
      )
    },
  )
}

export function generateDecisionRecommendations({
  decision,
  ruleExecutions = [],
  options,
}: {
  decision:
    EducationalDecision

  ruleExecutions?:
    DecisionRuleExecutionResult[]

  options?:
    Partial<DecisionRecommendationGenerationOptions>
}): DecisionRecommendationGenerationResult {
  const normalizedOptions =
    normalizeOptions(
      options,
    )

  const warnings:
    string[] = []

  const errors:
    string[] = []

  const generated: DecisionRecommendation[] = [
    ...generateRiskRecommendations(
      decision,
    ),

    ...generateDecisionTypeRecommendations(
      decision,
    ),

    ...generateRuleRecommendations({
      decision,
      ruleExecutions,
    }),
  ]

  if (
    normalizedOptions
      .includeMonitoringRecommendation &&
    generated.length ===
      0
  ) {
    generated.push(
      createRecommendation({
        decision,

        title:
          'Manter acompanhamento',

        description:
          'Registre novas evidÃªncias, acompanhe a evoluÃ§Ã£o e revise a decisÃ£o quando houver mudanÃ§a relevante.',

        actionType:
          'monitor',

        rationale:
          'NÃ£o foram identificadas condiÃ§Ãµes suficientes para uma recomendaÃ§Ã£o mais especÃ­fica.',

        expectedOutcome:
          'AmpliaÃ§Ã£o da base de evidÃªncias para futura decisÃ£o.',

        confidence:
          decision.confidence ??
          0.5,

        audience:
          getPrimaryAudience(
            decision,
          ),

        priority:
          decision.priority,

        urgency:
          decision.urgency,

        requiresApproval:
          false,
      }),
    )
  }

  if (
    normalizedOptions
      .includeHumanReviewRecommendation &&
    decision.humanReviewRequired
  ) {
    generated.push(
      createRecommendation({
        decision,

        title:
          'Validar decisÃ£o antes da execuÃ§Ã£o',

        description:
          'Encaminhe a decisÃ£o e suas evidÃªncias para revisÃ£o de responsÃ¡vel autorizado.',

        actionType:
          'review_evidence',

        rationale:
          'A decisÃ£o foi marcada como dependente de revisÃ£o humana.',

        expectedOutcome:
          'ValidaÃ§Ã£o responsÃ¡vel e reduÃ§Ã£o do risco de aÃ§Ã£o inadequada.',

        confidence:
          decision.confidence ??
          0.5,

        audience: [
          'coordinator',
          'school_management',
        ],

        priority:
          decision.priority,

        urgency:
          decision.urgency,

        requiresApproval:
          true,
      }),
    )
  }

  const sensitiveData =
    decision.privacy
      .containsSensitiveData ||
    decision.privacy
      .containsMinorData

  const filtered =
    generated
      .filter(
        recommendation =>
          (
            recommendation.confidence ??
            0
          ) >=
          normalizedOptions
            .minimumConfidence,
      )
      .map(
        recommendation => ({
          ...recommendation,

          requiresApproval:
            recommendation
              .requiresApproval ||
            (
              normalizedOptions
                .requireApprovalForSensitiveData &&
              sensitiveData
            ),
        }),
      )

  if (
    generated.length >
      0 &&
    filtered.length ===
      0
  ) {
    warnings.push(
      'As recomendaÃ§Ãµes geradas foram removidas por confianÃ§a abaixo do mÃ­nimo configurado.',
    )
  }

  const recommendations =
    sortRecommendations(
      deduplicateRecommendations(
        filtered,
      ),
    ).slice(
      0,
      normalizedOptions
        .maximumRecommendations,
    )

  if (
    recommendations.length ===
    normalizedOptions
      .maximumRecommendations &&
    filtered.length >
      recommendations.length
  ) {
    warnings.push(
      `O resultado foi limitado a ${normalizedOptions.maximumRecommendations} recomendaÃ§Ãµes.`,
    )
  }

  const requiresHumanReview =
    decision.humanReviewRequired ||
    sensitiveData ||
    recommendations.some(
      recommendation =>
        recommendation
          .requiresApproval,
    )

  return {
    success:
      errors.length ===
      0,

    decisionId:
      decision.id,

    recommendations,

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),

    requiresHumanReview,
  }
}

export function generateDecisionRecommendationsBatch({
  decisions,
  ruleExecutions = [],
  options,
}: {
  decisions:
    EducationalDecision[]

  ruleExecutions?:
    DecisionRuleExecutionResult[]

  options?:
    Partial<DecisionRecommendationGenerationOptions>
}): DecisionRecommendationBatchResult {
  const results =
    decisions.map(
      decision =>
        generateDecisionRecommendations({
          decision,

          ruleExecutions:
            ruleExecutions.filter(
              execution =>
                execution.decisionId ===
                decision.id,
            ),

          options,
        }),
    )

  const recommendations =
    sortRecommendations(
      results.flatMap(
        result =>
          result.recommendations,
      ),
    )

  const warnings =
    uniqueStrings(
      results.flatMap(
        result =>
          result.warnings,
      ),
    )

  const errors =
    uniqueStrings(
      results.flatMap(
        result =>
          result.errors,
      ),
    )

  return {
    success:
      errors.length ===
      0,

    results,

    recommendations,

    warnings,

    errors,

    requiresHumanReview:
      results.some(
        result =>
          result
            .requiresHumanReview,
      ),
  }
}

export function applyDecisionRecommendations({
  decision,
  ruleExecutions = [],
  options,
}: {
  decision:
    EducationalDecision

  ruleExecutions?:
    DecisionRuleExecutionResult[]

  options?:
    Partial<DecisionRecommendationGenerationOptions>
}): EducationalDecision {
  const generation =
    generateDecisionRecommendations({
      decision,
      ruleExecutions,
      options,
    })

  return {
    ...decision,

    recommendations:
      generation.recommendations,

    humanReviewRequired:
      decision
        .humanReviewRequired ||
      generation
        .requiresHumanReview,

    updatedAt:
      nowIso(),

    auditTrail: [
      ...decision.auditTrail,

      {
        id:
          createId(
            'audit-recommendation',
          ),

        action:
          'generated',

        actorId:
          null,

        actorType:
          'service',

        occurredAt:
          nowIso(),

        previousStatus:
          decision.status,

        nextStatus:
          decision.status,

        description:
          'RecomendaÃ§Ãµes geradas pelo Decision Recommendation Engine.',

        changes: {
          recommendationCount:
            generation
              .recommendations
              .length,

          requiresHumanReview:
            generation
              .requiresHumanReview,
        },

        metadata: {
          engine:
            'decision-recommendation',

          version:
            'v1',

          warnings:
            generation.warnings,
        },
      },
    ],

    metadata: {
      ...decision.metadata,

      recommendationGeneration: {
        generatedAt:
          nowIso(),

        recommendationCount:
          generation
            .recommendations
            .length,

        warnings:
          generation.warnings,

        errors:
          generation.errors,
      },
    },
  }
}

export function createDefaultDecisionRecommendationOptions():
  DecisionRecommendationGenerationOptions {
  return {
    ...DEFAULT_OPTIONS,
  }
}

export const decisionRecommendationService = {
  generate:
    generateDecisionRecommendations,

  generateBatch:
    generateDecisionRecommendationsBatch,

  apply:
    applyDecisionRecommendations,

  createDefaultOptions:
    createDefaultDecisionRecommendationOptions,
}

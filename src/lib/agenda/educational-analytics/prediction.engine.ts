/**
 * EduData IA — EIOS
 * Capability 04.4: Prediction Engine
 *
 * Motor estatístico determinístico de projeção educacional.
 *
 * Responsabilidades:
 * - produzir projeções numéricas longitudinais explicáveis;
 * - trabalhar apenas com observações autorizadas do contrato analítico;
 * - estimar incerteza e confiança de cada projeção;
 * - preservar revisão humana e autonomia profissional;
 * - impedir interpretação causal ou decisão automatizada.
 *
 * Limitações:
 * - usa regressão linear simples sobre a série temporal/ordinal;
 * - não executa machine learning;
 * - não acessa banco de dados;
 * - não aplica RLS;
 * - previsões não devem ser usadas isoladamente para decisões pedagógicas.
 */

import type {
  AnalyticsConfidence,
  AnalyticsGranularity,
  AnalyticsMetadata,
  AnalyticsObservation,
  AnalyticsPredictionResult,
  AnalyticsPredictionType,
  AnalyticsRiskLevel,
  AnalyticsSourceReference,
  AnalyticsTimestamp,
  AnalyticsVariableDefinition,
} from './analytics.types'

const ENGINE_NAME =
  'eios-prediction-engine'

const ENGINE_VERSION =
  '1.0.0'

const RULESET_VERSION =
  'prediction-ruleset-1.0.0'

const DEFAULT_MINIMUM_OBSERVATIONS =
  3

const DEFAULT_HORIZON =
  1

const EPSILON =
  1e-12

const SUPPORTED_PREDICTION_TYPES:
  AnalyticsPredictionType[] = [
    'performance',
    'learning_progress',
    'learning_regression',
    'intervention_need',
    'intervention_effectiveness',
    'attendance_risk',
    'engagement_risk',
    'dropout_risk',
    'learning_gap',
    'group_reorganization',
    'behavioral_change',
    'other',
  ]

const NUMERIC_VALUE_TYPES =
  new Set([
    'integer',
    'decimal',
    'percentage',
    'proportion',
    'score',
    'duration',
    'count',
  ])

export type PredictionRiskThresholds = {
  moderate?: number | null
  high?: number | null
  critical?: number | null
  direction?:
    | 'higher_is_risk'
    | 'lower_is_risk'
}

export type PredictionTarget = {
  variableId: string
  predictionType?:
    AnalyticsPredictionType
  entityIds?: string[]
  horizon?: number
  horizonUnit?:
    AnalyticsGranularity | null
  minimumObservations?: number
  riskThresholds?:
    PredictionRiskThresholds | null
  metadata?: AnalyticsMetadata
}

export type PredictionEngineInput = {
  observations:
    AnalyticsObservation[]
  variableDefinitions:
    AnalyticsVariableDefinition[]
  targets?: PredictionTarget[]
  defaultHorizon?: number
  defaultHorizonUnit?:
    AnalyticsGranularity | null
  minimumObservations?: number
  allowSensitiveVariables?: boolean
  requestedByUserId?:
    string | null
  correlationId: string
  metadata?: AnalyticsMetadata
}

export type PredictionEngineResult = {
  success: boolean
  predictions:
    AnalyticsPredictionResult[]
  warnings: string[]
  errors: string[]
  generatedAt:
    AnalyticsTimestamp
  correlationId: string
  metadata: AnalyticsMetadata
}

type SeriesPoint = {
  observation:
    AnalyticsObservation
  value: number
  timestamp:
    number | null
}

type RegressionResult = {
  slope: number
  intercept: number
  rSquared: number
  residualStandardError:
    number | null
  xMean: number
  sxx: number
}

type AxisResult = {
  xValues: number[]
  forecastX: number
  mode:
    | 'temporal'
    | 'ordinal'
  intervalSize: number
}

function nowIso():
  AnalyticsTimestamp {
  return new Date()
    .toISOString()
}

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  return value?.trim() || null
}

function normalizeRequiredText(
  value:
    string | null | undefined,
  fieldName: string,
): string {
  const normalized =
    normalizeOptionalText(value)

  if (!normalized) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalized
}

function uniqueStrings(
  values:
    Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (
            value,
          ): value is string =>
            typeof value === 'string',
        )
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  )
}

function stableHash(
  value: string,
): string {
  let hash = 2166136261

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0)
    .toString(16)
    .padStart(8, '0')
}

function createStableId(
  prefix: string,
  value: string,
): string {
  return `${prefix}-${stableHash(value)}`
}

function mean(
  values: number[],
): number {
  return values.reduce(
    (total, value) =>
      total + value,
    0,
  ) / values.length
}

function parseTimestamp(
  observation:
    AnalyticsObservation,
): number | null {
  const candidates = [
    observation.observedAt,
    observation.recordedAt,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue

    const parsed =
      Date.parse(candidate)

    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return null
}

function resolveHorizonSizeInDays(
  horizon: number,
  unit:
    AnalyticsGranularity | null,
): number | null {
  switch (unit) {
    case 'day':
      return horizon
    case 'week':
      return horizon * 7
    case 'month':
      return horizon * 30.4375
    case 'bimester':
      return horizon * 60.875
    case 'quarter':
      return horizon * 91.3125
    case 'semester':
      return horizon * 182.625
    case 'academic_year':
      return horizon * 365.25
    default:
      return null
  }
}

function addHorizonToDate(
  timestamp: number | null,
  horizon: number,
  unit:
    AnalyticsGranularity | null,
): string | null {
  if (timestamp === null) {
    return null
  }

  const days =
    resolveHorizonSizeInDays(
      horizon,
      unit,
    )

  if (days === null) {
    return null
  }

  return new Date(
    timestamp +
      days * 86_400_000,
  ).toISOString()
}

function buildSeries(
  observations:
    AnalyticsObservation[],
  variableId: string,
  entityId: string,
): SeriesPoint[] {
  return observations
    .filter(
      observation =>
        !observation.excluded &&
        observation.variableId ===
          variableId &&
        observation.entityId ===
          entityId &&
        typeof observation.numericValue ===
          'number' &&
        Number.isFinite(
          observation.numericValue,
        ),
    )
    .map(
      observation => ({
        observation,
        value:
          observation.numericValue as number,
        timestamp:
          parseTimestamp(observation),
      }),
    )
    .sort(
      (first, second) => {
        if (
          first.timestamp !== null &&
          second.timestamp !== null &&
          first.timestamp !==
            second.timestamp
        ) {
          return (
            first.timestamp -
            second.timestamp
          )
        }

        return first.observation.id
          .localeCompare(
            second.observation.id,
          )
      },
    )
}

function buildAxis(
  points: SeriesPoint[],
  horizon: number,
  horizonUnit:
    AnalyticsGranularity | null,
): AxisResult {
  const timestamps =
    points.map(
      point => point.timestamp,
    )

  const temporal =
    timestamps.every(
      (
        value,
      ): value is number =>
        value !== null,
    ) &&
    new Set(timestamps).size > 1

  if (!temporal) {
    const xValues =
      points.map(
        (_, index) => index,
      )

    return {
      xValues,
      forecastX:
        xValues.at(-1)! +
        horizon,
      mode: 'ordinal',
      intervalSize: 1,
    }
  }

  const firstTimestamp =
    timestamps[0] as number

  const xValues =
    timestamps.map(
      value =>
        (
          (value as number) -
          firstTimestamp
        ) /
        86_400_000,
    )

  const lastX =
    xValues.at(-1) ?? 0

  const explicitHorizon =
    resolveHorizonSizeInDays(
      horizon,
      horizonUnit,
    )

  const intervalSize =
    xValues.length > 1
      ? Math.max(
          EPSILON,
          (
            lastX -
            xValues[0]
          ) /
            (
              xValues.length - 1
            ),
        )
      : 1

  return {
    xValues,
    forecastX:
      lastX +
      (
        explicitHorizon ??
        horizon * intervalSize
      ),
    mode: 'temporal',
    intervalSize,
  }
}

function linearRegression(
  xValues: number[],
  yValues: number[],
): RegressionResult | null {
  if (
    xValues.length !== yValues.length ||
    xValues.length < 2
  ) {
    return null
  }

  const xMean =
    mean(xValues)
  const yMean =
    mean(yValues)

  let sxx = 0
  let sxy = 0

  for (
    let index = 0;
    index < xValues.length;
    index += 1
  ) {
    const dx =
      xValues[index] - xMean
    const dy =
      yValues[index] - yMean

    sxx += dx ** 2
    sxy += dx * dy
  }

  if (sxx <= EPSILON) {
    return null
  }

  const slope =
    sxy / sxx
  const intercept =
    yMean - slope * xMean

  let totalVariation = 0
  let residualVariation = 0

  for (
    let index = 0;
    index < xValues.length;
    index += 1
  ) {
    const predicted =
      intercept +
      slope * xValues[index]

    totalVariation +=
      (
        yValues[index] -
        yMean
      ) ** 2

    residualVariation +=
      (
        yValues[index] -
        predicted
      ) ** 2
  }

  const rSquared =
    totalVariation <= EPSILON
      ? 1
      : clamp(
          1 -
            residualVariation /
              totalVariation,
          0,
          1,
        )

  const residualStandardError =
    xValues.length > 2
      ? Math.sqrt(
          Math.max(
            0,
            residualVariation /
              (
                xValues.length - 2
              ),
          ),
        )
      : null

  return {
    slope,
    intercept,
    rSquared,
    residualStandardError,
    xMean,
    sxx,
  }
}

function clampToVariableRange(
  value: number,
  variable:
    AnalyticsVariableDefinition,
): number {
  let result = value

  if (
    typeof variable.validMinimum ===
      'number'
  ) {
    result = Math.max(
      variable.validMinimum,
      result,
    )
  }

  if (
    typeof variable.validMaximum ===
      'number'
  ) {
    result = Math.min(
      variable.validMaximum,
      result,
    )
  }

  return result
}

function resolveConfidenceLevel(
  score: number,
): AnalyticsConfidence['level'] {
  if (score < 0.2) return 'very_low'
  if (score < 0.4) return 'low'
  if (score < 0.6) return 'moderate'
  if (score < 0.8) return 'high'
  return 'very_high'
}

function resolveEvidenceStrength(
  score: number,
): AnalyticsConfidence['evidenceStrength'] {
  if (score < 0.2) return 'insufficient'
  if (score < 0.4) return 'weak'
  if (score < 0.7) return 'moderate'
  if (score < 0.9) return 'strong'
  return 'very_strong'
}

function buildConfidence({
  sampleSize,
  rSquared,
  horizon,
}: {
  sampleSize: number
  rSquared: number
  horizon: number
}): AnalyticsConfidence {
  const sampleFactor =
    clamp(
      sampleSize / 12,
      0,
      1,
    )

  const horizonFactor =
    1 /
    (
      1 +
      0.15 *
        Math.max(1, horizon)
    )

  const value =
    clamp(
      0.4 * sampleFactor +
        0.4 * rSquared +
        0.2 * horizonFactor,
      0,
      1,
    )

  return {
    value,
    level:
      resolveConfidenceLevel(value),
    evidenceStrength:
      resolveEvidenceStrength(value),
    sampleSize,
    explanation:
      'Confiança composta pelo tamanho da série, ajuste linear e distância do horizonte de projeção.',
    method:
      'linear_trend_projection',
    calculatedAt:
      nowIso(),
    requiresHumanReview:
      true,
    metadata: {
      engineName:
        ENGINE_NAME,
      engineVersion:
        ENGINE_VERSION,
      rSquared,
      horizon,
    },
  }
}

function resolvePredictionType(
  variable:
    AnalyticsVariableDefinition,
  explicitType?:
    AnalyticsPredictionType,
): AnalyticsPredictionType {
  if (explicitType) {
    return explicitType
  }

  const metadataType =
    typeof variable.metadata
      .predictionType === 'string'
      ? variable.metadata
          .predictionType
      : null

  if (
    metadataType &&
    SUPPORTED_PREDICTION_TYPES
      .includes(
        metadataType as
          AnalyticsPredictionType,
      )
  ) {
    return metadataType as
      AnalyticsPredictionType
  }

  const key =
    `${variable.key} ${variable.label}`
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )

  if (key.includes('frequenc')) {
    return 'attendance_risk'
  }

  if (
    key.includes('engaj') ||
    key.includes('particip')
  ) {
    return 'engagement_risk'
  }

  if (
    key.includes('evas') ||
    key.includes('aband')
  ) {
    return 'dropout_risk'
  }

  if (
    key.includes('lacuna') ||
    key.includes('defas')
  ) {
    return 'learning_gap'
  }

  if (
    key.includes('comport') ||
    key.includes('disciplin')
  ) {
    return 'behavioral_change'
  }

  if (
    key.includes('progres') ||
    key.includes('evolu')
  ) {
    return 'learning_progress'
  }

  if (
    key.includes('desempen') ||
    key.includes('nota') ||
    key.includes('score')
  ) {
    return 'performance'
  }

  return 'other'
}

function resolveRiskLevel(
  value: number,
  thresholds:
    PredictionRiskThresholds | null | undefined,
): AnalyticsRiskLevel {
  if (!thresholds) {
    return 'undetermined'
  }

  const direction =
    thresholds.direction ??
    'higher_is_risk'

  const moderate =
    thresholds.moderate
  const high =
    thresholds.high
  const critical =
    thresholds.critical

  const hasThreshold =
    [
      moderate,
      high,
      critical,
    ].some(
      threshold =>
        typeof threshold ===
          'number' &&
        Number.isFinite(threshold),
    )

  if (!hasThreshold) {
    return 'undetermined'
  }

  if (direction === 'lower_is_risk') {
    if (
      typeof critical === 'number' &&
      value <= critical
    ) return 'critical'

    if (
      typeof high === 'number' &&
      value <= high
    ) return 'high'

    if (
      typeof moderate === 'number' &&
      value <= moderate
    ) return 'moderate'

    return 'low'
  }

  if (
    typeof critical === 'number' &&
    value >= critical
  ) return 'critical'

  if (
    typeof high === 'number' &&
    value >= high
  ) return 'high'

  if (
    typeof moderate === 'number' &&
    value >= moderate
  ) return 'moderate'

  return 'low'
}

function mergeSourceReferences(
  points: SeriesPoint[],
): AnalyticsSourceReference[] {
  const byId =
    new Map<
      string,
      AnalyticsSourceReference
    >()

  for (const point of points) {
    for (
      const source
      of point.observation
        .sourceReferences
    ) {
      if (!byId.has(source.id)) {
        byId.set(
          source.id,
          source,
        )
      }
    }
  }

  return Array.from(
    byId.values(),
  )
}

function buildDefaultTargets(
  variables:
    AnalyticsVariableDefinition[],
): PredictionTarget[] {
  return variables
    .filter(
      variable =>
        NUMERIC_VALUE_TYPES.has(
          variable.valueType,
        ) &&
        !variable.sensitive &&
        [
          'outcome',
          'dependent',
        ].includes(
          variable.role,
        ),
    )
    .map(
      variable => ({
        variableId:
          variable.id,
        predictionType:
          resolvePredictionType(
            variable,
          ),
      }),
    )
}

function buildPrediction({
  variable,
  target,
  entityId,
  points,
  horizon,
  horizonUnit,
}: {
  variable:
    AnalyticsVariableDefinition
  target: PredictionTarget
  entityId: string
  points: SeriesPoint[]
  horizon: number
  horizonUnit:
    AnalyticsGranularity | null
}): AnalyticsPredictionResult | null {
  const axis =
    buildAxis(
      points,
      horizon,
      horizonUnit,
    )

  const yValues =
    points.map(
      point => point.value,
    )

  const regression =
    linearRegression(
      axis.xValues,
      yValues,
    )

  if (!regression) {
    return null
  }

  const rawPrediction =
    regression.intercept +
    regression.slope *
      axis.forecastX

  const predictedNumericValue =
    clampToVariableRange(
      rawPrediction,
      variable,
    )

  let uncertaintyLower:
    number | null = null
  let uncertaintyUpper:
    number | null = null

  if (
    regression
      .residualStandardError !== null &&
    regression.sxx > EPSILON
  ) {
    const predictionStandardError =
      regression
        .residualStandardError *
      Math.sqrt(
        1 +
          1 / points.length +
          (
            (
              axis.forecastX -
              regression.xMean
            ) ** 2
          ) /
            regression.sxx,
      )

    uncertaintyLower =
      clampToVariableRange(
        rawPrediction -
          1.96 *
            predictionStandardError,
        variable,
      )

    uncertaintyUpper =
      clampToVariableRange(
        rawPrediction +
          1.96 *
            predictionStandardError,
        variable,
      )
  }

  const latestPoint =
    points.at(-1)!

  const sourceReferences =
    mergeSourceReferences(points)

  const confidence =
    buildConfidence({
      sampleSize:
        points.length,
      rSquared:
        regression.rSquared,
      horizon,
    })

  const predictionType =
    resolvePredictionType(
      variable,
      target.predictionType,
    )

  const limitations = [
    'A projeção usa regressão linear simples e pode não representar relações não lineares.',
    'A projeção depende da estabilidade do padrão histórico observado.',
    'Correlação temporal não representa causalidade.',
    'A previsão não autoriza decisão pedagógica automática.',
    'O resultado exige interpretação e validação profissional.',
  ]

  return {
    id:
      createStableId(
        'analytics-prediction',
        [
          variable.id,
          entityId,
          horizon,
          horizonUnit ??
            'ordinal',
          latestPoint.observation.id,
        ].join('::'),
      ),
    type:
      predictionType,
    subjectEntityId:
      entityId,
    subjectEntityType:
      latestPoint
        .observation
        .entityType,
    predictedValue:
      predictedNumericValue,
    predictedNumericValue,
    probability: null,
    classes: [],
    riskLevel:
      resolveRiskLevel(
        predictedNumericValue,
        target.riskThresholds,
      ),
    predictionHorizon:
      horizon,
    predictionHorizonUnit:
      horizonUnit,
    validUntil:
      addHorizonToDate(
        latestPoint.timestamp,
        horizon,
        horizonUnit,
      ),
    modelId:
      'eios-linear-trend-projection',
    modelVersion:
      ENGINE_VERSION,
    inputVariableIds: [
      variable.id,
    ],
    confidence,
    uncertaintyLower,
    uncertaintyUpper,
    requiresHumanReview:
      true,
    explanation: {
      summary:
        `Projeção de ${variable.label} baseada na tendência histórica disponível para a entidade analisada.`,
      reasons: [
        `Foram utilizadas ${points.length} observações válidas.`,
        `O ajuste linear apresentou R² de ${regression.rSquared.toFixed(3)}.`,
        `O horizonte considerado foi ${horizon} ${horizonUnit ?? 'passo(s) ordinal(is)'}.`,
      ],
      rulesApplied: [
        'numeric_observation_filter',
        'chronological_ordering',
        'linear_regression_projection',
        'variable_range_clamping',
        'prediction_interval_estimation',
        'mandatory_human_review',
        'causal_inference_prohibited',
      ],
      variablesUsed: [
        variable.id,
      ],
      sourceReferences,
      assumptions: [
        'A série histórica utilizada é comparável ao longo do período observado.',
        'A tendência recente pode ser aproximada linearmente no horizonte solicitado.',
      ],
      limitations,
      uncertaintyFactors: [
        'Tamanho da série histórica.',
        'Qualidade e regularidade temporal dos registros.',
        'Mudanças externas não representadas nas observações.',
        'Possível não linearidade do fenômeno educacional.',
      ],
      alternativeExplanations: [
        'Mudanças pedagógicas, institucionais ou contextuais podem alterar a trajetória observada.',
        'Eventos externos podem produzir reorganizações não capturadas pelo modelo.',
      ],
      causalityStatus:
        'descriptive_only',
      generatedAt:
        nowIso(),
      engineName:
        ENGINE_NAME,
      engineVersion:
        ENGINE_VERSION,
      metadata: {
        axisMode:
          axis.mode,
        intervalSize:
          axis.intervalSize,
        slope:
          regression.slope,
        intercept:
          regression.intercept,
        rSquared:
          regression.rSquared,
      },
    },
    limitations,
    metadata: {
      ...(target.metadata ?? {}),
      engineName:
        ENGINE_NAME,
      engineVersion:
        ENGINE_VERSION,
      rulesetVersion:
        RULESET_VERSION,
      variableId:
        variable.id,
      latestObservationId:
        latestPoint.observation.id,
      sampleSize:
        points.length,
      axisMode:
        axis.mode,
      slope:
        regression.slope,
      intercept:
        regression.intercept,
      rSquared:
        regression.rSquared,
      rawPrediction,
      clampedPrediction:
        predictedNumericValue !==
        rawPrediction,
    },
  }
}

export function runPredictionEngine(
  input: PredictionEngineInput,
): PredictionEngineResult {
  const generatedAt =
    nowIso()

  const warnings: string[] = []
  const errors: string[] = []

  try {
    const correlationId =
      normalizeRequiredText(
        input.correlationId,
        'correlationId',
      )

    const minimumObservations =
      Math.max(
        3,
        Math.floor(
          input.minimumObservations ??
            DEFAULT_MINIMUM_OBSERVATIONS,
        ),
      )

    const defaultHorizon =
      Math.max(
        1,
        Math.floor(
          input.defaultHorizon ??
            DEFAULT_HORIZON,
        ),
      )

    const variableById =
      new Map(
        input.variableDefinitions.map(
          variable => [
            variable.id,
            variable,
          ],
        ),
      )

    const targets =
      input.targets?.length
        ? input.targets
        : buildDefaultTargets(
            input.variableDefinitions,
          )

    const predictions:
      AnalyticsPredictionResult[] = []

    if (targets.length === 0) {
      warnings.push(
        'Nenhuma variável elegível para previsão foi encontrada.',
      )
    }

    for (const target of targets) {
      const variable =
        variableById.get(
          target.variableId,
        )

      if (!variable) {
        warnings.push(
          `Variável de previsão inexistente: ${target.variableId}.`,
        )
        continue
      }

      if (
        !NUMERIC_VALUE_TYPES.has(
          variable.valueType,
        )
      ) {
        warnings.push(
          `A variável ${variable.id} não é numérica e foi ignorada.`,
        )
        continue
      }

      if (
        variable.sensitive &&
        !input.allowSensitiveVariables
      ) {
        warnings.push(
          `A variável sensível ${variable.id} foi bloqueada para previsão.`,
        )
        continue
      }

      const horizon =
        Math.max(
          1,
          Math.floor(
            target.horizon ??
              defaultHorizon,
          ),
        )

      const horizonUnit =
        target.horizonUnit ??
        input.defaultHorizonUnit ??
        null

      const requiredObservations =
        Math.max(
          3,
          Math.floor(
            target.minimumObservations ??
              minimumObservations,
          ),
        )

      const eligibleObservations =
        input.observations.filter(
          observation =>
            !observation.excluded &&
            observation.variableId ===
              variable.id &&
            typeof observation.numericValue ===
              'number' &&
            Number.isFinite(
              observation.numericValue,
            ),
        )

      const entityIds =
        target.entityIds?.length
          ? uniqueStrings(
              target.entityIds,
            )
          : uniqueStrings(
              eligibleObservations.map(
                observation =>
                  observation.entityId,
              ),
            )

      for (const entityId of entityIds) {
        const points =
          buildSeries(
            eligibleObservations,
            variable.id,
            entityId,
          )

        if (
          points.length <
          requiredObservations
        ) {
          warnings.push(
            `A série ${variable.id}/${entityId} possui ${points.length} observações; mínimo exigido: ${requiredObservations}.`,
          )
          continue
        }

        const prediction =
          buildPrediction({
            variable,
            target,
            entityId,
            points,
            horizon,
            horizonUnit,
          })

        if (!prediction) {
          warnings.push(
            `Não foi possível ajustar uma tendência para ${variable.id}/${entityId}.`,
          )
          continue
        }

        predictions.push(
          prediction,
        )
      }
    }

    return {
      success:
        errors.length === 0,
      predictions,
      warnings:
        uniqueStrings(warnings),
      errors:
        uniqueStrings(errors),
      generatedAt,
      correlationId,
      metadata: {
        ...(input.metadata ?? {}),
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        rulesetVersion:
          RULESET_VERSION,
        predictionCount:
          predictions.length,
        targetCount:
          targets.length,
        requestedByUserId:
          normalizeOptionalText(
            input.requestedByUserId,
          ),
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida no Prediction Engine.'

    return {
      success: false,
      predictions: [],
      warnings: [],
      errors: [message],
      generatedAt,
      correlationId:
        normalizeOptionalText(
          input.correlationId,
        ) ??
        createStableId(
          'prediction-run',
          generatedAt,
        ),
      metadata: {
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        rulesetVersion:
          RULESET_VERSION,
        failure: true,
      },
    }
  }
}

export function getPredictionEngineInfo() {
  return {
    name:
      ENGINE_NAME,
    version:
      ENGINE_VERSION,
    rulesetVersion:
      RULESET_VERSION,
    mode:
      'statistical_deterministic' as const,
    method:
      'linear_trend_projection' as const,
    guarantees: [
      'prediction_is_not_causation',
      'mandatory_human_review',
      'professional_autonomy_preserved',
      'sensitive_variables_blocked_by_default',
      'uncertainty_reported_when_estimable',
      'deterministic_processing',
    ],
    limitations: [
      'Usa regressão linear simples.',
      'Não executa machine learning.',
      'Não produz decisão pedagógica automática.',
      'Não acessa banco de dados.',
      'Não aplica RLS.',
    ],
  }
}

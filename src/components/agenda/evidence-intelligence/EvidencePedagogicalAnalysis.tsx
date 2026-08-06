type PedagogicalDimension =
  | 'evidence'
  | 'inclusion'
  | 'intelligence'

type PedagogicalDimensionLevel =
  | 'initial'
  | 'developing'
  | 'adequate'
  | 'advanced'

type PedagogicalInsightSeverity =
  | 'information'
  | 'attention'
  | 'priority'
  | 'critical'

export type EvidencePedagogicalDimension = {
  dimension:
    PedagogicalDimension

  label:
    string

  score:
    number

  level:
    PedagogicalDimensionLevel

  explanation:
    string

  strengths:
    string[]

  gaps:
    string[]
}

export type EvidencePedagogicalInsight = {
  id:
    string

  category:
    string

  severity:
    PedagogicalInsightSeverity

  title:
    string

  description:
    string

  recommendation:
    string

  evidence:
    string[]

  priority:
    number

  requiresHumanReview:
    boolean
}

export type EvidencePedagogicalAnalysisData = {
  success:
    boolean

  summary:
    string

  evidenceScore:
    number

  inclusionScore:
    number

  intelligenceScore:
    number

  overallScore:
    number

  dimensions:
    EvidencePedagogicalDimension[]

  insights:
    EvidencePedagogicalInsight[]

  strengths:
    string[]

  improvementOpportunities:
    string[]

  recommendedNextActions:
    string[]

  requiresHumanReview:
    boolean

  generatedAt:
    string

  engine: {
    name:
      string

    version:
      string

    mode:
      string
  }

  metadata:
    Record<string, unknown>
}

type EvidencePedagogicalAnalysisProps = {
  analysis:
    EvidencePedagogicalAnalysisData

  evidenceTitle?:
    string

  className?:
    string
}

type StatusDefinition = {
  label:
    string

  description:
    string

  classes:
    string
}

const DIMENSION_LEVEL_LABELS:
  Record<
    PedagogicalDimensionLevel,
    string
  > = {
    initial:
      'Inicial',

    developing:
      'Em desenvolvimento',

    adequate:
      'Adequado',

    advanced:
      'Avançado',
  }

const SEVERITY_LABELS:
  Record<
    PedagogicalInsightSeverity,
    string
  > = {
    information:
      'Informação',

    attention:
      'Atenção',

    priority:
      'Prioridade',

    critical:
      'Crítico',
  }

function clampScore(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        value,
      ),
    ),
  )
}

function formatDateTime(
  value:
    string,
): string {
  const date =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data não informada'
  }

  return date.toLocaleString(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  )
}

function getScoreLevel(
  score:
    number,
): string {
  const normalizedScore =
    clampScore(
      score,
    )

  if (
    normalizedScore >=
    85
  ) {
    return 'Muito alto'
  }

  if (
    normalizedScore >=
    70
  ) {
    return 'Alto'
  }

  if (
    normalizedScore >=
    50
  ) {
    return 'Moderado'
  }

  if (
    normalizedScore >=
    30
  ) {
    return 'Baixo'
  }

  return 'Inicial'
}

function getScoreClasses(
  score:
    number,
): string {
  const normalizedScore =
    clampScore(
      score,
    )

  if (
    normalizedScore >=
    85
  ) {
    return [
      'border-emerald-300',
      'bg-emerald-50',
      'text-emerald-900',
    ].join(' ')
  }

  if (
    normalizedScore >=
    70
  ) {
    return [
      'border-cyan-300',
      'bg-cyan-50',
      'text-[#075F78]',
    ].join(' ')
  }

  if (
    normalizedScore >=
    50
  ) {
    return [
      'border-amber-300',
      'bg-amber-50',
      'text-amber-900',
    ].join(' ')
  }

  return [
    'border-rose-300',
    'bg-rose-50',
    'text-rose-900',
  ].join(' ')
}

function getProgressClasses(
  score:
    number,
): string {
  const normalizedScore =
    clampScore(
      score,
    )

  if (
    normalizedScore >=
    85
  ) {
    return 'bg-emerald-600'
  }

  if (
    normalizedScore >=
    70
  ) {
    return 'bg-cyan-600'
  }

  if (
    normalizedScore >=
    50
  ) {
    return 'bg-amber-500'
  }

  return 'bg-rose-600'
}

function getSeverityClasses(
  severity:
    PedagogicalInsightSeverity,
): string {
  if (
    severity ===
      'critical'
  ) {
    return [
      'border-rose-300',
      'bg-rose-50',
      'text-rose-900',
    ].join(' ')
  }

  if (
    severity ===
      'priority'
  ) {
    return [
      'border-amber-300',
      'bg-amber-50',
      'text-amber-900',
    ].join(' ')
  }

  if (
    severity ===
      'attention'
  ) {
    return [
      'border-blue-300',
      'bg-blue-50',
      'text-blue-900',
    ].join(' ')
  }

  return [
    'border-slate-300',
    'bg-slate-50',
    'text-slate-700',
  ].join(' ')
}

function getAnalysisStatus(
  analysis:
    EvidencePedagogicalAnalysisData,
): StatusDefinition {
  const overallScore =
    clampScore(
      analysis.overallScore,
    )

  const hasCriticalInsight =
    analysis.insights.some(
      insight =>
        insight.severity ===
        'critical',
    )

  if (
    analysis
      .requiresHumanReview ||
    hasCriticalInsight
  ) {
    return {
      label:
        'Em revisão',

      description:
        'A análise identificou elementos que precisam de validação humana antes de orientar decisões pedagógicas.',

      classes:
        [
          'border-amber-300',
          'bg-amber-50',
          'text-amber-900',
        ].join(' '),
    }
  }

  if (
    overallScore <
    50
  ) {
    return {
      label:
        'Necessita complementação',

      description:
        'A evidência ainda precisa de informações adicionais para sustentar uma interpretação pedagógica mais consistente.',

      classes:
        [
          'border-rose-300',
          'bg-rose-50',
          'text-rose-900',
        ].join(' '),
    }
  }

  return {
    label:
      'Análise disponível',

    description:
      'A evidência possui elementos suficientes para apoiar a reflexão pedagógica, mantendo a necessidade de interpretação profissional.',

    classes:
      [
        'border-emerald-300',
        'bg-emerald-50',
        'text-emerald-900',
      ].join(' '),
  }
}

function AnalysisList({
  items,
  emptyMessage,
}: {
  items:
    string[]

  emptyMessage:
    string
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <p
        className={[
          'text-sm leading-6',
          'text-slate-500',
        ].join(' ')}
      >
        {emptyMessage}
      </p>
    )
  }

  return (
    <div
      className="space-y-3"
    >
      {items.map(
        (
          item,
          index,
        ) => (
          <div
            key={`${index}-${item}`}
            className={[
              'grid grid-cols-[auto_1fr]',
              'gap-3',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              className={[
                'mt-2 h-2 w-2',
                'rounded-full',
                'bg-[#0B7491]',
              ].join(' ')}
            />

            <p
              className={[
                'text-sm leading-6',
                'text-slate-700',
              ].join(' ')}
            >
              {item}
            </p>
          </div>
        ),
      )}
    </div>
  )
}

function ScoreCard({
  label,
  score,
  description,
}: {
  label:
    string

  score:
    number

  description:
    string
}) {
  const normalizedScore =
    clampScore(
      score,
    )

  return (
    <article
      className={[
        'rounded-2xl border',
        'p-5',
        getScoreClasses(
          normalizedScore,
        ),
      ].join(' ')}
    >
      <div
        className={[
          'flex items-start',
          'justify-between gap-4',
        ].join(' ')}
      >
        <div>
          <p
            className={[
              'text-xs font-bold',
              'uppercase',
              'tracking-[0.14em]',
            ].join(' ')}
          >
            {label}
          </p>

          <p
            className={[
              'mt-2 text-sm',
              'font-semibold',
            ].join(' ')}
          >
            {getScoreLevel(
              normalizedScore,
            )}
          </p>
        </div>

        <p
          className={[
            'text-3xl font-bold',
          ].join(' ')}
        >
          {normalizedScore}
          <span
            className={[
              'ml-1 text-sm',
              'font-semibold',
            ].join(' ')}
          >
            /100
          </span>
        </p>
      </div>

      <div
        className={[
          'mt-4 h-2',
          'overflow-hidden',
          'rounded-full',
          'bg-white/80',
        ].join(' ')}
      >
        <div
          className={[
            'h-full rounded-full',
            'transition-all',
            getProgressClasses(
              normalizedScore,
            ),
          ].join(' ')}
          style={{
            width:
              `${normalizedScore}%`,
          }}
        />
      </div>

      <p
        className={[
          'mt-4 text-xs',
          'leading-5 opacity-80',
        ].join(' ')}
      >
        {description}
      </p>
    </article>
  )
}

function DimensionCard({
  dimension,
}: {
  dimension:
    EvidencePedagogicalDimension
}) {
  const normalizedScore =
    clampScore(
      dimension.score,
    )

  return (
    <article
      className={[
        'overflow-hidden',
        'rounded-2xl border',
        'border-slate-200',
        'bg-white',
      ].join(' ')}
    >
      <header
        className={[
          'border-b',
          'border-slate-200',
          'bg-slate-50',
          'p-5',
        ].join(' ')}
      >
        <div
          className={[
            'flex items-start',
            'justify-between gap-4',
          ].join(' ')}
        >
          <div>
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.14em]',
                'text-[#0B7491]',
              ].join(' ')}
            >
              Dimensão EDI
            </p>

            <h4
              className={[
                'mt-2 text-lg',
                'font-bold',
                'text-[#071827]',
              ].join(' ')}
            >
              {dimension.label}
            </h4>
          </div>

          <span
            className={[
              'rounded-xl border',
              'px-3 py-2',
              'text-xs font-bold',
              getScoreClasses(
                normalizedScore,
              ),
            ].join(' ')}
          >
            {normalizedScore}/100
          </span>
        </div>

        <p
          className={[
            'mt-3 text-sm',
            'font-semibold',
            'text-slate-600',
          ].join(' ')}
        >
          {
            DIMENSION_LEVEL_LABELS[
              dimension.level
            ]
          }
        </p>
      </header>

      <div
        className={[
          'space-y-5',
          'p-5',
        ].join(' ')}
      >
        <p
          className={[
            'text-sm leading-6',
            'text-slate-600',
          ].join(' ')}
        >
          {dimension.explanation}
        </p>

        <section>
          <h5
            className={[
              'text-xs font-bold',
              'uppercase',
              'tracking-[0.14em]',
              'text-slate-500',
            ].join(' ')}
          >
            Aspectos identificados
          </h5>

          <div
            className="mt-3"
          >
            <AnalysisList
              items={
                dimension.strengths
              }
              emptyMessage="Nenhum aspecto positivo específico foi identificado nesta dimensão."
            />
          </div>
        </section>

        <section>
          <h5
            className={[
              'text-xs font-bold',
              'uppercase',
              'tracking-[0.14em]',
              'text-slate-500',
            ].join(' ')}
          >
            Lacunas observadas
          </h5>

          <div
            className="mt-3"
          >
            <AnalysisList
              items={
                dimension.gaps
              }
              emptyMessage="Nenhuma lacuna específica foi registrada nesta dimensão."
            />
          </div>
        </section>
      </div>
    </article>
  )
}

function InsightCard({
  insight,
}: {
  insight:
    EvidencePedagogicalInsight
}) {
  return (
    <article
      className={[
        'rounded-2xl border',
        'p-5',
        getSeverityClasses(
          insight.severity,
        ),
      ].join(' ')}
    >
      <div
        className={[
          'flex flex-col gap-3',
          'sm:flex-row',
          'sm:items-start',
          'sm:justify-between',
        ].join(' ')}
      >
        <div>
          <p
            className={[
              'text-xs font-bold',
              'uppercase',
              'tracking-[0.14em]',
              'opacity-80',
            ].join(' ')}
          >
            {insight.category}
          </p>

          <h4
            className={[
              'mt-2 text-base',
              'font-bold',
            ].join(' ')}
          >
            {insight.title}
          </h4>
        </div>

        <span
          className={[
            'w-fit rounded-lg',
            'border border-current/20',
            'bg-white/60',
            'px-3 py-2',
            'text-xs font-bold',
          ].join(' ')}
        >
          {
            SEVERITY_LABELS[
              insight.severity
            ]
          }
        </span>
      </div>

      <p
        className={[
          'mt-4 text-sm',
          'leading-6',
        ].join(' ')}
      >
        {insight.description}
      </p>

      {insight.evidence.length >
      0 ? (
        <section
          className={[
            'mt-4 rounded-xl',
            'border border-current/15',
            'bg-white/50 p-4',
          ].join(' ')}
        >
          <p
            className={[
              'text-xs font-bold',
              'uppercase',
              'tracking-[0.14em]',
            ].join(' ')}
          >
            Elementos considerados
          </p>

          <div
            className="mt-3"
          >
            <AnalysisList
              items={
                insight.evidence
              }
              emptyMessage=""
            />
          </div>
        </section>
      ) : null}

      <section
        className={[
          'mt-4 rounded-xl',
          'border border-current/15',
          'bg-white/70 p-4',
        ].join(' ')}
      >
        <p
          className={[
            'text-xs font-bold',
            'uppercase',
            'tracking-[0.14em]',
          ].join(' ')}
        >
          Recomendação
        </p>

        <p
          className={[
            'mt-2 text-sm',
            'font-semibold',
            'leading-6',
          ].join(' ')}
        >
          {insight.recommendation}
        </p>
      </section>

      {insight
        .requiresHumanReview ? (
        <p
          className={[
            'mt-4 text-xs',
            'font-bold uppercase',
            'tracking-[0.12em]',
          ].join(' ')}
        >
          Requer validação humana
        </p>
      ) : null}
    </article>
  )
}

export function EvidencePedagogicalAnalysis({
  analysis,
  evidenceTitle,
  className,
}: EvidencePedagogicalAnalysisProps) {
  const status =
    getAnalysisStatus(
      analysis,
    )

  const orderedInsights =
    [...analysis.insights]
      .sort(
        (
          first,
          second,
        ) =>
          first.priority -
          second.priority,
      )

  return (
    <section
      aria-label="Análise pedagógica EDI"
      className={[
        'overflow-hidden',
        'rounded-[1.75rem]',
        'border border-slate-200',
        'bg-white shadow-sm',
        className ??
          '',
      ].join(' ')}
    >
      <header
        className={[
          'border-b',
          'border-slate-200',
          'bg-[#071827]',
          'px-5 py-5',
          'text-white',
          'sm:px-7',
        ].join(' ')}
      >
        <p
          className={[
            'text-xs font-bold',
            'uppercase',
            'tracking-[0.18em]',
            'text-cyan-300',
          ].join(' ')}
        >
          Evidence Intelligence
        </p>

        <h3
          className={[
            'mt-2 text-2xl',
            'font-bold',
          ].join(' ')}
        >
          Análise pedagógica EDI
        </h3>

        {evidenceTitle ? (
          <p
            className={[
              'mt-2 text-sm',
              'font-semibold',
              'text-slate-300',
            ].join(' ')}
          >
            {evidenceTitle}
          </p>
        ) : null}

        <p
          className={[
            'mt-3 max-w-3xl',
            'text-sm leading-6',
            'text-slate-300',
          ].join(' ')}
        >
          Interpretação automatizada para apoiar a reflexão profissional. Os resultados não substituem a avaliação do professor ou da equipe pedagógica.
        </p>
      </header>

      <div
        className={[
          'space-y-6',
          'p-5 sm:p-7',
        ].join(' ')}
      >
        <section
          className={[
            'rounded-2xl border',
            'p-5',
            status.classes,
          ].join(' ')}
        >
          <div
            className={[
              'flex flex-col gap-3',
              'sm:flex-row',
              'sm:items-start',
              'sm:justify-between',
            ].join(' ')}
          >
            <div>
              <p
                className={[
                  'text-xs font-bold',
                  'uppercase',
                  'tracking-[0.14em]',
                ].join(' ')}
              >
                Status EDI
              </p>

              <p
                className={[
                  'mt-2 text-lg',
                  'font-bold',
                ].join(' ')}
              >
                {status.label}
              </p>
            </div>

            <span
              className={[
                'w-fit rounded-lg',
                'border border-current/20',
                'bg-white/60',
                'px-3 py-2',
                'text-xs font-bold',
              ].join(' ')}
            >
              {analysis
                .requiresHumanReview
                ? 'Revisão necessária'
                : 'Revisão não indicada'}
            </span>
          </div>

          <p
            className={[
              'mt-3 text-sm',
              'leading-6',
            ].join(' ')}
          >
            {status.description}
          </p>
        </section>

        <section
          className={[
            'rounded-2xl border',
            'border-slate-200',
            'bg-slate-50 p-5',
          ].join(' ')}
        >
          <p
            className={[
              'text-xs font-bold',
              'uppercase',
              'tracking-[0.14em]',
              'text-[#0B7491]',
            ].join(' ')}
          >
            Resumo executivo
          </p>

          <p
            className={[
              'mt-3 text-sm',
              'leading-7',
              'text-slate-700',
            ].join(' ')}
          >
            {analysis.summary ||
              'O motor não produziu um resumo pedagógico para esta execução.'}
          </p>
        </section>

        <section>
          <div
            className={[
              'flex flex-col gap-2',
              'sm:flex-row',
              'sm:items-end',
              'sm:justify-between',
            ].join(' ')}
          >
            <div>
              <p
                className={[
                  'text-xs font-bold',
                  'uppercase',
                  'tracking-[0.14em]',
                  'text-[#0B7491]',
                ].join(' ')}
              >
                Índices pedagógicos
              </p>

              <h4
                className={[
                  'mt-2 text-xl',
                  'font-bold',
                  'text-[#071827]',
                ].join(' ')}
              >
                Leitura geral da evidência
              </h4>
            </div>

            <p
              className={[
                'text-xs',
                'font-semibold',
                'text-slate-500',
              ].join(' ')}
            >
              Gerado em{' '}
              {formatDateTime(
                analysis.generatedAt,
              )}
            </p>
          </div>

          <div
            className={[
              'mt-4 grid gap-4',
              'sm:grid-cols-2',
              'xl:grid-cols-4',
            ].join(' ')}
          >
            <ScoreCard
              label="Índice EDI geral"
              score={
                analysis.overallScore
              }
              description="Síntese composta das dimensões de Evidência, Inclusão e Inteligência."
            />

            <ScoreCard
              label="Evidência"
              score={
                analysis.evidenceScore
              }
              description="Qualidade do registro, contexto, rastreabilidade e capacidade de demonstrar a prática."
            />

            <ScoreCard
              label="Inclusão"
              score={
                analysis.inclusionScore
              }
              description="Presença de elementos relacionados à participação, acesso, diversidade e necessidades dos estudantes."
            />

            <ScoreCard
              label="Inteligência"
              score={
                analysis.intelligenceScore
              }
              description="Potencial do registro para orientar análise, intervenção e continuidade pedagógica."
            />
          </div>
        </section>

        {analysis.dimensions.length >
        0 ? (
          <section>
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.14em]',
                'text-[#0B7491]',
              ].join(' ')}
            >
              Dimensões do Framework EDI
            </p>

            <div
              className={[
                'mt-4 grid gap-4',
                'xl:grid-cols-3',
              ].join(' ')}
            >
              {analysis.dimensions.map(
                dimension => (
                  <DimensionCard
                    key={
                      dimension.dimension
                    }
                    dimension={
                      dimension
                    }
                  />
                ),
              )}
            </div>
          </section>
        ) : null}

        <section
          className={[
            'grid gap-4',
            'lg:grid-cols-2',
          ].join(' ')}
        >
          <article
            className={[
              'rounded-2xl border',
              'border-emerald-200',
              'bg-emerald-50 p-5',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.14em]',
                'text-emerald-800',
              ].join(' ')}
            >
              Pontos fortes
            </p>

            <div
              className="mt-4"
            >
              <AnalysisList
                items={
                  analysis.strengths
                }
                emptyMessage="Nenhum ponto forte específico foi registrado nesta execução."
              />
            </div>
          </article>

          <article
            className={[
              'rounded-2xl border',
              'border-amber-200',
              'bg-amber-50 p-5',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.14em]',
                'text-amber-800',
              ].join(' ')}
            >
              Pontos de atenção
            </p>

            <div
              className="mt-4"
            >
              <AnalysisList
                items={
                  analysis
                    .improvementOpportunities
                }
                emptyMessage="Nenhum ponto de atenção específico foi registrado nesta execução."
              />
            </div>
          </article>
        </section>

        <section
          className={[
            'rounded-2xl border',
            'border-cyan-200',
            'bg-cyan-50 p-5',
          ].join(' ')}
        >
          <p
            className={[
              'text-xs font-bold',
              'uppercase',
              'tracking-[0.14em]',
              'text-[#075F78]',
            ].join(' ')}
          >
            Próximas ações recomendadas
          </p>

          <div
            className="mt-4"
          >
            <AnalysisList
              items={
                analysis
                  .recommendedNextActions
              }
              emptyMessage="O motor não indicou uma próxima ação específica para esta evidência."
            />
          </div>
        </section>

        {orderedInsights.length >
        0 ? (
          <section>
            <p
              className={[
                'text-xs font-bold',
                'uppercase',
                'tracking-[0.14em]',
                'text-[#0B7491]',
              ].join(' ')}
            >
              Diagnósticos e recomendações
            </p>

            <div
              className={[
                'mt-4 grid gap-4',
                'xl:grid-cols-2',
              ].join(' ')}
            >
              {orderedInsights.map(
                insight => (
                  <InsightCard
                    key={
                      insight.id
                    }
                    insight={
                      insight
                    }
                  />
                ),
              )}
            </div>
          </section>
        ) : null}

        <footer
          className={[
            'rounded-2xl border',
            'border-slate-200',
            'bg-slate-50 p-5',
          ].join(' ')}
        >
          <div
            className={[
              'grid gap-4',
              'sm:grid-cols-3',
            ].join(' ')}
          >
            <div>
              <p
                className={[
                  'text-[10px] font-bold',
                  'uppercase',
                  'tracking-[0.14em]',
                  'text-slate-400',
                ].join(' ')}
              >
                Motor
              </p>

              <p
                className={[
                  'mt-2 text-sm',
                  'font-bold',
                  'text-[#071827]',
                ].join(' ')}
              >
                {analysis.engine.name}
              </p>
            </div>

            <div>
              <p
                className={[
                  'text-[10px] font-bold',
                  'uppercase',
                  'tracking-[0.14em]',
                  'text-slate-400',
                ].join(' ')}
              >
                Versão
              </p>

              <p
                className={[
                  'mt-2 text-sm',
                  'font-bold',
                  'text-[#071827]',
                ].join(' ')}
              >
                {analysis.engine.version}
              </p>
            </div>

            <div>
              <p
                className={[
                  'text-[10px] font-bold',
                  'uppercase',
                  'tracking-[0.14em]',
                  'text-slate-400',
                ].join(' ')}
              >
                Modo
              </p>

              <p
                className={[
                  'mt-2 break-words',
                  'text-sm font-bold',
                  'text-[#071827]',
                ].join(' ')}
              >
                {analysis.engine.mode}
              </p>
            </div>
          </div>

          <p
            className={[
              'mt-5 border-t',
              'border-slate-200',
              'pt-4 text-xs',
              'leading-5',
              'text-slate-500',
            ].join(' ')}
          >
            Esta leitura utiliza apenas os dados disponíveis na evidência e pode apresentar limitações contextuais. Recomendações automatizadas devem ser interpretadas à luz do planejamento, da turma e da experiência profissional.
          </p>
        </footer>
      </div>
    </section>
  )
}
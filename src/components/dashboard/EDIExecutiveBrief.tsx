import Link from 'next/link'

import type {
  TeacherPerformanceSnapshot,
  TeacherSnapshotNextAction,
  TeacherSnapshotRecommendation,
  TeacherSnapshotRiskSeverity,
} from '@/lib/agenda/services/teacher-intelligence.service'

export type EDIExecutiveBriefProps = {
  snapshot:
    TeacherPerformanceSnapshot | null

  loading?: boolean

  className?: string
}

type BriefStatus = {
  label: string
  description: string
  badgeClassName: string
  markerClassName: string
}

type BriefAction = {
  title: string
  description: string
  href: string
  actionLabel: string
  severity: TeacherSnapshotRiskSeverity
}

const STATUS_PRESENTATION:
  Record<string, BriefStatus> = {
    excellent: {
      label:
        'Operação excelente',

      description:
        'O ciclo docente apresenta organização, equilíbrio e boa cobertura dos registros.',

      badgeClassName:
        'border-emerald-200 bg-emerald-50 text-emerald-800',

      markerClassName:
        'bg-emerald-600',
    },

    stable: {
      label:
        'Operação estável',

      description:
        'O ciclo está organizado, com pontos pontuais que podem ser acompanhados.',

      badgeClassName:
        'border-cyan-200 bg-cyan-50 text-cyan-800',

      markerClassName:
        'bg-cyan-600',
    },

    attention: {
      label:
        'Atenção necessária',

      description:
        'Existem pendências ou riscos que devem ser priorizados para preservar o ciclo.',

      badgeClassName:
        'border-amber-200 bg-amber-50 text-amber-900',

      markerClassName:
        'bg-amber-500',
    },

    critical: {
      label:
        'Situação crítica',

      description:
        'O ciclo apresenta riscos importantes que exigem decisão e acompanhamento.',

      badgeClassName:
        'border-red-200 bg-red-50 text-red-800',

      markerClassName:
        'bg-red-600',
    },
  }

const SEVERITY_ORDER:
  Record<TeacherSnapshotRiskSeverity, number> = {
    critical:
      0,

    high:
      1,

    medium:
      2,

    low:
      3,
  }

function clampScore(
  value: number,
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

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    'pt-BR',
  ).format(
    Math.max(
      0,
      Math.round(
        value,
      ),
    ),
  )
}

function getStatusPresentation(
  status: string,
): BriefStatus {
  return (
    STATUS_PRESENTATION[
      status
    ]
    ?? {
      label:
        'Situação em acompanhamento',

      description:
        'O EIOS está acompanhando os indicadores disponíveis para este ciclo.',

      badgeClassName:
        'border-slate-200 bg-slate-50 text-slate-700',

      markerClassName:
        'bg-slate-500',
    }
  )
}

function getSeverityClasses(
  severity:
    TeacherSnapshotRiskSeverity,
): string {
  if (
    severity ===
    'critical'
  ) {
    return (
      'border-red-200 '
      + 'bg-red-50 '
      + 'text-red-800'
    )
  }

  if (
    severity ===
    'high'
  ) {
    return (
      'border-orange-200 '
      + 'bg-orange-50 '
      + 'text-orange-800'
    )
  }

  if (
    severity ===
    'medium'
  ) {
    return (
      'border-amber-200 '
      + 'bg-amber-50 '
      + 'text-amber-900'
    )
  }

  return (
    'border-slate-200 '
    + 'bg-slate-50 '
    + 'text-slate-700'
  )
}

function mapAreaToHref(
  area:
    string | null | undefined,
): string {
  const normalizedArea =
    area
      ?.trim()
      .toLowerCase()
    ?? ''

  if (
    normalizedArea.includes(
      'evidence',
    )
    || normalizedArea.includes(
      'evidência',
    )
  ) {
    return '/agenda/evidencias'
  }

  if (
    normalizedArea.includes(
      'planning',
    )
    || normalizedArea.includes(
      'planejamento',
    )
  ) {
    return '/agenda/planejamento'
  }

  if (
    normalizedArea.includes(
      'task',
    )
    || normalizedArea.includes(
      'tarefa',
    )
  ) {
    return '/agenda/tarefas'
  }

  if (
    normalizedArea.includes(
      'calendar',
    )
    || normalizedArea.includes(
      'agenda',
    )
    || normalizedArea.includes(
      'calendário',
    )
  ) {
    return '/agenda/calendario'
  }

  if (
    normalizedArea.includes(
      'lesson',
    )
    || normalizedArea.includes(
      'aula',
    )
  ) {
    return '/agenda/aulas'
  }

  return '/agenda/dashboard'
}

function selectPrimaryRecommendation(
  recommendations:
    TeacherSnapshotRecommendation[],
): TeacherSnapshotRecommendation | null {
  return [
    ...recommendations,
  ].sort(
    (
      first,
      second,
    ) =>
      SEVERITY_ORDER[
        first.priority
      ]
      - SEVERITY_ORDER[
        second.priority
      ],
  )[0] ?? null
}

function selectPrimaryAction(
  actions:
    TeacherSnapshotNextAction[],
): TeacherSnapshotNextAction | null {
  return [
    ...actions,
  ].sort(
    (
      first,
      second,
    ) =>
      SEVERITY_ORDER[
        first.priority
      ]
      - SEVERITY_ORDER[
        second.priority
      ],
  )[0] ?? null
}

function buildPrimaryAction(
  snapshot:
    TeacherPerformanceSnapshot,
): BriefAction | null {
  const recommendation =
    selectPrimaryRecommendation(
      snapshot.recommendations,
    )

  if (
    recommendation
  ) {
    return {
      title:
        recommendation.description,

      description:
        recommendation.professional_decision_required
          ? 'A recomendação exige análise e decisão profissional antes de qualquer alteração.'
          : 'Recomendação produzida a partir dos indicadores disponíveis.',

      href:
        mapAreaToHref(
          recommendation.area,
        ),

      actionLabel:
        'Abrir módulo relacionado',

      severity:
        recommendation.priority,
    }
  }

  const nextAction =
    selectPrimaryAction(
      snapshot.next_actions,
    )

  if (
    nextAction
  ) {
    return {
      title:
        nextAction.title,

      description:
        'Esta é a próxima ação operacional priorizada pelo EIOS.',

      href:
        mapAreaToHref(
          nextAction.type,
        ),

      actionLabel:
        'Executar próxima ação',

      severity:
        nextAction.priority,
    }
  }

  return null
}

function BriefSkeleton() {
  return (
    <section
      aria-label="Carregando resumo executivo EDI"
      aria-busy="true"
      className="
        animate-pulse
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      <div
        className="
          border-b
          border-slate-100
          p-5
          sm:p-7
        "
      >
        <div
          className="
            h-3
            w-40
            rounded
            bg-slate-200
          "
        />

        <div
          className="
            mt-4
            h-8
            w-72
            max-w-full
            rounded
            bg-slate-200
          "
        />

        <div
          className="
            mt-4
            h-4
            w-full
            max-w-2xl
            rounded
            bg-slate-100
          "
        />
      </div>

      <div
        className="
          grid
          gap-4
          p-5
          sm:grid-cols-2
          sm:p-7
          xl:grid-cols-4
        "
      >
        {Array.from({
          length:
            4,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={
                index
              }
              className="
                h-32
                rounded-2xl
                bg-slate-100
              "
            />
          ),
        )}
      </div>
    </section>
  )
}

export default function EDIExecutiveBrief({
  snapshot,
  loading = false,
  className = '',
}: EDIExecutiveBriefProps) {
  if (
    loading
    && !snapshot
  ) {
    return (
      <div
        className={
          className
        }
      >
        <BriefSkeleton />
      </div>
    )
  }

  if (
    !snapshot
  ) {
    return null
  }

  const status =
    getStatusPresentation(
      snapshot
        .summary
        .operational_status,
    )

  const primaryAction =
    buildPrimaryAction(
      snapshot,
    )

  const metrics = [
    {
      label:
        'Evidências pendentes',

      value:
        snapshot
          .evidences
          .total_pending,

      description:
        'Registros que ainda exigem acompanhamento.',
    },
    {
      label:
        'Tarefas críticas',

      value:
        snapshot
          .tasks
          .critical,

      description:
        'Tarefas classificadas com prioridade crítica.',
    },
    {
      label:
        'Conflitos de agenda',

      value:
        snapshot
          .calendar
          .overlaps,

      description:
        'Sobreposições identificadas no período.',
    },
    {
      label:
        'Próximas ações',

      value:
        snapshot
          .summary
          .next_action_count,

      description:
        'Ações priorizadas para o ciclo atual.',
    },
  ]

  return (
    <section
      aria-labelledby="edi-executive-brief-title"
      className={`
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-[0_22px_70px_-50px_rgba(15,23,42,0.6)]
        ${className}
      `}
    >
      <header
        className="
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-7
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-start
            lg:justify-between
          "
        >
          <div
            className="
              max-w-3xl
            "
          >
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-cyan-700
              "
            >
              Leitura executiva do EIOS
            </p>

            <h2
              id="edi-executive-brief-title"
              className="
                mt-2
                text-2xl
                font-bold
                tracking-tight
                text-slate-950
              "
            >
              Síntese da sua situação operacional
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-600
              "
            >
              O EIOS consolidou planejamento, evidências,
              tarefas e calendário para indicar o que exige
              maior atenção neste momento.
            </p>
          </div>

          <div
            className={`
              inline-flex
              items-center
              gap-2
              self-start
              rounded-full
              border
              px-3
              py-2
              text-xs
              font-bold
              ${status.badgeClassName}
            `}
          >
            <span
              aria-hidden="true"
              className={`
                h-2
                w-2
                rounded-full
                ${status.markerClassName}
              `}
            />

            {status.label}
          </div>
        </div>

        <div
          className="
            mt-5
            flex
            flex-col
            gap-4
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.14em]
                text-slate-500
              "
            >
              Score operacional
            </p>

            <p
              className="
                mt-1
                text-4xl
                font-bold
                tracking-tight
                text-slate-950
              "
            >
              {clampScore(
                snapshot
                  .summary
                  .overall_score,
              )}
            </p>
          </div>

          <p
            className="
              max-w-2xl
              text-sm
              leading-6
              text-slate-600
            "
          >
            {status.description}
          </p>
        </div>
      </header>

      <div
        className="
          grid
          gap-px
          bg-slate-200
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {metrics.map(
          metric => (
            <article
              key={
                metric.label
              }
              className="
                bg-white
                p-5
                sm:p-6
              "
            >
              <p
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  text-slate-950
                "
              >
                {formatNumber(
                  metric.value,
                )}
              </p>

              <h3
                className="
                  mt-2
                  text-sm
                  font-bold
                  text-slate-800
                "
              >
                {metric.label}
              </h3>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                {metric.description}
              </p>
            </article>
          ),
        )}
      </div>

      <div
        className="
          border-t
          border-slate-100
          p-5
          sm:p-7
        "
      >
        {primaryAction ? (
          <article
            className={`
              rounded-2xl
              border
              p-5
              ${getSeverityClasses(
                primaryAction
                  .severity,
              )}
            `}
          >
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.16em]
                opacity-75
              "
            >
              Prioridade recomendada
            </p>

            <h3
              className="
                mt-2
                text-lg
                font-bold
              "
            >
              {primaryAction.title}
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                opacity-85
              "
            >
              {primaryAction.description}
            </p>

            <Link
              href={
                primaryAction.href
              }
              className="
                mt-5
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-current
                bg-white/70
                px-4
                py-2.5
                text-sm
                font-bold
                transition
                hover:bg-white
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-current
                focus-visible:ring-offset-2
              "
            >
              {primaryAction.actionLabel}
            </Link>
          </article>
        ) : (
          <div
            className="
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              p-5
            "
          >
            <p
              className="
                text-sm
                font-bold
                text-emerald-800
              "
            >
              Nenhuma ação prioritária foi identificada.
            </p>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-emerald-700
              "
            >
              Mantenha os registros atualizados para preservar
              a qualidade da leitura operacional.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
'use client'

import {
  useMemo,
  useState,
} from 'react'

import type {
  PedagogicalHumanReviewStatus,
  PedagogicalIntervention,
  PedagogicalInterventionAction,
  PedagogicalInterventionPriority,
  PedagogicalInterventionRiskLevel,
  PedagogicalInterventionStatus,
  PedagogicalTeacherDecisionType,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.types'

type PedagogicalCopilotPanelProps = {
  intervention:
    PedagogicalIntervention

  className?: string

  disabled?: boolean

  onAccept?: (
    intervention:
      PedagogicalIntervention,
  ) => void | Promise<void>

  onAdapt?: (
    intervention:
      PedagogicalIntervention,
  ) => void | Promise<void>

  onReject?: (
    intervention:
      PedagogicalIntervention,
  ) => void | Promise<void>
}

type DecisionAction =
  | 'accepted'
  | 'adapted'
  | 'rejected'

type SectionProps = {
  title: string
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

type BadgeDefinition = {
  label: string
  classes: string
}

const PRIORITY_DEFINITIONS:
  Record<
    PedagogicalInterventionPriority,
    BadgeDefinition
  > = {
    low: {
      label:
        'Baixa',

      classes:
        'border-slate-300 bg-slate-50 text-slate-700',
    },

    moderate: {
      label:
        'Moderada',

      classes:
        'border-cyan-300 bg-cyan-50 text-cyan-800',
    },

    high: {
      label:
        'Alta',

      classes:
        'border-amber-300 bg-amber-50 text-amber-900',
    },

    urgent: {
      label:
        'Urgente',

      classes:
        'border-orange-300 bg-orange-50 text-orange-900',
    },

    critical: {
      label:
        'Crítica',

      classes:
        'border-red-300 bg-red-50 text-red-900',
    },
  }

const RISK_DEFINITIONS:
  Record<
    PedagogicalInterventionRiskLevel,
    BadgeDefinition
  > = {
    none: {
      label:
        'Sem risco identificado',

      classes:
        'border-emerald-300 bg-emerald-50 text-emerald-800',
    },

    low: {
      label:
        'Risco baixo',

      classes:
        'border-cyan-300 bg-cyan-50 text-cyan-800',
    },

    moderate: {
      label:
        'Risco moderado',

      classes:
        'border-amber-300 bg-amber-50 text-amber-900',
    },

    high: {
      label:
        'Risco alto',

      classes:
        'border-orange-300 bg-orange-50 text-orange-900',
    },

    critical: {
      label:
        'Risco crítico',

      classes:
        'border-red-300 bg-red-50 text-red-900',
    },

    undetermined: {
      label:
        'Risco não determinado',

      classes:
        'border-slate-300 bg-slate-50 text-slate-700',
    },
  }

const STATUS_LABELS:
  Record<
    PedagogicalInterventionStatus,
    string
  > = {
    draft:
      'Rascunho',

    generated:
      'Gerada',

    awaiting_teacher_decision:
      'Aguardando decisão docente',

    accepted:
      'Aceita',

    adapted:
      'Adaptada',

    rejected:
      'Rejeitada',

    scheduled:
      'Agendada',

    in_progress:
      'Em andamento',

    paused:
      'Pausada',

    completed:
      'Concluída',

    cancelled:
      'Cancelada',

    under_evaluation:
      'Em avaliação',

    evaluated:
      'Avaliada',

    archived:
      'Arquivada',
  }

const HUMAN_REVIEW_LABELS:
  Record<
    PedagogicalHumanReviewStatus,
    string
  > = {
    not_required:
      'Não obrigatória',

    pending:
      'Pendente',

    in_review:
      'Em revisão',

    approved:
      'Aprovada',

    approved_with_changes:
      'Aprovada com alterações',

    changes_requested:
      'Alterações solicitadas',

    rejected:
      'Rejeitada',
  }

const TEACHER_DECISION_LABELS:
  Record<
    PedagogicalTeacherDecisionType,
    string
  > = {
    pending:
      'Decisão pendente',

    accepted:
      'Intervenção aceita',

    adapted:
      'Intervenção adaptada',

    rejected:
      'Intervenção rejeitada',
  }

function formatDateTime(
  value:
    string | null | undefined,
): string {
  if (!value) {
    return 'Não informado'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data inválida'
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

function formatDate(
  value:
    string | null | undefined,
): string {
  if (!value) {
    return 'Não informado'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data inválida'
  }

  return date.toLocaleDateString(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',
    },
  )
}

function formatPercentage(
  value:
    number | null | undefined,
): string {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 'Não informado'
  }

  return `${Math.round(value)}%`
}

function translateCode(
  value: string,
): string {
  return value
    .replaceAll(
      '_',
      ' ',
    )
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase(),
    )
}

function Section({
  title,
  description,
  children,
  defaultOpen = false,
}: SectionProps) {
  return (
    <details
      className={[
        'group overflow-hidden rounded-2xl',
        'border border-slate-200',
        'bg-white shadow-sm',
      ].join(' ')}
      open={defaultOpen}
    >
      <summary
        className={[
          'flex cursor-pointer list-none',
          'items-start justify-between gap-4',
          'px-5 py-4',
          'transition hover:bg-slate-50',
        ].join(' ')}
      >
        <span className="min-w-0">
          <span
            className={[
              'block text-base font-semibold',
              'text-[#092A45]',
            ].join(' ')}
          >
            {title}
          </span>

          {description ? (
            <span
              className={[
                'mt-1 block text-sm',
                'leading-6 text-slate-600',
              ].join(' ')}
            >
              {description}
            </span>
          ) : null}
        </span>

        <span
          aria-hidden="true"
          className={[
            'mt-1 text-xl text-slate-500',
            'transition-transform',
            'group-open:rotate-45',
          ].join(' ')}
        >
          +
        </span>
      </summary>

      <div
        className={[
          'border-t border-slate-100',
          'px-5 py-5',
        ].join(' ')}
      >
        {children}
      </div>
    </details>
  )
}

function Badge({
  definition,
}: {
  definition: BadgeDefinition
}) {
  return (
    <span
      className={[
        'inline-flex items-center',
        'rounded-full border',
        'px-3 py-1',
        'text-xs font-semibold',
        definition.classes,
      ].join(' ')}
    >
      {definition.label}
    </span>
  )
}

function EmptyState({
  message,
}: {
  message: string
}) {
  return (
    <p
      className={[
        'rounded-xl border',
        'border-dashed border-slate-300',
        'bg-slate-50 px-4 py-3',
        'text-sm text-slate-600',
      ].join(' ')}
    >
      {message}
    </p>
  )
}

function TextList({
  items,
  emptyMessage,
}: {
  items: string[]
  emptyMessage: string
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        message={emptyMessage}
      />
    )
  }

  return (
    <ul className="space-y-2">
      {items.map(
        (
          item,
          index,
        ) => (
          <li
            key={`${item}-${index}`}
            className={[
              'flex gap-3',
              'text-sm leading-6',
              'text-slate-700',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              className={[
                'mt-2 h-1.5 w-1.5',
                'shrink-0 rounded-full',
                'bg-[#087E8B]',
              ].join(' ')}
            />

            <span>{item}</span>
          </li>
        ),
      )}
    </ul>
  )
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) {
  return (
    <div
      className={[
        'rounded-2xl border',
        'border-slate-200',
        'bg-slate-50 p-4',
      ].join(' ')}
    >
      <p
        className={[
          'text-xs font-semibold',
          'uppercase tracking-[0.14em]',
          'text-slate-500',
        ].join(' ')}
      >
        {label}
      </p>

      <p
        className={[
          'mt-2 text-lg font-bold',
          'text-[#092A45]',
        ].join(' ')}
      >
        {value}
      </p>

      {description ? (
        <p
          className={[
            'mt-1 text-xs leading-5',
            'text-slate-500',
          ].join(' ')}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}

function ActionCard({
  action,
}: {
  action:
    PedagogicalInterventionAction
}) {
  return (
    <article
      className={[
        'rounded-2xl border',
        'border-slate-200',
        'bg-slate-50 p-4',
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
              'text-xs font-semibold',
              'uppercase tracking-[0.12em]',
              'text-[#087E8B]',
            ].join(' ')}
          >
            Ação {action.sequence}
          </p>

          <h4
            className={[
              'mt-1 text-base font-semibold',
              'text-[#092A45]',
            ].join(' ')}
          >
            {action.title}
          </h4>
        </div>

        <span
          className={[
            'inline-flex w-fit',
            'rounded-full border',
            'border-slate-300',
            'bg-white px-3 py-1',
            'text-xs font-medium',
            'text-slate-700',
          ].join(' ')}
        >
          {translateCode(
            action.executionStatus,
          )}
        </span>
      </div>

      <p
        className={[
          'mt-3 text-sm leading-6',
          'text-slate-700',
        ].join(' ')}
      >
        {action.description}
      </p>

      <div
        className={[
          'mt-4 grid gap-3',
          'sm:grid-cols-2',
        ].join(' ')}
      >
        <MetricCard
          label="Início previsto"
          value={
            formatDateTime(
              action.plannedStartAt,
            )
          }
        />

        <MetricCard
          label="Término previsto"
          value={
            formatDateTime(
              action.plannedEndAt,
            )
          }
        />
      </div>

      {action.teacherInstructions.length > 0 ? (
        <div className="mt-4">
          <p
            className={[
              'mb-2 text-sm font-semibold',
              'text-[#092A45]',
            ].join(' ')}
          >
            Orientações ao professor
          </p>

          <TextList
            items={
              action.teacherInstructions
            }
            emptyMessage="Nenhuma orientação cadastrada."
          />
        </div>
      ) : null}
    </article>
  )
}

export default function PedagogicalCopilotPanel({
  intervention,
  className = '',
  disabled = false,
  onAccept,
  onAdapt,
  onReject,
}: PedagogicalCopilotPanelProps) {
  const [
    decisionInProgress,
    setDecisionInProgress,
  ] = useState<
    DecisionAction | null
  >(null)

  const [
    localMessage,
    setLocalMessage,
  ] = useState<
    string | null
  >(null)

  const priorityDefinition =
    PRIORITY_DEFINITIONS[
      intervention.priority
    ]

  const riskDefinition =
    RISK_DEFINITIONS[
      intervention.diagnostic
        .risk
        .level
    ]

  const completedActionCount =
    useMemo(
      () =>
        intervention.plan.actions
          .filter(
            action =>
              action
                .executionStatus ===
              'completed',
          )
          .length,
      [
        intervention.plan.actions,
      ],
    )

  const canDecide =
    !disabled &&
    intervention.teacherDecision
      .decision === 'pending'

  async function handleDecision(
    decision:
      DecisionAction,
  ) {
    if (
      !canDecide ||
      decisionInProgress
    ) {
      return
    }

    const callback =
      decision === 'accepted'
        ? onAccept
        : decision === 'adapted'
          ? onAdapt
          : onReject

    if (!callback) {
      setLocalMessage(
        'A ação ainda não está conectada à API de persistência.',
      )

      return
    }

    setDecisionInProgress(
      decision,
    )

    setLocalMessage(null)

    try {
      await callback(intervention)

      setLocalMessage(
        decision === 'accepted'
          ? 'Solicitação de aceite encaminhada.'
          : decision === 'adapted'
            ? 'Solicitação de adaptação encaminhada.'
            : 'Solicitação de rejeição encaminhada.',
      )
    } catch (error) {
      setLocalMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a decisão.',
      )
    } finally {
      setDecisionInProgress(null)
    }
  }

  return (
    <section
      className={[
        'space-y-5',
        className,
      ].join(' ')}
      aria-labelledby={
        `pedagogical-copilot-${intervention.id}`
      }
    >
      <header
        className={[
          'overflow-hidden rounded-3xl',
          'border border-[#0E6070]/20',
          'bg-gradient-to-br',
          'from-[#092A45]',
          'via-[#0B425D]',
          'to-[#087E8B]',
          'px-5 py-6 text-white',
          'shadow-lg',
          'sm:px-7',
        ].join(' ')}
      >
        <div
          className={[
            'flex flex-col gap-5',
            'lg:flex-row',
            'lg:items-start',
            'lg:justify-between',
          ].join(' ')}
        >
          <div className="max-w-3xl">
            <p
              className={[
                'text-xs font-semibold',
                'uppercase tracking-[0.18em]',
                'text-cyan-100',
              ].join(' ')}
            >
              EIOS · Pedagogical Copilot
            </p>

            <h2
              id={
                `pedagogical-copilot-${intervention.id}`
              }
              className={[
                'mt-2 text-2xl font-bold',
                'tracking-tight',
                'sm:text-3xl',
              ].join(' ')}
            >
              {intervention.context.title}
            </h2>

            <p
              className={[
                'mt-3 max-w-2xl',
                'text-sm leading-6',
                'text-slate-100',
                'sm:text-base',
              ].join(' ')}
            >
              {intervention.context.summary}
            </p>
          </div>

          <div
            className={[
              'flex flex-wrap gap-2',
              'lg:max-w-xs',
              'lg:justify-end',
            ].join(' ')}
          >
            <Badge
              definition={
                priorityDefinition
              }
            />

            <Badge
              definition={
                riskDefinition
              }
            />

            <span
              className={[
                'inline-flex items-center',
                'rounded-full border',
                'border-white/30',
                'bg-white/10 px-3 py-1',
                'text-xs font-semibold',
                'text-white',
              ].join(' ')}
            >
              {
                STATUS_LABELS[
                  intervention.status
                ]
              }
            </span>
          </div>
        </div>

        <div
          className={[
            'mt-6 grid gap-3',
            'sm:grid-cols-2',
            'lg:grid-cols-4',
          ].join(' ')}
        >
          <div
            className={[
              'rounded-2xl border',
              'border-white/15',
              'bg-white/10 p-4',
            ].join(' ')}
          >
            <p className="text-xs text-cyan-100">
              Objetivos
            </p>

            <p className="mt-1 text-2xl font-bold">
              {
                intervention.plan
                  .objectives
                  .length
              }
            </p>
          </div>

          <div
            className={[
              'rounded-2xl border',
              'border-white/15',
              'bg-white/10 p-4',
            ].join(' ')}
          >
            <p className="text-xs text-cyan-100">
              Ações
            </p>

            <p className="mt-1 text-2xl font-bold">
              {
                intervention.plan
                  .actions
                  .length
              }
            </p>
          </div>

          <div
            className={[
              'rounded-2xl border',
              'border-white/15',
              'bg-white/10 p-4',
            ].join(' ')}
          >
            <p className="text-xs text-cyan-100">
              Progresso
            </p>

            <p className="mt-1 text-2xl font-bold">
              {
                formatPercentage(
                  intervention
                    .monitoring
                    .progressPercentage,
                )
              }
            </p>
          </div>

          <div
            className={[
              'rounded-2xl border',
              'border-white/15',
              'bg-white/10 p-4',
            ].join(' ')}
          >
            <p className="text-xs text-cyan-100">
              Versão
            </p>

            <p className="mt-1 text-2xl font-bold">
              {
                intervention.version
                  .versionLabel
              }
            </p>
          </div>
        </div>
      </header>

      {intervention.diagnostic
        .risk
        .requiresImmediateHumanAttention ? (
        <div
          role="alert"
          className={[
            'rounded-2xl border',
            'border-red-300',
            'bg-red-50 p-5',
            'text-red-950',
          ].join(' ')}
        >
          <p className="font-semibold">
            Atenção humana imediata necessária
          </p>

          <p
            className={[
              'mt-1 text-sm',
              'leading-6',
            ].join(' ')}
          >
            O diagnóstico apresenta sinais
            que exigem análise profissional
            antes de qualquer execução.
          </p>
        </div>
      ) : null}

      <div
        className={[
          'grid gap-4',
          'sm:grid-cols-2',
          'xl:grid-cols-4',
        ].join(' ')}
      >
        <MetricCard
          label="Revisão humana"
          value={
            HUMAN_REVIEW_LABELS[
              intervention.humanReview
                .status
            ]
          }
          description={
            intervention.humanReview
              .required
              ? 'A intervenção precisa ser validada por um profissional.'
              : 'A revisão não foi definida como obrigatória.'
          }
        />

        <MetricCard
          label="Decisão docente"
          value={
            TEACHER_DECISION_LABELS[
              intervention
                .teacherDecision
                .decision
            ]
          }
          description="A decisão final pertence ao professor."
        />

        <MetricCard
          label="Ações concluídas"
          value={
            `${completedActionCount} de ${intervention.plan.actions.length}`
          }
        />

        <MetricCard
          label="Fim previsto"
          value={
            formatDate(
              intervention.schedule
                .plannedEndAt,
            )
          }
        />
      </div>

      <Section
        title="Diagnóstico pedagógico"
        description="Leitura das evidências, padrões, riscos e limitações."
        defaultOpen
      >
        <div className="space-y-5">
          <div>
            <h3
              className={[
                'text-sm font-semibold',
                'text-[#092A45]',
              ].join(' ')}
            >
              Problema identificado
            </h3>

            <p
              className={[
                'mt-2 text-sm leading-6',
                'text-slate-700',
              ].join(' ')}
            >
              {
                intervention
                  .diagnostic
                  .problemStatement
              }
            </p>
          </div>

          <div>
            <h3
              className={[
                'text-sm font-semibold',
                'text-[#092A45]',
              ].join(' ')}
            >
              Interpretação pedagógica
            </h3>

            <p
              className={[
                'mt-2 text-sm leading-6',
                'text-slate-700',
              ].join(' ')}
            >
              {
                intervention
                  .diagnostic
                  .pedagogicalInterpretation
              }
            </p>
          </div>

          <div
            className={[
              'grid gap-5',
              'lg:grid-cols-2',
            ].join(' ')}
          >
            <div>
              <h3
                className={[
                  'mb-3 text-sm',
                  'font-semibold',
                  'text-[#092A45]',
                ].join(' ')}
              >
                Potencialidades
              </h3>

              <TextList
                items={
                  intervention
                    .diagnostic
                    .strengths
                }
                emptyMessage="Nenhuma potencialidade registrada."
              />
            </div>

            <div>
              <h3
                className={[
                  'mb-3 text-sm',
                  'font-semibold',
                  'text-[#092A45]',
                ].join(' ')}
              >
                Lacunas de aprendizagem
              </h3>

              <TextList
                items={
                  intervention
                    .diagnostic
                    .learningGaps
                }
                emptyMessage="Nenhuma lacuna registrada."
              />
            </div>
          </div>

          <div
            className={[
              'grid gap-5',
              'lg:grid-cols-2',
            ].join(' ')}
          >
            <div>
              <h3
                className={[
                  'mb-3 text-sm',
                  'font-semibold',
                  'text-[#092A45]',
                ].join(' ')}
              >
                Sinais de risco
              </h3>

              <TextList
                items={
                  intervention
                    .diagnostic
                    .risk
                    .signals
                }
                emptyMessage="Nenhum sinal de risco registrado."
              />
            </div>

            <div>
              <h3
                className={[
                  'mb-3 text-sm',
                  'font-semibold',
                  'text-[#092A45]',
                ].join(' ')}
              >
                Fatores protetivos
              </h3>

              <TextList
                items={
                  intervention
                    .diagnostic
                    .risk
                    .protectiveFactors
                }
                emptyMessage="Nenhum fator protetivo registrado."
              />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Objetivos da intervenção"
        description="Resultados pedagógicos esperados e horizonte de acompanhamento."
        defaultOpen
      >
        {intervention.plan.objectives.length ===
        0 ? (
          <EmptyState
            message="Nenhum objetivo foi gerado."
          />
        ) : (
          <div
            className={[
              'grid gap-4',
              'lg:grid-cols-2',
            ].join(' ')}
          >
            {intervention.plan.objectives.map(
              objective => (
                <article
                  key={objective.id}
                  className={[
                    'rounded-2xl border',
                    'border-slate-200',
                    'bg-slate-50 p-4',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex items-start',
                      'justify-between gap-3',
                    ].join(' ')}
                  >
                    <div>
                      <p
                        className={[
                          'text-xs font-semibold',
                          'uppercase',
                          'tracking-[0.12em]',
                          'text-[#087E8B]',
                        ].join(' ')}
                      >
                        {
                          translateCode(
                            objective.type,
                          )
                        }
                      </p>

                      <h3
                        className={[
                          'mt-1 font-semibold',
                          'text-[#092A45]',
                        ].join(' ')}
                      >
                        {objective.title}
                      </h3>
                    </div>

                    <Badge
                      definition={
                        PRIORITY_DEFINITIONS[
                          objective.priority
                        ]
                      }
                    />
                  </div>

                  <p
                    className={[
                      'mt-3 text-sm',
                      'leading-6',
                      'text-slate-700',
                    ].join(' ')}
                  >
                    {objective.description}
                  </p>

                  <p
                    className={[
                      'mt-3 text-xs',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    Prazo esperado:{' '}
                    {
                      formatDate(
                        objective.expectedBy,
                      )
                    }
                  </p>
                </article>
              ),
            )}
          </div>
        )}
      </Section>

      <Section
        title="Plano de ações"
        description="Ações ordenadas, orientações e cronograma de execução."
        defaultOpen
      >
        {intervention.plan.actions.length ===
        0 ? (
          <EmptyState
            message="Nenhuma ação pedagógica foi gerada."
          />
        ) : (
          <div className="space-y-4">
            {intervention.plan.actions.map(
              action => (
                <ActionCard
                  key={action.id}
                  action={action}
                />
              ),
            )}
          </div>
        )}
      </Section>

      <Section
        title="Recomposição da aprendizagem"
        description="Conhecimentos essenciais, sequência e atividades de recuperação."
      >
        {!intervention.plan
          .recomposition.enabled ? (
          <EmptyState
            message="A recomposição não foi ativada para esta intervenção."
          />
        ) : (
          <div className="space-y-5">
            <MetricCard
              label="Nível de recomposição"
              value={
                intervention.plan
                  .recomposition.level
                  ? translateCode(
                      intervention.plan
                        .recomposition
                        .level,
                    )
                  : 'Não informado'
              }
              description={
                intervention.plan
                  .recomposition
                  .expectedDuration ??
                undefined
              }
            />

            <div
              className={[
                'grid gap-5',
                'lg:grid-cols-2',
              ].join(' ')}
            >
              <div>
                <h3
                  className={[
                    'mb-3 text-sm',
                    'font-semibold',
                    'text-[#092A45]',
                  ].join(' ')}
                >
                  Sequência recomendada
                </h3>

                <TextList
                  items={
                    intervention.plan
                      .recomposition
                      .sequence
                  }
                  emptyMessage="Nenhuma sequência cadastrada."
                />
              </div>

              <div>
                <h3
                  className={[
                    'mb-3 text-sm',
                    'font-semibold',
                    'text-[#092A45]',
                  ].join(' ')}
                >
                  Atividades de recuperação
                </h3>

                <TextList
                  items={
                    intervention.plan
                      .recomposition
                      .recoveryActivities
                  }
                  emptyMessage="Nenhuma atividade cadastrada."
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Inclusão e acessibilidade"
        description="Barreiras, apoios, diferenciações e adaptações propostas."
      >
        {!intervention.plan
          .inclusion.enabled ? (
          <EmptyState
            message="Nenhuma barreira de inclusão foi registrada."
          />
        ) : (
          <div className="space-y-5">
            <div
              className={[
                'grid gap-5',
                'lg:grid-cols-2',
              ].join(' ')}
            >
              <div>
                <h3
                  className={[
                    'mb-3 text-sm',
                    'font-semibold',
                    'text-[#092A45]',
                  ].join(' ')}
                >
                  Barreiras identificadas
                </h3>

                <TextList
                  items={
                    intervention.plan
                      .inclusion
                      .identifiedBarriers
                  }
                  emptyMessage="Nenhuma barreira registrada."
                />
              </div>

              <div>
                <h3
                  className={[
                    'mb-3 text-sm',
                    'font-semibold',
                    'text-[#092A45]',
                  ].join(' ')}
                >
                  Apoios à participação
                </h3>

                <TextList
                  items={
                    intervention.plan
                      .inclusion
                      .participationSupports
                  }
                  emptyMessage="Nenhum apoio registrado."
                />
              </div>
            </div>

            <div>
              <h3
                className={[
                  'mb-3 text-sm',
                  'font-semibold',
                  'text-[#092A45]',
                ].join(' ')}
              >
                Adaptações propostas
              </h3>

              {intervention.plan
                .inclusion
                .adaptations.length ===
              0 ? (
                <EmptyState
                  message="Nenhuma adaptação foi proposta."
                />
              ) : (
                <div
                  className={[
                    'grid gap-4',
                    'lg:grid-cols-2',
                  ].join(' ')}
                >
                  {intervention.plan
                    .inclusion
                    .adaptations
                    .map(
                      adaptation => (
                        <article
                          key={
                            adaptation.id
                          }
                          className={[
                            'rounded-2xl',
                            'border',
                            'border-slate-200',
                            'bg-slate-50',
                            'p-4',
                          ].join(' ')}
                        >
                          <p
                            className={[
                              'text-xs',
                              'font-semibold',
                              'uppercase',
                              'tracking-[0.12em]',
                              'text-[#087E8B]',
                            ].join(' ')}
                          >
                            {
                              translateCode(
                                adaptation.type,
                              )
                            }
                          </p>

                          <h4
                            className={[
                              'mt-1',
                              'font-semibold',
                              'text-[#092A45]',
                            ].join(' ')}
                          >
                            {
                              adaptation.title
                            }
                          </h4>

                          <p
                            className={[
                              'mt-2',
                              'text-sm',
                              'leading-6',
                              'text-slate-700',
                            ].join(' ')}
                          >
                            {
                              adaptation.description
                            }
                          </p>
                        </article>
                      ),
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Metodologias recomendadas"
        description="Estratégias selecionadas pelo motor e sujeitas à validação docente."
      >
        {intervention.plan
          .methodologies.length ===
        0 ? (
          <EmptyState
            message="Nenhuma metodologia foi recomendada."
          />
        ) : (
          <div
            className={[
              'grid gap-4',
              'lg:grid-cols-2',
            ].join(' ')}
          >
            {intervention.plan
              .methodologies
              .map(
                methodology => (
                  <article
                    key={
                      methodology.id
                    }
                    className={[
                      'rounded-2xl',
                      'border',
                      'border-slate-200',
                      'bg-slate-50',
                      'p-4',
                    ].join(' ')}
                  >
                    <p
                      className={[
                        'text-xs',
                        'font-semibold',
                        'uppercase',
                        'tracking-[0.12em]',
                        'text-[#087E8B]',
                      ].join(' ')}
                    >
                      {
                        translateCode(
                          methodology.category,
                        )
                      }
                    </p>

                    <h3
                      className={[
                        'mt-1 font-semibold',
                        'text-[#092A45]',
                      ].join(' ')}
                    >
                      {
                        methodology.name
                      }
                    </h3>

                    <p
                      className={[
                        'mt-2 text-sm',
                        'leading-6',
                        'text-slate-700',
                      ].join(' ')}
                    >
                      {
                        methodology.description
                      }
                    </p>

                    <div className="mt-4">
                      <TextList
                        items={
                          methodology
                            .implementationGuidance
                        }
                        emptyMessage="Nenhuma orientação cadastrada."
                      />
                    </div>
                  </article>
                ),
              )}
          </div>
        )}
      </Section>

      <Section
        title="Perguntas diagnósticas"
        description="Questões para ampliar ou confirmar a compreensão do diagnóstico."
      >
        {intervention.plan
          .diagnosticQuestions
          .length === 0 ? (
          <EmptyState
            message="Nenhuma pergunta diagnóstica foi gerada."
          />
        ) : (
          <ol className="space-y-4">
            {intervention.plan
              .diagnosticQuestions
              .map(
                question => (
                  <li
                    key={question.id}
                    className={[
                      'rounded-2xl',
                      'border',
                      'border-slate-200',
                      'bg-slate-50',
                      'p-4',
                    ].join(' ')}
                  >
                    <p
                      className={[
                        'text-xs',
                        'font-semibold',
                        'uppercase',
                        'tracking-[0.12em]',
                        'text-[#087E8B]',
                      ].join(' ')}
                    >
                      Pergunta{' '}
                      {question.order}
                    </p>

                    <p
                      className={[
                        'mt-2 font-semibold',
                        'leading-6',
                        'text-[#092A45]',
                      ].join(' ')}
                    >
                      {
                        question.question
                      }
                    </p>

                    <p
                      className={[
                        'mt-2 text-sm',
                        'leading-6',
                        'text-slate-600',
                      ].join(' ')}
                    >
                      Finalidade:{' '}
                      {
                        question.purpose
                      }
                    </p>
                  </li>
                ),
              )}
          </ol>
        )}
      </Section>

      <Section
        title="Evidências e indicadores"
        description="Registros esperados, formas de acompanhamento e critérios de sucesso."
      >
        <div className="space-y-6">
          <div>
            <h3
              className={[
                'mb-3 text-sm',
                'font-semibold',
                'text-[#092A45]',
              ].join(' ')}
            >
              Evidências esperadas
            </h3>

            {intervention
              .expectedEvidence
              .length === 0 ? (
              <EmptyState
                message="Nenhuma evidência esperada foi cadastrada."
              />
            ) : (
              <div
                className={[
                  'grid gap-4',
                  'lg:grid-cols-2',
                ].join(' ')}
              >
                {intervention
                  .expectedEvidence
                  .map(
                    evidence => (
                      <article
                        key={evidence.id}
                        className={[
                          'rounded-2xl',
                          'border',
                          'border-slate-200',
                          'bg-slate-50',
                          'p-4',
                        ].join(' ')}
                      >
                        <h4
                          className={[
                            'font-semibold',
                            'text-[#092A45]',
                          ].join(' ')}
                        >
                          {
                            evidence.title
                          }
                        </h4>

                        <p
                          className={[
                            'mt-2',
                            'text-sm',
                            'leading-6',
                            'text-slate-700',
                          ].join(' ')}
                        >
                          {
                            evidence.description
                          }
                        </p>

                        <p
                          className={[
                            'mt-3',
                            'text-xs',
                            'text-slate-500',
                          ].join(' ')}
                        >
                          Prazo:{' '}
                          {
                            formatDateTime(
                              evidence.expectedBy,
                            )
                          }
                        </p>
                      </article>
                    ),
                  )}
              </div>
            )}
          </div>

          <div>
            <h3
              className={[
                'mb-3 text-sm',
                'font-semibold',
                'text-[#092A45]',
              ].join(' ')}
            >
              Indicadores
            </h3>

            {intervention.indicators
              .length === 0 ? (
              <EmptyState
                message="Nenhum indicador foi cadastrado."
              />
            ) : (
              <div className="space-y-3">
                {intervention.indicators
                  .map(
                    indicator => (
                      <article
                        key={
                          indicator.id
                        }
                        className={[
                          'rounded-2xl',
                          'border',
                          'border-slate-200',
                          'bg-white p-4',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'flex flex-col',
                            'gap-2',
                            'sm:flex-row',
                            'sm:items-start',
                            'sm:justify-between',
                          ].join(' ')}
                        >
                          <div>
                            <h4
                              className={[
                                'font-semibold',
                                'text-[#092A45]',
                              ].join(' ')}
                            >
                              {
                                indicator.name
                              }
                            </h4>

                            <p
                              className={[
                                'mt-1',
                                'text-sm',
                                'leading-6',
                                'text-slate-600',
                              ].join(' ')}
                            >
                              {
                                indicator.description
                              }
                            </p>
                          </div>

                          <span
                            className={[
                              'inline-flex',
                              'w-fit',
                              'rounded-full',
                              'border',
                              'border-cyan-300',
                              'bg-cyan-50',
                              'px-3 py-1',
                              'text-xs',
                              'font-semibold',
                              'text-cyan-800',
                            ].join(' ')}
                          >
                            {
                              translateCode(
                                indicator.type,
                              )
                            }
                          </span>
                        </div>
                      </article>
                    ),
                  )}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section
        title="Cronograma e checkpoints"
        description="Marcos previstos para diagnóstico, acompanhamento e avaliação."
      >
        {intervention.schedule
          .checkpoints.length ===
        0 ? (
          <EmptyState
            message="Nenhum checkpoint foi definido."
          />
        ) : (
          <ol
            className={[
              'relative space-y-4',
              'border-l-2',
              'border-cyan-200',
              'pl-5',
            ].join(' ')}
          >
            {intervention.schedule
              .checkpoints
              .map(
                checkpoint => (
                  <li
                    key={checkpoint.id}
                    className="relative"
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        'absolute',
                        '-left-[27px]',
                        'top-2',
                        'h-3 w-3',
                        'rounded-full',
                        'border-2',
                        'border-white',
                        'bg-[#087E8B]',
                      ].join(' ')}
                    />

                    <article
                      className={[
                        'rounded-2xl',
                        'border',
                        'border-slate-200',
                        'bg-slate-50',
                        'p-4',
                      ].join(' ')}
                    >
                      <p
                        className={[
                          'text-xs',
                          'font-semibold',
                          'uppercase',
                          'tracking-[0.12em]',
                          'text-[#087E8B]',
                        ].join(' ')}
                      >
                        {
                          translateCode(
                            checkpoint.type,
                          )
                        }
                      </p>

                      <h3
                        className={[
                          'mt-1',
                          'font-semibold',
                          'text-[#092A45]',
                        ].join(' ')}
                      >
                        {
                          checkpoint.title
                        }
                      </h3>

                      <p
                        className={[
                          'mt-2',
                          'text-sm',
                          'leading-6',
                          'text-slate-700',
                        ].join(' ')}
                      >
                        {
                          checkpoint.description
                        }
                      </p>

                      <p
                        className={[
                          'mt-3',
                          'text-xs',
                          'text-slate-500',
                        ].join(' ')}
                      >
                        Previsto para:{' '}
                        {
                          formatDateTime(
                            checkpoint.plannedAt,
                          )
                        }
                      </p>
                    </article>
                  </li>
                ),
              )}
          </ol>
        )}
      </Section>

      <Section
        title="Explicabilidade e limitações"
        description="Razões da recomendação, incertezas e pontos obrigatórios de validação."
      >
        <div className="space-y-5">
          <p
            className={[
              'text-sm leading-6',
              'text-slate-700',
            ].join(' ')}
          >
            {
              intervention
                .explainability
                .summary
            }
          </p>

          <div
            className={[
              'grid gap-5',
              'lg:grid-cols-2',
            ].join(' ')}
          >
            <div>
              <h3
                className={[
                  'mb-3 text-sm',
                  'font-semibold',
                  'text-[#092A45]',
                ].join(' ')}
              >
                Limitações
              </h3>

              <TextList
                items={
                  intervention
                    .explainability
                    .limitations
                }
                emptyMessage="Nenhuma limitação registrada."
              />
            </div>

            <div>
              <h3
                className={[
                  'mb-3 text-sm',
                  'font-semibold',
                  'text-[#092A45]',
                ].join(' ')}
              >
                Pontos de validação humana
              </h3>

              <TextList
                items={
                  intervention
                    .explainability
                    .humanValidationPoints
                }
                emptyMessage="Nenhum ponto de validação registrado."
              />
            </div>
          </div>
        </div>
      </Section>

      <section
        className={[
          'rounded-3xl border',
          'border-[#087E8B]/30',
          'bg-[#F4FBFC] p-5',
          'sm:p-6',
        ].join(' ')}
        aria-labelledby={
          `teacher-decision-${intervention.id}`
        }
      >
        <div
          className={[
            'flex flex-col gap-4',
            'lg:flex-row',
            'lg:items-start',
            'lg:justify-between',
          ].join(' ')}
        >
          <div className="max-w-2xl">
            <p
              className={[
                'text-xs font-semibold',
                'uppercase tracking-[0.15em]',
                'text-[#087E8B]',
              ].join(' ')}
            >
              Autonomia profissional
            </p>

            <h2
              id={
                `teacher-decision-${intervention.id}`
              }
              className={[
                'mt-2 text-xl font-bold',
                'text-[#092A45]',
              ].join(' ')}
            >
              Decisão do professor
            </h2>

            <p
              className={[
                'mt-2 text-sm',
                'leading-6',
                'text-slate-700',
              ].join(' ')}
            >
              O EIOS apresenta uma recomendação.
              A decisão final de aceitar,
              adaptar ou rejeitar pertence ao
              profissional responsável.
            </p>
          </div>

          <span
            className={[
              'inline-flex w-fit',
              'rounded-full border',
              'border-slate-300',
              'bg-white px-3 py-1',
              'text-xs font-semibold',
              'text-slate-700',
            ].join(' ')}
          >
            {
              TEACHER_DECISION_LABELS[
                intervention
                  .teacherDecision
                  .decision
              ]
            }
          </span>
        </div>

        <div
          className={[
            'mt-5 grid gap-3',
            'sm:grid-cols-3',
          ].join(' ')}
        >
          <button
            type="button"
            disabled={
              !canDecide ||
              decisionInProgress !==
                null
            }
            onClick={() =>
              handleDecision(
                'accepted',
              )
            }
            className={[
              'rounded-xl px-4 py-3',
              'text-sm font-semibold',
              'transition',
              'focus:outline-none',
              'focus:ring-2',
              'focus:ring-emerald-500',
              'focus:ring-offset-2',
              'disabled:cursor-not-allowed',
              'disabled:opacity-50',
              'bg-emerald-600',
              'text-white',
              'hover:bg-emerald-700',
            ].join(' ')}
          >
            {decisionInProgress ===
            'accepted'
              ? 'Processando...'
              : 'Aceitar intervenção'}
          </button>

          <button
            type="button"
            disabled={
              !canDecide ||
              decisionInProgress !==
                null
            }
            onClick={() =>
              handleDecision(
                'adapted',
              )
            }
            className={[
              'rounded-xl border',
              'border-amber-400',
              'bg-amber-50',
              'px-4 py-3',
              'text-sm font-semibold',
              'text-amber-900',
              'transition',
              'hover:bg-amber-100',
              'focus:outline-none',
              'focus:ring-2',
              'focus:ring-amber-500',
              'focus:ring-offset-2',
              'disabled:cursor-not-allowed',
              'disabled:opacity-50',
            ].join(' ')}
          >
            {decisionInProgress ===
            'adapted'
              ? 'Processando...'
              : 'Adaptar intervenção'}
          </button>

          <button
            type="button"
            disabled={
              !canDecide ||
              decisionInProgress !==
                null
            }
            onClick={() =>
              handleDecision(
                'rejected',
              )
            }
            className={[
              'rounded-xl border',
              'border-red-300',
              'bg-red-50',
              'px-4 py-3',
              'text-sm font-semibold',
              'text-red-800',
              'transition',
              'hover:bg-red-100',
              'focus:outline-none',
              'focus:ring-2',
              'focus:ring-red-500',
              'focus:ring-offset-2',
              'disabled:cursor-not-allowed',
              'disabled:opacity-50',
            ].join(' ')}
          >
            {decisionInProgress ===
            'rejected'
              ? 'Processando...'
              : 'Rejeitar intervenção'}
          </button>
        </div>

        {localMessage ? (
          <p
            aria-live="polite"
            className={[
              'mt-4 rounded-xl',
              'border border-cyan-200',
              'bg-white px-4 py-3',
              'text-sm text-slate-700',
            ].join(' ')}
          >
            {localMessage}
          </p>
        ) : null}
      </section>

      <footer
        className={[
          'rounded-2xl border',
          'border-slate-200',
          'bg-white px-5 py-4',
          'text-xs leading-5',
          'text-slate-500',
        ].join(' ')}
      >
        <p>
          Gerado em{' '}
          {
            formatDateTime(
              intervention.createdAt,
            )
          }{' '}
          pelo motor{' '}
          <strong>
            {intervention.engine.name}
          </strong>{' '}
          versão{' '}
          <strong>
            {intervention.engine.version}
          </strong>.
        </p>

        <p className="mt-1">
          Correlação:{' '}
          {
            intervention
              .traceability
              .correlationId
          }
        </p>
      </footer>
    </section>
  )
}
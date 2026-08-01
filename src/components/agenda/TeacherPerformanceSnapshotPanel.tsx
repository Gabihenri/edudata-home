'use client'

import type {
  TeacherOperationalStatus,
  TeacherPerformanceSnapshot,
  TeacherSnapshotRiskSeverity,
} from '@/lib/agenda/services/teacher-intelligence.service'

export type TeacherPerformanceSnapshotPanelProps = {
  snapshot:
    TeacherPerformanceSnapshot | null

  loading?: boolean

  error?: string | null

  onGenerate?: () => void

  onRetry?: () => void

  onCancel?: () => void
}

type ScoreCard = {
  code: string
  label: string
  score: number
  description: string
}

function clampScore(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value),
    ),
  )
}

function formatScore(
  value: number,
): string {
  return `${clampScore(value)}%`
}

function getStatusLabel(
  status:
    TeacherOperationalStatus | string,
): string {
  const labels:
    Record<string, string> = {
      excellent:
        'Desempenho operacional excelente',

      stable:
        'Ciclo operacional estável',

      attention:
        'Ciclo que exige atenção',

      critical:
        'Ciclo operacional crítico',

      balanced:
        'Carga equilibrada',

      overloaded:
        'Carga sobrecarregada',

      adequate:
        'Situação adequada',

      high:
        'Carga elevada',

      moderate:
        'Carga moderada',
    }

  return (
    labels[status] ??
    'Situação em acompanhamento'
  )
}

function getStatusClasses(
  status:
    TeacherOperationalStatus | string,
): string {
  if (
    status === 'excellent' ||
    status === 'balanced' ||
    status === 'adequate'
  ) {
    return (
      'border-emerald-200 '
      + 'bg-emerald-50 '
      + 'text-emerald-800'
    )
  }

  if (
    status === 'stable'
  ) {
    return (
      'border-cyan-200 '
      + 'bg-cyan-50 '
      + 'text-[#075F78]'
    )
  }

  if (
    status === 'attention' ||
    status === 'high' ||
    status === 'moderate'
  ) {
    return (
      'border-amber-200 '
      + 'bg-amber-50 '
      + 'text-amber-900'
    )
  }

  return (
    'border-red-200 '
    + 'bg-red-50 '
    + 'text-red-800'
  )
}

function getSeverityLabel(
  severity:
    TeacherSnapshotRiskSeverity,
): string {
  const labels:
    Record<
      TeacherSnapshotRiskSeverity,
      string
    > = {
      critical: 'Crítica',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
    }

  return labels[
    severity
  ]
}

function getSeverityClasses(
  severity:
    TeacherSnapshotRiskSeverity,
): string {
  if (severity === 'critical') {
    return (
      'border-red-300 '
      + 'bg-red-50 '
      + 'text-red-900'
    )
  }

  if (severity === 'high') {
    return (
      'border-orange-300 '
      + 'bg-orange-50 '
      + 'text-orange-900'
    )
  }

  if (severity === 'medium') {
    return (
      'border-amber-300 '
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

function SnapshotLoading() {
  return (
    <section
      role="status"
      aria-label="Processando inteligência docente"
      className="overflow-hidden rounded-[1.75rem] border border-cyan-200 bg-white shadow-sm"
    >
      <header className="border-b border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#075F78]">
          EIOS — inteligência docente
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#071827]">
          Processando snapshot operacional
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Consolidando planejamento, evidências, tarefas,
          calendário e indicadores do ciclo docente.
        </p>
      </header>

      <div className="p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            '01',
            '02',
            '03',
            '04',
            '05',
          ].map(
            code => (
              <div
                key={code}
                className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="font-mono text-xs font-bold text-slate-300">
                  {code}
                </p>

                <div className="mt-5 h-8 w-20 rounded bg-slate-200" />

                <div className="mt-4 h-4 w-28 rounded bg-slate-200" />

                <div className="mt-3 h-3 w-full rounded bg-slate-200" />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  )
}

export function TeacherPerformanceSnapshotPanel({
  snapshot,
  loading = false,
  error = null,
  onGenerate,
  onRetry,
  onCancel,
}: TeacherPerformanceSnapshotPanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <SnapshotLoading />

        {onCancel ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800"
            >
              Cancelar processamento
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  if (error) {
    return (
      <section className="overflow-hidden rounded-[1.75rem] border border-red-200 bg-white shadow-sm">
        <header className="border-b border-red-200 bg-red-50 px-5 py-5 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
            Inteligência docente indisponível
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-950">
            Não foi possível gerar o snapshot
          </h2>
        </header>

        <div className="p-5 sm:p-7">
          <p className="text-sm leading-6 text-red-700">
            {error}
          </p>

          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      </section>
    )
  }

  if (!snapshot) {
    return (
      <section className="overflow-hidden rounded-[1.75rem] border border-cyan-200 bg-white shadow-sm">
        <header className="border-b border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#075F78]">
            EIOS — inteligência docente
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#071827]">
            Snapshot de desempenho operacional
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Uma visão consolidada do planejamento, das
            evidências, das tarefas e da carga semanal.
          </p>
        </header>

        <div className="p-5 sm:p-7">
          <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50/50 p-6">
            <p className="text-sm font-semibold text-[#075F78]">
              O snapshot ainda não foi processado.
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              A geração será liberada quando os resultados das
              capacidades operacionais estiverem disponíveis.
            </p>

            {onGenerate ? (
              <button
                type="button"
                onClick={onGenerate}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#075F78] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#064e63]"
              >
                Gerar snapshot docente
              </button>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  const scoreCards:
    ScoreCard[] = [
      {
        code: '01',
        label: 'Dashboard',
        score:
          snapshot.scores.dashboard,
        description:
          'Síntese dos indicadores operacionais da Agenda.',
      },
      {
        code: '02',
        label: 'Planejamento',
        score:
          snapshot.scores.planning,
        description:
          'Cobertura, coerência e continuidade do ciclo.',
      },
      {
        code: '03',
        label: 'Evidências',
        score:
          snapshot.scores.evidences,
        description:
          'Conclusão, cobertura e integridade dos registros.',
      },
      {
        code: '04',
        label: 'Tarefas',
        score:
          snapshot.scores.tasks,
        description:
          'Prazos, prioridades e pendências operacionais.',
      },
      {
        code: '05',
        label: 'Carga semanal',
        score:
          snapshot.scores.calendar,
        description:
          'Distribuição, concentração e equilíbrio da agenda.',
      },
    ]

  return (
    <section
      aria-label="Snapshot de desempenho operacional docente"
      className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
    >
      <header className="border-b border-slate-200 bg-[#071827] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              EIOS — inteligência docente
            </p>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Snapshot de desempenho operacional
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Visão consolidada do ciclo docente produzida pela
              Educational Capability Platform.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
              Score geral EDI
            </p>

            <div className="mt-2 flex items-end gap-3">
              <p className="text-4xl font-bold tracking-tight text-white">
                {formatScore(
                  snapshot.summary
                    .overall_score,
                )}
              </p>

              <span
                className={`mb-1 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                  snapshot.summary
                    .operational_status,
                )}`}
              >
                {getStatusLabel(
                  snapshot.summary
                    .operational_status,
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {scoreCards.map(
            card => (
              <article
                key={card.code}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-[#0B7491]">
                      {card.code}
                    </p>

                    <h3 className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-[#075F78]">
                      {card.label}
                    </h3>
                  </div>

                  <span
                    aria-hidden="true"
                    className="mt-1 h-2.5 w-2.5 rounded-full bg-[#0B7491]"
                  />
                </div>

                <p className="mt-5 text-3xl font-bold tracking-tight text-[#071827]">
                  {formatScore(
                    card.score,
                  )}
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#0B7491]"
                    style={{
                      width:
                        `${clampScore(
                          card.score,
                        )}%`,
                    }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </article>
            ),
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200">
            <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Pontos de atenção
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#071827]">
                Riscos operacionais
              </h3>
            </header>

            <div className="space-y-3 p-5">
              {snapshot.risks.length === 0 ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                  Nenhum risco operacional relevante foi
                  identificado no ciclo atual.
                </p>
              ) : (
                snapshot.risks.map(
                  risk => (
                    <article
                      key={risk.code}
                      className={`rounded-xl border p-4 ${getSeverityClasses(
                        risk.severity,
                      )}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold">
                          {risk.area}
                        </p>

                        <span className="rounded-full border border-current/20 px-2.5 py-1 text-xs font-bold">
                          {getSeverityLabel(
                            risk.severity,
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6">
                        {risk.description}
                      </p>
                    </article>
                  ),
                )
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200">
            <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Evidências positivas
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#071827]">
                Pontos fortes
              </h3>
            </header>

            <div className="space-y-3 p-5">
              {snapshot.strengths.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  Os pontos fortes serão apresentados quando
                  houver indicadores suficientes.
                </p>
              ) : (
                snapshot.strengths.map(
                  strength => (
                    <article
                      key={strength.code}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold text-emerald-950">
                          {strength.area}
                        </p>

                        <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-emerald-800">
                          {formatScore(
                            strength.score,
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-emerald-800">
                        {strength.description}
                      </p>
                    </article>
                  ),
                )
              )}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-cyan-200">
          <header className="border-b border-cyan-200 bg-cyan-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
              Continuidade operacional
            </p>

            <h3 className="mt-1 text-lg font-bold text-[#071827]">
              Próximas ações
            </h3>
          </header>

          <div className="grid gap-3 p-5 md:grid-cols-2">
            {snapshot.next_actions.length === 0 ? (
              <p className="text-sm leading-6 text-slate-600">
                Nenhuma próxima ação foi indicada para o
                período atual.
              </p>
            ) : (
              snapshot.next_actions.map(
                (
                  action,
                  index,
                ) => (
                  <article
                    key={
                      action.reference_id ??
                      `${action.type}-${index}`
                    }
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs font-bold text-[#0B7491]">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          {action.type}
                        </p>

                        <p className="mt-1 text-sm font-semibold leading-6 text-[#071827]">
                          {action.title}
                        </p>
                      </div>
                    </div>
                  </article>
                ),
              )
            )}
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Capacidade: {snapshot.capability_id}
          </p>

          <p>
            Processado em{' '}
            {new Intl.DateTimeFormat(
              'pt-BR',
              {
                dateStyle: 'short',
                timeStyle: 'short',
              },
            ).format(
              new Date(
                snapshot.generated_at,
              ),
            )}
          </p>
        </footer>
      </div>
    </section>
  )
}
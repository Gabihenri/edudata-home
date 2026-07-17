'use client'

import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'
import {
  useDashboard,
} from '@/lib/agenda/hooks'

type IndicatorItem = {
  code: string
  title: string
  value: number
  description: string
  href: string
  actionLabel: string
  attention?: boolean
}

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    'pt-BR',
  ).format(value)
}

function getCompletionRate(
  totalTasks: number,
  pendingTasks: number,
): number {
  if (totalTasks <= 0) {
    return 0
  }

  const completedTasks =
    Math.max(
      totalTasks -
        pendingTasks,
      0,
    )

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (
          completedTasks /
          totalTasks
        ) *
          100,
      ),
    ),
  )
}

export function AgendaIndicators() {
  const {
    data,
    loading,
    error,
    reload,
  } = useDashboard()

  if (loading) {
    return (
      <AgendaPageShell
        eyebrow="Leitura operacional"
        title="Indicadores"
        description="Acompanhe os dados consolidados da Agenda Inteligente EDI e sua distribuição entre os módulos operacionais."
      >
        <section
          role="status"
          className="overflow-hidden rounded-[1.75rem] border border-cyan-200 bg-white shadow-sm"
        >
          <div className="border-b border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#075F78]">
              Processamento
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#071827]">
              Carregando indicadores
            </h2>
          </div>

          <div className="p-5 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                '01',
                '02',
                '03',
                '04',
              ].map(
                (code) => (
                  <div
                    key={code}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="font-mono text-xs font-bold text-slate-300">
                      {code}
                    </p>

                    <div className="mt-5 h-9 w-20 rounded bg-slate-200" />

                    <div className="mt-4 h-4 w-32 rounded bg-slate-200" />

                    <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </AgendaPageShell>
    )
  }

  if (
    error ||
    !data
  ) {
    return (
      <AgendaPageShell
        eyebrow="Leitura operacional"
        title="Indicadores"
        description="Acompanhe os dados consolidados da Agenda Inteligente EDI e sua distribuição entre os módulos operacionais."
      >
        <section className="overflow-hidden rounded-[1.75rem] border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-200 bg-red-50 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
              Falha de carregamento
            </p>

            <h2 className="mt-2 text-2xl font-bold text-red-950">
              Não foi possível carregar os indicadores
            </h2>
          </div>

          <div className="p-5 sm:p-7">
            <p className="text-sm leading-6 text-red-700">
              {error ??
                'Os dados operacionais estão indisponíveis neste momento.'}
            </p>

            <button
              type="button"
              onClick={() =>
                void reload()
              }
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      </AgendaPageShell>
    )
  }

  const totals =
    data.totals

  const completedTasks =
    Math.max(
      totals.tasks -
        totals.pendingTasks,
      0,
    )

  const completionRate =
    getCompletionRate(
      totals.tasks,
      totals.pendingTasks,
    )

  const operationalValues = [
    totals.events,
    totals.planning,
    totals.evidences,
    totals.tasks,
    totals.classes,
  ]

  const modulesWithData =
    operationalValues.filter(
      (value) =>
        value > 0,
    ).length

  const totalRecords =
    operationalValues.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    )

  const indicators:
    IndicatorItem[] = [
      {
        code: '01',
        title: 'Eventos',
        value:
          totals.events,
        description:
          'Compromissos e ações organizados no calendário.',
        href:
          '/agenda/calendario',
        actionLabel:
          'Abrir calendário',
      },
      {
        code: '02',
        title:
          'Planejamentos',
        value:
          totals.planning,
        description:
          'Registros de intencionalidade e organização pedagógica.',
        href:
          '/agenda/planejamento',
        actionLabel:
          'Ver planejamentos',
      },
      {
        code: '03',
        title:
          'Evidências',
        value:
          totals.evidences,
        description:
          'Registros pedagógicos documentados e preservados.',
        href:
          '/agenda/evidencias',
        actionLabel:
          'Ver evidências',
      },
      {
        code: '04',
        title:
          'Tarefas',
        value:
          totals.tasks,
        description:
          'Ações e demandas registradas para acompanhamento.',
        href:
          '/agenda/tarefas',
        actionLabel:
          'Ver tarefas',
      },
      {
        code: '05',
        title:
          'Pendências',
        value:
          totals.pendingTasks,
        description:
          'Tarefas que ainda aguardam conclusão ou acompanhamento.',
        href:
          '/agenda/tarefas',
        actionLabel:
          'Revisar pendências',
        attention:
          totals.pendingTasks >
          0,
      },
      {
        code: '06',
        title:
          'Turmas',
        value:
          totals.classes,
        description:
          'Contextos de aprendizagem cadastrados na Agenda.',
        href:
          '/agenda/turmas',
        actionLabel:
          'Ver turmas',
      },
    ]

  const operationalReading =
    totals.tasks === 0
      ? 'Ainda não há tarefas suficientes para calcular a conclusão do fluxo de execução.'
      : totals.pendingTasks ===
          0
        ? 'Todas as tarefas registradas estão fora da contagem de pendências.'
        : `${formatNumber(
            totals.pendingTasks,
          )} ${
            totals.pendingTasks ===
            1
              ? 'tarefa aguarda'
              : 'tarefas aguardam'
          } acompanhamento.`

  return (
    <AgendaPageShell
      eyebrow="Leitura operacional"
      title="Indicadores"
      description="Acompanhe os dados consolidados da Agenda Inteligente EDI e sua distribuição entre calendário, planejamento, evidências, tarefas e turmas."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo operacional"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Registros operacionais
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {formatNumber(
                totalRecords,
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Soma dos módulos principais
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Módulos com dados
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {modulesWithData}/5
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Áreas com registros ativos
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Tarefas concluídas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {formatNumber(
                completedTasks,
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Diferença entre total e pendências
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Conclusão das tarefas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {completionRate}%
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Proporção calculada no fluxo
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Base operacional
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                  Distribuição por módulo
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Os valores abaixo são carregados da base operacional da Agenda e permitem acessar diretamente cada contexto.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void reload()
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]"
              >
                Atualizar indicadores
              </button>
            </div>
          </header>

          <div className="grid gap-4 p-5 sm:p-7 md:grid-cols-2 xl:grid-cols-3">
            {indicators.map(
              (
                indicator,
              ) => (
                <article
                  key={
                    indicator.code
                  }
                  className={`overflow-hidden rounded-2xl border bg-white ${
                    indicator.attention
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  <header
                    className={`border-b px-5 py-4 ${
                      indicator.attention
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-xs font-bold ${
                            indicator.attention
                              ? 'text-amber-800'
                              : 'text-[#0B7491]'
                          }`}
                        >
                          {
                            indicator.code
                          }
                        </span>

                        <p
                          className={`text-xs font-bold uppercase tracking-[0.14em] ${
                            indicator.attention
                              ? 'text-amber-800'
                              : 'text-[#075F78]'
                          }`}
                        >
                          {
                            indicator.title
                          }
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full ${
                          indicator.attention
                            ? 'bg-amber-500'
                            : 'bg-[#0B7491]'
                        }`}
                      />
                    </div>
                  </header>

                  <div className="p-5">
                    <p className="text-4xl font-bold tracking-tight text-[#071827]">
                      {formatNumber(
                        indicator.value,
                      )}
                    </p>

                    <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                      {
                        indicator.description
                      }
                    </p>

                    <Link
                      href={
                        indicator.href
                      }
                      className={`mt-5 inline-flex min-h-11 w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        indicator.attention
                          ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          : 'border-cyan-200 bg-cyan-50 text-[#075F78] hover:border-[#0B7491] hover:bg-cyan-100'
                      }`}
                    >
                      <span>
                        {
                          indicator.actionLabel
                        }
                      </span>

                      <span
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Leitura operacional
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Situação das tarefas
              </h2>
            </header>

            <div className="p-5 sm:p-7">
              <p className="text-xl font-bold leading-8 text-white sm:text-2xl">
                {
                  operationalReading
                }
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                A taxa abaixo considera como concluídas as tarefas que não aparecem na contagem de pendências retornada pelo painel.
              </p>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-300">
                    Conclusão calculada
                  </span>

                  <span className="font-bold text-cyan-300">
                    {completionRate}%
                  </span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300 transition-[width]"
                    style={{
                      width:
                        `${completionRate}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Concluídas
                  </p>

                  <p className="mt-2 text-2xl font-bold text-white">
                    {formatNumber(
                      completedTasks,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
                    Pendentes
                  </p>

                  <p className="mt-2 text-2xl font-bold text-white">
                    {formatNumber(
                      totals.pendingTasks,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Governança dos dados
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                Interpretação responsável
              </h2>
            </header>

            <div className="divide-y divide-slate-200">
              <article className="px-5 py-5 sm:px-7">
                <div className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    01
                  </span>

                  <div>
                    <h3 className="font-bold text-[#071827]">
                      Dados operacionais
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Os totais representam registros existentes nos módulos da Agenda.
                    </p>
                  </div>
                </div>
              </article>

              <article className="px-5 py-5 sm:px-7">
                <div className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    02
                  </span>

                  <div>
                    <h3 className="font-bold text-[#071827]">
                      Contexto necessário
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Quantidade de registros não deve ser interpretada isoladamente como qualidade pedagógica.
                    </p>
                  </div>
                </div>
              </article>

              <article className="px-5 py-5 sm:px-7">
                <div className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    03
                  </span>

                  <div>
                    <h3 className="font-bold text-[#071827]">
                      Apoio à decisão
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Os indicadores servem para orientar acompanhamento, revisão e priorização.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div className="border-t border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-950">
                O EIOS deverá combinar dados, contexto e evidências antes de gerar alertas ou recomendações educacionais.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </AgendaPageShell>
  )
}
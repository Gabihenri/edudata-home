import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

type OperationalIndicator = {
  code: string
  label: string
  value: string
  description: string
  href: string
}

type QuickAction = {
  code: string
  label: string
  description: string
  href: string
  primary?: boolean
}

const operationalIndicators:
  OperationalIndicator[] = [
    {
      code: '01',
      label: 'Eventos',
      value: '12',
      description:
        'Compromissos organizados no calendário.',
      href:
        '/agenda/calendario',
    },
    {
      code: '02',
      label: 'Planejamentos',
      value: '08',
      description:
        'Planos e ações pedagógicas registrados.',
      href:
        '/agenda/planejamento',
    },
    {
      code: '03',
      label: 'Evidências',
      value: '24',
      description:
        'Registros pedagógicos preservados.',
      href:
        '/agenda/evidencias',
    },
    {
      code: '04',
      label: 'Turmas',
      value: '06',
      description:
        'Contextos de aprendizagem acompanhados.',
      href:
        '/agenda/turmas',
    },
  ]

const quickActions:
  QuickAction[] = [
    {
      code: 'A1',
      label: 'Novo evento',
      description:
        'Registrar compromisso, reunião, formação ou prazo.',
      href:
        '/agenda/calendario',
      primary: true,
    },
    {
      code: 'A2',
      label: 'Novo planejamento',
      description:
        'Organizar objetivos, ações e acompanhamento pedagógico.',
      href:
        '/agenda/planejamento',
    },
    {
      code: 'A3',
      label: 'Registrar evidência',
      description:
        'Adicionar texto, documento, imagem ou produção pedagógica.',
      href:
        '/agenda/evidencias',
    },
    {
      code: 'A4',
      label: 'Consultar histórico',
      description:
        'Acessar registros, exclusões, restaurações e auditoria.',
      href:
        '/agenda/historico',
    },
  ]

const operationalPriorities = [
  {
    code: 'P1',
    title:
      'Revisar o planejamento da semana',
    description:
      'Verifique ações previstas, objetivos e registros ainda pendentes.',
    href:
      '/agenda/planejamento',
  },
  {
    code: 'P2',
    title:
      'Registrar evidências pedagógicas',
    description:
      'Mantenha a memória do trabalho pedagógico atualizada e protegida.',
    href:
      '/agenda/evidencias',
  },
  {
    code: 'P3',
    title:
      'Validar compromissos do calendário',
    description:
      'Confirme reuniões, formações, prazos e atividades institucionais.',
    href:
      '/agenda/calendario',
  },
]

const ediFlow = [
  {
    code: '01',
    label: 'Planejar',
    description:
      'Organize objetivos, ações, prazos e compromissos.',
  },
  {
    code: '02',
    label: 'Registrar',
    description:
      'Documente aulas, tarefas, decisões e evidências.',
  },
  {
    code: '03',
    label: 'Acompanhar',
    description:
      'Observe pendências, evolução e contexto pedagógico.',
  },
  {
    code: '04',
    label: 'Analisar',
    description:
      'Transforme registros em indicadores e apoio à decisão.',
  },
]

export default function AgendaDashboardPage() {
  return (
    <AgendaPageShell
      eyebrow="Visão operacional"
      title="Dashboard pedagógico"
      description="Acompanhe a operação da Agenda Inteligente EDI, acesse os principais módulos e mantenha o trabalho pedagógico organizado em um único ambiente."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-labelledby="agenda-operational-summary"
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Operação atual
                </p>

                <h2
                  id="agenda-operational-summary"
                  className="mt-2 text-2xl font-bold tracking-tight text-[#071827] sm:text-3xl"
                >
                  Resumo da Agenda
                </h2>
              </div>

              <Link
                href="/agenda/indicadores"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]"
              >
                Ver indicadores
              </Link>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {operationalIndicators.map(
              (
                indicator,
                index,
              ) => (
                <Link
                  key={
                    indicator.code
                  }
                  href={
                    indicator.href
                  }
                  className={`group block p-5 transition hover:bg-cyan-50/60 sm:p-6 ${
                    index <
                    operationalIndicators.length -
                      1
                      ? 'border-b border-slate-200 xl:border-b-0 xl:border-r'
                      : ''
                  } ${
                    index === 1
                      ? 'sm:border-l sm:border-slate-200 xl:border-l-0'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {
                        indicator.code
                      }
                    </span>

                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full bg-cyan-300 transition group-hover:bg-[#0B7491]"
                    />
                  </div>

                  <p className="mt-5 text-4xl font-bold tracking-tight text-[#071827]">
                    {
                      indicator.value
                    }
                  </p>

                  <h3 className="mt-2 font-bold text-slate-950">
                    {
                      indicator.label
                    }
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {
                      indicator.description
                    }
                  </p>
                </Link>
              ),
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section
            aria-labelledby="agenda-priorities"
            className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Acompanhamento
              </p>

              <h2
                id="agenda-priorities"
                className="mt-2 text-2xl font-bold text-[#071827]"
              >
                Prioridades pedagógicas
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pontos operacionais que merecem revisão e atualização.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {operationalPriorities.map(
                (
                  priority,
                ) => (
                  <Link
                    key={
                      priority.code
                    }
                    href={
                      priority.href
                    }
                    className="group grid gap-4 px-5 py-5 transition hover:bg-slate-50 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center sm:px-7"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 font-mono text-xs font-bold text-[#0B7491]">
                      {
                        priority.code
                      }
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-950">
                        {
                          priority.title
                        }
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {
                          priority.description
                        }
                      </p>
                    </div>

                    <span className="text-sm font-bold text-[#0B7491] transition group-hover:translate-x-1">
                      Acessar
                    </span>
                  </Link>
                ),
              )}
            </div>
          </section>

          <section
            aria-labelledby="agenda-quick-actions"
            className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm"
          >
            <div className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Acesso direto
              </p>

              <h2
                id="agenda-quick-actions"
                className="mt-2 text-2xl font-bold"
              >
                Ações rápidas
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Inicie as principais atividades da Agenda.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-7">
              {quickActions.map(
                (
                  action,
                ) => (
                  <Link
                    key={
                      action.code
                    }
                    href={
                      action.href
                    }
                    className={`group rounded-xl border px-4 py-4 transition ${
                      action.primary
                        ? 'border-cyan-300/40 bg-cyan-300/15 hover:bg-cyan-300/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="shrink-0 font-mono text-xs font-bold text-cyan-300">
                        {
                          action.code
                        }
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white">
                          {
                            action.label
                          }
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {
                            action.description
                          }
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="text-cyan-300 transition group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </section>
        </div>

        <section
          aria-labelledby="agenda-edi-flow"
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
        >
          <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="bg-slate-50 px-5 py-6 sm:px-7 sm:py-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Ciclo operacional
              </p>

              <h2
                id="agenda-edi-flow"
                className="mt-3 text-2xl font-bold tracking-tight text-[#071827]"
              >
                Fluxo de trabalho EDI
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                A Agenda organiza o trabalho pedagógico como um processo contínuo, rastreável e orientado por evidências.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
              {ediFlow.map(
                (
                  step,
                  index,
                ) => (
                  <article
                    key={
                      step.code
                    }
                    className={`p-5 sm:p-6 ${
                      index <
                      ediFlow.length -
                        1
                        ? 'border-b border-slate-200 xl:border-b-0 xl:border-r'
                        : ''
                    } ${
                      index === 1 ||
                      index === 3
                        ? 'sm:border-l sm:border-slate-200 xl:border-l-0'
                        : ''
                    }`}
                  >
                    <p className="font-mono text-xs font-bold text-[#0B7491]">
                      {
                        step.code
                      }
                    </p>

                    <h3 className="mt-4 text-lg font-bold text-slate-950">
                      {
                        step.label
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {
                        step.description
                      }
                    </p>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>
      </div>
    </AgendaPageShell>
  )
}
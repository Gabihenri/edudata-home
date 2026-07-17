import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

type GoalCategory =
  | 'Pedagógico'
  | 'Engajamento'
  | 'Gestão'
  | 'Formação'

type Goal = {
  code: string
  title: string
  category: GoalCategory
  description: string
  evidenceDirection: string
  relatedModule: string
  relatedHref: string
}

const goals: Goal[] = [
  {
    code: 'O01',
    title:
      'Elevar a aprendizagem',
    category:
      'Pedagógico',
    description:
      'Planejar ações para melhorar os resultados de aprendizagem com base em evidências.',
    evidenceDirection:
      'Planejamentos, produções dos estudantes e registros de acompanhamento.',
    relatedModule:
      'Planejamento',
    relatedHref:
      '/agenda/planejamento',
  },
  {
    code: 'O02',
    title:
      'Fortalecer a participação',
    category:
      'Engajamento',
    description:
      'Promover estratégias que ampliem a participação dos estudantes nas atividades.',
    evidenceDirection:
      'Registros de aula, participação observada e produções pedagógicas.',
    relatedModule:
      'Evidências',
    relatedHref:
      '/agenda/evidencias',
  },
  {
    code: 'O03',
    title:
      'Acompanhar indicadores',
    category:
      'Gestão',
    description:
      'Monitorar indicadores educacionais para apoiar a tomada de decisão.',
    evidenceDirection:
      'Dados consolidados, tendências, pendências e resultados acompanhados.',
    relatedModule:
      'Indicadores',
    relatedHref:
      '/agenda/indicadores',
  },
  {
    code: 'O04',
    title:
      'Desenvolvimento profissional',
    category:
      'Formação',
    description:
      'Registrar metas de formação e evolução contínua dos professores.',
    evidenceDirection:
      'Formações realizadas, reflexões, aplicações práticas e registros de evolução.',
    relatedModule:
      'Histórico',
    relatedHref:
      '/agenda/historico',
  },
]

const objectiveCycle = [
  {
    code: '01',
    label: 'Definir',
    description:
      'Estabelecer uma intenção clara, contextualizada e alcançável.',
  },
  {
    code: '02',
    label: 'Relacionar',
    description:
      'Conectar o objetivo a turmas, planejamentos, ações e responsáveis.',
  },
  {
    code: '03',
    label: 'Evidenciar',
    description:
      'Determinar quais registros poderão demonstrar evolução.',
  },
  {
    code: '04',
    label: 'Analisar',
    description:
      'Revisar os resultados e orientar as decisões seguintes.',
  },
]

function getCategoryClasses(
  category: GoalCategory,
): string {
  if (
    category ===
    'Pedagógico'
  ) {
    return [
      'border-cyan-200',
      'bg-cyan-50',
      'text-[#075F78]',
    ].join(' ')
  }

  if (
    category ===
    'Engajamento'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    category ===
    'Gestão'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-800',
    ].join(' ')
  }

  return [
    'border-amber-200',
    'bg-amber-50',
    'text-amber-800',
  ].join(' ')
}

export function AgendaGoals() {
  const categories =
    new Set(
      goals.map(
        (goal) =>
          goal.category,
      ),
    ).size

  const relatedModules =
    new Set(
      goals.map(
        (goal) =>
          goal.relatedModule,
      ),
    ).size

  return (
    <AgendaPageShell
      eyebrow="Direção e acompanhamento"
      title="Objetivos"
      description="Organize intenções pedagógicas, metas de desenvolvimento e direções de acompanhamento relacionadas às evidências, à inclusão e à inteligência educacional."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo dos objetivos"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Objetivos
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {goals.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Direções apresentadas
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Categorias
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {categories}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Eixos de acompanhamento
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Módulos relacionados
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {relatedModules}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Pontos de integração
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Ciclo EDI
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                objectiveCycle.length
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Etapas de acompanhamento
            </p>
          </article>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Direções estratégicas
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                Objetivos apresentados
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Cada objetivo deve futuramente ser relacionado a contextos, ações, prazos e evidências verificáveis.
              </p>
            </header>

            <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
              {goals.map(
                (
                  goal,
                ) => (
                  <article
                    key={
                      goal.code
                    }
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="font-mono text-xs font-bold text-[#0B7491]">
                            {
                              goal.code
                            }
                          </span>

                          <div className="min-w-0">
                            <span
                              className={`inline-flex rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${getCategoryClasses(
                                goal.category,
                              )}`}
                            >
                              {
                                goal.category
                              }
                            </span>

                            <h3 className="mt-3 break-words text-xl font-bold leading-7 text-[#071827]">
                              {
                                goal.title
                              }
                            </h3>
                          </div>
                        </div>
                      </div>
                    </header>

                    <div className="space-y-4 p-5">
                      <p className="text-sm leading-6 text-slate-600">
                        {
                          goal.description
                        }
                      </p>

                      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Evidências relacionadas
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {
                            goal.evidenceDirection
                          }
                        </p>
                      </section>

                      <Link
                        href={
                          goal.relatedHref
                        }
                        className="inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-[#075F78] transition hover:border-[#0B7491] hover:bg-cyan-100"
                      >
                        <span>
                          Acessar{' '}
                          {
                            goal.relatedModule
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

          <aside className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm xl:sticky xl:top-[176px]">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Estrutura EDI
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Ciclo do objetivo
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Um objetivo ganha valor operacional quando pode ser acompanhado por ações e evidências.
              </p>
            </header>

            <div className="divide-y divide-white/10">
              {objectiveCycle.map(
                (
                  step,
                ) => (
                  <article
                    key={
                      step.code
                    }
                    className="px-5 py-5 sm:px-7"
                  >
                    <div className="flex gap-4">
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {
                          step.code
                        }
                      </span>

                      <div>
                        <h3 className="font-bold">
                          {
                            step.label
                          }
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {
                            step.description
                          }
                        </p>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>

            <div className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-100">
                O Framework EDI orienta a definição de objetivos por evidências, inclusão e inteligência, sem substituir a autonomia pedagógica.
              </p>
            </div>
          </aside>
        </div>

        <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
            Estado atual do módulo
          </p>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-950">
            Os objetivos apresentados nesta tela ainda são demonstrativos. Cadastro, edição, prazos, responsáveis, progresso e vínculo persistente com turmas, planejamentos, ações e evidências deverão ser implementados posteriormente pela arquitetura oficial da Agenda.
          </p>
        </section>
      </div>
    </AgendaPageShell>
  )
}
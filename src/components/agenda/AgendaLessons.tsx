import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

type LessonStatus =
  | 'Planejada'
  | 'Em preparação'
  | 'Pendente'

type Lesson = {
  code: string
  title: string
  className: string
  subject: string
  status: LessonStatus
  description: string
  nextStep: string
}

const lessons:
  Lesson[] = [
    {
      code: 'A01',
      title:
        'Potência elétrica e consumo de energia',
      className:
        '3ª Série A',
      subject:
        'Física',
      status:
        'Planejada',
      description:
        'Estudo da relação entre potência, tempo de uso e consumo de energia elétrica.',
      nextStep:
        'Preparar os recursos e confirmar a data de realização.',
    },
    {
      code: 'A02',
      title:
        'Circuitos elétricos simples',
      className:
        '3ª Série B',
      subject:
        'Física',
      status:
        'Em preparação',
      description:
        'Organização de uma aula sobre associação de componentes e funcionamento de circuitos.',
      nextStep:
        'Finalizar materiais e definir as evidências esperadas.',
    },
    {
      code: 'A03',
      title:
        'Função afim aplicada a problemas reais',
      className:
        '8º Ano A',
      subject:
        'Matemática',
      status:
        'Planejada',
      description:
        'Aplicação da função afim em situações contextualizadas e análise de diferentes representações.',
      nextStep:
        'Relacionar a aula ao planejamento e à turma correspondente.',
    },
    {
      code: 'A04',
      title:
        'Revisão para avaliação bimestral',
      className:
        '2ª Série B',
      subject:
        'Física',
      status:
        'Pendente',
      description:
        'Revisão dos conceitos essenciais e identificação de pontos que precisam de retomada.',
      nextStep:
        'Definir objetivos, atividades e critérios de acompanhamento.',
    },
  ]

const lessonFlow = [
  {
    code: '01',
    label: 'Planejamento',
    description:
      'Definir objetivos, contexto e estratégias.',
  },
  {
    code: '02',
    label: 'Execução',
    description:
      'Realizar a aula considerando o contexto da turma.',
  },
  {
    code: '03',
    label: 'Registro',
    description:
      'Documentar ações, observações e produções.',
  },
  {
    code: '04',
    label: 'Análise',
    description:
      'Relacionar evidências aos objetivos previstos.',
  },
]

function getStatusClasses(
  status: LessonStatus,
): string {
  if (
    status ===
    'Planejada'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    status ===
    'Em preparação'
  ) {
    return [
      'border-cyan-200',
      'bg-cyan-50',
      'text-[#075F78]',
    ].join(' ')
  }

  return [
    'border-amber-200',
    'bg-amber-50',
    'text-amber-800',
  ].join(' ')
}

export function AgendaLessons() {
  const planned =
    lessons.filter(
      (lesson) =>
        lesson.status ===
        'Planejada',
    ).length

  const preparing =
    lessons.filter(
      (lesson) =>
        lesson.status ===
        'Em preparação',
    ).length

  const pending =
    lessons.filter(
      (lesson) =>
        lesson.status ===
        'Pendente',
    ).length

  const subjects =
    new Set(
      lessons.map(
        (lesson) =>
          lesson.subject,
      ),
    ).size

  return (
    <AgendaPageShell
      eyebrow="Execução pedagógica"
      title="Aulas"
      description="Visualize aulas em preparação, planejadas ou pendentes e organize sua relação com turmas, planejamentos, objetivos e evidências."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo das aulas"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Planejadas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {planned}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Prontas para execução
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Em preparação
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {preparing}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Em organização
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Pendentes
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {pending}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Exigem definição
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Disciplinas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {subjects}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Áreas representadas
            </p>
          </article>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Organização da execução
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                Aulas organizadas
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Visão inicial dos registros demonstrativos atualmente disponíveis no módulo.
              </p>
            </header>

            <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
              {lessons.map(
                (
                  lesson,
                ) => (
                  <article
                    key={
                      lesson.code
                    }
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="font-mono text-xs font-bold text-[#0B7491]">
                            {
                              lesson.code
                            }
                          </span>

                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
                              {
                                lesson.subject
                              }
                            </p>

                            <h3 className="mt-2 break-words text-xl font-bold leading-7 text-[#071827]">
                              {
                                lesson.title
                              }
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${getStatusClasses(
                            lesson.status,
                          )}`}
                        >
                          {
                            lesson.status
                          }
                        </span>
                      </div>
                    </header>

                    <div className="space-y-4 p-5">
                      <p className="text-sm leading-6 text-slate-600">
                        {
                          lesson.description
                        }
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Turma
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            {
                              lesson.className
                            }
                          </p>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Disciplina
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            {
                              lesson.subject
                            }
                          </p>
                        </section>
                      </div>

                      <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
                          Próxima ação
                        </p>

                        <p className="mt-2 text-sm leading-6 text-cyan-950">
                          {
                            lesson.nextStep
                          }
                        </p>
                      </section>
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>

          <aside className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm xl:sticky xl:top-[176px]">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Fluxo EDI
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Ciclo da aula
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                A aula é tratada como parte de um processo pedagógico contínuo e rastreável.
              </p>
            </header>

            <div className="divide-y divide-white/10">
              {lessonFlow.map(
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

            <div className="border-t border-cyan-300/20 bg-cyan-300/10 p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                Módulos relacionados
              </p>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/agenda/planejamento"
                  className="inline-flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/10"
                >
                  Planejamentos

                  <span
                    aria-hidden="true"
                    className="text-cyan-300"
                  >
                    →
                  </span>
                </Link>

                <Link
                  href="/agenda/turmas"
                  className="inline-flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/10"
                >
                  Turmas

                  <span
                    aria-hidden="true"
                    className="text-cyan-300"
                  >
                    →
                  </span>
                </Link>

                <Link
                  href="/agenda/evidencias"
                  className="inline-flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/10"
                >
                  Evidências

                  <span
                    aria-hidden="true"
                    className="text-cyan-300"
                  >
                    →
                  </span>
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
            Estado atual do módulo
          </p>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-950">
            Os registros apresentados nesta tela ainda são demonstrativos. Cadastro, persistência, edição e vínculo real de aulas com turmas, planejamentos e evidências deverão ser implementados posteriormente pela arquitetura oficial da Agenda.
          </p>
        </section>
      </div>
    </AgendaPageShell>
  )
}
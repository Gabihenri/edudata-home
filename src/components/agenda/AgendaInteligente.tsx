import Link from 'next/link'

type OperationalStep = {
  code: string
  title: string
  description: string
}

type ApplicationItem = {
  code: string
  title: string
  description: string
}

const operationalFlow:
  OperationalStep[] = [
    {
      code: '01',
      title: 'Planejar',
      description:
        'Organizar objetivos, aulas, ações pedagógicas, reuniões, formações e intervenções.',
    },
    {
      code: '02',
      title: 'Registrar',
      description:
        'Documentar a execução do trabalho pedagógico e os contextos de aprendizagem.',
    },
    {
      code: '03',
      title: 'Evidenciar',
      description:
        'Relacionar registros a documentos, produções, relatos e resultados observáveis.',
    },
    {
      code: '04',
      title: 'Analisar',
      description:
        'Transformar dados e evidências em indicadores para acompanhamento e decisão.',
    },
  ]

const applications:
  ApplicationItem[] = [
    {
      code: 'A01',
      title: 'Calendário pedagógico',
      description:
        'Eventos pontuais, recorrência semanal e horários reutilizáveis.',
    },
    {
      code: 'A02',
      title: 'Planejamento',
      description:
        'Objetivos, estratégias, recursos, avaliação e contexto das turmas.',
    },
    {
      code: 'A03',
      title: 'Evidências',
      description:
        'Registros protegidos, contextualizados e preservados com governança.',
    },
    {
      code: 'A04',
      title: 'Tarefas',
      description:
        'Prioridades, prazos e pendências integradas ao fluxo de trabalho.',
    },
    {
      code: 'A05',
      title: 'Indicadores',
      description:
        'Leitura consolidada da operação sem substituir o contexto pedagógico.',
    },
    {
      code: 'A06',
      title: 'Histórico',
      description:
        'Memória institucional, versões, auditoria, exclusões e restaurações.',
    },
  ]

const ediPillars = [
  {
    label: 'Evidências',
    description:
      'Registros sustentam o acompanhamento.',
  },
  {
    label: 'Inclusão',
    description:
      'A tecnologia respeita pessoas e contextos.',
  },
  {
    label: 'Inteligência',
    description:
      'Dados apoiam decisões educacionais.',
  },
]

export function AgendaInteligente() {
  return (
    <section
      id="agenda"
      className="overflow-hidden bg-[#EEF3F7]"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
                Produto especializado
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Integrado ao EIOS
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              Agenda Inteligente EDI
            </p>

            <h2 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-[#071827] sm:text-5xl lg:text-6xl">
              O ambiente operacional para organizar o trabalho educacional.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              A Agenda Inteligente EDI conecta planejamento, calendário,
              tarefas, turmas, evidências, indicadores e histórico em um
              fluxo integrado à plataforma EduData IA.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-500">
              Construída a partir dos desafios reais de professores,
              coordenadores e gestores, ela reduz fragmentação,
              preserva a memória pedagógica e fortalece decisões
              fundamentadas em evidências.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/agenda"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#0B2940]"
              >
                Conhecer a Agenda
              </Link>

              <Link
                href="/agenda/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
              >
                Acessar ambiente
              </Link>
            </div>

            <section className="mt-10 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
              <header className="border-b border-white/10 px-5 py-5 sm:px-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Arquitetura oficial
                </p>

                <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                  Um produto construído sobre o EIOS
                </h3>
              </header>

              <div className="divide-y divide-white/10">
                <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
                  <span className="font-semibold">
                    Framework EDI
                  </span>

                  <span className="font-mono text-xs font-bold text-cyan-300">
                    01
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
                  <span className="font-semibold">
                    EIOS
                  </span>

                  <span className="font-mono text-xs font-bold text-cyan-300">
                    02
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
                  <span className="font-semibold">
                    Core compartilhado
                  </span>

                  <span className="font-mono text-xs font-bold text-cyan-300">
                    03
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 bg-cyan-300/10 px-5 py-4 sm:px-7">
                  <span className="font-bold text-cyan-100">
                    Agenda Inteligente EDI
                  </span>

                  <span className="font-mono text-xs font-bold text-cyan-300">
                    04
                  </span>
                </div>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Fluxo operacional EDI
              </p>

              <h3 className="mt-2 text-2xl font-bold text-[#071827]">
                Do planejamento à análise
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Um ciclo contínuo para organizar, documentar e acompanhar
                o trabalho educacional.
              </p>
            </header>

            <div className="divide-y divide-slate-200">
              {operationalFlow.map(
                (step) => (
                  <article
                    key={step.code}
                    className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7"
                  >
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {step.code}
                    </span>

                    <div>
                      <h4 className="text-lg font-bold text-[#071827]">
                        {step.title}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>

            <footer className="border-t border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-950">
                Planejar → Registrar → Evidenciar → Analisar
              </p>
            </footer>
          </section>
        </div>

        <section className="mt-14 sm:mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Aplicações operacionais
            </p>

            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Módulos conectados em uma única experiência.
            </h3>

            <p className="mt-5 text-base leading-7 text-slate-600">
              Cada módulo compartilha identidade, acesso, segurança,
              governança e dados com o restante da plataforma.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {applications.map(
              (application) => (
                <article
                  key={application.code}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {application.code}
                    </span>
                  </header>

                  <div className="p-5">
                    <h4 className="text-xl font-bold text-[#071827]">
                      {application.title}
                    </h4>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {application.description}
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="mt-14 grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-3 sm:mt-16">
          {ediPillars.map(
            (
              pillar,
              index,
            ) => (
              <article
                key={pillar.label}
                className={`px-5 py-6 sm:px-7 ${
                  index < 2
                    ? 'border-b border-slate-200 sm:border-b-0 sm:border-r'
                    : ''
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                  {pillar.label}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {pillar.description}
                </p>
              </article>
            ),
          )}
        </section>
      </div>
    </section>
  )
}
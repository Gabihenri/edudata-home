import type {
  Metadata,
} from 'next'

import Image from 'next/image'
import Link from 'next/link'

export const metadata:
  Metadata = {
  title:
    'Agenda Inteligente EDI | EduData IA',

  description:
    'Planejamento, registros, evidências e inteligência educacional integrados ao EIOS.',
}

const operationalFlow = [
  {
    code: '01',
    title: 'Planejar',
    description:
      'Organize eventos, aulas, reuniões, tarefas e ações pedagógicas.',
  },
  {
    code: '02',
    title: 'Registrar',
    description:
      'Documente a execução do trabalho pedagógico e institucional.',
  },
  {
    code: '03',
    title: 'Evidenciar',
    description:
      'Relacione registros, documentos, produções e resultados observáveis.',
  },
  {
    code: '04',
    title: 'Analisar',
    description:
      'Acompanhe indicadores, histórico, pendências e prioridades.',
  },
]

const resources = [
  {
    code: '01',
    title: 'Calendário pedagógico',
    description:
      'Organize eventos pontuais, compromissos recorrentes e horários-padrão.',
  },
  {
    code: '02',
    title: 'Planejamento',
    description:
      'Registre objetivos, estratégias, recursos e formas de acompanhamento.',
  },
  {
    code: '03',
    title: 'Evidências',
    description:
      'Preserve registros pedagógicos com segurança, contexto e governança.',
  },
  {
    code: '04',
    title: 'Histórico',
    description:
      'Consulte registros, versões, exclusões preservadas e restaurações.',
  },
]

const ediPillars = [
  {
    label: 'Evidências',
    description:
      'Registros contextualizados e verificáveis.',
  },
  {
    label: 'Inclusão',
    description:
      'Organização acessível e proteção das pessoas.',
  },
  {
    label: 'Inteligência',
    description:
      'Dados transformados em apoio à decisão.',
  },
]

export default function AgendaPage() {
  return (
    <main className="min-h-screen bg-[#EEF3F7]">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Voltar para a Home da EduData IA"
            className="min-w-0"
          >
            <Image
              src="/logo-agenda-inteligente-edi.png"
              alt="Agenda Inteligente EDI"
              width={270}
              height={100}
              priority
              className="h-auto w-36 object-contain object-left sm:w-44"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="hidden min-h-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
            >
              Home
            </Link>

            <Link
              href="/agenda/dashboard"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#0B7491] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#09657E]"
            >
              Acessar
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#071827] text-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 top-12 h-72 w-72 rounded-full border border-cyan-300/10"
        />

        <div
          aria-hidden="true"
          className="absolute -right-4 top-36 h-40 w-40 rounded-full border border-cyan-300/10"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                Produto especializado
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Integrado ao EIOS
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Agenda Inteligente EDI
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Organize o trabalho pedagógico em um único fluxo operacional.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Planejamento, calendário, tarefas, turmas, evidências,
              indicadores e histórico conectados ao ecossistema da
              EduData IA.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/agenda/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
              >
                Acessar a Agenda
              </Link>

              <Link
                href="#recursos-agenda"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-center font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                Conhecer recursos
              </Link>
            </div>
          </div>

          <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04]">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Método operacional
              </p>

              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Do planejamento à análise
              </h2>
            </header>

            <div className="divide-y divide-white/10">
              {operationalFlow.map(
                (step) => (
                  <article
                    key={step.code}
                    className="grid grid-cols-[38px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7 sm:py-5"
                  >
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {step.code}
                    </span>

                    <div>
                      <h3 className="font-bold text-white">
                        {step.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {step.description}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>

            <footer className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-4 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-100">
                Planejar, registrar, evidenciar e analisar.
              </p>
            </footer>
          </aside>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl sm:grid-cols-3">
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
        </div>
      </section>

      <section
        id="recursos-agenda"
        className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Recursos operacionais
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Uma agenda construída para o trabalho educacional.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Os módulos compartilham a mesma identidade, os mesmos
              princípios de governança e a mesma base operacional do
              EIOS.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {resources.map(
              (resource) => (
                <article
                  key={resource.code}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {resource.code}
                    </span>
                  </header>

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-[#071827]">
                      {resource.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {resource.description}
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Arquitetura da plataforma
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Um produto especializado construído sobre o EIOS.
            </h2>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              A Agenda Inteligente EDI não funciona como uma solução
              isolada. Ela compartilha identidade, acesso, dados,
              segurança e inteligência com os demais produtos da
              plataforma.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#071827] text-white">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                Estrutura oficial
              </p>
            </div>

            <div className="divide-y divide-white/10">
              <div className="px-5 py-4 font-semibold">
                Framework EDI
              </div>

              <div className="px-5 py-4 font-semibold">
                EIOS
              </div>

              <div className="px-5 py-4 font-semibold">
                Core compartilhado
              </div>

              <div className="bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100">
                Agenda Inteligente EDI
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071827] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Ambiente operacional
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Acesse a Agenda Inteligente EDI.
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Utilize os módulos integrados para organizar sua rotina
              pedagógica.
            </p>
          </div>

          <Link
            href="/agenda/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
          >
            Entrar na Agenda
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            Agenda Inteligente EDI
          </p>

          <p>
            Produto operacional integrado ao EIOS
          </p>
        </div>
      </footer>
    </main>
  )
}
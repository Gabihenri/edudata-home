import type {
  Metadata,
} from 'next'

import Link from 'next/link'

export const metadata: Metadata = {
  title:
    'Professor Digital | EduData IA',

  description:
    'Ambiente de desenvolvimento profissional, identidade docente e inteligência educacional da EduData IA.',
}

const primaryModules = [
  {
    eyebrow:
      'Organizar',

    title:
      'Ambiente Docente',

    description:
      'Acesse sua rotina pedagógica integrada à Agenda Inteligente EDI.',

    href:
      '/professor-digital/agenda',

    action:
      'Abrir ambiente',
  },
  {
    eyebrow:
      'Identidade',

    title:
      'Perfil Docente',

    description:
      'Acompanhe informações profissionais, indicadores e evolução do perfil EDI.',

    href:
      '/professor-digital/perfil',

    action:
      'Abrir perfil',
  },
  {
    eyebrow:
      'Contextualizar',

    title:
      'Contexto da Escola',

    description:
      'Mantenha atualizadas as informações institucionais que qualificam as análises.',

    href:
      '/professor-digital/escola',

    action:
      'Atualizar contexto',
  },
  {
    eyebrow:
      'Desenvolver',

    title:
      'Plano de Desenvolvimento',

    description:
      'Organize metas profissionais, competências e ações de desenvolvimento docente.',

    href:
      '/professor-digital/plano',

    action:
      'Abrir plano',
  },
  {
    eyebrow:
      'Analisar',

    title:
      'Recomendações',

    description:
      'Consulte orientações explicáveis produzidas a partir do contexto pedagógico.',

    href:
      '/professor-digital/recomendacoes',

    action:
      'Ver recomendações',
  },
]

const operationalModules = [
  {
    title:
      'Planejamentos',

    description:
      'Organize objetivos, sequências didáticas e ações pedagógicas.',

    href:
      '/agenda/planejamento',
  },
  {
    title:
      'Calendário',

    description:
      'Visualize compromissos, reuniões, formações e prazos.',

    href:
      '/agenda/calendario',
  },
  {
    title:
      'Evidências',

    description:
      'Registre práticas, intervenções e produções dos estudantes.',

    href:
      '/agenda/evidencias',
  },
  {
    title:
      'Tarefas',

    description:
      'Acompanhe pendências, prioridades e responsabilidades.',

    href:
      '/agenda/tarefas',
  },
  {
    title:
      'Indicadores',

    description:
      'Consulte dados e tendências para apoiar decisões pedagógicas.',

    href:
      '/agenda/indicadores',
  },
  {
    title:
      'Histórico',

    description:
      'Acompanhe registros e a evolução do trabalho pedagógico.',

    href:
      '/agenda/historico',
  },
]

function PrimaryModuleCard({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  href: string
  action: string
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-56 flex-col overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-card transition duration-250 hover:-translate-y-0.5 hover:border-border-brand hover:shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
    >
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-1 bg-brand-secondary"
      />

      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-secondary">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-xl font-bold text-content-primary">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-7 text-content-secondary">
        {description}
      </p>

      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-brand-secondary">
        {action}

        <span
          aria-hidden="true"
          className="transition-transform duration-250 group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  )
}

function OperationalModuleCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-panel border border-border bg-surface p-5 shadow-card transition duration-250 hover:-translate-y-0.5 hover:border-border-brand hover:shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
    >
      <h3 className="font-bold text-content-primary">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-content-secondary">
        {description}
      </p>

      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-secondary">
        Acessar

        <span
          aria-hidden="true"
          className="transition-transform duration-250 group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  )
}

export default function ProfessorDigitalPage() {
  return (
    <main className="min-h-screen bg-surface-page text-content-primary">
      <header className="border-b border-white/10 bg-brand-primary text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-accent">
              Professor Digital
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Desenvolvimento profissional docente
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Identidade pedagógica, desenvolvimento profissional,
              recomendações e inteligência educacional em um único ambiente.
            </p>
          </div>

          <nav
            aria-label="Navegação do Professor Digital"
            className="flex flex-wrap gap-3"
          >
            <Link
              href="/"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition duration-250 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
            >
              Central EIOS
            </Link>

            <Link
              href="/professor-digital/agenda"
              className="rounded-full bg-brand-secondary px-5 py-3 text-sm font-semibold text-white transition duration-250 hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
            >
              Ambiente Docente
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-10 lg:py-10">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-brand-primary text-white shadow-card sm:rounded-shell">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-brand-accent/15" />

            <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full border border-brand-accent/10" />

            <div className="absolute bottom-0 right-0 h-px w-2/3 bg-brand-line" />

            <div className="absolute bottom-0 right-[18%] h-24 w-px bg-gradient-to-t from-brand-accent/25 to-transparent" />

            <div className="absolute left-0 top-0 h-full w-1.5 bg-brand-secondary" />
          </div>

          <div className="relative px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">
              <span className="text-brand-accent">
                EIOS
              </span>

              <span
                aria-hidden="true"
                className="text-slate-500"
              >
                /
              </span>

              <span className="text-slate-300">
                Produto especializado
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-accent">
                  Centro de desenvolvimento docente
                </p>

                <h2 className="mt-3 max-w-4xl text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Professor Digital
                </h2>

                <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                  Construa sua identidade pedagógica, acompanhe sua evolução
                  profissional e utilize as evidências do Framework EDI para
                  orientar seu desenvolvimento.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/professor-digital/agenda"
                    className="rounded-full bg-white px-6 py-3 font-semibold text-brand-primary transition duration-250 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                  >
                    Abrir ambiente docente
                  </Link>

                  <Link
                    href="/professor-digital/perfil"
                    className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition duration-250 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                  >
                    Consultar perfil
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-xs lg:justify-end">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Ambiente
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    Profissional
                  </p>
                </div>

                <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/10 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                    Inteligência
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    EIOS ativa
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 border-t border-white/10 bg-white/[0.03]">
            <div className="border-r border-white/10 px-3 py-3 text-center sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Evidências
              </p>
            </div>

            <div className="border-r border-white/10 px-3 py-3 text-center sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Inclusão
              </p>
            </div>

            <div className="px-3 py-3 text-center sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Inteligência
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="professor-primary-modules">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">
              Professor Digital
            </p>

            <h2
              id="professor-primary-modules"
              className="mt-2 text-3xl font-bold tracking-tight text-content-primary"
            >
              Desenvolvimento, identidade e evolução
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-content-secondary">
              Acesse os módulos que organizam o contexto profissional e
              qualificam as análises do Professor Digital.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {primaryModules.map(
              module => (
                <PrimaryModuleCard
                  key={module.href}
                  eyebrow={module.eyebrow}
                  title={module.title}
                  description={module.description}
                  href={module.href}
                  action={module.action}
                />
              ),
            )}
          </div>
        </section>

        <section aria-labelledby="professor-operational-modules">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">
              Agenda Inteligente EDI
            </p>

            <h2
              id="professor-operational-modules"
              className="mt-2 text-3xl font-bold tracking-tight text-content-primary"
            >
              Ferramentas operacionais integradas
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-content-secondary">
              Planejamentos, registros e indicadores alimentam continuamente o
              contexto educacional e a identidade pedagógica.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {operationalModules.map(
              module => (
                <OperationalModuleCard
                  key={module.href}
                  title={module.title}
                  description={module.description}
                  href={module.href}
                />
              ),
            )}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-panel border border-border bg-surface p-7 shadow-card sm:p-9">
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-1 bg-brand-secondary"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-border-brand/60"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">
                Ecossistema EDI
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-content-primary">
                Do registro à evolução profissional.
              </h2>

              <p className="mt-4 leading-7 text-content-secondary">
                Cada planejamento, aula, evidência e ação de desenvolvimento
                fortalece o histórico docente e melhora a qualidade das
                recomendações apresentadas pelo EIOS.
              </p>
            </div>

            <Link
              href="/professor-digital/agenda"
              className="inline-flex w-fit shrink-0 rounded-full bg-brand-secondary px-7 py-4 font-semibold text-white transition duration-250 hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
            >
              Entrar no ambiente docente
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
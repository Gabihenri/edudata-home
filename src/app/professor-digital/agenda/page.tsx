import type {
  Metadata,
} from 'next'

import Link from 'next/link'

import {
  AgendaCalendar,
  AgendaDashboard,
  AgendaTasks,
} from '@/components/agenda'

import {
  ProfessorDigitalNextStep,
} from '@/components/professor-digital/ProfessorDigitalNextStep'

import {
  ProfessorDigitalTodayPanel,
} from '@/components/professor-digital/ProfessorDigitalTodayPanel'

import {
  SectionHeader,
} from '@/components/ui/layout/SectionHeader'

export const metadata: Metadata = {
  title:
    'Ambiente Docente | Professor Digital',

  description:
    'Ambiente operacional do Professor Digital integrado à Agenda Inteligente EDI.',
}

const agendaModules = [
  {
    title:
      'Planejamento',

    description:
      'Organize aulas, objetivos de aprendizagem, sequências didáticas e ações pedagógicas.',

    href:
      '/agenda/planejamento',

    label:
      'Abrir planejamento',
  },
  {
    title:
      'Calendário',

    description:
      'Visualize compromissos, reuniões, formações e atividades da rotina escolar.',

    href:
      '/agenda/calendario',

    label:
      'Abrir calendário',
  },
  {
    title:
      'Evidências',

    description:
      'Registre práticas, produções dos estudantes, intervenções e ações pedagógicas.',

    href:
      '/agenda/evidencias',

    label:
      'Registrar evidências',
  },
  {
    title:
      'Tarefas',

    description:
      'Acompanhe pendências, prioridades, prazos e responsabilidades docentes.',

    href:
      '/agenda/tarefas',

    label:
      'Ver tarefas',
  },
  {
    title:
      'Turmas',

    description:
      'Acesse a organização das turmas e os registros relacionados aos estudantes.',

    href:
      '/agenda/turmas',

    label:
      'Ver turmas',
  },
  {
    title:
      'Indicadores',

    description:
      'Acompanhe dados, tendências e informações para apoiar decisões pedagógicas.',

    href:
      '/agenda/indicadores',

    label:
      'Ver indicadores',
  },
]

const professorModules = [
  {
    title:
      'Perfil docente',

    description:
      'Organize informações profissionais, áreas de atuação e preferências pedagógicas.',

    href:
      '/professor-digital/perfil',
  },
  {
    title:
      'Contexto da escola',

    description:
      'Registre informações institucionais importantes para personalizar o ambiente.',

    href:
      '/professor-digital/escola',
  },
  {
    title:
      'Plano de desenvolvimento',

    description:
      'Acompanhe objetivos profissionais, formações e evolução docente.',

    href:
      '/professor-digital/plano',
  },
  {
    title:
      'Recomendações',

    description:
      'Receba orientações e sugestões baseadas no contexto pedagógico registrado.',

    href:
      '/professor-digital/recomendacoes',
  },
]

function ModuleCard({
  title,
  description,
  href,
  label,
}: {
  title: string

  description: string

  href: string

  label: string
}) {
  return (
    <Link
      href={
        href
      }
      className="group relative flex min-h-56 flex-col overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-card transition duration-250 hover:-translate-y-0.5 hover:border-border-brand hover:shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
    >
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-1 bg-brand-secondary"
      />

      <h3 className="text-xl font-bold text-content-primary">
        {
          title
        }
      </h3>

      <p className="mt-4 text-sm leading-7 text-content-secondary">
        {
          description
        }
      </p>

      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-brand-secondary">
        {
          label
        }

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

export default function AgendaProfessorPage() {
  return (
    <main className="min-h-screen bg-surface-page text-content-primary">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-10 lg:py-10">
        <ProfessorDigitalTodayPanel />

        <section aria-label="Próximo passo recomendado">
          <ProfessorDigitalNextStep />
        </section>

        <section aria-label="Resumo da rotina pedagógica">
          <SectionHeader
            eyebrow="Acompanhamento"
            title="Resumo da rotina pedagógica"
            description="Acompanhe a execução do ciclo pedagógico registrado na Agenda Inteligente EDI."
          />

          <div className="mt-6">
            <AgendaDashboard />
          </div>
        </section>

        <section aria-label="Calendário e próximos compromissos">
          <SectionHeader
            eyebrow="Agenda integrada"
            title="Calendário e próximos compromissos"
            description="Consulte as atividades previstas e mantenha a organização da rotina docente."
            actions={
              <Link
                href="/agenda/calendario"
                className="inline-flex rounded-full border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-brand-primary transition duration-250 hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
              >
                Ver calendário completo
              </Link>
            }
          />

          <div className="mt-6">
            <AgendaCalendar />
          </div>
        </section>

        <section aria-label="Tarefas e prioridades">
          <SectionHeader
            eyebrow="Organização"
            title="Tarefas e prioridades"
            description="Acompanhe prazos, pendências e ações que precisam de atenção."
            actions={
              <Link
                href="/agenda/tarefas"
                className="inline-flex rounded-full border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-brand-primary transition duration-250 hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
              >
                Ver todas as tarefas
              </Link>
            }
          />

          <div className="mt-6">
            <AgendaTasks />
          </div>
        </section>

        <section aria-label="Ferramentas da Agenda Inteligente EDI">
          <SectionHeader
            eyebrow="Agenda Inteligente EDI"
            title="Ferramentas para a rotina docente"
            description="Acesse os módulos que sustentam planejamento, execução, registros e análise pedagógica."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {
              agendaModules.map(
                module => (
                  <ModuleCard
                    key={
                      module.href
                    }
                    title={
                      module.title
                    }
                    description={
                      module.description
                    }
                    href={
                      module.href
                    }
                    label={
                      module.label
                    }
                  />
                ),
              )
            }
          </div>
        </section>

        <section aria-label="Desenvolvimento profissional docente">
          <SectionHeader
            eyebrow="Desenvolvimento profissional"
            title="Perfil, contexto e evolução docente"
            description="Mantenha atualizadas as informações que qualificam as análises e recomendações do Professor Digital."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {
              professorModules.map(
                module => (
                  <ModuleCard
                    key={
                      module.href
                    }
                    title={
                      module.title
                    }
                    description={
                      module.description
                    }
                    href={
                      module.href
                    }
                    label="Acessar módulo"
                  />
                ),
              )
            }
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
                Integração EDI
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-content-primary">
                Do planejamento à tomada de decisão.
              </h2>

              <p className="mt-4 leading-7 text-content-secondary">
                Cada planejamento, tarefa e evidência alimenta o contexto
                educacional, fortalece o histórico pedagógico e permite que o
                Professor Digital apresente análises e recomendações
                contextualizadas.
              </p>
            </div>

            <Link
              href="/agenda/historico"
              className="inline-flex w-fit shrink-0 rounded-full bg-brand-secondary px-7 py-4 font-semibold text-white transition duration-250 hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
            >
              Consultar histórico
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
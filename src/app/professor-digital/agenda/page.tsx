import type { Metadata } from 'next'
import Link from 'next/link'

import {
  AgendaCalendar,
  AgendaDashboard,
  AgendaTasks,
} from '@/components/agenda'

export const metadata: Metadata = {
  title: 'Ambiente Docente | Professor Digital',
  description:
    'Ambiente operacional do Professor Digital integrado à Agenda Inteligente EDI.',
}

const modules = [
  {
    title: 'Planejamento',
    description:
      'Organize aulas, objetivos de aprendizagem, sequências didáticas e ações pedagógicas.',
    href: '/agenda/planejamento',
    label: 'Abrir planejamento',
  },
  {
    title: 'Calendário',
    description:
      'Visualize compromissos, reuniões, formações e atividades da rotina escolar.',
    href: '/agenda/calendario',
    label: 'Abrir calendário',
  },
  {
    title: 'Evidências',
    description:
      'Registre práticas, produções dos estudantes, intervenções e ações pedagógicas.',
    href: '/agenda/evidencias',
    label: 'Registrar evidências',
  },
  {
    title: 'Tarefas',
    description:
      'Acompanhe pendências, prioridades, prazos e responsabilidades docentes.',
    href: '/agenda/tarefas',
    label: 'Ver tarefas',
  },
  {
    title: 'Turmas',
    description:
      'Acesse a organização das turmas e os registros relacionados aos estudantes.',
    href: '/agenda/turmas',
    label: 'Ver turmas',
  },
  {
    title: 'Indicadores',
    description:
      'Acompanhe dados, tendências e informações para apoiar decisões pedagógicas.',
    href: '/agenda/indicadores',
    label: 'Ver indicadores',
  },
]

const professorModules = [
  {
    title: 'Perfil docente',
    description:
      'Organize informações profissionais, áreas de atuação e preferências pedagógicas.',
    href: '/professor-digital/perfil',
  },
  {
    title: 'Contexto da escola',
    description:
      'Registre informações institucionais importantes para personalizar o ambiente.',
    href: '/professor-digital/escola',
  },
  {
    title: 'Plano de desenvolvimento',
    description:
      'Acompanhe objetivos profissionais, formações e evolução docente.',
    href: '/professor-digital/plano',
  },
  {
    title: 'Recomendações',
    description:
      'Receba orientações e sugestões baseadas no contexto pedagógico registrado.',
    href: '/professor-digital/recomendacoes',
  },
]

export default function AgendaProfessorPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#081C2E] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              Professor Digital
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Ambiente docente
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Planejamento, rotina pedagógica, evidências e inteligência
              educacional em um único ambiente.
            </p>
          </div>

          <nav
            aria-label="Navegação do ambiente docente"
            className="flex flex-wrap gap-3"
          >
            <Link
              href="/professor-digital"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
            >
              Voltar ao produto
            </Link>

            <Link
              href="/agenda/dashboard"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Abrir Agenda EDI
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        <section className="rounded-3xl bg-gradient-to-br from-[#081C2E] to-[#0A3A5E] p-8 text-white shadow-lg md:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Visão diária
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Organize o trabalho docente com clareza e evidências.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              O Professor Digital conecta planejamento, agenda, registros,
              tarefas e indicadores para reduzir retrabalho e ampliar o tempo
              dedicado à aprendizagem.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/agenda/planejamento"
              className="rounded-full bg-white px-6 py-3 font-semibold text-[#081C2E] transition hover:bg-slate-100"
            >
              Criar planejamento
            </Link>

            <Link
              href="/agenda/evidencias"
              className="rounded-full border border-white/25 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Registrar evidência
            </Link>
          </div>
        </section>

        <section aria-labelledby="resumo-docente">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Acompanhamento
            </p>

            <h2
              id="resumo-docente"
              className="mt-2 text-3xl font-bold text-[#081C2E]"
            >
              Resumo da rotina pedagógica
            </h2>
          </div>

          <AgendaDashboard />
        </section>

        <section aria-labelledby="agenda-calendario">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Agenda integrada
              </p>

              <h2
                id="agenda-calendario"
                className="mt-2 text-3xl font-bold text-[#081C2E]"
              >
                Calendário e próximos compromissos
              </h2>
            </div>

            <Link
              href="/agenda/calendario"
              className="w-fit rounded-full border border-[#0A3A5E]/20 bg-white px-5 py-3 text-sm font-semibold text-[#0A3A5E] transition hover:bg-slate-50"
            >
              Ver calendário completo
            </Link>
          </div>

          <AgendaCalendar />
        </section>

        <section aria-labelledby="tarefas-docente">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Organização
              </p>

              <h2
                id="tarefas-docente"
                className="mt-2 text-3xl font-bold text-[#081C2E]"
              >
                Tarefas e prioridades
              </h2>
            </div>

            <Link
              href="/agenda/tarefas"
              className="w-fit rounded-full border border-[#0A3A5E]/20 bg-white px-5 py-3 text-sm font-semibold text-[#0A3A5E] transition hover:bg-slate-50"
            >
              Ver todas as tarefas
            </Link>
          </div>

          <AgendaTasks />
        </section>

        <section aria-labelledby="modulos-agenda">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Agenda Inteligente EDI
            </p>

            <h2
              id="modulos-agenda"
              className="mt-2 text-3xl font-bold text-[#081C2E]"
            >
              Ferramentas para a rotina docente
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-cyan-600/30 hover:shadow-lg"
              >
                <h3 className="text-xl font-bold text-[#081C2E]">
                  {module.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {module.description}
                </p>

                <span className="mt-auto inline-flex items-center gap-2 pt-7 font-semibold text-cyan-700">
                  {module.label}

                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="desenvolvimento-docente">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Desenvolvimento profissional
            </p>

            <h2
              id="desenvolvimento-docente"
              className="mt-2 text-3xl font-bold text-[#081C2E]"
            >
              Perfil, contexto e evolução docente
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {professorModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-cyan-600/30 hover:shadow-lg"
              >
                <h3 className="text-xl font-bold text-[#081C2E]">
                  {module.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {module.description}
                </p>

                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-cyan-700">
                  Acessar módulo

                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-700/10 bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Integração EDI
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#081C2E]">
                Do planejamento à tomada de decisão.
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Cada planejamento, tarefa e evidência alimenta o histórico
                pedagógico e fortalece análises futuras dentro do ecossistema
                EduData IA.
              </p>
            </div>

            <Link
              href="/agenda/historico"
              className="w-fit shrink-0 rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Consultar histórico
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
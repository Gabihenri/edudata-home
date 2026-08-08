import Link from 'next/link'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import TeacherCommandCenter from '@/components/dashboard/TeacherCommandCenter'

type AgendaModuleLink = {
  code: string
  title: string
  description: string
  href: string
  emphasis?: boolean
  intelligence?: boolean
}

const agendaModules: AgendaModuleLink[] = [
  {
    code: '01',
    title: 'Planejamento',
    description: 'Organize propostas sempre vinculadas às turmas e ao período acadêmico.',
    href: '/agenda/planejamento',
    emphasis: true,
  },
  {
    code: '02',
    title: 'Diário de Classe',
    description: 'Abra a aula a partir do planejamento e registre frequência na lista nominal.',
    href: '/agenda/diario-classe',
    emphasis: true,
  },
  {
    code: '03',
    title: 'Avaliações',
    description: 'Consulte instrumentos, resultados, notas e classificação da aprendizagem.',
    href: '/agenda/avaliacoes',
  },
  {
    code: '04',
    title: 'Evidências',
    description: 'Documente a execução pedagógica com proteção, contexto e rastreabilidade.',
    href: '/agenda/evidencias',
  },
  {
    code: '05',
    title: 'Estudantes',
    description: 'Localize estudantes pela turma e abra o Caderno Pedagógico longitudinal.',
    href: '/agenda/caderno',
  },
  {
    code: '06',
    title: 'Ocorrências',
    description: 'Registre e consulte acontecimentos vinculados a estudantes já cadastrados.',
    href: '/agenda/ocorrencias',
  },
  {
    code: '07',
    title: 'Casos Pedagógicos',
    description: 'Estruture acompanhamento a partir dos registros já existentes.',
    href: '/agenda/casos',
  },
  {
    code: '08',
    title: 'Centro de Inteligência',
    description: 'Visualize relações entre turma, planejamento, aula, evidências, avaliações e acompanhamento.',
    href: '/agenda/inteligencia',
    intelligence: true,
  },
  {
    code: '09',
    title: 'Relatórios',
    description: 'Gere documentos institucionais ou individuais com dados já registrados na Agenda.',
    href: '/agenda/relatorios',
    intelligence: true,
  },
  {
    code: '10',
    title: 'Indicadores',
    description: 'Consulte leituras consolidadas dos registros autorizados.',
    href: '/agenda/indicadores',
  },
  {
    code: '11',
    title: 'Histórico',
    description: 'Consulte versões, exclusões, restaurações e registros de auditoria.',
    href: '/agenda/historico',
  },
  {
    code: '12',
    title: 'Calendário',
    description: 'Acompanhe compromissos, períodos, reuniões e prazos.',
    href: '/agenda/calendario',
  },
  {
    code: '13',
    title: 'Cadastros e Integrações',
    description: 'Configure identidade, calendário acadêmico, turmas e estudantes sem misturar cadastros com a operação diária.',
    href: '/agenda/cadastros',
    emphasis: true,
  },
]

export default function AgendaDashboardPage() {
  return (
    <AgendaPageShell
      eyebrow="Meu Dia · Centro de Comando Pedagógico"
      title="Agenda Inteligente EDI"
      description="Acompanhe sua operação diária, identifique dependências e acesse inteligência e relatórios sem redigitar informações que a plataforma já conhece."
    >
      <div className="space-y-6 sm:space-y-8">
        <TeacherCommandCenter />

        <section className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#075F78]">EIOS Registry · Configuração</p>
              <h2 className="mt-2 text-2xl font-bold text-[#071827]">Cadastros ficam fora da operação.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Use o Centro de Administração para organizar identidade dos relatórios, calendário acadêmico, turmas e estudantes. Depois, Planejamento, Diário, Avaliações e Evidências reutilizam esses dados automaticamente.
              </p>
            </div>
            <Link
              href="/agenda/cadastros"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#09657E]"
            >
              Abrir Cadastros e Integrações
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-cyan-200 bg-[#071827] text-white shadow-[0_28px_90px_-55px_rgba(8,145,178,0.9)]">
          <div className="grid gap-7 px-5 py-7 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                EIOS · Camada de inteligência
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Veja como seus registros se conectam.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                O Centro de Inteligência representa o fluxo Turma → Planejamento → Aula → Frequência → Avaliação → Evidência → Acompanhamento em uma leitura visual e acionável.
              </p>

              <div className="mt-5 grid max-w-3xl gap-2 sm:grid-cols-3">
                {[
                  ['01', 'Contexto', 'Turma e estudante'],
                  ['02', 'Relações', 'Fluxo pedagógico'],
                  ['03', 'Ação', 'Atalhos operacionais'],
                ].map(([code, title, description]) => (
                  <div key={code} className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                    <span className="font-mono text-[10px] font-bold text-cyan-300">{code}</span>
                    <p className="mt-2 text-sm font-bold text-white">{title}</p>
                    <p className="mt-1 text-xs text-slate-400">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/agenda/inteligencia"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-[#071827] transition hover:bg-cyan-300"
              >
                Abrir Centro de Inteligência
              </Link>
              <Link
                href="/agenda/relatorios"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Gerar relatório
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_-50px_rgba(15,23,42,0.55)]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Operação pedagógica</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Fluxo da Agenda</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Cada módulo consome o contexto anterior. Cadastros ficam na gestão; as telas operacionais servem para consultar, executar e registrar.
            </p>
          </div>

          <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">
            {agendaModules.map(module => (
              <Link
                key={module.code}
                href={module.href}
                className={`group relative flex min-h-44 flex-col p-5 transition sm:p-6 ${
                  module.intelligence
                    ? 'bg-[#071827] text-white hover:bg-[#0B2638]'
                    : 'bg-white hover:bg-cyan-50/60'
                }`}
              >
                {module.emphasis || module.intelligence ? (
                  <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${module.intelligence ? 'bg-cyan-400' : 'bg-cyan-600'}`} />
                ) : null}

                <span className={`font-mono text-xs font-bold tracking-[0.14em] ${module.intelligence ? 'text-cyan-300' : 'text-cyan-700'}`}>
                  {module.code}
                </span>
                <h3 className={`mt-5 text-lg font-bold ${module.intelligence ? 'text-white' : 'text-slate-950'}`}>
                  {module.title}
                </h3>
                <p className={`mt-2 text-sm leading-6 ${module.intelligence ? 'text-slate-300' : 'text-slate-600'}`}>
                  {module.description}
                </p>
                <span className={`mt-auto pt-5 text-sm font-semibold transition group-hover:translate-x-1 ${module.intelligence ? 'text-cyan-300' : 'text-cyan-800'}`}>
                  Acessar
                </span>
              </Link>
            ))}
          </div>

          <footer className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>Autonomia individual e governança institucional utilizam o mesmo núcleo EIOS.</p>
              <p className="font-medium text-slate-600">Framework EDI · EIOS</p>
            </div>
          </footer>
        </section>
      </div>
    </AgendaPageShell>
  )
}

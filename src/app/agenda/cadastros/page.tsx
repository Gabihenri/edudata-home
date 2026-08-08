'use client'

import Link from 'next/link'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

const sections = [
  {
    code: '01',
    title: 'Identidade e documentos',
    description: 'Dados do professor individual ou da instituição usados em cabeçalhos, rodapés e relatórios.',
    href: '#',
    status: 'Próxima etapa',
  },
  {
    code: '02',
    title: 'Calendário acadêmico',
    description: 'Ano letivo, períodos, dias letivos, férias, recessos, feriados, pontos facultativos e eventos institucionais.',
    href: '/agenda/cadastros/calendario',
    status: 'Disponível',
  },
  {
    code: '03',
    title: 'Turmas',
    description: 'Contextos de aprendizagem e painel visual das turmas cadastradas.',
    href: '/agenda/turmas',
    status: 'Disponível',
  },
  {
    code: '04',
    title: 'Estudantes',
    description: 'Cadastro único, matrícula institucional, número de chamada e importação por planilha.',
    href: '/agenda/cadastros/estudantes',
    status: 'Disponível',
  },
  {
    code: '05',
    title: 'Integrações',
    description: 'Entrada futura por planilhas recorrentes, APIs e sistemas acadêmicos externos.',
    href: '#',
    status: 'Preparado para evolução',
  },
]

export default function RegistryCenterPage() {
  return (
    <AgendaPageShell
      eyebrow="EIOS Registry"
      title="Centro de Administração EDI"
      description="Dados mestres que alimentam toda a Agenda Inteligente EDI. Cadastros ficam separados da operação diária para reduzir retrabalho e manter consistência."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
          <div className="border-l-4 border-cyan-400 px-5 py-7 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Regra operacional</p>
            <h2 className="mt-2 text-2xl font-bold">Configurar uma vez. Reutilizar em toda a plataforma.</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
              Turmas, estudantes, calendário, identidade e integrações passam a funcionar como fontes únicas de dados para Planejamento, Aulas, Diário, Avaliações, Evidências, Ocorrências, Relatórios e Inteligência.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {sections.map(item => {
            const disabled = item.href === '#'

            const content = (
              <article className="h-full rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">{item.code}</span>
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    {item.status}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-bold text-[#071827]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <p className="mt-5 text-sm font-bold text-[#075F78]">
                  {disabled ? 'Disponível em etapa futura' : 'Abrir cadastro →'}
                </p>
              </article>
            )

            return disabled ? (
              <div key={item.code} aria-disabled="true" className="opacity-70">{content}</div>
            ) : (
              <Link key={item.code} href={item.href}>{content}</Link>
            )
          })}
        </section>
      </div>
    </AgendaPageShell>
  )
}

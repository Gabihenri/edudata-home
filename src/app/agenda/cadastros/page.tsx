'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

type CalendarContext = {
  id: string
  organization: { id: string; name: string }
  school: { id: string; name: string }
}

const sections = [
  {
    code: '01',
    title: 'Identidade e documentos',
    description: 'Dados do professor individual ou da instituição usados automaticamente em cabeçalhos, rodapés e relatórios.',
    href: '/agenda/cadastros/identidade',
    action: 'Configurar identidade',
  },
  {
    code: '02',
    title: 'Calendário acadêmico',
    description: 'Ano letivo, períodos, dias letivos, férias, recessos, feriados, pontos facultativos e eventos institucionais.',
    href: '/agenda/cadastros/calendario',
    action: 'Gerenciar calendário',
  },
  {
    code: '03',
    title: 'Turmas',
    description: 'Contextos de aprendizagem, componentes e painel visual das turmas cadastradas.',
    href: '/agenda/turmas',
    action: 'Ver turmas',
  },
  {
    code: '04',
    title: 'Estudantes',
    description: 'Cadastro único, matrícula institucional opcional, número de chamada e importação por planilha.',
    href: '/agenda/cadastros/estudantes',
    action: 'Gerenciar estudantes',
  },
  {
    code: '05',
    title: 'Instituições e unidades',
    description: 'Gerencie as escolas/unidades efetivamente vinculadas à plataforma e reutilize os dados já existentes.',
    href: '/schools',
    action: 'Ver unidades',
  },
  {
    code: '06',
    title: 'Organizações',
    description: 'Redes, mantenedoras e organizações já cadastradas no Core compartilhado do EIOS.',
    href: '/organizations',
    action: 'Ver organizações',
  },
] as const

export default function RegistryCenterPage() {
  const [contexts, setContexts] = useState<CalendarContext[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/agenda/institutional-calendar/contexts?limit=100', {
          credentials: 'include',
          cache: 'no-store',
        })
        const body = await response.json() as { success?: boolean; data?: CalendarContext[] }
        if (!cancelled && response.ok && body.success) setContexts(body.data ?? [])
      } catch {
        if (!cancelled) setContexts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  const organizations = useMemo(
    () => new Map(contexts.map(item => [item.organization.id, item.organization.name])),
    [contexts],
  )

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
              Turmas, estudantes, calendário, identidade e instituições funcionam como fontes únicas de dados para Planejamento, Aulas, Diário, Avaliações, Evidências, Ocorrências, Relatórios e Inteligência.
            </p>
          </div>
        </section>

        <section className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-3">
          <article className="border-b border-slate-200 p-5 sm:border-b-0 sm:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Modo atual</p>
            <p className="mt-3 text-2xl font-bold text-[#071827]">{loading ? 'Carregando…' : contexts.length > 0 ? 'Institucional' : 'Individual'}</p>
            <p className="mt-1 text-sm text-slate-500">Autonomia individual ou governança institucional</p>
          </article>
          <article className="border-b border-slate-200 p-5 sm:border-b-0 sm:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Organizações disponíveis</p>
            <p className="mt-3 text-2xl font-bold text-[#071827]">{organizations.size}</p>
            <p className="mt-1 text-sm text-slate-500">Cadastros existentes reutilizados</p>
          </article>
          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Unidades / escolas</p>
            <p className="mt-3 text-2xl font-bold text-[#071827]">{contexts.length}</p>
            <p className="mt-1 text-sm text-slate-500">Contextos vinculados ao usuário</p>
          </article>
        </section>

        <section className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">Base institucional existente</p>
          <h2 className="mt-1 text-xl font-bold text-[#071827]">Os dados de instituições já cadastradas são preservados</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
            O EIOS Registry não cria uma segunda base. Ele reutiliza organizations, schools e o cadastro de referência institucional já existente na plataforma. Quando uma escola for localizada na base, ela poderá ser vinculada ao contexto da Agenda sem redigitação dos dados disponíveis.
          </p>
          {contexts.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {contexts.slice(0, 10).map(item => (
                <span key={item.id} className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#075F78]">
                  {item.organization.name} · {item.school.name}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sections.map(item => (
            <article key={item.code} className="flex min-h-[230px] flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs font-bold text-[#0B7491]">{item.code}</span>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">Cadastro mestre</span>
              </div>
              <h2 className="mt-5 text-xl font-bold text-[#071827]">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
              <Link href={item.href} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0B2940]">
                {item.action}
              </Link>
            </article>
          ))}
        </section>

        <aside className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
          <strong className="text-[#071827]">Regra do EIOS Registry:</strong> dados mestres são cadastrados aqui e consumidos pelas telas operacionais. Diário, Evidências, Avaliações e Relatórios não devem solicitar novamente informações que já existam no cadastro.
        </aside>
      </div>
    </AgendaPageShell>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { EdiIcon } from '@/components/ui/EdiIcon'

type NavigationItem = { code: string; label: string; href: string; description: string; icon: Parameters<typeof EdiIcon>[0]['name'] }

const primaryItems: NavigationItem[] = [
  { code: '01', label: 'Início', href: '/agenda/dashboard', description: 'Visão geral e próximo passo', icon: 'home' },
  { code: '02', label: 'Planejar', href: '/agenda/planejamento', description: 'Planejamento pedagógico', icon: 'plan' },
  { code: '03', label: 'Diário', href: '/agenda/diario-classe', description: 'Execução e registros da aula', icon: 'diary' },
  { code: '04', label: 'Evidências', href: '/agenda/evidencias', description: 'Documentação e rastreabilidade', icon: 'evidence' },
]

const menuGroups = [
  { title: 'Operação', items: [
    { code: '01', label: 'Dashboard', href: '/agenda/dashboard', description: 'Visão geral da operação' },
    { code: '02', label: 'Calendário', href: '/agenda/calendario', description: 'Compromissos e prazos' },
    { code: '03', label: 'Planejamento', href: '/agenda/planejamento', description: 'Planos e ações pedagógicas' },
    { code: '04', label: 'Diário de Classe', href: '/agenda/diario-classe', description: 'Execução, frequência e registros em uma única lista' },
    { code: '05', label: 'Evidências', href: '/agenda/evidencias', description: 'Consulta, registro e inteligência de evidências' },
    { code: '06', label: 'Tarefas', href: '/agenda/tarefas', description: 'Pendências e entregas' },
  ] },
  { title: 'Cadastros e Integrações', items: [
    { code: 'C0', label: 'Centro de Administração', href: '/agenda/cadastros', description: 'EIOS Registry e dados mestres da Agenda' },
    { code: 'C1', label: 'Identidade e Documentos', href: '/agenda/cadastros/identidade', description: 'Cabeçalhos individual e institucional dos relatórios' },
    { code: 'C2', label: 'Calendário Acadêmico', href: '/agenda/cadastros/calendario', description: 'Dias letivos, férias, recessos e exceções' },
    { code: 'C3', label: 'Turmas', href: '/agenda/turmas', description: 'Painel visual e configuração das turmas' },
    { code: 'C4', label: 'Cadastro de Estudantes', href: '/agenda/cadastros/estudantes', description: 'Lista nominal, matrícula institucional e importação' },
  ] },
  { title: 'Turmas e acompanhamento', items: [
    { code: '07', label: 'Aulas', href: '/agenda/aulas', description: 'Aulas vinculadas ao planejamento' },
    { code: '08', label: 'Avaliações', href: '/agenda/avaliacoes', description: 'Instrumentos e resultados' },
    { code: '09', label: 'Ocorrências', href: '/agenda/ocorrencias', description: 'Registros de ocorrências' },
    { code: '10', label: 'Casos Pedagógicos', href: '/agenda/casos', description: 'Acompanhamento estruturado' },
    { code: '11', label: 'Estudantes', href: '/agenda/caderno', description: 'Pesquisa e Caderno Pedagógico do estudante' },
  ] },
  { title: 'Inteligência e documentos', items: [
    { code: '13', label: 'Centro de Inteligência', href: '/agenda/inteligencia', description: 'Mapa relacional do contexto pedagógico' },
    { code: '14', label: 'Relatórios', href: '/agenda/relatorios', description: 'PDFs de ocorrências, notas e frequência' },
    { code: '15', label: 'Objetivos', href: '/agenda/objetivos', description: 'Metas e acompanhamento' },
    { code: '16', label: 'Evidências Inteligentes', href: '/agenda/evidencias/inteligencia', description: 'Qualidade, classificação e análise EDI' },
    { code: '17', label: 'Indicadores', href: '/agenda/indicadores', description: 'Leitura e análise de dados' },
    { code: '18', label: 'Histórico', href: '/agenda/historico', description: 'Memória e rastreabilidade' },
  ] },
] as const

function isPathActive(pathname: string, href: string) { return pathname === href || pathname.startsWith(`${href}/`) }

export function AgendaMobileNavigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', handleEscape)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleEscape) }
  }, [menuOpen])

  return <><nav aria-label="Navegação principal móvel da Agenda" className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur lg:hidden"><div className="mx-auto grid min-h-[64px] max-w-xl grid-cols-5 px-1">{primaryItems.map(item => { const active = isPathActive(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={['relative flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center transition','focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-inset',active ? 'text-[#071827]' : 'text-slate-500 hover:bg-slate-50 hover:text-[#075F78]'].join(' ')}>{active ? <span aria-hidden className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-[#0B7491]" /> : null}<EdiIcon name={item.icon} className={`h-[18px] w-[18px] ${active ? 'text-[#0B7491]' : ''}`} aria-hidden /><span className="max-w-full truncate text-[11px] font-bold leading-4 sm:text-xs">{item.label}</span></Link> })}<button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="agenda-mobile-menu-sheet" className="relative flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-slate-500 transition hover:bg-cyan-50 hover:text-[#075F78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-inset"><span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-100 bg-cyan-50 text-[#0B7491]"><EdiIcon name="menu" className="h-[18px] w-[18px]" aria-hidden /></span><span className="text-[11px] font-bold leading-4 sm:text-xs">Menu</span></button></div></nav>{menuOpen ? <div className="fixed inset-0 z-[140] bg-slate-950/45 lg:hidden" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setMenuOpen(false) }}><section id="agenda-mobile-menu-sheet" role="dialog" aria-modal="true" aria-label="Todos os módulos da Agenda Inteligente EDI" className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"><header className="shrink-0 border-b border-slate-200 bg-[#071827] px-4 pb-4 pt-5 text-white sm:px-6"><div className="mx-auto flex max-w-xl items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Agenda Inteligente EDI</p><h2 className="mt-1 text-lg font-bold">Todos os módulos</h2></div><button type="button" onClick={() => setMenuOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10">Fechar</button></div></header><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"><div className="mx-auto max-w-xl space-y-7 pb-5">{menuGroups.map(group => <section key={group.title}><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{group.title}</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{group.items.map(item => { const active = isPathActive(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={['flex min-h-[72px] items-start gap-3 rounded-xl border p-3.5 transition',active ? 'border-[#071827] bg-[#071827] text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'].join(' ')}><span className={['shrink-0 font-mono text-[10px] font-bold',active ? 'text-cyan-300' : 'text-[#0B7491]'].join(' ')}>{item.code}</span><span className="min-w-0"><span className="block font-bold">{item.label}</span><span className={['mt-1 block text-xs leading-5',active ? 'text-slate-300' : 'text-slate-500'].join(' ')}>{item.description}</span></span></Link> })}</div></section>)}</div></div></section></div> : null}</>
}

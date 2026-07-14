'use client'

import { useRouter } from 'next/navigation'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

const stats = [
  {
    label: 'Eventos',
    value: '12',
  },
  {
    label: 'Planejamentos',
    value: '08',
  },
  {
    label: 'Evidências',
    value: '24',
  },
  {
    label: 'Turmas',
    value: '06',
  },
]

const quickActions = [
  {
    label: 'Novo evento',
    href: '/agenda/calendario',
    primary: true,
  },
  {
    label: 'Novo planejamento',
    href: '/agenda/planejamento',
    primary: false,
  },
  {
    label: 'Registrar evidência',
    href: '/agenda/evidencias',
    primary: false,
  },
  {
    label: 'Ver histórico',
    href: '/agenda/historico',
    primary: false,
  },
]

export default function AgendaDashboardPage() {
  const router = useRouter()

  function navigateTo(href: string) {
    router.push(href)
  }

  return (
    <AgendaPageShell
      eyebrow="Agenda Inteligente EDI"
      title="Dashboard pedagógico"
      description="Visão consolidada dos eventos, planejamentos, evidências, tarefas e turmas registradas na Agenda Inteligente EDI."
    >
      <div className="grid gap-6">
        <section
          aria-label="Indicadores da Agenda"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-700">
                {item.label}
              </p>

              <p className="mt-4 text-4xl font-bold text-[#081C2E]">
                {item.value}
              </p>
            </article>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[#081C2E]">
              Próximas ações
            </h2>

            <ul className="mt-6 space-y-4 text-base leading-8 text-slate-600">
              <li>• Revisar planejamento da semana.</li>
              <li>• Registrar evidências da turma 2ºA.</li>
              <li>• Validar compromissos do calendário.</li>
              <li>• Atualizar acompanhamento pedagógico.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[#081C2E]">
              Atalhos rápidos
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => navigateTo(action.href)}
                  className={[
                    'inline-flex min-h-[58px] w-full cursor-pointer items-center justify-center rounded-full px-6 py-4',
                    'text-center text-base font-semibold transition duration-200',
                    'focus:outline-none focus:ring-4 focus:ring-purple-300',
                    'active:scale-[0.98]',
                    action.primary
                      ? 'bg-[#6B21A8] text-white shadow-md hover:bg-[#581C87]'
                      : 'border-2 border-slate-300 bg-white text-slate-700 shadow-sm hover:border-[#6B21A8] hover:bg-purple-50 hover:text-[#6B21A8]',
                  ].join(' ')}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AgendaPageShell>
  )
}
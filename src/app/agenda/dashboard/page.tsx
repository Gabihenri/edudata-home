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

export default function AgendaDashboardPage() {
  return (
    <AgendaPageShell
      eyebrow="Agenda Inteligente EDI"
      title="Dashboard pedagógico"
      description="Visão consolidada dos eventos, planejamentos, evidências, tarefas e turmas registradas na Agenda Inteligente EDI."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-700">
                {item.label}
              </p>
              <p className="mt-4 text-4xl font-bold text-[#081C2E]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

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

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#6B21A8] px-6 py-3 text-base font-semibold text-white transition hover:opacity-95">
                Novo evento
              </button>

              <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
                Novo planejamento
              </button>

              <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
                Registrar evidência
              </button>

              <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
                Ver histórico
              </button>
            </div>
          </section>
        </div>
      </div>
    </AgendaPageShell>
  )
}

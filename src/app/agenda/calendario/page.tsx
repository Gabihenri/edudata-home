import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

export default function AgendaCalendarPage() {
  return (
    <AgendaPageShell
      eyebrow="Agenda Inteligente EDI"
      title="Calendário pedagógico"
      description="Organize aulas, reuniões, formações, prazos e ações pedagógicas utilizando dados reais da Agenda Inteligente EDI."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              'Planejamento semanal',
              'Reunião pedagógica',
              'Entrega de evidências',
              'Formação interna',
              'Acompanhamento de turma',
              'Avaliação bimestral',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-700">
                  Evento
                </p>
                <h3 className="mt-3 text-lg font-bold text-[#081C2E]">
                  {item}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Organização pedagógica integrada ao calendário institucional.
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[#081C2E]">
            Ações rápidas
          </h2>

          <div className="mt-6 flex flex-col gap-3">
            <button className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#6B21A8] px-6 py-3 text-base font-semibold text-white transition hover:opacity-95">
              Novo evento
            </button>

            <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
              Ver agenda completa
            </button>
          </div>
        </aside>
      </div>
    </AgendaPageShell>
  )
}

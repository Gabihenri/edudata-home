import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

export default function AgendaPlanningPage() {
  return (
    <AgendaPageShell
      eyebrow="Agenda Inteligente EDI"
      title="Planejamento pedagógico"
      description="Organize objetivos, metodologias, recursos, avaliações e datas utilizando dados persistidos no Supabase."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <h2 className="text-3xl font-bold text-[#081C2E]">
            Novo planejamento
          </h2>

          <div className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Título
              </label>
              <input
                id="title"
                type="text"
                placeholder="Ex.: Sequência didática - 2º Bimestre"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="objective"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Objetivo
              </label>
              <textarea
                id="objective"
                rows={5}
                placeholder="Descreva o objetivo pedagógico."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#6B21A8] px-6 py-3 text-base font-semibold text-white transition hover:opacity-95">
                Salvar planejamento
              </button>

              <button className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
                Limpar campos
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[#081C2E]">
            Boas práticas
          </h2>

          <ul className="mt-6 space-y-4 text-base leading-8 text-slate-600">
            <li>• Defina objetivos claros de aprendizagem.</li>
            <li>• Relacione metodologias e evidências esperadas.</li>
            <li>• Estabeleça cronograma e formas de avaliação.</li>
            <li>• Mantenha registros para análise futura.</li>
          </ul>
        </aside>
      </div>
    </AgendaPageShell>
  )
}

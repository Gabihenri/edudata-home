'use client'

import { useDashboard } from '@/lib/agenda/hooks'

export function AgendaIndicators() {
  const { data, loading, error, reload } = useDashboard()

  if (loading) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-lg font-semibold text-slate-600">
            Carregando indicadores...
          </p>
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-2xl font-bold text-red-800">
              Não foi possível carregar os indicadores
            </h1>

            <p className="mt-3 text-red-700">
              {error ?? 'Dados indisponíveis.'}
            </p>

            <button
              type="button"
              onClick={() => void reload()}
              className="mt-6 rounded-full bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </section>
    )
  }

  const indicadores = [
    {
      titulo: 'Eventos',
      valor: data.totals.events,
      descricao: 'eventos cadastrados',
      faixa: 'bg-blue-600',
    },
    {
      titulo: 'Planejamentos',
      valor: data.totals.planning,
      descricao: 'planejamentos registrados',
      faixa: 'bg-violet-600',
    },
    {
      titulo: 'Evidências',
      valor: data.totals.evidences,
      descricao: 'evidências documentadas',
      faixa: 'bg-emerald-600',
    },
    {
      titulo: 'Tarefas',
      valor: data.totals.tasks,
      descricao: 'tarefas cadastradas',
      faixa: 'bg-cyan-600',
    },
    {
      titulo: 'Pendências',
      valor: data.totals.pendingTasks,
      descricao: 'tarefas não concluídas',
      faixa: 'bg-amber-500',
    },
    {
      titulo: 'Turmas',
      valor: data.totals.classes,
      descricao: 'turmas cadastradas',
      faixa: 'bg-[#081C2E]',
    },
  ]

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
              Agenda Inteligente EDI
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Indicadores
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Acompanhe os dados operacionais da Agenda Inteligente EDI
              registrados no Supabase.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Atualizar indicadores
          </button>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {indicadores.map((item) => (
            <article
              key={item.titulo}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className={`h-2 rounded-full ${item.faixa}`} />

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {item.titulo}
              </p>

              <p className="mt-4 text-5xl font-bold text-[#081C2E]">
                {item.valor}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.descricao}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] bg-[#081C2E] p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Leitura operacional
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            {data.totals.pendingTasks === 0
              ? 'Nenhuma pendência registrada.'
              : `${data.totals.pendingTasks} pendência${
                  data.totals.pendingTasks === 1 ? '' : 's'
                } aguardando acompanhamento.`}
          </h2>

          <p className="mt-5 max-w-3xl leading-7 text-slate-200">
            Estes dados serão utilizados pelo EIOS para gerar alertas,
            recomendações e análises educacionais.
          </p>
        </div>
      </div>
    </section>
  )
}
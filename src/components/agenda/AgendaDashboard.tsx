'use client'

import { useDashboard } from '@/lib/agenda/hooks/useDashboard'

export function AgendaDashboard() {
  const { data, loading, error, reload } = useDashboard()

  if (loading) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-lg font-semibold text-slate-600">
            Carregando dashboard...
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
              Não foi possível carregar o dashboard
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
    },
    {
      titulo: 'Planejamentos',
      valor: data.totals.planning,
      descricao: 'planejamentos registrados',
    },
    {
      titulo: 'Evidências',
      valor: data.totals.evidences,
      descricao: 'evidências documentadas',
    },
    {
      titulo: 'Pendências',
      valor: data.totals.pendingTasks,
      descricao: 'tarefas aguardando conclusão',
    },
    {
      titulo: 'Turmas',
      valor: data.totals.classes,
      descricao: 'turmas cadastradas',
    },
  ]

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
            Agenda Inteligente EDI
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Dashboard pedagógico
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Visão consolidada dos eventos, planejamentos, evidências, tarefas e
            turmas registradas na Agenda Inteligente EDI.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {indicadores.map((item) => (
            <article
              key={item.titulo}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {item.titulo}
              </p>

              <p className="mt-5 text-5xl font-bold text-[#081C2E]">
                {item.valor}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.descricao}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-slate-950">
              Próximos eventos
            </h2>

            <div className="mt-6 space-y-4">
              {data.upcomingEvents.length > 0 ? (
                data.upcomingEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-slate-200 bg-[#F5F6F8] p-5"
                  >
                    <h3 className="font-bold text-slate-950">
                      {event.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      {new Date(event.start_at).toLocaleString('pt-BR')}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-slate-500">
                  Nenhum próximo evento cadastrado.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-slate-950">
              Tarefas pendentes
            </h2>

            <div className="mt-6 space-y-4">
              {data.pendingTasks.length > 0 ? (
                data.pendingTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-[#F5F6F8] p-5"
                  >
                    <h3 className="font-bold text-slate-950">
                      {task.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      Prioridade: {task.priority}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-slate-500">
                  Nenhuma tarefa pendente.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#081C2E] p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Evidências recentes
            </p>

            <div className="mt-6 space-y-4">
              {data.recentEvidences.length > 0 ? (
                data.recentEvidences.map((evidence) => (
                  <article
                    key={evidence.id}
                    className="rounded-2xl bg-white/10 p-5"
                  >
                    <h3 className="font-bold">
                      {evidence.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      Tipo: {evidence.evidence_type}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-slate-300">
                  Nenhuma evidência cadastrada.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
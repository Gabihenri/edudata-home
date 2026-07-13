'use client'

import { FormEvent, useMemo, useState } from 'react'

import { useHistory } from '@/lib/agenda/hooks'
import type {
  AgendaHistoryFilters,
  AgendaHistoryItemType,
} from '@/lib/agenda'

type HistoryFormState = {
  search: string
  type: '' | AgendaHistoryItemType
  startDate: string
  endDate: string
}

const initialForm: HistoryFormState = {
  search: '',
  type: '',
  startDate: '',
  endDate: '',
}

const typeLabels: Record<AgendaHistoryItemType, string> = {
  evento: 'Evento',
  planejamento: 'Planejamento',
  evidencia: 'Evidência',
  tarefa: 'Tarefa',
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AgendaHistory() {
  const { history, loading, error, reload } = useHistory({
    limit: 200,
  })

  const [form, setForm] = useState<HistoryFormState>(initialForm)
  const [activeFilters, setActiveFilters] =
    useState<AgendaHistoryFilters>({
      limit: 200,
    })

  const groupedHistory = useMemo(() => {
    return history.reduce<Record<string, typeof history>>(
      (groups, item) => {
        const dateKey = new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'full',
        }).format(new Date(item.occurred_at))

        if (!groups[dateKey]) {
          groups[dateKey] = []
        }

        groups[dateKey].push(item)

        return groups
      },
      {},
    )
  }, [history])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    const filters: AgendaHistoryFilters = {
      search: form.search.trim() || null,
      type: form.type || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      limit: 200,
    }

    setActiveFilters(filters)
    await reload(filters)
  }

  async function handleClearFilters(): Promise<void> {
    setForm(initialForm)

    const filters: AgendaHistoryFilters = {
      limit: 200,
    }

    setActiveFilters(filters)
    await reload(filters)
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Histórico pedagógico
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Consulte eventos, planejamentos, evidências e tarefas registrados na
          Agenda Inteligente EDI.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label
                htmlFor="history-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Buscar
              </label>

              <input
                id="history-search"
                type="search"
                value={form.search}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                placeholder="Título, descrição, disciplina, turma..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
              />
            </div>

            <div>
              <label
                htmlFor="history-type"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Tipo
              </label>

              <select
                id="history-type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as
                      | ''
                      | AgendaHistoryItemType,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
              >
                <option value="">Todos</option>
                <option value="evento">Eventos</option>
                <option value="planejamento">Planejamentos</option>
                <option value="evidencia">Evidências</option>
                <option value="tarefa">Tarefas</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="history-start-date"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Data inicial
              </label>

              <input
                id="history-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
              />
            </div>

            <div>
              <label
                htmlFor="history-end-date"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Data final
              </label>

              <input
                id="history-end-date"
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-[#5C1A8C] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Aplicar filtros
            </button>

            <button
              type="button"
              onClick={() => void handleClearFilters()}
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Limpar filtros
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">
            {history.length} registro{history.length === 1 ? '' : 's'}
          </p>

          <button
            type="button"
            onClick={() => void reload(activeFilters)}
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Atualizar histórico
          </button>
        </div>

        {loading ? (
          <p className="mt-10 text-lg font-semibold text-slate-600">
            Carregando histórico...
          </p>
        ) : null}

        {error ? (
          <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && !error && history.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Nenhum registro encontrado.
          </div>
        ) : null}

        <div className="mt-10 space-y-10">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <section key={date}>
              <h2 className="border-b border-slate-200 pb-3 text-xl font-bold capitalize text-slate-950">
                {date}
              </h2>

              <div className="mt-5 space-y-5">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                          {typeLabels[item.type]}
                        </p>

                        <h3 className="mt-3 text-2xl font-bold text-slate-950">
                          {item.title}
                        </h3>
                      </div>

                      <span className="rounded-full bg-[#081C2E] px-4 py-2 text-xs font-bold text-white">
                        {formatDate(item.occurred_at)}
                      </span>
                    </div>

                    {item.description ? (
                      <p className="mt-5 leading-7 text-slate-600">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.status ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Status: {item.status}
                        </span>
                      ) : null}

                      {item.category ? (
                        <span className="rounded-full bg-[#5C1A8C]/10 px-3 py-1 text-xs font-semibold text-[#5C1A8C]">
                          {item.category}
                        </span>
                      ) : null}

                      {item.subject ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {item.subject}
                        </span>
                      ) : null}

                      {item.class_name ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {item.class_name}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-4">
                      {item.file_url ? (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#5C1A8C] hover:underline"
                        >
                          Abrir arquivo
                        </a>
                      ) : null}

                      {item.external_url ? (
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#5C1A8C] hover:underline"
                        >
                          Abrir link
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
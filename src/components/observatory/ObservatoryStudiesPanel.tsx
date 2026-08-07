'use client'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

type Study = {
  id: string
  title: string
  research_question: string
  scope: string
  methodology_summary: string
  findings_summary: string | null
  status: string
  is_public: boolean
  created_at: string
}

type ResponseShape = {
  success: boolean
  items: Study[]
  summary: {
    total: number
    active: number
    completed: number
    published: number
    underReview: number
  }
  error?: string
}

export default function ObservatoryStudiesPanel() {
  const [data, setData] = useState<ResponseShape | null>(null)
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [scope, setScope] = useState('')
  const [methodology, setMethodology] = useState('')
  const [status, setStatus] = useState('draft')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/observatorio/estudos', {
        credentials: 'include',
        cache: 'no-store',
      })
      const body = await response.json() as ResponseShape
      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível carregar os estudos.')
      }
      setData(body)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os estudos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/observatorio/estudos', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title,
          research_question: question,
          scope,
          methodology_summary: methodology,
          findings_summary: null,
          status,
          is_public: false,
          dataset_refs: [],
          indicator_refs: [],
          metadata: {
            source: 'observatory_studies_panel',
          },
        }),
      })
      const body = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível registrar o estudo.')
      }
      setTitle('')
      setQuestion('')
      setScope('')
      setMethodology('')
      await load()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível registrar o estudo.')
    } finally {
      setLoading(false)
    }
  }

  const summary = data?.summary ?? {
    total: 0,
    active: 0,
    completed: 0,
    published: 0,
    underReview: 0,
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Estudos', summary.total],
          ['Ativos', summary.active],
          ['Em revisão', summary.underReview],
          ['Concluídos', summary.completed],
          ['Publicados', summary.published],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{String(label)}</p>
            <p className="mt-2 text-2xl font-bold text-[#071827]">{String(value)}</p>
          </article>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.25fr]">
        <form onSubmit={submit} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Pesquisa</p>
          <h2 className="mt-2 text-xl font-bold text-[#071827]">Registrar estudo</h2>

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input value={title} onChange={event => setTitle(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Pergunta de pesquisa
              <textarea value={question} onChange={event => setQuestion(event.target.value)} required rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Escopo
              <input value={scope} onChange={event => setScope(event.target.value)} required placeholder="Turma, escola, rede, período..." className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Metodologia resumida
              <textarea value={methodology} onChange={event => setMethodology(event.target.value)} required rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Status
              <select value={status} onChange={event => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                <option value="draft">Rascunho</option>
                <option value="under_review">Em revisão</option>
                <option value="active">Ativo</option>
                <option value="completed">Concluído</option>
              </select>
            </label>
          </div>

          <button type="submit" disabled={loading} className="mt-5 w-full rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
            Registrar estudo
          </button>
        </form>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Research Intelligence</p>
            <h2 className="mt-1 font-bold text-[#071827]">Estudos registrados</h2>
          </header>

          {(data?.items ?? []).length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhum estudo registrado.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.items.map(item => (
                <article key={item.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#0B7491]">{item.scope}</p>
                      <h3 className="mt-2 text-lg font-bold text-[#071827]">{item.title}</h3>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{item.research_question}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.methodology_summary}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
        O Observatório organiza estudos e conhecimento educacional. Publicação de resultados exige revisão humana, governança e proteção dos dados utilizados.
      </aside>
    </section>
  )
}

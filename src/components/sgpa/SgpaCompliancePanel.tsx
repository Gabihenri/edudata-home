'use client'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

type ComplianceItem = {
  id: string
  code: string
  title: string
  description: string
  status: string
  severity: string
  recommendation: string | null
  due_at: string | null
}

type ActionPlan = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_at: string | null
}

type OverviewResponse = {
  success: boolean
  checks: ComplianceItem[]
  plans: ActionPlan[]
  summary: {
    checks: number
    compliant: number
    attention: number
    nonCompliant: number
    activePlans: number
    completedPlans: number
  }
  error?: string
}

export default function SgpaCompliancePanel() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('not_evaluated')
  const [severity, setSeverity] = useState('informational')
  const [recommendation, setRecommendation] = useState('')

  const [planTitle, setPlanTitle] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planPriority, setPlanPriority] = useState('moderate')

  async function load() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sgpa/compliance', {
        credentials: 'include',
        cache: 'no-store',
      })
      const body = await response.json() as OverviewResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível carregar compliance.')
      }

      setData(body)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar compliance.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function createCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sgpa/compliance', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          operation: 'create_check',
          payload: {
            code,
            title,
            description,
            status,
            severity,
            recommendation: recommendation || null,
            evidence_ids: [],
            metadata: {
              source: 'sgpa_compliance_panel',
            },
          },
        }),
      })

      const body = await response.json() as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível registrar o item.')
      }

      setCode('')
      setTitle('')
      setDescription('')
      setRecommendation('')
      await load()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível registrar o item.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sgpa/compliance', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          operation: 'create_plan',
          payload: {
            title: planTitle,
            description: planDescription,
            status: 'draft',
            priority: planPriority,
            compliance_check_ids: [],
            items: [],
            success_criteria: [],
            metadata: {
              source: 'sgpa_compliance_panel',
            },
          },
        }),
      })

      const body = await response.json() as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível registrar o plano.')
      }

      setPlanTitle('')
      setPlanDescription('')
      await load()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível registrar o plano.',
      )
    } finally {
      setLoading(false)
    }
  }

  const summary = data?.summary ?? {
    checks: 0,
    compliant: 0,
    attention: 0,
    nonCompliant: 0,
    activePlans: 0,
    completedPlans: 0,
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Itens avaliados', summary.checks],
          ['Conformes', summary.compliant],
          ['Atenção', summary.attention],
          ['Não conformes', summary.nonCompliant],
          ['Planos ativos', summary.activePlans],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{String(label)}</p>
            <p className="mt-2 text-2xl font-bold text-[#071827]">{String(value)}</p>
          </article>
        ))}
      </section>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={createCheck} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Compliance</p>
          <h2 className="mt-2 text-xl font-bold text-[#071827]">Registrar verificação</h2>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Código
                <input value={code} onChange={event => setCode(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Gravidade
                <select value={severity} onChange={event => setSeverity(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                  <option value="informational">Informativa</option>
                  <option value="low">Baixa</option>
                  <option value="moderate">Moderada</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input value={title} onChange={event => setTitle(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Descrição
              <textarea value={description} onChange={event => setDescription(event.target.value)} required rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Status
              <select value={status} onChange={event => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                <option value="not_evaluated">Não avaliado</option>
                <option value="compliant">Conforme</option>
                <option value="attention">Atenção</option>
                <option value="non_compliant">Não conforme</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Recomendação
              <textarea value={recommendation} onChange={event => setRecommendation(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
          </div>

          <button type="submit" disabled={loading} className="mt-5 w-full rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
            Registrar verificação
          </button>
        </form>

        <form onSubmit={createPlan} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Plano de ação</p>
          <h2 className="mt-2 text-xl font-bold text-[#071827]">Criar plano institucional</h2>

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input value={planTitle} onChange={event => setPlanTitle(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Descrição
              <textarea value={planDescription} onChange={event => setPlanDescription(event.target.value)} required rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Prioridade
              <select value={planPriority} onChange={event => setPlanPriority(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                <option value="low">Baixa</option>
                <option value="moderate">Moderada</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </label>
          </div>

          <button type="submit" disabled={loading} className="mt-5 w-full rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
            Criar plano de ação
          </button>
        </form>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="font-bold text-[#071827]">Verificações recentes</h2>
          </header>
          <div className="divide-y divide-slate-100">
            {(data?.checks ?? []).length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Nenhuma verificação registrada.</p>
            ) : (
              data?.checks.slice(0, 12).map(item => (
                <article key={item.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#0B7491]">{item.code}</p>
                      <h3 className="mt-1 font-bold text-[#071827]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                      {item.status}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="font-bold text-[#071827]">Planos de ação</h2>
          </header>
          <div className="divide-y divide-slate-100">
            {(data?.plans ?? []).length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Nenhum plano registrado.</p>
            ) : (
              data?.plans.slice(0, 12).map(item => (
                <article key={item.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[#071827]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800">
                      {item.status}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
        O SGPA organiza conformidade, responsabilidades e planos de ação. Itens críticos e decisões institucionais permanecem sob revisão e responsabilidade humanas.
      </aside>
    </div>
  )
}

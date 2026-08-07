'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

type GovernanceOverview = {
  auditEvents: Array<Record<string, unknown>>
  workflowTransitions: Array<Record<string, unknown>>
  decisions: Array<Record<string, unknown>>
  totals: {
    auditEvents: number
    workflowTransitions: number
    decisions: number
  }
  generatedAt: string
}

type GovernanceResponse = {
  success: boolean
  overview?: GovernanceOverview
  error?: string
}

function valueAsText(
  value: unknown,
): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value)
  }

  return '—'
}

export default function SgpaGovernancePanel() {
  const [overview, setOverview] =
    useState<GovernanceOverview | null>(null)
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          '/api/eios/governance?limit=50',
          {
            method: 'GET',
            cache: 'no-store',
          },
        )

        const payload =
          await response.json() as GovernanceResponse

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.error ??
              'Não foi possível carregar a governança.',
          )
        }

        if (active) {
          setOverview(
            payload.overview ?? null,
          )
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Erro desconhecido.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const auditPreview =
    useMemo(
      () =>
        overview?.auditEvents.slice(0, 8) ?? [],
      [overview],
    )

  const workflowPreview =
    useMemo(
      () =>
        overview?.workflowTransitions.slice(0, 8) ?? [],
      [overview],
    )

  const decisionPreview =
    useMemo(
      () =>
        overview?.decisions.slice(0, 8) ?? [],
      [overview],
    )

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">
          Carregando governança do EIOS…
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-semibold text-red-800">
          {error}
        </p>
      </section>
    )
  }

  const totals = overview?.totals ?? {
    auditEvents: 0,
    workflowTransitions: 0,
    decisions: 0,
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Auditoria
          </p>
          <p className="mt-2 text-3xl font-bold text-[#071827]">
            {totals.auditEvents}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            eventos governados
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Workflow
          </p>
          <p className="mt-2 text-3xl font-bold text-[#071827]">
            {totals.workflowTransitions}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            transições registradas
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Decisões humanas
          </p>
          <p className="mt-2 text-3xl font-bold text-[#071827]">
            {totals.decisions}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            decisões rastreáveis
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <GovernanceList
          title="Eventos de auditoria"
          items={auditPreview}
          primaryField="action"
          secondaryField="capability"
          dateField="occurred_at"
        />

        <GovernanceList
          title="Workflow"
          items={workflowPreview}
          primaryField="to_state"
          secondaryField="resource_type"
          dateField="occurred_at"
        />

        <GovernanceList
          title="Decisões humanas"
          items={decisionPreview}
          primaryField="decision"
          secondaryField="subject_type"
          dateField="decided_at"
        />
      </section>

      <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
        <p className="text-sm font-semibold leading-6 text-cyan-950">
          O SGPA exibe trilhas do Governance Core do EIOS. Aprovação, publicação e decisões permanecem dependentes de ação humana explícita.
        </p>
      </section>
    </div>
  )
}

function GovernanceList({
  title,
  items,
  primaryField,
  secondaryField,
  dateField,
}: {
  title: string
  items: Array<Record<string, unknown>>
  primaryField: string
  secondaryField: string
  dateField: string
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-bold text-[#071827]">
          {title}
        </h2>
      </header>

      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            Nenhum registro encontrado.
          </p>
        ) : (
          items.map((item, index) => (
            <article
              key={valueAsText(item.id) + index}
              className="px-5 py-4"
            >
              <p className="text-sm font-bold text-[#071827]">
                {valueAsText(item[primaryField])}
              </p>

              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                {valueAsText(item[secondaryField])}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {valueAsText(item[dateField])}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

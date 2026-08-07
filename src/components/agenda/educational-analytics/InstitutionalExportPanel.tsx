'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

type InstitutionalProfile =
  | 'teacher'
  | 'coordination'
  | 'direction'
  | 'supervision'
  | 'secretariat'
  | 'research'
  | 'technical'

type HistoryItem = {
  id: string
  versionNumber: number
  versionLabel: string
  isCurrentVersion: boolean
  title: string
  generatedAt: string
  approved: boolean
  humanReviewStatus: string
  reportAvailable: boolean
}

type HistoryResponse = {
  success: boolean
  items: HistoryItem[]
  error?: string
}

const PROFILE_LABELS:
  Record<InstitutionalProfile, string> = {
    teacher: 'Professor',
    coordination: 'Coordenação pedagógica',
    direction: 'Direção',
    supervision: 'Supervisão',
    secretariat: 'Secretaria',
    research: 'Pesquisa',
    technical: 'Técnico',
  }

function formatDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date)
}

export default function InstitutionalExportPanel() {
  const [items, setItems] =
    useState<HistoryItem[]>([])
  const [runId, setRunId] =
    useState('')
  const [profile, setProfile] =
    useState<InstitutionalProfile>('teacher')
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          '/api/agenda/educational-analytics/history?limit=50',
          {
            credentials: 'include',
            cache: 'no-store',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        const body =
          await response.json() as HistoryResponse

        if (!response.ok) {
          throw new Error(
            body.error ||
            'Não foi possível carregar as execuções exportáveis.',
          )
        }

        if (!active) {
          return
        }

        const exportable =
          body.items.filter(
            item => item.reportAvailable,
          )

        setItems(exportable)

        const preferred =
          exportable.find(
            item => item.isCurrentVersion,
          ) ?? exportable[0]

        setRunId(preferred?.id ?? '')
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar as execuções exportáveis.',
        )
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

  const selected = useMemo(
    () =>
      items.find(item => item.id === runId) ?? null,
    [items, runId],
  )

  function exportUrl(
    format: 'json' | 'html',
  ): string {
    const params = new URLSearchParams({
      runId,
      profile,
      format,
    })

    return `/api/agenda/educational-analytics/institutional-export?${params.toString()}`
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-[#071827] px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
          EIOS · Exportação institucional
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Relatórios auditáveis e imprimíveis
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Gere uma visão institucional a partir de uma execução histórica persistida, preservando versão, hash, revisão humana, ética e rastreabilidade.
        </p>
      </header>

      <div className="space-y-5 p-5 sm:p-7">
        {loading ? (
          <p className="text-sm text-slate-600">
            Carregando relatórios disponíveis…
          </p>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Ainda não há execuções com AnalyticsReport persistido para exportação.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Execução histórica
                </span>
                <select
                  value={runId}
                  onChange={event =>
                    setRunId(event.target.value)
                  }
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800"
                >
                  {items.map(item => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      v{item.versionNumber} · {item.title} · {formatDate(item.generatedAt)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Perfil institucional
                </span>
                <select
                  value={profile}
                  onChange={event =>
                    setProfile(
                      event.target.value as InstitutionalProfile,
                    )
                  }
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800"
                >
                  {(
                    Object.entries(PROFILE_LABELS) as
                      Array<[InstitutionalProfile, string]>
                  ).map(([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selected ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#071827]">
                    Versão {selected.versionNumber}
                  </span>
                  {selected.isCurrentVersion ? (
                    <span className="rounded-full bg-[#071827] px-2.5 py-1 text-xs font-bold text-white">
                      Atual
                    </span>
                  ) : null}
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs">
                    {selected.approved
                      ? 'Aprovada'
                      : `Revisão: ${selected.humanReviewStatus}`}
                  </span>
                </div>
                <p className="mt-2">
                  O status de aprovação do AnalyticsReport original é preservado na exportação. A exportação não aprova nem altera a análise.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <a
                href={exportUrl('json')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Exportar JSON
              </a>

              <a
                href={exportUrl('html')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#075F78]"
              >
                Abrir versão imprimível
              </a>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              A versão HTML foi preparada para impressão em A4 e pode ser convertida em PDF pelo recurso de impressão do navegador sem recalcular ou alterar o conteúdo analítico.
            </p>
          </>
        )}
      </div>
    </section>
  )
}

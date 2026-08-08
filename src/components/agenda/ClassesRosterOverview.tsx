'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useClasses } from '@/lib/agenda/hooks/useClasses'

type RosterStudent = {
  id: string
}

type DiaryResponse = {
  success?: boolean
  roster?: RosterStudent[]
}

type ClassRosterState = Record<string, number | null>

export function ClassesRosterOverview() {
  const { classes, loading, error, reload } = useClasses()
  const [rosterCounts, setRosterCounts] = useState<ClassRosterState>({})
  const [loadingRosters, setLoadingRosters] = useState(false)

  useEffect(() => {
    const activeClasses = classes.filter(item => item.active)
    if (activeClasses.length === 0) {
      setRosterCounts({})
      return
    }

    let cancelled = false

    async function loadCounts() {
      setLoadingRosters(true)

      const entries = await Promise.all(
        activeClasses.map(async agendaClass => {
          try {
            const response = await fetch(
              `/api/agenda/diario-classe?classId=${encodeURIComponent(agendaClass.id)}`,
              { credentials: 'include', cache: 'no-store' },
            )
            const body = await response.json() as DiaryResponse
            return [agendaClass.id, response.ok && body.success ? (body.roster?.length ?? 0) : null] as const
          } catch {
            return [agendaClass.id, null] as const
          }
        }),
      )

      if (!cancelled) {
        setRosterCounts(Object.fromEntries(entries))
        setLoadingRosters(false)
      }
    }

    void loadCounts()

    return () => {
      cancelled = true
    }
  }, [classes])

  const activeClasses = useMemo(
    () => classes.filter(item => item.active),
    [classes],
  )

  const totalStudents = useMemo(
    () => Object.values(rosterCounts).reduce<number>(
      (total, value) => total + (typeof value === 'number' ? value : 0),
      0,
    ),
    [rosterCounts],
  )

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-[#071827] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Cadastros · Visão rápida
            </p>
            <h2 className="mt-2 text-2xl font-bold">Painel de Turmas</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Visualize as turmas cadastradas e o estado real da lista nominal antes de entrar na operação pedagógica.
            </p>
          </div>

          <div className="flex gap-3 text-sm">
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Turmas</span>
              <strong className="mt-1 block text-xl">{activeClasses.length}</strong>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Estudantes</span>
              <strong className="mt-1 block text-xl">{loadingRosters ? '…' : totalStudents}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-7">
        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
            Carregando turmas…
          </div>
        ) : activeClasses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-bold text-[#071827]">Nenhuma turma ativa cadastrada.</p>
            <p className="mt-2 text-sm text-slate-500">Cadastre a primeira turma abaixo para iniciar a configuração da Agenda.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeClasses.map(agendaClass => {
              const count = rosterCounts[agendaClass.id]
              const countKnown = typeof count === 'number'
              const hasStudents = countKnown && count > 0

              return (
                <article key={agendaClass.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-800">
                          Ativa
                        </span>
                        <h3 className="mt-3 truncate text-xl font-bold text-[#071827]">{agendaClass.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-[#075F78]">{agendaClass.subject ?? 'Componente não informado'}</p>
                      </div>

                      <div className="shrink-0 rounded-xl bg-[#071827] px-4 py-3 text-center text-white">
                        <p className="text-xl font-bold">{countKnown ? count : '—'}</p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300">Lista nominal</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Série / etapa</span>
                        <span className="mt-1 block font-semibold text-slate-700">{agendaClass.grade ?? 'Não informada'}</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Ano letivo</span>
                        <span className="mt-1 block font-semibold text-slate-700">{agendaClass.school_year ?? 'Não informado'}</span>
                      </div>
                    </div>

                    <div className={`rounded-xl border p-4 text-sm ${
                      countKnown
                        ? hasStudents
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-amber-200 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}>
                      <p className="font-bold">
                        {!countKnown
                          ? 'Lista nominal não verificada'
                          : hasStudents
                            ? `${count} estudante${count === 1 ? '' : 's'} cadastrado${count === 1 ? '' : 's'}`
                            : 'Nenhum estudante cadastrado'}
                      </p>
                      <p className="mt-1 leading-5">
                        {!countKnown
                          ? 'Não foi possível consultar a lista desta turma agora.'
                          : hasStudents
                            ? 'A turma já pode alimentar Diário, avaliações, evidências e relatórios.'
                            : 'Cadastre ou importe os estudantes antes de usar os módulos dependentes.'}
                      </p>
                    </div>

                    <Link
                      href={`/agenda/cadastros/estudantes?classId=${encodeURIComponent(agendaClass.id)}`}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#09657E]"
                    >
                      {hasStudents ? 'Gerenciar estudantes' : 'Cadastrar estudantes'}
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Atualizar painel
          </button>
        </div>
      </div>
    </section>
  )
}

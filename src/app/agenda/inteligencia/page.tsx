'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'
import { usePlanning } from '@/lib/agenda/hooks/usePlanning'

type OccurrenceRow = {
  id: string
  requires_follow_up: boolean
}

type CaseRow = {
  id: string
  status: string
  priority: string
}

type IntelligenceSnapshot = {
  occurrences: OccurrenceRow[]
  cases: CaseRow[]
}

const emptySnapshot: IntelligenceSnapshot = {
  occurrences: [],
  cases: [],
}

export default function PedagogicalIntelligencePage() {
  const {
    classes,
    classesLoading,
    classId,
    changeClass,
    selectedClass,
    students,
    studentsLoading,
    studentId,
    setStudentId,
    selectedStudent,
    academicPeriods,
    academicPeriodId,
    setAcademicPeriodId,
  } = usePedagogicalContext()

  const { planning } = usePlanning()
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot>(emptySnapshot)
  const [loading, setLoading] = useState(false)

  const classPlanning = useMemo(
    () => planning.filter(item => item.class_id === classId && item.status !== 'arquivado'),
    [planning, classId],
  )

  const activeCases = useMemo(
    () => snapshot.cases.filter(item => !['resolved', 'closed', 'archived'].includes(item.status)),
    [snapshot.cases],
  )

  const followUps = useMemo(
    () => snapshot.occurrences.filter(item => item.requires_follow_up).length,
    [snapshot.occurrences],
  )

  useEffect(() => {
    async function loadSnapshot() {
      if (!classId) {
        setSnapshot(emptySnapshot)
        return
      }

      setLoading(true)

      try {
        const baseParams = new URLSearchParams({ classId, limit: '100' })
        if (studentId) baseParams.set('studentId', studentId)
        if (academicPeriodId) baseParams.set('academicPeriodId', academicPeriodId)

        const [occurrencesResponse, casesResponse] = await Promise.all([
          fetch(`/api/agenda/ocorrencias?${baseParams.toString()}`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch(`/api/agenda/casos?${baseParams.toString()}`, {
            credentials: 'include',
            cache: 'no-store',
          }),
        ])

        const occurrencesBody = await occurrencesResponse.json() as {
          success?: boolean
          rows?: OccurrenceRow[]
        }
        const casesBody = await casesResponse.json() as {
          success?: boolean
          items?: CaseRow[]
        }

        setSnapshot({
          occurrences: occurrencesBody.success ? (occurrencesBody.rows ?? []) : [],
          cases: casesBody.success ? (casesBody.items ?? []) : [],
        })
      } catch {
        setSnapshot(emptySnapshot)
      } finally {
        setLoading(false)
      }
    }

    void loadSnapshot()
  }, [classId, studentId, academicPeriodId])

  return (
    <AgendaPageShell
      eyebrow="EIOS · Centro de Inteligência Pedagógica"
      title="Relações que orientam a ação"
      description="Uma leitura visual do contexto pedagógico. Selecione a turma e, quando necessário, o estudante para acompanhar como planejamento, aula, evidências, avaliações e acompanhamento se conectam."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">
              Turma
              <select
                value={classId}
                onChange={event => changeClass(event.target.value)}
                disabled={classesLoading}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="">Selecione a turma</option>
                {classes.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Estudante
              <select
                value={studentId}
                onChange={event => setStudentId(event.target.value)}
                disabled={!classId || studentsLoading}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="">{classId ? 'Visão da turma' : 'Selecione a turma primeiro'}</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.sequence_number ? `${student.sequence_number}. ` : ''}{student.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Período letivo
              <select
                value={academicPeriodId}
                onChange={event => setAcademicPeriodId(event.target.value)}
                disabled={academicPeriods.length === 0}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="">Todo o período disponível</option>
                {academicPeriods.map(period => (
                  <option key={period.id} value={period.id}>{period.name}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {!classId ? (
          <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Contexto necessário</p>
            <h2 className="mt-2 text-2xl font-bold text-[#071827]">Escolha uma turma para ativar a leitura visual.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              O Centro de Inteligência não inventa indicadores. Ele organiza apenas os vínculos e registros existentes na Agenda.
            </p>
          </section>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[2rem] border border-cyan-200 bg-[#071827] p-5 text-white shadow-[0_28px_90px_-55px_rgba(8,145,178,0.9)] sm:p-8">
              <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cyan-300/10" />
              <div aria-hidden="true" className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full border border-cyan-300/10" />

              <div className="relative">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Mapa de relações EDI</p>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                      {selectedStudent?.full_name ?? selectedClass?.name ?? 'Contexto pedagógico'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {selectedStudent ? `Turma ${selectedClass?.name ?? ''}` : 'Visão consolidada da turma'}
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
                    {loading ? 'Atualizando contexto…' : 'Contexto ativo'}
                  </span>
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                  {[
                    ['01', 'Turma', selectedClass?.name ?? '—', '/agenda/turmas'],
                    ['02', 'Planejamento', `${classPlanning.length} registro(s)`, '/agenda/planejamento'],
                    ['03', 'Aula', 'Execução contextual', '/agenda/aulas'],
                    ['04', 'Frequência', `${students.length} estudante(s)`, '/agenda/diario-classe'],
                    ['05', 'Avaliações', 'Resultados vinculados', '/agenda/avaliacoes'],
                    ['06', 'Evidências', 'Registros de aprendizagem', '/agenda/evidencias'],
                    ['07', 'Acompanhamento', `${activeCases.length} caso(s) ativo(s)`, '/agenda/casos'],
                  ].map(([code, label, value, href], index) => (
                    <Link
                      key={code}
                      href={href}
                      className="group relative min-h-36 rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-cyan-300/40 hover:bg-white/[0.09]"
                    >
                      {index < 6 ? (
                        <span aria-hidden="true" className="absolute -right-3 top-1/2 hidden h-px w-3 bg-cyan-300/40 xl:block" />
                      ) : null}
                      <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-cyan-300">{code}</span>
                      <h3 className="mt-5 text-sm font-bold text-white">{label}</h3>
                      <p className="mt-2 text-xs leading-5 text-slate-300">{value}</p>
                      <span className="mt-4 block text-xs font-semibold text-cyan-200 transition group-hover:translate-x-1">Abrir contexto</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Planejamento ativo</p>
                <p className="mt-3 text-3xl font-bold text-[#071827]">{classPlanning.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Planos da turma disponíveis para orientar aulas, registros e evidências.</p>
              </article>

              <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Acompanhamentos</p>
                <p className="mt-3 text-3xl font-bold text-[#071827]">{activeCases.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Casos pedagógicos em aberto no contexto selecionado.</p>
              </article>

              <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Atenção necessária</p>
                <p className="mt-3 text-3xl font-bold text-[#071827]">{followUps}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Ocorrências registradas que indicam necessidade de acompanhamento.</p>
              </article>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Próxima ação</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">Do dado para a decisão pedagógica</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    O EIOS mantém a sequência de dependências visível. Use o mapa para retornar diretamente ao ponto do fluxo que precisa de registro ou revisão.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/agenda/caderno" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white">
                    Abrir Estudantes
                  </Link>
                  <Link href="/agenda/indicadores" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700">
                    Ver indicadores
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AgendaPageShell>
  )
}

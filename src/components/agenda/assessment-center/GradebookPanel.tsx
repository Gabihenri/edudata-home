'use client'

import { type FormEvent, useMemo, useState } from 'react'

import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type GradeEntry = {
  id: string
  title: string
  value: number | null
  percentage: number | null
  weight: number
  classification: string
  entry_type: string
  recorded_at: string
}

type GradebookResponse = {
  success: boolean
  items: GradeEntry[]
  error?: string
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  critical: 'Crítico',
  initial: 'Inicial',
  developing: 'Em desenvolvimento',
  adequate: 'Adequado',
  proficient: 'Proficiente',
  advanced: 'Avançado',
  not_classified: 'Não classificado',
}

export default function GradebookPanel() {
  const {
    classes,
    classesLoading,
    classesError,
    classId,
    changeClass,
    selectedClass,
    students,
    studentsLoading,
    studentsError,
    studentId,
    setStudentId,
    selectedStudent,
    academicPeriods,
    periodsLoading,
    periodsError,
    academicPeriodId,
    setAcademicPeriodId,
    selectedAcademicPeriod,
  } = usePedagogicalContext()

  const [title, setTitle] = useState('Avaliação')
  const [value, setValue] = useState('')
  const [percentage, setPercentage] = useState('')
  const [weight, setWeight] = useState('1')
  const [type, setType] = useState('assessment')
  const [items, setItems] = useState<GradeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const componentId = selectedClass?.subject?.trim() ?? ''

  async function loadGradebook() {
    if (!studentId || !classId || !componentId || !academicPeriodId) {
      setError('Selecione turma, estudante e período. A turma também precisa ter componente curricular configurado.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        view: 'gradebook',
        studentId,
        classId,
        componentId,
        academicPeriodId,
      })

      const response = await fetch(`/api/agenda/avaliacoes?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      const body = await response.json() as GradebookResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível carregar o diário.')
      }

      setItems(body.items ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar o diário.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!studentId || !classId || !componentId || !academicPeriodId) {
      setError('Complete o contexto pedagógico antes de lançar a nota.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/agenda/avaliacoes', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          operation: 'create_grade',
          grade: {
            studentId,
            classId,
            componentId,
            academicPeriodId,
            type,
            title,
            value: value === '' ? null : Number(value),
            percentage: percentage === '' ? null : Number(percentage),
            weight: weight === '' ? 1 : Number(weight),
            metadata: {
              source: 'agenda_gradebook',
              studentName: selectedStudent?.full_name ?? null,
              className: selectedClass?.name ?? null,
              academicPeriodName: selectedAcademicPeriod?.name ?? null,
            },
          },
        }),
      })

      const body = await response.json() as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível lançar a nota.')
      }

      setSuccess('Nota lançada com classificação atualizada.')
      setValue('')
      setPercentage('')
      setCreateOpen(false)
      await loadGradebook()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível lançar a nota.',
      )
    } finally {
      setLoading(false)
    }
  }

  const average = useMemo(() => {
    const valid = items.filter(
      item => typeof item.value === 'number' && Number.isFinite(item.value),
    )
    if (valid.length === 0) return null
    const totalWeight = valid.reduce((sum, item) => sum + Math.max(0, item.weight || 0), 0)
    if (totalWeight <= 0) return null
    return valid.reduce(
      (sum, item) => sum + (item.value ?? 0) * Math.max(0, item.weight || 0),
      0,
    ) / totalWeight
  }, [items])

  const contextError = classesError || studentsError || periodsError

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-[1.5rem] border border-slate-200 bg-[#071827] px-4 py-6 text-white shadow-sm sm:rounded-[1.75rem] sm:px-7 sm:py-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300 sm:text-xs">
          Agenda Inteligente EDI · Avaliação da Aprendizagem
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Diário de Notas</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Consulte lançamentos por estudante e registre notas usando turma, lista nominal, componente e período já existentes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(current => !current)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white"
          >
            {createOpen ? 'Fechar lançamento' : 'Novo lançamento'}
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Consulta</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-semibold text-slate-700">
            Turma
            <select
              value={classId}
              onChange={event => {
                changeClass(event.target.value)
                setItems([])
              }}
              disabled={classesLoading}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
            >
              <option value="">Selecione a turma</option>
              {classes.map(item => (
                <option key={item.id} value={item.id}>{item.name}{item.subject ? ` · ${item.subject}` : ''}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Estudante
            <select
              value={studentId}
              onChange={event => {
                setStudentId(event.target.value)
                setItems([])
              }}
              disabled={!classId || studentsLoading}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
            >
              <option value="">
                {!classId ? 'Selecione a turma primeiro' : studentsLoading ? 'Carregando...' : 'Selecione o estudante'}
              </option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.sequence_number ? `${student.sequence_number}. ` : ''}{student.full_name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-slate-700">
            <p className="text-xs font-bold uppercase text-[#0B7491]">Componente</p>
            <p className="mt-2 font-semibold">{componentId || 'Selecione uma turma com componente configurado'}</p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Período letivo
            <select
              value={academicPeriodId}
              onChange={event => {
                setAcademicPeriodId(event.target.value)
                setItems([])
              }}
              disabled={periodsLoading || academicPeriods.length === 0}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
            >
              <option value="">{periodsLoading ? 'Carregando...' : 'Selecione o período'}</option>
              {academicPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
          </label>
        </div>

        {contextError ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{contextError}</p>
        ) : null}

        <button
          type="button"
          onClick={() => void loadGradebook()}
          disabled={loading || !studentId || !classId || !componentId || !academicPeriodId}
          className="mt-4 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-50 sm:w-auto"
        >
          {loading ? 'Carregando…' : 'Carregar diário'}
        </button>
      </section>

      {createOpen ? (
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Operação</p>
          <h2 className="mt-2 text-xl font-bold text-[#071827]">Novo lançamento</h2>
          <p className="mt-2 text-sm text-slate-600">
            {selectedStudent?.full_name ?? 'Selecione um estudante'} · {selectedClass?.name ?? 'Turma'} · {selectedAcademicPeriod?.name ?? 'Período'}
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <label className="block text-sm font-semibold text-slate-700">
              Instrumento
              <select value={type} onChange={event => setType(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                <option value="assessment">Avaliação</option>
                <option value="recovery">Recuperação</option>
                <option value="recomposition">Recomposição</option>
                <option value="manual_adjustment">Ajuste manual</option>
                <option value="final_grade">Nota final</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input value={title} onChange={event => setTitle(event.target.value)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-slate-700">
              Nota
              <input type="number" inputMode="decimal" step="0.01" value={value} onChange={event => setValue(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Percentual
              <input type="number" inputMode="decimal" min="0" max="100" step="0.01" value={percentage} onChange={event => setPercentage(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Peso
              <input type="number" inputMode="decimal" min="0.01" step="0.01" value={weight} onChange={event => setWeight(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !studentId || !classId || !componentId || !academicPeriodId}
            className="mt-5 min-h-12 rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Salvando…' : 'Lançar nota'}
          </button>
        </form>
      ) : null}

      {error ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p> : null}
      {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p> : null}

      <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Histórico</p>
            <h2 className="mt-1 font-bold text-[#071827]">Lançamentos do estudante</h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-slate-500 sm:text-xs">Média ponderada</p>
            <p className="font-bold text-[#071827]">{average === null ? '—' : average.toFixed(2)}</p>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="p-5 text-sm text-slate-600 sm:p-6">Nenhum lançamento carregado para este estudante.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Instrumento</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">%</th>
                  <th className="px-4 py-3">Peso</th>
                  <th className="px-4 py-3">Classificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-[#071827]">{item.title}</td>
                    <td className="px-4 py-3 text-slate-600">{item.value ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{item.percentage ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{item.weight}</td>
                    <td className="px-4 py-3 text-slate-600">{CLASSIFICATION_LABELS[item.classification] ?? item.classification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700 sm:p-5">
        A classificação é apoio pedagógico e permanece sujeita à revisão humana. O sistema reutiliza o contexto cadastrado e não expõe identificadores técnicos ao usuário.
      </aside>
    </section>
  )
}

'use client'

import {
  FormEvent,
  useMemo,
  useState,
} from 'react'

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
  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [title, setTitle] = useState('Avaliação')
  const [value, setValue] = useState('')
  const [percentage, setPercentage] = useState('')
  const [weight, setWeight] = useState('1')
  const [type, setType] = useState('assessment')
  const [items, setItems] = useState<GradeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadGradebook() {
    if (!studentId || !classId || !componentId || !academicPeriodId) {
      setError('Informe estudante, turma, componente e período letivo.')
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
      (item) => typeof item.value === 'number' && Number.isFinite(item.value),
    )
    if (valid.length === 0) return null
    const totalWeight = valid.reduce((sum, item) => sum + Math.max(0, item.weight || 0), 0)
    if (totalWeight <= 0) return null
    return valid.reduce(
      (sum, item) => sum + (item.value ?? 0) * Math.max(0, item.weight || 0),
      0,
    ) / totalWeight
  }, [items])

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-[1.5rem] border border-slate-200 bg-[#071827] px-4 py-6 text-white shadow-sm sm:rounded-[1.75rem] sm:px-7 sm:py-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300 sm:text-xs">
          Agenda Inteligente EDI · Avaliação da Aprendizagem
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Diário de Notas
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Lançamentos por instrumento, pesos, recuperação e recomposição com classificação pedagógica revisável.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Estudante', studentId, setStudentId, 'ID do estudante'],
            ['Turma', classId, setClassId, 'ID da turma'],
            ['Componente', componentId, setComponentId, 'ID do componente'],
            ['Período', academicPeriodId, setAcademicPeriodId, 'ID do período'],
          ].map(([label, currentValue, setter, placeholder]) => (
            <label key={String(label)} className="block text-sm font-semibold text-slate-700">
              {String(label)}
              <input
                value={String(currentValue)}
                onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                placeholder={String(placeholder)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void loadGradebook()}
          disabled={loading}
          className="mt-4 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-60 sm:w-auto"
        >
          {loading ? 'Carregando…' : 'Carregar diário'}
        </button>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.3fr] xl:gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h2 className="text-xl font-bold text-[#071827]">Novo lançamento</h2>

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Instrumento
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal"
              >
                <option value="assessment">Avaliação</option>
                <option value="recovery">Recuperação</option>
                <option value="recomposition">Recomposição</option>
                <option value="manual_adjustment">Ajuste manual</option>
                <option value="final_grade">Nota final</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-semibold text-slate-700">
                Nota
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Percentual
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.01"
                  value={percentage}
                  onChange={(event) => setPercentage(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Peso
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p>
          ) : null}
          {success ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 min-h-12 w-full rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Salvando…' : 'Lançar nota'}
          </button>
        </form>

        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Histórico</p>
              <h2 className="mt-1 font-bold text-[#071827]">Lançamentos do estudante</h2>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-500 sm:text-xs">Média ponderada</p>
              <p className="font-bold text-[#071827]">
                {average === null ? '—' : average.toFixed(2)}
              </p>
            </div>
          </header>

          {items.length === 0 ? (
            <div className="p-5 text-sm text-slate-600 sm:p-6">
              Nenhum lançamento carregado para este estudante.
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 md:hidden">
                {items.map((item) => (
                  <article key={item.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-[#071827]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#075F78]">
                          {CLASSIFICATION_LABELS[item.classification] ?? item.classification}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-[#071827]">
                        {item.value ?? '—'}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <dt className="font-semibold text-slate-500">Percentual</dt>
                        <dd className="mt-0.5 font-bold text-slate-700">{item.percentage ?? '—'}</dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <dt className="font-semibold text-slate-500">Peso</dt>
                        <dd className="mt-0.5 font-bold text-slate-700">{item.weight}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
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
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold text-[#071827]">{item.title}</td>
                        <td className="px-4 py-3 text-slate-600">{item.value ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{item.percentage ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{item.weight}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {CLASSIFICATION_LABELS[item.classification] ?? item.classification}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700 sm:p-5">
        A classificação é calculada por faixas transparentes e permanece sujeita à revisão do professor. Não deve ser usada para rotular estudantes ou automatizar decisões pedagógicas.
      </aside>
    </section>
  )
}

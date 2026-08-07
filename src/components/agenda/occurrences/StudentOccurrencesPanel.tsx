'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'

type OccurrenceRow = {
  id: string
  student_id: string
  class_id: string
  nature: string
  severity: string
  status: string
  title: string
  description: string
  positive: boolean
  requires_follow_up: boolean
  occurred_at: string
}

type ListResponse = {
  success: boolean
  rows?: OccurrenceRow[]
  error?: string
}

const natureOptions = [
  ['behavior', 'Comportamento'],
  ['coexistence', 'Convivência'],
  ['attendance', 'Frequência'],
  ['engagement', 'Engajamento'],
  ['pedagogical', 'Pedagógica'],
  ['mediation', 'Mediação'],
  ['positive_recognition', 'Reconhecimento positivo'],
  ['leadership', 'Liderança'],
  ['protagonism', 'Protagonismo'],
  ['collaboration', 'Colaboração'],
  ['support_needed', 'Necessidade de apoio'],
  ['other', 'Outro'],
] as const

const severityOptions = [
  ['informational', 'Informativa'],
  ['low', 'Baixa'],
  ['moderate', 'Moderada'],
  ['high', 'Alta'],
  ['critical', 'Crítica'],
] as const

export default function StudentOccurrencesPanel() {
  const [rows, setRows] =
    useState<OccurrenceRow[]>([])
  const [loading, setLoading] =
    useState(true)
  const [saving, setSaving] =
    useState(false)
  const [error, setError] =
    useState<string | null>(null)

  const [studentId, setStudentId] =
    useState('')
  const [classId, setClassId] =
    useState('')
  const [title, setTitle] =
    useState('')
  const [description, setDescription] =
    useState('')
  const [nature, setNature] =
    useState('pedagogical')
  const [severity, setSeverity] =
    useState('informational')

  const loadRows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        '/api/agenda/ocorrencias?limit=100',
        {
          cache: 'no-store',
        },
      )

      const payload =
        await response.json() as ListResponse

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error ??
            'Não foi possível carregar as ocorrências.',
        )
      }

      setRows(payload.rows ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Erro desconhecido.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(
        '/api/agenda/ocorrencias',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId,
            classId,
            nature,
            severity,
            title,
            description,
            correlationId:
              `agenda-occurrence:${Date.now()}`,
          }),
        },
      )

      const payload =
        await response.json() as {
          success: boolean
          error?: string
        }

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error ??
            'Não foi possível registrar a ocorrência.',
        )
      }

      setTitle('')
      setDescription('')
      await loadRows()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Erro desconhecido.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
            Acompanhamento longitudinal
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#071827]">
            Registrar ocorrência educacional
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Registre situações pedagógicas, de convivência ou reconhecimentos positivos. O registro apoia acompanhamento e não produz rotulagem ou decisão disciplinar automática.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <Field
            label="ID do estudante"
            value={studentId}
            onChange={setStudentId}
            required
          />
          <Field
            label="ID da turma"
            value={classId}
            onChange={setClassId}
            required
          />

          <label className="text-sm font-semibold text-slate-700">
            Natureza
            <select
              value={nature}
              onChange={event =>
                setNature(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"
            >
              {natureOptions.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Gravidade
            <select
              value={severity}
              onChange={event =>
                setSeverity(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"
            >
              {severityOptions.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          <div className="md:col-span-2">
            <Field
              label="Título"
              value={title}
              onChange={setTitle}
              required
            />
          </div>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Descrição objetiva
            <textarea
              value={description}
              onChange={event =>
                setDescription(event.target.value)
              }
              required
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Registrando…'
                : 'Registrar ocorrência'}
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-[#071827]">
            Histórico de ocorrências
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length} registro(s) no período consultado.
          </p>
        </header>

        {loading ? (
          <p className="p-6 text-sm text-slate-500">
            Carregando…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Nenhuma ocorrência registrada.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map(row => (
              <article
                key={row.id}
                className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      {row.nature}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      {row.severity}
                    </span>
                    {row.positive ? (
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                        Positiva
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 font-bold text-[#071827]">
                    {row.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {row.description}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    Estudante {row.student_id} · Turma {row.class_id}
                  </p>
                </div>

                <div className="lg:text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {row.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {row.occurred_at}
                  </p>
                  {row.requires_follow_up ? (
                    <p className="mt-2 text-xs font-bold text-amber-700">
                      Requer acompanhamento
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        required={required}
        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"
      />
    </label>
  )
}

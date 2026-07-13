'use client'

import { FormEvent, useState } from 'react'

import { useClasses } from '@/lib/agenda/hooks/useClasses'

type ClassFormState = {
  name: string
  schoolYear: string
  grade: string
  subject: string
  studentsCount: string
}

const initialForm: ClassFormState = {
  name: '',
  schoolYear: '',
  grade: '',
  subject: '',
  studentsCount: '0',
}

export function AgendaClasses() {
  const {
    classes,
    loading,
    error,
    reload,
    createClass,
  } = useClasses()

  const [form, setForm] = useState<ClassFormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    null,
  )

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)

    try {
      const studentsCount = Number(form.studentsCount)

      if (!Number.isInteger(studentsCount) || studentsCount < 0) {
        throw new Error(
          'A quantidade de estudantes deve ser um número inteiro igual ou maior que zero.',
        )
      }

      await createClass({
        name: form.name,
        school_year: form.schoolYear || null,
        grade: form.grade || null,
        subject: form.subject || null,
        students_count: studentsCount,
        active: true,
      })

      setForm(initialForm)
      setSuccessMessage('Turma criada com sucesso.')
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar a turma.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Turmas
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Cadastre e acompanhe turmas, disciplinas, etapas de ensino e
          quantidade de estudantes com dados persistidos no Supabase.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-950">
              Nova turma
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="class-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nome da turma
                </label>

                <input
                  id="class-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                  placeholder="Ex.: 3ª Série A"
                />
              </div>

              <div>
                <label
                  htmlFor="class-school-year"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Ano letivo
                </label>

                <input
                  id="class-school-year"
                  type="text"
                  value={form.schoolYear}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      schoolYear: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                  placeholder="Ex.: 2026"
                />
              </div>

              <div>
                <label
                  htmlFor="class-grade"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Série ou etapa
                </label>

                <input
                  id="class-grade"
                  type="text"
                  value={form.grade}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      grade: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                  placeholder="Ex.: 3ª Série do Ensino Médio"
                />
              </div>

              <div>
                <label
                  htmlFor="class-subject"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Disciplina
                </label>

                <input
                  id="class-subject"
                  type="text"
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                  placeholder="Ex.: Física"
                />
              </div>

              <div>
                <label
                  htmlFor="class-students-count"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Quantidade de estudantes
                </label>

                <input
                  id="class-students-count"
                  type="number"
                  min="0"
                  step="1"
                  value={form.studentsCount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      studentsCount: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>
            </div>

            {formError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-[#5C1A8C] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : 'Criar turma'}
            </button>
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">
                Turmas cadastradas
              </h2>

              <button
                type="button"
                onClick={() => void reload()}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Atualizar
              </button>
            </div>

            {loading ? (
              <p className="mt-8 text-slate-600">
                Carregando turmas...
              </p>
            ) : null}

            {error ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            ) : null}

            {!loading && !error && classes.length === 0 ? (
              <p className="mt-8 text-slate-500">
                Nenhuma turma cadastrada.
              </p>
            ) : null}

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {classes.map((agendaClass) => (
                <article
                  key={agendaClass.id}
                  className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                        {agendaClass.active ? 'Ativa' : 'Inativa'}
                      </p>

                      <h3 className="mt-3 text-xl font-bold text-slate-950">
                        {agendaClass.name}
                      </h3>
                    </div>

                    <span className="rounded-full bg-[#081C2E] px-4 py-2 text-xs font-bold text-white">
                      {agendaClass.students_count} estudantes
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-slate-600">
                    <p>
                      <strong>Ano letivo:</strong>{' '}
                      {agendaClass.school_year ?? 'Não informado'}
                    </p>

                    <p>
                      <strong>Série:</strong>{' '}
                      {agendaClass.grade ?? 'Não informada'}
                    </p>

                    <p>
                      <strong>Disciplina:</strong>{' '}
                      {agendaClass.subject ?? 'Não informada'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
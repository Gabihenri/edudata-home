'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'
import {
  useClasses,
} from '@/lib/agenda/hooks/useClasses'

type ClassFormState = {
  name: string
  schoolYear: string
  grade: string
  subject: string
  studentsCount: string
}

const initialForm:
  ClassFormState = {
  name: '',
  schoolYear: '',
  grade: '',
  subject: '',
  studentsCount: '0',
}

const inputClassName = [
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-slate-950 outline-none transition placeholder:text-slate-400',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

function normalizeText(
  value: string | null,
): string | null {
  const normalized =
    value?.trim() ?? ''

  return normalized ||
    null
}

function formatStudentCount(
  value: number,
): string {
  return new Intl.NumberFormat(
    'pt-BR',
  ).format(value)
}

export function AgendaClasses() {
  const {
    classes,
    loading,
    error,
    reload,
    createClass,
  } = useClasses()

  const [
    form,
    setForm,
  ] =
    useState<ClassFormState>(
      initialForm,
    )

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

  const summary =
    useMemo(() => {
      const activeClasses =
        classes.filter(
          (agendaClass) =>
            agendaClass.active,
        )

      const students =
        activeClasses.reduce(
          (
            total,
            agendaClass,
          ) =>
            total +
            Math.max(
              0,
              agendaClass
                .students_count ??
                0,
            ),
          0,
        )

      const subjects =
        new Set(
          activeClasses
            .map(
              (agendaClass) =>
                agendaClass
                  .subject
                  ?.trim(),
            )
            .filter(
              (
                subject,
              ): subject is string =>
                Boolean(
                  subject,
                ),
            ),
        )

      const schoolYears =
        new Set(
          activeClasses
            .map(
              (agendaClass) =>
                agendaClass
                  .school_year
                  ?.trim(),
            )
            .filter(
              (
                schoolYear,
              ): schoolYear is string =>
                Boolean(
                  schoolYear,
                ),
            ),
        )

      return {
        total:
          classes.length,

        active:
          activeClasses.length,

        students,
        subjects:
          subjects.size,

        schoolYears:
          schoolYears.size,
      }
    }, [classes])

  function updateField<
    Key extends
      keyof ClassFormState,
  >(
    key: Key,
    value:
      ClassFormState[Key],
  ): void {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )

    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )
  }

  function clearForm(): void {
    if (submitting) {
      return
    }

    setForm(
      initialForm,
    )

    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(
      true,
    )

    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )

    try {
      const name =
        form.name.trim()

      if (!name) {
        throw new Error(
          'Informe o nome da turma.',
        )
      }

      const studentsCount =
        Number(
          form.studentsCount,
        )

      if (
        !Number.isInteger(
          studentsCount,
        ) ||
        studentsCount < 0
      ) {
        throw new Error(
          'A quantidade de estudantes deve ser um número inteiro igual ou maior que zero.',
        )
      }

      await createClass({
        name,

        school_year:
          normalizeText(
            form.schoolYear,
          ),

        grade:
          normalizeText(
            form.grade,
          ),

        subject:
          normalizeText(
            form.subject,
          ),

        students_count:
          studentsCount,

        active:
          true,
      })

      setForm(
        initialForm,
      )

      setSuccessMessage(
        'Turma criada com sucesso.',
      )
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar a turma.',
      )
    } finally {
      setSubmitting(
        false,
      )
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Contextos de aprendizagem"
      title="Turmas"
      description="Organize os contextos pedagógicos acompanhados na Agenda Inteligente EDI, relacionando turma, etapa, disciplina, ano letivo e quantidade de estudantes."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo das turmas"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Turmas ativas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.active
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Contextos acompanhados
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Estudantes
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {formatStudentCount(
                summary.students,
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Total informado
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Disciplinas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.subjects
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Áreas identificadas
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Anos letivos
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.schoolYears
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Períodos registrados
            </p>
          </article>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <form
            onSubmit={
              handleSubmit
            }
            className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-[176px]"
          >
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071827] font-mono text-xs font-bold text-cyan-300">
                  06
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Novo contexto
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                    Cadastrar turma
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Registre as informações essenciais para relacionar planejamentos, aulas e evidências.
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-6 p-5 sm:p-7">
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
                  value={
                    form.name
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'name',
                      event.target
                        .value,
                    )
                  }
                  className={
                    inputClassName
                  }
                  placeholder="Ex.: 3ª Série A"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
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
                    inputMode="numeric"
                    value={
                      form.schoolYear
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'schoolYear',
                        event.target
                          .value,
                      )
                    }
                    className={
                      inputClassName
                    }
                    placeholder="Ex.: 2026"
                  />
                </div>

                <div>
                  <label
                    htmlFor="class-students-count"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Estudantes
                  </label>

                  <input
                    id="class-students-count"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.studentsCount
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'studentsCount',
                        event.target
                          .value,
                      )
                    }
                    className={
                      inputClassName
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="class-grade"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Série, ano ou etapa
                </label>

                <input
                  id="class-grade"
                  type="text"
                  value={
                    form.grade
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'grade',
                      event.target
                        .value,
                    )
                  }
                  className={
                    inputClassName
                  }
                  placeholder="Ex.: 3ª Série do Ensino Médio"
                />
              </div>

              <div>
                <label
                  htmlFor="class-subject"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Disciplina ou área
                </label>

                <input
                  id="class-subject"
                  type="text"
                  value={
                    form.subject
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'subject',
                      event.target
                        .value,
                    )
                  }
                  className={
                    inputClassName
                  }
                  placeholder="Ex.: Física"
                />
              </div>

              <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
                  Contexto pedagógico
                </p>

                <p className="mt-2 text-sm leading-6 text-cyan-950">
                  A turma funciona como referência para organizar planejamentos, aulas, objetivos, tarefas e evidências sem expor dados individuais dos estudantes.
                </p>
              </section>

              {formError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
                >
                  {formError}
                </div>
              ) : null}

              {successMessage ? (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800"
                >
                  {
                    successMessage
                  }
                </div>
              ) : null}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:px-7">
              <button
                type="button"
                onClick={
                  clearForm
                }
                disabled={
                  submitting
                }
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpar
              </button>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting
                  ? 'Salvando...'
                  : 'Criar turma'}
              </button>
            </footer>
          </form>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Organização pedagógica
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                    Turmas cadastradas
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {
                      summary.total
                    }{' '}
                    turma
                    {summary.total === 1
                      ? ''
                      : 's'}{' '}
                    registrada
                    {summary.total === 1
                      ? ''
                      : 's'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void reload()
                  }
                  disabled={
                    loading
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Atualizando...'
                    : 'Atualizar turmas'}
                </button>
              </div>
            </header>

            <div className="p-5 sm:p-7">
              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div
                  role="status"
                  className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-sm font-semibold text-cyan-900"
                >
                  Carregando turmas...
                </div>
              ) : null}

              {!loading &&
              !error &&
              classes.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <h3 className="text-lg font-bold text-[#071827]">
                    Nenhuma turma cadastrada
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Utilize o formulário para registrar o primeiro contexto de aprendizagem.
                  </p>
                </div>
              ) : null}

              {!loading &&
              classes.length >
                0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {classes.map(
                    (
                      agendaClass,
                      index,
                    ) => (
                      <article
                        key={
                          agendaClass.id
                        }
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                      >
                        <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="font-mono text-xs font-bold text-[#0B7491]">
                                {String(
                                  index +
                                    1,
                                ).padStart(
                                  2,
                                  '0',
                                )}
                              </span>

                              <div className="min-w-0">
                                <span
                                  className={`inline-flex rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                                    agendaClass.active
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                      : 'border-slate-200 bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {agendaClass.active
                                    ? 'Ativa'
                                    : 'Inativa'}
                                </span>

                                <h3 className="mt-3 break-words text-xl font-bold text-[#071827]">
                                  {
                                    agendaClass.name
                                  }
                                </h3>
                              </div>
                            </div>

                            <div className="shrink-0 rounded-xl bg-[#071827] px-4 py-3 text-center text-white">
                              <p className="text-xl font-bold">
                                {formatStudentCount(
                                  agendaClass.students_count ??
                                    0,
                                )}
                              </p>

                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
                                Estudantes
                              </p>
                            </div>
                          </div>
                        </header>

                        <div className="space-y-4 p-5">
                          <div className="grid grid-cols-2 gap-3">
                            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Ano letivo
                              </p>

                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                {agendaClass.school_year ??
                                  'Não informado'}
                              </p>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Situação
                              </p>

                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                {agendaClass.active
                                  ? 'Em acompanhamento'
                                  : 'Fora do acompanhamento'}
                              </p>
                            </section>
                          </div>

                          <section className="rounded-xl border border-slate-200 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Série ou etapa
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {agendaClass.grade ??
                                'Não informada'}
                            </p>
                          </section>

                          <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">
                              Disciplina ou área
                            </p>

                            <p className="mt-2 text-sm font-semibold leading-6 text-cyan-950">
                              {agendaClass.subject ??
                                'Não informada'}
                            </p>
                          </section>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </AgendaPageShell>
  )
}
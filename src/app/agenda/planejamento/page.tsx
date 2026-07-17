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
  usePlanning,
} from '@/lib/agenda/hooks/usePlanning'

type PlanningFormData = {
  title: string
  description: string
  subject: string
  className: string
  objective: string
  methodology: string
  resources: string
  evaluation: string
  plannedDate: string
}

const initialFormData:
  PlanningFormData = {
  title: '',
  description: '',
  subject: '',
  className: '',
  objective: '',
  methodology: '',
  resources: '',
  evaluation: '',
  plannedDate: '',
}

const inputClassName = [
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-slate-950 outline-none transition placeholder:text-slate-400',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

function formatPlanningDate(
  value: string | null,
): string {
  if (!value) {
    return 'Data não definida'
  }

  const parts =
    value
      .split('-')
      .map(Number)

  if (
    parts.length !== 3 ||
    parts.some(
      (part) =>
        !Number.isFinite(part),
    )
  ) {
    return value
  }

  const [
    year,
    month,
    day,
  ] = parts

  const date =
    new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle:
        'medium',
    },
  ).format(date)
}

function formatStatus(
  value: string,
): string {
  const labels:
    Record<string, string> = {
    rascunho:
      'Rascunho',

    ativo:
      'Ativo',

    concluido:
      'Concluído',

    concluído:
      'Concluído',

    arquivado:
      'Arquivado',
  }

  return (
    labels[value] ??
    value
      .replace(
        /_/g,
        ' ',
      )
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      )
  )
}

export default function AgendaPlanningPage() {
  const {
    planning,
    loading,
    error,
    reload,
    createPlanning,
  } = usePlanning()

  const [
    formData,
    setFormData,
  ] =
    useState<PlanningFormData>(
      initialFormData,
    )

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false)

  const [
    formError,
    setFormError,
  ] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('')

  const summary =
    useMemo(() => {
      const dated =
        planning.filter(
          (item) =>
            Boolean(
              item.planned_date,
            ),
        ).length

      const contextualized =
        planning.filter(
          (item) =>
            Boolean(
              item.subject ||
                item.class_name,
            ),
        ).length

      const drafts =
        planning.filter(
          (item) =>
            item.status ===
            'rascunho',
        ).length

      return {
        total:
          planning.length,

        dated,
        contextualized,
        drafts,
      }
    }, [planning])

  function updateField<
    Key extends
      keyof PlanningFormData,
  >(
    field: Key,
    value:
      PlanningFormData[Key],
  ): void {
    setFormData(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )

    setFormError('')
    setSuccessMessage('')
  }

  function clearForm(): void {
    if (isSaving) {
      return
    }

    setFormData(
      initialFormData,
    )

    setFormError('')
    setSuccessMessage('')
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setFormError('')
    setSuccessMessage('')

    const title =
      formData.title.trim()

    const objective =
      formData.objective.trim()

    if (!title) {
      setFormError(
        'Informe o título do planejamento.',
      )

      return
    }

    if (!objective) {
      setFormError(
        'Informe o objetivo do planejamento.',
      )

      return
    }

    setIsSaving(true)

    try {
      await createPlanning({
        title,

        description:
          formData.description
            .trim() ||
          null,

        subject:
          formData.subject
            .trim() ||
          null,

        class_name:
          formData.className
            .trim() ||
          null,

        objective,

        methodology:
          formData.methodology
            .trim() ||
          null,

        resources:
          formData.resources
            .trim() ||
          null,

        evaluation:
          formData.evaluation
            .trim() ||
          null,

        planned_date:
          formData.plannedDate ||
          null,

        status:
          'rascunho',

        school_id:
          null,

        user_id:
          null,
      })

      setFormData(
        initialFormData,
      )

      setSuccessMessage(
        'Planejamento salvo com sucesso.',
      )
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o planejamento.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Organização pedagógica"
      title="Planejamento pedagógico"
      description="Estruture objetivos, contexto, estratégias, recursos e formas de acompanhamento em um registro pedagógico integrado ao EIOS."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo dos planejamentos"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Registros ativos
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {summary.total}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Planejamentos disponíveis
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Com data
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {summary.dated}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Cronogramas definidos
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Contextualizados
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.contextualized
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Com turma ou disciplina
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Rascunhos
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {summary.drafts}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Em elaboração
            </p>
          </article>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <form
            onSubmit={
              handleSubmit
            }
            className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
          >
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071827] font-mono text-xs font-bold text-cyan-300">
                  03
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Novo registro
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                    Criar planejamento
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Organize a intenção pedagógica antes de registrar ações e evidências.
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-8 p-5 sm:p-7">
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  01 — Identificação
                </legend>

                <div className="mt-5 space-y-5">
                  <div>
                    <label
                      htmlFor="planning-title"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Título
                    </label>

                    <input
                      id="planning-title"
                      type="text"
                      required
                      value={
                        formData.title
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          'title',
                          event.target
                            .value,
                        )
                      }
                      placeholder="Ex.: Sequência didática sobre energia"
                      autoComplete="off"
                      className={
                        inputClassName
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="planning-description"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Descrição geral
                    </label>

                    <textarea
                      id="planning-description"
                      rows={4}
                      value={
                        formData.description
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          'description',
                          event.target
                            .value,
                        )
                      }
                      placeholder="Apresente o contexto e a finalidade deste planejamento."
                      className={`${inputClassName} resize-y`}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="planning-subject"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Disciplina ou área
                      </label>

                      <input
                        id="planning-subject"
                        type="text"
                        value={
                          formData.subject
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
                        placeholder="Ex.: Física"
                        className={
                          inputClassName
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="planning-class"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Turma
                      </label>

                      <input
                        id="planning-class"
                        type="text"
                        value={
                          formData.className
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            'className',
                            event.target
                              .value,
                          )
                        }
                        placeholder="Ex.: 2º A"
                        className={
                          inputClassName
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="planning-date"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Data planejada
                    </label>

                    <input
                      id="planning-date"
                      type="date"
                      value={
                        formData.plannedDate
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          'plannedDate',
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
              </fieldset>

              <div className="h-px bg-slate-200" />

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  02 — Intencionalidade
                </legend>

                <div className="mt-5">
                  <label
                    htmlFor="planning-objective"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Objetivo pedagógico
                  </label>

                  <textarea
                    id="planning-objective"
                    rows={5}
                    required
                    value={
                      formData.objective
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'objective',
                        event.target
                          .value,
                      )
                    }
                    placeholder="Descreva o que se espera que os estudantes desenvolvam ou demonstrem."
                    className={`${inputClassName} resize-y`}
                  />
                </div>
              </fieldset>

              <div className="h-px bg-slate-200" />

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  03 — Estratégia
                </legend>

                <div className="mt-5 space-y-5">
                  <div>
                    <label
                      htmlFor="planning-methodology"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Estratégias e metodologia
                    </label>

                    <textarea
                      id="planning-methodology"
                      rows={4}
                      value={
                        formData.methodology
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          'methodology',
                          event.target
                            .value,
                        )
                      }
                      placeholder="Descreva ações, organização da aula e formas de participação."
                      className={`${inputClassName} resize-y`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="planning-resources"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Recursos
                    </label>

                    <textarea
                      id="planning-resources"
                      rows={3}
                      value={
                        formData.resources
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          'resources',
                          event.target
                            .value,
                        )
                      }
                      placeholder="Materiais, ambientes, tecnologias e apoios necessários."
                      className={`${inputClassName} resize-y`}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="h-px bg-slate-200" />

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  04 — Acompanhamento
                </legend>

                <div className="mt-5">
                  <label
                    htmlFor="planning-evaluation"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Avaliação e evidências esperadas
                  </label>

                  <textarea
                    id="planning-evaluation"
                    rows={4}
                    value={
                      formData.evaluation
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'evaluation',
                        event.target
                          .value,
                      )
                    }
                    placeholder="Indique como o desenvolvimento será acompanhado e quais evidências poderão ser registradas."
                    className={`${inputClassName} resize-y`}
                  />
                </div>
              </fieldset>

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
                  isSaving
                }
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpar campos
              </button>

              <button
                type="submit"
                disabled={
                  isSaving
                }
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSaving
                  ? 'Salvando...'
                  : 'Salvar planejamento'}
              </button>
            </footer>
          </form>

          <aside className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm xl:sticky xl:top-[176px]">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Referência EDI
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Estrutura do planejamento
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                O registro deve apoiar a ação docente, e não aumentar a burocracia.
              </p>
            </header>

            <div className="divide-y divide-white/10">
              <article className="px-5 py-5 sm:px-7">
                <div className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    01
                  </span>

                  <div>
                    <h3 className="font-bold">
                      Contexto
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Identifique turma, área, período e situação pedagógica.
                    </p>
                  </div>
                </div>
              </article>

              <article className="px-5 py-5 sm:px-7">
                <div className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    02
                  </span>

                  <div>
                    <h3 className="font-bold">
                      Intencionalidade
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Defina com clareza a aprendizagem ou o desenvolvimento esperado.
                    </p>
                  </div>
                </div>
              </article>

              <article className="px-5 py-5 sm:px-7">
                <div className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    03
                  </span>

                  <div>
                    <h3 className="font-bold">
                      Estratégia
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Registre ações, recursos, apoios e formas de participação.
                    </p>
                  </div>
                </div>
              </article>

              <article className="px-5 py-5 sm:px-7">
                <div className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    04
                  </span>

                  <div>
                    <h3 className="font-bold">
                      Evidências
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Antecipe como o processo será observado, documentado e analisado.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-100">
                O Framework EDI orienta o planejamento por evidências, inclusão e inteligência, sem impor uma metodologia pedagógica específica.
              </p>
            </div>
          </aside>
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Memória de trabalho
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                  Planejamentos cadastrados
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {planning.length}{' '}
                  registro
                  {planning.length === 1
                    ? ''
                    : 's'}{' '}
                  ativo
                  {planning.length === 1
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
                  : 'Atualizar registros'}
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
                Carregando planejamentos...
              </div>
            ) : null}

            {!loading &&
            !error &&
            planning.length ===
              0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-bold text-[#071827]">
                  Nenhum planejamento cadastrado
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Utilize o formulário para criar o primeiro planejamento pedagógico.
                </p>
              </div>
            ) : null}

            {!loading &&
            planning.length >
              0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {planning.map(
                  (
                    item,
                    index,
                  ) => (
                    <article
                      key={
                        item.id
                      }
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="font-mono text-xs font-bold text-[#0B7491]">
                              {String(
                                index + 1,
                              ).padStart(
                                2,
                                '0',
                              )}
                            </span>

                            <div className="min-w-0">
                              <span className="inline-flex rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#075F78]">
                                {formatStatus(
                                  item.status,
                                )}
                              </span>

                              <h3 className="mt-3 break-words text-xl font-bold text-[#071827]">
                                {item.title}
                              </h3>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-lg bg-[#071827] px-3 py-2 text-xs font-bold text-white">
                            {formatPlanningDate(
                              item.planned_date,
                            )}
                          </span>
                        </div>
                      </header>

                      <div className="space-y-4 p-5">
                        {item.description ? (
                          <p className="text-sm leading-6 text-slate-600">
                            {
                              item.description
                            }
                          </p>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          {item.subject ? (
                            <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                              {
                                item.subject
                              }
                            </span>
                          ) : null}

                          {item.class_name ? (
                            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                              Turma{' '}
                              {
                                item.class_name
                              }
                            </span>
                          ) : null}
                        </div>

                        {item.objective ? (
                          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Objetivo
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {
                                item.objective
                              }
                            </p>
                          </section>
                        ) : null}

                        {item.methodology ||
                        item.resources ||
                        item.evaluation ? (
                          <details className="group rounded-xl border border-slate-200">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold text-[#075F78] [&::-webkit-details-marker]:hidden">
                              Ver estrutura completa

                              <span
                                aria-hidden="true"
                                className="transition group-open:rotate-180"
                              >
                                ↓
                              </span>
                            </summary>

                            <div className="space-y-4 border-t border-slate-200 px-4 py-4">
                              {item.methodology ? (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                    Estratégia
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-slate-700">
                                    {
                                      item.methodology
                                    }
                                  </p>
                                </div>
                              ) : null}

                              {item.resources ? (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                    Recursos
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-slate-700">
                                    {
                                      item.resources
                                    }
                                  </p>
                                </div>
                              ) : null}

                              {item.evaluation ? (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                    Avaliação
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-slate-700">
                                    {
                                      item.evaluation
                                    }
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AgendaPageShell>
  )
}
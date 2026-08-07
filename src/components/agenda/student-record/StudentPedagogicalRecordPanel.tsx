'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useClasses,
} from '@/lib/agenda/hooks/useClasses'

type RosterStudent = {
  id: string
  class_id: string
  full_name: string
  enrollment_code: string | null
  sequence_number: number | null
  active: boolean
}

type OccurrenceItem = {
  id: string
  title: string
  description: string
  nature: string
  severity: string
  status: string
  positive: boolean
  occurred_at: string
}

type CaseItem = {
  id: string
  title: string
  summary: string
  origin: string
  priority: string
  status: string
  opened_at: string
}

type TimelineItem = {
  id: string
  type: 'occurrence' | 'case'
  title: string
  description: string
  occurredAt: string
  tag: string
}

function formatDate(
  value: string,
): string {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
    },
  ).format(date)
}

export default function StudentPedagogicalRecordPanel() {
  const {
    classes,
    loading: loadingClasses,
    error: classesError,
  } = useClasses()

  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState('')

  const [
    roster,
    setRoster,
  ] = useState<RosterStudent[]>([])

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState<RosterStudent | null>(
    null,
  )

  const [
    occurrences,
    setOccurrences,
  ] = useState<OccurrenceItem[]>([])

  const [
    cases,
    setCases,
  ] = useState<CaseItem[]>([])

  const [
    loadingRoster,
    setLoadingRoster,
  ] = useState(false)

  const [
    loadingRecord,
    setLoadingRecord,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const selectedClass =
    useMemo(
      () =>
        classes.find(
          agendaClass =>
            agendaClass.id ===
            selectedClassId,
        ) ?? null,
      [
        classes,
        selectedClassId,
      ],
    )

  const filteredRoster =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          )

      if (!query) {
        return roster
      }

      return roster.filter(
        student => {
          const searchable = [
            student.full_name,
            student.enrollment_code ?? '',
            student.sequence_number !== null
              ? String(
                  student.sequence_number,
                )
              : '',
          ]
            .join(' ')
            .toLocaleLowerCase(
              'pt-BR',
            )

          return searchable.includes(
            query,
          )
        },
      )
    }, [
      roster,
      search,
    ])

  useEffect(() => {
    setSelectedStudent(null)
    setOccurrences([])
    setCases([])
    setSearch('')

    if (!selectedClassId) {
      setRoster([])
      return
    }

    let cancelled = false

    async function loadRoster() {
      setLoadingRoster(true)
      setError(null)

      try {
        const params =
          new URLSearchParams({
            classId:
              selectedClassId,
          })

        const response =
          await fetch(
            `/api/agenda/diario-classe?${params.toString()}`,
            {
              credentials:
                'include',
              cache:
                'no-store',
            },
          )

        const body =
          await response.json() as {
            success?: boolean
            roster?: RosterStudent[]
            error?: string
          }

        if (
          !response.ok ||
          !body.success
        ) {
          throw new Error(
            body.error ||
              'Não foi possível carregar os estudantes da turma.',
          )
        }

        if (!cancelled) {
          setRoster(
            body.roster ?? [],
          )
        }
      } catch (
        loadError
      ) {
        if (!cancelled) {
          setRoster([])
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Não foi possível carregar os estudantes da turma.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingRoster(false)
        }
      }
    }

    void loadRoster()

    return () => {
      cancelled = true
    }
  }, [
    selectedClassId,
  ])

  async function openStudent(
    student: RosterStudent,
  ) {
    setSelectedStudent(
      student,
    )
    setLoadingRecord(true)
    setError(null)

    try {
      const occurrenceParams =
        new URLSearchParams({
          studentId:
            student.id,
          classId:
            student.class_id,
          limit:
            '100',
        })

      const caseParams =
        new URLSearchParams({
          studentId:
            student.id,
          classId:
            student.class_id,
          limit:
            '100',
        })

      const [
        occurrenceResponse,
        caseResponse,
      ] =
        await Promise.all([
          fetch(
            `/api/agenda/ocorrencias?${occurrenceParams.toString()}`,
            {
              credentials:
                'include',
              cache:
                'no-store',
            },
          ),
          fetch(
            `/api/agenda/casos?${caseParams.toString()}`,
            {
              credentials:
                'include',
              cache:
                'no-store',
            },
          ),
        ])

      const occurrenceBody =
        await occurrenceResponse.json() as {
          success?: boolean
          rows?: OccurrenceItem[]
          items?: OccurrenceItem[]
          error?: string
        }

      if (
        !occurrenceResponse.ok ||
        !occurrenceBody.success
      ) {
        throw new Error(
          occurrenceBody.error ||
            'Não foi possível carregar os registros do estudante.',
        )
      }

      const caseBody =
        await caseResponse.json() as {
          success?: boolean
          items?: CaseItem[]
          error?: string
        }

      if (
        !caseResponse.ok ||
        !caseBody.success
      ) {
        throw new Error(
          caseBody.error ||
            'Não foi possível carregar o acompanhamento pedagógico.',
        )
      }

      setOccurrences(
        occurrenceBody.rows ??
          occurrenceBody.items ??
          [],
      )
      setCases(
        caseBody.items ?? [],
      )
    } catch (
      loadError
    ) {
      setOccurrences([])
      setCases([])
      setError(
        loadError instanceof
          Error
          ? loadError.message
          : 'Não foi possível abrir o Caderno Pedagógico.',
      )
    } finally {
      setLoadingRecord(false)
    }
  }

  const timeline =
    useMemo<TimelineItem[]>(
      () => {
        const occurrenceItems:
          TimelineItem[] =
          occurrences.map(
            item => ({
              id:
                item.id,
              type:
                'occurrence',
              title:
                item.title,
              description:
                item.description,
              occurredAt:
                item.occurred_at,
              tag:
                item.positive
                  ? 'Registro positivo'
                  : 'Ocorrência',
            }),
          )

        const caseItems:
          TimelineItem[] =
          cases.map(
            item => ({
              id:
                item.id,
              type:
                'case',
              title:
                item.title,
              description:
                item.summary,
              occurredAt:
                item.opened_at,
              tag:
                'Caso pedagógico',
            }),
          )

        return [
          ...occurrenceItems,
          ...caseItems,
        ]
          .filter(
            item =>
              item.occurredAt,
          )
          .sort(
            (
              first,
              second,
            ) =>
              new Date(
                second.occurredAt,
              ).getTime() -
              new Date(
                first.occurredAt,
              ).getTime(),
          )
      },
      [
        occurrences,
        cases,
      ],
    )

  const pendingOccurrences =
    occurrences.filter(
      item =>
        item.status !==
          'resolved' &&
        item.status !==
          'archived',
    ).length

  const activeCases =
    cases.filter(
      item =>
        item.status !==
          'resolved' &&
        item.status !==
          'closed' &&
        item.status !==
          'archived',
    ).length

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-[1.5rem] border border-slate-200 bg-[#071827] px-4 py-6 text-white shadow-sm sm:rounded-[1.75rem] sm:px-7 sm:py-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300 sm:text-xs">
          Agenda Inteligente EDI · Estudantes
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Caderno Pedagógico
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Localize um estudante pela turma e consulte sua trajetória pedagógica sem lidar com identificadores técnicos.
        </p>
      </header>

      {!selectedStudent ? (
        <>
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                Localizar estudante
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">
                Quem você deseja acompanhar?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Selecione uma turma e pesquise pelo nome, matrícula ou número da chamada.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <label className="block text-sm font-semibold text-slate-700">
                Turma
                <select
                  value={
                    selectedClassId
                  }
                  onChange={
                    event =>
                      setSelectedClassId(
                        event.target.value,
                      )
                  }
                  disabled={
                    loadingClasses
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-cyan-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingClasses
                      ? 'Carregando turmas...'
                      : 'Selecione uma turma'}
                  </option>

                  {classes
                    .filter(
                      agendaClass =>
                        agendaClass.active,
                    )
                    .map(
                      agendaClass => (
                        <option
                          key={
                            agendaClass.id
                          }
                          value={
                            agendaClass.id
                          }
                        >
                          {agendaClass.name}
                          {agendaClass.subject
                            ? ` · ${agendaClass.subject}`
                            : ''}
                        </option>
                      ),
                    )}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Pesquisar estudante
                <input
                  type="search"
                  value={search}
                  onChange={
                    event =>
                      setSearch(
                        event.target.value,
                      )
                  }
                  disabled={
                    !selectedClassId ||
                    loadingRoster
                  }
                  placeholder="Nome, matrícula ou chamada"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-2.5 font-normal outline-none focus:border-cyan-500 disabled:bg-slate-100"
                />
              </label>
            </div>

            {classesError || error ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {error ?? classesError}
              </p>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
                Estudantes
              </p>

              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-[#071827]">
                  {selectedClass
                    ? selectedClass.name
                    : 'Selecione uma turma'}
                </h2>

                {selectedClass ? (
                  <span className="text-xs font-semibold text-slate-500">
                    {filteredRoster.length}{' '}
                    {filteredRoster.length === 1
                      ? 'estudante'
                      : 'estudantes'}
                  </span>
                ) : null}
              </div>
            </header>

            {!selectedClassId ? (
              <div className="p-6 text-sm leading-6 text-slate-600">
                Escolha uma turma acima para visualizar sua lista nominal.
              </div>
            ) : loadingRoster ? (
              <div className="p-6 text-sm text-slate-600">
                Carregando estudantes...
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="p-6 text-sm leading-6 text-slate-600">
                {roster.length === 0
                  ? 'Esta turma ainda não possui estudantes na lista nominal.'
                  : 'Nenhum estudante corresponde à pesquisa.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredRoster.map(
                  student => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() =>
                        void openStudent(
                          student,
                        )
                      }
                      className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-cyan-50/60 focus:bg-cyan-50/60 focus:outline-none sm:px-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071827] text-sm font-bold text-cyan-200">
                          {student.sequence_number ?? '—'}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#071827]">
                            {student.full_name}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {student.enrollment_code
                              ? `Matrícula ${student.enrollment_code}`
                              : 'Matrícula não informada'}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-[#0B7491]">
                        Abrir
                      </span>
                    </button>
                  ),
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="p-4 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(
                    null,
                  )
                  setOccurrences([])
                  setCases([])
                  setError(null)
                }}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                Voltar aos estudantes
              </button>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#071827] text-base font-bold text-cyan-200">
                  {selectedStudent.sequence_number ?? '—'}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
                    Caderno Pedagógico
                  </p>

                  <h2 className="mt-1 break-words text-2xl font-bold text-[#071827] sm:text-3xl">
                    {selectedStudent.full_name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    {selectedClass?.name ?? 'Turma'}
                    {selectedClass?.subject
                      ? ` · ${selectedClass.subject}`
                      : ''}
                    {selectedStudent.enrollment_code
                      ? ` · Matrícula ${selectedStudent.enrollment_code}`
                      : ''}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                Registros
              </p>
              <p className="mt-2 text-2xl font-bold text-[#071827]">
                {occurrences.length}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                Pendências
              </p>
              <p className="mt-2 text-2xl font-bold text-[#071827]">
                {pendingOccurrences}
              </p>
            </article>

            <article className="col-span-2 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm sm:col-span-1 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-800 sm:text-xs">
                Casos ativos
              </p>
              <p className="mt-2 text-2xl font-bold text-[#071827]">
                {activeCases}
              </p>
            </article>
          </div>

          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
                Linha do tempo
              </p>
              <h2 className="mt-1 font-bold text-[#071827]">
                Trajetória consolidada
              </h2>
            </header>

            {loadingRecord ? (
              <div className="p-6 text-sm text-slate-600">
                Carregando trajetória...
              </div>
            ) : timeline.length === 0 ? (
              <div className="p-6 text-sm leading-6 text-slate-600">
                Ainda não há registros de acompanhamento vinculados a este estudante.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {timeline.map(
                  item => (
                    <article
                      key={`${item.type}-${item.id}`}
                      className="grid gap-2 px-4 py-5 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-3 sm:px-5"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">
                          {item.tag}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            item.occurredAt,
                          )}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-bold text-[#071827]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">
                Aprendizagem
              </p>
              <h2 className="mt-2 font-bold text-[#071827]">
                Avaliações e evolução
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Os resultados avaliativos serão apresentados aqui automaticamente conforme o contexto pedagógico vinculado ao estudante.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">
                Acompanhamento
              </p>
              <h2 className="mt-2 font-bold text-[#071827]">
                Registros pedagógicos
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {occurrences.length} registros disponíveis, incluindo situações positivas e itens que demandam acompanhamento.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">
                Intervenção
              </p>
              <h2 className="mt-2 font-bold text-[#071827]">
                Casos pedagógicos
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {cases.length} casos estruturados vinculados ao estudante selecionado.
              </p>
            </section>
          </div>
        </>
      )}

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700 sm:p-5">
        O Caderno Pedagógico organiza informações educacionais para apoiar o trabalho profissional. Ele não produz diagnóstico clínico nem substitui a decisão do professor ou da equipe pedagógica.
      </aside>
    </section>
  )
}

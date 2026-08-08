'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type StudentRow = {
  id: string
  class_id: string
  full_name: string
  enrollment_code: string | null
  sequence_number: number | null
  active: boolean
}

type DiaryResponse = {
  success?: boolean
  roster?: StudentRow[]
  student?: StudentRow
  error?: string
}

type ImportRow = {
  fullName: string
  enrollmentCode: string | null
  sequenceNumber: number | null
}

const inputClassName = [
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-sm text-[#071827] outline-none transition',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

function parseCsv(text: string): ImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const delimiter = lines[0].includes(';') ? ';' : ','
  const normalizedHeader = lines[0]
    .split(delimiter)
    .map(value => value.trim().toLocaleLowerCase('pt-BR'))

  const hasHeader = normalizedHeader.some(value =>
    ['nome', 'nome completo', 'estudante', 'matricula', 'matrícula', 'ra'].includes(value),
  )

  const dataLines = hasHeader ? lines.slice(1) : lines

  const nameIndex = hasHeader
    ? Math.max(0, normalizedHeader.findIndex(value =>
        ['nome', 'nome completo', 'estudante'].includes(value),
      ))
    : 0
  const enrollmentIndex = hasHeader
    ? normalizedHeader.findIndex(value =>
        ['matricula', 'matrícula', 'ra', 'matricula institucional', 'matrícula institucional'].includes(value),
      )
    : 1
  const sequenceIndex = hasHeader
    ? normalizedHeader.findIndex(value =>
        ['numero', 'número', 'chamada', 'numero chamada', 'número chamada'].includes(value),
      )
    : 2

  return dataLines
    .map(line => {
      const cells = line.split(delimiter).map(value => value.trim().replace(/^"|"$/g, ''))
      const fullName = cells[nameIndex]?.trim() ?? ''
      const enrollmentCode = enrollmentIndex >= 0
        ? cells[enrollmentIndex]?.trim() || null
        : null
      const sequenceRaw = sequenceIndex >= 0 ? cells[sequenceIndex]?.trim() : ''
      const parsedSequence = sequenceRaw ? Number(sequenceRaw) : null

      return {
        fullName,
        enrollmentCode,
        sequenceNumber:
          parsedSequence !== null && Number.isInteger(parsedSequence) && parsedSequence > 0
            ? parsedSequence
            : null,
      }
    })
    .filter(row => row.fullName.length > 0)
}

export default function StudentRegistryPage() {
  const searchParams = useSearchParams()
  const initialClassId = searchParams.get('classId') ?? ''

  const {
    classes,
    classesLoading,
    classesError,
    classId,
    changeClass,
    selectedClass,
  } = usePedagogicalContext(initialClassId)

  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [enrollmentCode, setEnrollmentCode] = useState('')
  const [sequenceNumber, setSequenceNumber] = useState('')
  const [search, setSearch] = useState('')

  async function loadStudents(nextClassId = classId) {
    if (!nextClassId) {
      setStudents([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/agenda/diario-classe?classId=${encodeURIComponent(nextClassId)}`,
        { credentials: 'include', cache: 'no-store' },
      )
      const body = await response.json() as DiaryResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível carregar os estudantes da turma.')
      }

      setStudents(body.roster ?? [])
    } catch (loadError) {
      setStudents([])
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar os estudantes da turma.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStudents(classId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  async function addStudent(row: ImportRow): Promise<StudentRow> {
    const response = await fetch('/api/agenda/diario-classe', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'add_student',
        classId,
        fullName: row.fullName,
        enrollmentCode: row.enrollmentCode,
        sequenceNumber: row.sequenceNumber,
      }),
    })

    const body = await response.json() as DiaryResponse
    if (!response.ok || !body.success || !body.student) {
      throw new Error(body.error || `Não foi possível cadastrar ${row.fullName}.`)
    }

    return body.student
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!classId) {
      setError('Selecione uma turma antes de cadastrar o estudante.')
      return
    }

    if (!fullName.trim()) {
      setError('Informe o nome completo do estudante.')
      return
    }

    const parsedSequence = sequenceNumber.trim() ? Number(sequenceNumber) : null
    if (
      parsedSequence !== null &&
      (!Number.isInteger(parsedSequence) || parsedSequence <= 0)
    ) {
      setError('O número de chamada deve ser um inteiro maior que zero.')
      return
    }

    setSaving(true)

    try {
      await addStudent({
        fullName: fullName.trim(),
        enrollmentCode: enrollmentCode.trim() || null,
        sequenceNumber: parsedSequence,
      })

      setFullName('')
      setEnrollmentCode('')
      setSequenceNumber('')
      setSuccess('Estudante cadastrado e disponível nos módulos da Agenda.')
      await loadStudents()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível cadastrar o estudante.',
      )
    } finally {
      setSaving(false)
    }
  }

  function downloadTemplate() {
    const content = [
      'Nome Completo;Matrícula Institucional;Número de Chamada',
      'João Silva;2026001;1',
      'Maria Souza;2026002;2',
      'José Oliveira;2026003;3',
    ].join('\n')

    const blob = new Blob([`\uFEFF${content}`], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'modelo-estudantes-edudata.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  async function handleImport(file: File | null) {
    if (!file) return
    setError(null)
    setSuccess(null)

    if (!classId) {
      setError('Selecione a turma antes de importar a planilha.')
      return
    }

    if (!file.name.toLocaleLowerCase('pt-BR').endsWith('.csv')) {
      setError('Nesta primeira versão, envie o modelo CSV compatível com Excel. O arquivo .xlsx será habilitado na evolução do importador.')
      return
    }

    setImporting(true)

    try {
      const rows = parseCsv(await file.text())
      if (rows.length === 0) {
        throw new Error('Nenhum estudante válido foi encontrado no arquivo.')
      }

      const existingEnrollmentCodes = new Set(
        students.map(student => student.enrollment_code?.trim()).filter(Boolean) as string[],
      )
      const existingNames = new Set(
        students.map(student => student.full_name.trim().toLocaleLowerCase('pt-BR')),
      )

      const validRows = rows.filter(row => {
        if (row.enrollmentCode && existingEnrollmentCodes.has(row.enrollmentCode)) return false
        return !existingNames.has(row.fullName.trim().toLocaleLowerCase('pt-BR'))
      })

      if (validRows.length === 0) {
        throw new Error('Todos os registros do arquivo já existem nesta turma ou estão duplicados.')
      }

      let imported = 0
      for (const row of validRows) {
        await addStudent(row)
        imported += 1
      }

      setSuccess(`${imported} estudante${imported === 1 ? '' : 's'} importado${imported === 1 ? '' : 's'} com sucesso.`)
      await loadStudents()
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'Não foi possível importar a planilha.',
      )
    } finally {
      setImporting(false)
    }
  }

  const visibleStudents = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return students

    return students.filter(student =>
      [student.full_name, student.enrollment_code, student.sequence_number]
        .filter(value => value !== null && value !== undefined)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalized),
    )
  }, [students, search])

  return (
    <AgendaPageShell
      eyebrow="Cadastros e Integrações"
      title="Cadastro de Estudantes"
      description="Dados mestres dos estudantes, separados da operação pedagógica. O UUID interno é gerado pelo sistema e permanece invisível; a matrícula institucional é opcional."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
            <label className="text-sm font-semibold text-slate-700">
              Turma
              <select
                value={classId}
                onChange={event => changeClass(event.target.value)}
                disabled={classesLoading}
                className={`mt-2 ${inputClassName}`}
              >
                <option value="">Selecione a turma</option>
                {classes.filter(item => item.active).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}{item.subject ? ` · ${item.subject}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={downloadTemplate}
              className="min-h-12 rounded-xl border border-[#0B7491] bg-white px-5 text-sm font-bold text-[#075F78]"
            >
              Baixar modelo
            </button>

            <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-[#071827] px-5 text-sm font-bold text-white">
              {importing ? 'Importando…' : 'Importar planilha'}
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                disabled={importing || !classId}
                onChange={event => void handleImport(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {selectedClass ? (
            <div className="mt-4 grid gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm sm:grid-cols-3">
              <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Turma</span>{selectedClass.name}</div>
              <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Componente</span>{selectedClass.subject ?? 'Não informado'}</div>
              <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Lista nominal</span>{students.length} estudante{students.length === 1 ? '' : 's'}</div>
            </div>
          ) : null}

          {classesError ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{classesError}</p>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
          <form onSubmit={handleSubmit} className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-[176px]">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Cadastro manual</p>
              <h2 className="mt-2 text-2xl font-bold text-[#071827]">Novo estudante</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Cadastre poucos estudantes manualmente. Para listas maiores, utilize o modelo de importação.</p>
            </header>

            <div className="space-y-5 p-5 sm:p-6">
              <label className="block text-sm font-semibold text-slate-700">
                Nome completo *
                <input
                  value={fullName}
                  onChange={event => setFullName(event.target.value)}
                  required
                  placeholder="Ex.: João Silva"
                  className={`mt-2 ${inputClassName}`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Matrícula / RA institucional
                <input
                  value={enrollmentCode}
                  onChange={event => setEnrollmentCode(event.target.value)}
                  placeholder="Opcional"
                  className={`mt-2 ${inputClassName}`}
                />
                <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">Use o número da instituição quando existir. A EduData não substitui a matrícula oficial.</span>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Número de chamada
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={sequenceNumber}
                  onChange={event => setSequenceNumber(event.target.value)}
                  placeholder="Opcional"
                  className={`mt-2 ${inputClassName}`}
                />
              </label>

              {error ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{error}</p>
              ) : null}
              {success ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{success}</p>
              ) : null}

              <button
                type="submit"
                disabled={saving || !classId}
                className="min-h-12 w-full rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Cadastrar estudante'}
              </button>
            </div>
          </form>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Dados mestres</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">Estudantes cadastrados</h2>
                  <p className="mt-2 text-sm text-slate-500">{students.length} registro{students.length === 1 ? '' : 's'} na turma selecionada</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadStudents()}
                  disabled={loading || !classId}
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  {loading ? 'Atualizando…' : 'Atualizar'}
                </button>
              </div>

              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Pesquisar nome, matrícula ou chamada"
                disabled={!classId}
                className={`mt-4 ${inputClassName}`}
              />
            </header>

            {!classId ? (
              <div className="p-8 text-center text-sm text-slate-600">Selecione uma turma para consultar a lista nominal.</div>
            ) : loading ? (
              <div className="p-8 text-center text-sm font-semibold text-slate-500">Carregando estudantes…</div>
            ) : visibleStudents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-bold text-[#071827]">Nenhum estudante cadastrado</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Cadastre manualmente ou importe a lista nominal pelo modelo.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleStudents.map((student, index) => (
                  <article key={student.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[72px_minmax(0,1fr)_minmax(120px,0.4fr)] sm:items-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 font-mono text-sm font-black text-[#0B7491]">
                      {student.sequence_number ?? index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#071827]">{student.full_name}</p>
                      <p className="mt-1 text-xs text-slate-500">Matrícula institucional: {student.enrollment_code ?? 'não informada'}</p>
                    </div>
                    <span className="justify-self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 sm:justify-self-end">Ativo</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
          Este cadastro alimenta Diário de Classe, avaliações, evidências, ocorrências, casos pedagógicos, relatórios e inteligência. O usuário não precisa redigitar o estudante nos módulos operacionais.
        </aside>
      </div>
    </AgendaPageShell>
  )
}

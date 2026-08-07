import StudentOccurrencesPanel from '@/components/agenda/occurrences/StudentOccurrencesPanel'

export const metadata = {
  title:
    'Ocorrências | Agenda Inteligente EDI',
  description:
    'Registro e acompanhamento longitudinal de ocorrências educacionais dos estudantes.',
}

export default function AgendaOccurrencesPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071827]">
          Ocorrências dos Estudantes
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Registre, acompanhe e contextualize eventos pedagógicos, de convivência e reconhecimentos positivos sem rotulagem automática do estudante.
        </p>
      </header>

      <StudentOccurrencesPanel />
    </section>
  )
}

import DiagnosticResultsPanel from '@/components/agenda/assessment-center/DiagnosticResultsPanel'

export const metadata = {
  title: 'Resultados Diagnósticos | Agenda Inteligente EDI',
  description:
    'Registro de resultados diagnósticos, classificação da aprendizagem e sinalização de recuperação e recomposição.',
}

export default function DiagnosticResultsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <DiagnosticResultsPanel />
      </div>
    </main>
  )
}

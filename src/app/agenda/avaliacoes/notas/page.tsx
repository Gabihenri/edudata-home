import GradebookPanel from '@/components/agenda/assessment-center/GradebookPanel'

export const metadata = {
  title: 'Diário de Notas | Agenda Inteligente EDI',
  description:
    'Diário de notas, pesos, recuperação, recomposição e classificação da aprendizagem integrado ao EIOS.',
}

export default function AgendaGradebookPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <GradebookPanel />
      </div>
    </main>
  )
}

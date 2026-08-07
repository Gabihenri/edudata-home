import AssessmentCenterPanel from '@/components/agenda/assessment-center/AssessmentCenterPanel'

export const metadata = {
  title: 'Centro de Avaliações | Agenda Inteligente EDI',
  description:
    'Avaliações diagnósticas, diário de notas, classificação da aprendizagem, recuperação e recomposição integradas ao EIOS.',
}

export default function AgendaAssessmentsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <AssessmentCenterPanel />
      </div>
    </main>
  )
}

import { AgendaPlanning } from '@/components/agenda/AgendaPlanning'

export const metadata = {
  title: 'Planejamento da Agenda | EduData IA',
  description:
    'Planejamento pedagógico da Agenda Inteligente EDI para organizar objetivos, ações, metodologias, evidências e metas.',
}

export default function AgendaPlanejamentoPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaPlanning />
    </main>
  )
}
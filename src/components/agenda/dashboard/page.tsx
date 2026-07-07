import { AgendaDashboard } from '@/components/agenda/AgendaDashboard'

export const metadata = {
  title: 'Dashboard da Agenda | EduData IA',
  description:
    'Painel inicial da Agenda Inteligente EDI para acompanhamento da rotina pedagógica.',
}

export default function AgendaDashboardPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaDashboard />
    </main>
  )
}
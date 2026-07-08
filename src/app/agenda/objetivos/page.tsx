import { AgendaGoals } from '@/components/agenda/AgendaGoals'

export const metadata = {
  title: 'Objetivos | Agenda Inteligente EDI',
  description:
    'Gestão de objetivos e metas da Agenda Inteligente EDI.',
}

export default function AgendaGoalsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaGoals />
    </main>
  )
}
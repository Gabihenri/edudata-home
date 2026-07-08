import { AgendaCalendar } from '@/components/agenda/AgendaCalendar'

export const metadata = {
  title: 'Calendário | Agenda Inteligente EDI',
  description:
    'Calendário pedagógico da Agenda Inteligente EDI.',
}

export default function AgendaCalendarioPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaCalendar />
    </main>
  )
}
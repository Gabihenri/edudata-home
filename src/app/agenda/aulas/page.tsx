import { AgendaLessons } from '@/components/agenda/AgendaLessons'

export const metadata = {
  title: 'Aulas | Agenda Inteligente EDI',
  description:
    'Organização de aulas da Agenda Inteligente EDI.',
}

export default function AgendaLessonsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaLessons />
    </main>
  )
}
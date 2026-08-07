import { AgendaLessonsOperational } from '@/components/agenda/AgendaLessonsOperational'

export const metadata = {
  title: 'Aulas | Agenda Inteligente EDI',
  description:
    'Execução de aulas vinculadas às turmas e aos planejamentos da Agenda Inteligente EDI.',
}

export default function AgendaLessonsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaLessonsOperational />
    </main>
  )
}

import { AgendaTasks } from '@/components/agenda/AgendaTasks'

export const metadata = {
  title: 'Tarefas | Agenda Inteligente EDI',
  description:
    'Gerenciamento de tarefas e pendências da Agenda Inteligente EDI.',
}

export default function AgendaTasksPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaTasks />
    </main>
  )
}
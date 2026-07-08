import { AgendaClasses } from '@/components/agenda/AgendaClasses'

export const metadata = {
  title: 'Turmas | Agenda Inteligente EDI',
  description:
    'Gerenciamento de turmas da Agenda Inteligente EDI.',
}

export default function AgendaClassesPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaClasses />
    </main>
  )
}
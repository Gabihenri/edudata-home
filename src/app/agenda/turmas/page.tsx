import { AgendaClasses } from '@/components/agenda/AgendaClasses'
import { ClassesRosterOverview } from '@/components/agenda/ClassesRosterOverview'

export const metadata = {
  title: 'Turmas | Agenda Inteligente EDI',
  description:
    'Gerenciamento de turmas da Agenda Inteligente EDI.',
}

export default function AgendaClassesPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <ClassesRosterOverview />
      </div>
      <AgendaClasses />
    </main>
  )
}

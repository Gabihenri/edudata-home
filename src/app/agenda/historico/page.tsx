import { AgendaHistory } from '@/components/agenda/AgendaHistory'

export const metadata = {
  title: 'Histórico Pedagógico | Agenda Inteligente EDI',
  description:
    'Consulte eventos, planejamentos, evidências e tarefas registradas na Agenda Inteligente EDI.',
}

export default function AgendaHistoricoPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaHistory />
    </main>
  )
}
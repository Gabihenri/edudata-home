import { AgendaInteligente } from '@/components/agenda/AgendaInteligente'

export const metadata = {
  title: 'Agenda Inteligente EDI | EduData IA',
  description:
    'Plataforma estratégica para planejamento, evidências e inteligência educacional da EduData IA.',
}

export default function AgendaPage() {
  return (
    <main className="min-h-screen bg-white">
      <AgendaInteligente />
    </main>
  )
}
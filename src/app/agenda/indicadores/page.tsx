import { AgendaIndicators } from '@/components/agenda/AgendaIndicators'

export const metadata = {
  title: 'Indicadores | Agenda Inteligente EDI',
  description:
    'Indicadores da Agenda Inteligente EDI.',
}

export default function AgendaIndicatorsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaIndicators />
    </main>
  )
}
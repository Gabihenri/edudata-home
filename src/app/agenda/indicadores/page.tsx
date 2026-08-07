import {
  AgendaIndicators,
} from '@/components/agenda/AgendaIndicators'

import EducationalAnalyticsPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsPanel'

export const metadata = {
  title:
    'Indicadores | Agenda Inteligente EDI',
  description:
    'Indicadores operacionais e inteligência educacional da Agenda Inteligente EDI.',
}

export default function AgendaIndicatorsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaIndicators />

      <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <EducationalAnalyticsPanel />
      </div>
    </main>
  )
}

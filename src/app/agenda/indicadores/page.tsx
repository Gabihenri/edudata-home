import {
  AgendaIndicators,
} from '@/components/agenda/AgendaIndicators'

import EducationalAnalyticsPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsPanel'
import EducationalAnalyticsHistoryPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsHistoryPanel'

export const metadata = {
  title:
    'Indicadores | Agenda Inteligente EDI',
  description:
    'Indicadores operacionais, inteligência educacional e histórico longitudinal da Agenda Inteligente EDI.',
}

export default function AgendaIndicatorsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaIndicators />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
        <EducationalAnalyticsPanel />
        <EducationalAnalyticsHistoryPanel />
      </div>
    </main>
  )
}

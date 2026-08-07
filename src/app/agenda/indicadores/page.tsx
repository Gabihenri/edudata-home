import {
  AgendaIndicators,
} from '@/components/agenda/AgendaIndicators'

import EducationalAnalyticsPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsPanel'
import EducationalAnalyticsHistoryPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsHistoryPanel'
import EducationalAnalyticsComparisonPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsComparisonPanel'
import EducationalAnalyticsEvolutionPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsEvolutionPanel'
import EducationalAnalyticsLongitudinalPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsLongitudinalPanel'

export const metadata = {
  title:
    'Indicadores | Agenda Inteligente EDI',
  description:
    'Indicadores operacionais, inteligência educacional, histórico longitudinal, comparação de versões, evolução temporal e inteligência longitudinal da Agenda Inteligente EDI.',
}

export default function AgendaIndicatorsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaIndicators />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
        <EducationalAnalyticsPanel />
        <EducationalAnalyticsHistoryPanel />
        <EducationalAnalyticsComparisonPanel />
        <EducationalAnalyticsEvolutionPanel />
        <EducationalAnalyticsLongitudinalPanel />
      </div>
    </main>
  )
}

import { AgendaEvidence } from '@/components/agenda/AgendaEvidence'

export const metadata = {
  title: 'Evidências da Agenda | EduData IA',
  description:
    'Registro de evidências pedagógicas da Agenda Inteligente EDI para documentar práticas, ações, resultados e decisões.',
}

export default function AgendaEvidenciasPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaEvidence />
    </main>
  )
}
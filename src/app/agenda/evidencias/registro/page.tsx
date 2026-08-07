import { AgendaEvidence } from '@/components/agenda/AgendaEvidence'

export const metadata = {
  title: 'Registrar Evidência | Agenda Inteligente EDI',
  description: 'Registro protegido e contextualizado de evidências pedagógicas.',
}

export default function AgendaEvidenceRegistrationPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <AgendaEvidence />
    </main>
  )
}

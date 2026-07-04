import ProfileCard from './ProfileCard'
import Recommendations from './Recommendations'
import DevelopmentPlan from './DevelopmentPlan'
import EvidenceTimeline from './EvidenceTimeline'
import Statistics from './Statistics'
import { runEiosPipeline } from '@/services/eiosService'

async function getProfessorDigitalData() {
  try {
    const result = await runEiosPipeline({
      module: 'professor-digital',
      role: 'teacher',
      agenda_events: [],
      evidences: [],
      trainings: [],
      users: [],
      actions: [],
      analytics: {},
      interactions: [],
      accepted_recommendations: 0,
    })

    return result
  } catch {
    return null
  }
}

export default async function Dashboard() {
  const eiosData = await getProfessorDigitalData()

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-[#081C2E] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Professor Digital
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-tight">
            Desenvolvimento profissional orientado por evidências
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Perfil docente, recomendações inteligentes, plano de desenvolvimento
            e evidências conectadas ao EIOS da EduData IA.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-200">
            {eiosData ? 'EIOS conectado' : 'EIOS aguardando conexão'}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <ProfileCard eiosData={eiosData} />
        <Statistics eiosData={eiosData} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 lg:grid-cols-2">
        <Recommendations eiosData={eiosData} />
        <DevelopmentPlan />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <EvidenceTimeline />
      </section>
    </main>
  )
}
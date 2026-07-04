import ProfileCard from './ProfileCard'
import Recommendations from './Recommendations'
import DevelopmentPlan from './DevelopmentPlan'
import EvidenceTimeline from './EvidenceTimeline'
import Statistics from './Statistics'

export default function Dashboard() {
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
            Acompanhe seu perfil docente, recomendações inteligentes, plano de
            desenvolvimento e evidências conectadas ao EIOS da EduData IA.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <ProfileCard />
        <Statistics />
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 lg:grid-cols-2">
        <Recommendations />
        <DevelopmentPlan />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <EvidenceTimeline />
      </section>
    </main>
  )
}
import Link from 'next/link'

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

  const navigation = [
    { label: 'Copiloto', href: '/professor-digital/copiloto' },
    { label: 'Perfil docente', href: '/professor-digital/perfil' },
    { label: 'Plano', href: '/professor-digital/plano' },
    { label: 'Evidências', href: '/professor-digital/evidencias' },
    { label: 'Recomendações', href: '/professor-digital/recomendacoes' },
    { label: 'Agenda', href: '/professor-digital/agenda' },
  ]

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-[#081C2E] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Professor Digital
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-tight">
            Copiloto pedagógico orientado por evidências
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            O Professor Digital interpreta o contexto registrado na Agenda Inteligente EDI para apoiar planejamento, análise, acompanhamento e desenvolvimento profissional. A Agenda opera; o Copiloto recomenda.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#081C2E] transition hover:bg-cyan-100"
              >
                {item.label}
              </Link>
            ))}
          </div>

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

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/agenda/avaliacoes"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300"
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-700">Avaliar</p>
            <h2 className="mt-2 font-bold text-slate-950">Centro de Avaliações</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Diagnóstico e resultados que alimentam o contexto do Copiloto.</p>
          </Link>

          <Link
            href="/agenda/avaliacoes/classificacao"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300"
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-700">Interpretar</p>
            <h2 className="mt-2 font-bold text-slate-950">Classificação da Aprendizagem</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Nível e tendência com regras transparentes e revisão docente.</p>
          </Link>

          <Link
            href="/agenda/caderno"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300"
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-700">Compreender</p>
            <h2 className="mt-2 font-bold text-slate-950">Caderno Pedagógico</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Timeline longitudinal para contextualizar decisões sobre o estudante.</p>
          </Link>

          <Link
            href="/agenda/casos"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300"
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-700">Acompanhar</p>
            <h2 className="mt-2 font-bold text-slate-950">Casos Pedagógicos</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Transforme necessidades identificadas em acompanhamento estruturado.</p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <EvidenceTimeline />
      </section>
    </main>
  )
}

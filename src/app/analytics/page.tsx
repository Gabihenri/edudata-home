import type { Metadata } from 'next'
import Link from 'next/link'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'EduData Analytics | EduData IA',
  description:
    'Inteligência analítica, indicadores estratégicos e apoio à decisão para professores, gestores, escolas e redes de ensino.',
}

const capabilities = [
  {
    code: '01',
    title: 'Análise educacional',
    description:
      'Correlações, padrões, anomalias, influência, previsões e recomendações explicáveis produzidas pelo EIOS.',
  },
  {
    code: '02',
    title: 'Inteligência longitudinal',
    description:
      'Acompanhe versões, tendências persistentes, estabilidade, volatilidade e mudanças relevantes ao longo do tempo.',
  },
  {
    code: '03',
    title: 'Gestão e decisão',
    description:
      'Transforme sinais analíticos em informação estruturada para planejamento pedagógico, gestão escolar e acompanhamento institucional.',
  },
  {
    code: '04',
    title: 'Relatórios institucionais',
    description:
      'Gere visões para professor, coordenação, direção, supervisão, secretaria, pesquisa e equipes técnicas.',
  },
  {
    code: '05',
    title: 'Histórico e auditoria',
    description:
      'Consulte execuções persistidas, compare versões e acompanhe revisão humana, aprovação e rastreabilidade.',
  },
  {
    code: '06',
    title: 'Exportação de dados',
    description:
      'Exporte relatórios institucionais em JSON ou HTML imprimível com metadados, hash e governança.',
  },
]

const audiences = [
  'Professor',
  'Coordenação pedagógica',
  'Direção escolar',
  'Supervisão',
  'Secretarias e redes',
  'Pesquisa e equipes técnicas',
]

export default function AnalyticsPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main className="min-h-screen bg-[#F5F6F8] text-[#071827]">
        <section className="relative overflow-hidden bg-[#071827] text-white">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-10 h-72 w-72 rounded-full border border-cyan-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute right-16 top-40 h-40 w-40 rounded-full border border-cyan-300/10"
          />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)] lg:items-end lg:px-8 lg:py-20">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                  EIOS ativo
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Business Intelligence educacional
                </span>
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                EduData Analytics
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
                Dados educacionais transformados em inteligência para gestão e decisão.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Consolide evidências, acompanhe tendências, compare versões e gere relatórios explicáveis para apoiar decisões pedagógicas e institucionais.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/analytics/dashboard"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 font-bold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  Abrir Analytics
                </Link>

                <Link
                  href="/agenda/indicadores"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  Ver indicadores da Agenda
                </Link>
              </div>
            </div>

            <aside className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04]">
              <header className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Para quem decide
                </p>
              </header>

              <div className="divide-y divide-white/10">
                {audiences.map((audience, index) => (
                  <div
                    key={audience}
                    className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 px-5 py-3.5"
                  >
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm font-semibold text-slate-200">
                      {audience}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Plataforma de inteligência
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Uma camada analítica compartilhada pelo ecossistema EduData IA.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              O EduData Analytics reutiliza o mesmo núcleo EIOS que organiza evidências, histórico, governança e recomendações nos demais produtos. A análise apoia o julgamento profissional e não substitui decisões humanas.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map(capability => (
              <article
                key={capability.code}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="font-mono text-xs font-bold text-[#0B7491]">
                  {capability.code}
                </span>
                <h3 className="mt-3 text-xl font-bold">
                  {capability.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {capability.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Framework EDI → EIOS → Analytics
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Evidência, explicabilidade, governança e autonomia profissional por padrão.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Correlação não é tratada como causalidade, previsões não são decisões e toda recomendação relevante permanece sujeita à revisão humana.
              </p>
            </div>

            <Link
              href="/analytics/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-6 py-3 font-bold text-white transition hover:bg-[#102B3D] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
            >
              Entrar no ambiente analítico
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

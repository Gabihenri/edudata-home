import Link from 'next/link'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

export const metadata = {
  title:
    'SGPA | EduData IA',
  description:
    'Governança pedagógica, auditoria, conformidade e monitoramento institucional integrados ao EIOS.',
}

const pillars = [
  {
    title: 'Governança',
    description:
      'Fluxos de revisão, aprovação, publicação e arquivamento com rastreabilidade.',
  },
  {
    title: 'Auditoria',
    description:
      'Histórico imutável de ações, atores, recursos, engines e versões utilizadas.',
  },
  {
    title: 'Decisão humana',
    description:
      'Registro de decisões profissionais, justificativas, evidências e resultados observados.',
  },
]

export default function SgpaPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main className="min-h-screen bg-[#F5F6F8]">
        <section className="bg-[#071827] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Produto especializado EIOS
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              SGPA
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Governança pedagógica, auditoria, conformidade e monitoramento institucional em uma única camada operacional.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sgpa/dashboard"
                className="rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E]"
              >
                Abrir SGPA
              </Link>

              <Link
                href="/analytics"
                className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                EduData Analytics
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-3">
              {pillars.map(
                pillar => (
                  <article
                    key={pillar.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <h2 className="text-xl font-bold text-[#071827]">
                      {pillar.title}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {pillar.description}
                    </p>
                  </article>
                ),
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
              <p className="text-sm font-semibold leading-6 text-cyan-950">
                O SGPA consome o Governance Core compartilhado do EIOS. As regras de auditoria, workflow e decisão humana não são duplicadas no produto.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

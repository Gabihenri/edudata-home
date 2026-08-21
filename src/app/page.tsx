import type { Metadata } from 'next'
import Link from 'next/link'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import EcosystemProducts from '@/components/home/EcosystemProducts'

export const metadata: Metadata = {
  title: 'EduData IA | Inteligência Educacional',
  description:
    'Plataforma operacional de inteligência educacional para professores, escolas e redes de ensino.',
  openGraph: {
    title: 'EduData IA | Inteligência Educacional',
    description:
      'Formação, organização pedagógica, evidências e inteligência para apoiar o trabalho educacional.',
  },
}

const ediPillars = [
  {
    title: 'Evidências',
    description:
      'Registros contextualizados e confiáveis sustentam o acompanhamento e a análise.',
  },
  {
    title: 'Inclusão',
    description:
      'Clareza, acessibilidade e respeito às pessoas orientam a experiência.',
  },
  {
    title: 'Inteligência',
    description:
      'Dados organizados apoiam decisões sem substituir o julgamento profissional.',
  },
]

const PROFESSOR_PRO_UPGRADE_HREF =
  '/upgrade?requestedPlan=edi_professor_pro&product=agenda_edi&source=%2F&returnTo=%2F'

const heroSecondaryButtonClassName =
  'inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3.5 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-cyan-300 sm:w-auto'

export default function Page() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[#071827] text-white">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-10 h-72 w-72 rounded-full border border-cyan-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute right-16 top-40 h-40 w-40 rounded-full border border-cyan-300/10"
          />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                  Plataforma operacional
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Inteligência educacional
                </span>
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300 sm:text-sm">
                EduData IA
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
                Menos tarefas dispersas. Mais clareza para planejar, registrar e decidir.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Um ecossistema educacional que conecta formação profissional,
                organização da rotina, evidências pedagógicas e inteligência
                para professores, equipes, escolas e redes de ensino.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <Link
                  href="/agenda"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B7491] px-7 py-3.5 text-base font-bold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300 sm:w-auto"
                >
                  Conhecer a Agenda EDI
                </Link>
                <Link
                  href="/professor-digital"
                  className={heroSecondaryButtonClassName}
                >
                  Professor Digital
                </Link>
                <Link
                  href="/solucoes-escolas"
                  className={heroSecondaryButtonClassName}
                >
                  Soluções para escolas
                </Link>
              </div>

              <div className="mt-7 text-sm font-semibold text-slate-400">
                Framework EDI: Evidências · Inclusão · Inteligência
              </div>
            </div>

            <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04]">
              <header className="border-b border-white/10 px-5 py-5 sm:px-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Comece pela Agenda
                  </p>
                  <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
                    Piloto
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-bold text-white">
                  Agenda Inteligente EDI
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Organize a rotina docente, registre ações e transforme o
                  trabalho pedagógico em dados acompanháveis.
                </p>
              </header>

              <div className="px-5 py-5 sm:px-7">
                <p className="text-3xl font-bold text-white">R$ 15,00</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  piloto por 30 dias · pagamento único
                </p>
                <Link
                  href={PROFESSOR_PRO_UPGRADE_HREF}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  Ativar acesso ao piloto
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section
          aria-labelledby="framework-edi-title"
          className="border-b border-slate-200 bg-white"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                Framework EDI
              </p>
              <h2
                id="framework-edi-title"
                className="mt-3 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl"
              >
                Uma base metodológica para transformar trabalho educacional em evidências e decisões melhores.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {ediPillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className="rounded-2xl border border-slate-200 bg-[#F8FAFB] p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                    {pillar.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {pillar.description}
                  </p>
                </article>
              ))}
            </div>

            <Link
              href="/arquitetura"
              className="mt-7 inline-flex font-semibold text-[#075F78] hover:text-[#0B7491] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
            >
              Conhecer a arquitetura da plataforma →
            </Link>
          </div>
        </section>

        <EcosystemProducts />

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8 lg:py-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                Escolas e redes de ensino
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
                Soluções para organizar processos, desenvolver equipes e usar evidências na gestão.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                A atuação pode começar por uma necessidade específica ou por
                um diagnóstico institucional mais amplo, respeitando o
                contexto e as prioridades de cada organização.
              </p>
            </div>
            <Link
              href="/solucoes-escolas"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-6 py-3 font-bold text-white transition hover:bg-[#102B3D] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
            >
              Conhecer soluções
            </Link>
          </div>
        </section>

        <section className="bg-[#EEF3F7]">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
            <Link
              href="/consultorias"
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Projetos especiais
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                Consultorias e soluções sob medida
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Conheça o portfólio completo de consultorias institucionais.
              </p>
              <span className="mt-5 inline-block text-sm font-bold text-[#075F78]">
                Conhecer consultorias →
              </span>
            </Link>

            <Link
              href="/contato"
              className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 transition hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#075F78]">
                Fale com a EduData IA
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                Vamos conversar sobre sua realidade educacional?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Envie seus dados pelo formulário ou escolha um canal direto de contato.
              </p>
              <span className="mt-5 inline-block text-sm font-bold text-[#075F78]">
                Entrar em contato →
              </span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

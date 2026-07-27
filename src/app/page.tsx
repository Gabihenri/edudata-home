import Link from 'next/link'

import {
  FrameworkEDI,
} from '@/components/framework/FrameworkEDI'
import {
  ProfessorDigital,
} from '@/components/professor/ProfessorDigital'
import {
  AgendaInteligente,
} from '@/components/agenda/AgendaInteligente'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

import EcosystemProducts from '@/components/home/EcosystemProducts'
import EduDataAcademy from '@/components/home/EduDataAcademy'
import SobreEduData from '@/components/home/SobreEduData'
import ManifestoEDI from '@/components/home/ManifestoEDI'
import Participacao from '@/components/home/Participacao'
import SolucoesEscolas from '@/components/home/SolucoesEscolas'
import Consultorias from '@/components/home/Consultorias'

type ArchitectureLayer = {
  code: string
  title: string
  description: string
}

type EdiPillar = {
  title: string
  description: string
}

const PROFESSOR_PRO_UPGRADE_HREF =
  '/upgrade?requestedPlan=edi_professor_pro&product=agenda_edi&source=%2F&returnTo=%2F'

const architectureLayers:
  ArchitectureLayer[] = [
    {
      code: '01',
      title: 'Framework EDI',
      description:
        'Define os princípios científicos, metodológicos e pedagógicos da plataforma.',
    },
    {
      code: '02',
      title: 'EIOS',
      description:
        'Conecta identidade, dados, segurança, conhecimento e inteligência.',
    },
    {
      code: '03',
      title: 'Core compartilhado',
      description:
        'Mantém serviços essenciais integrados em toda a plataforma.',
    },
    {
      code: '04',
      title: 'Produtos especializados',
      description:
        'Entrega experiências específicas para professores, gestores e instituições.',
    },
  ]

const ediPillars:
  EdiPillar[] = [
    {
      title: 'Evidências',
      description:
        'Registros contextualizados e confiáveis sustentam o acompanhamento.',
    },
    {
      title: 'Inclusão',
      description:
        'Clareza, acessibilidade e respeito às pessoas orientam a experiência.',
    },
    {
      title: 'Inteligência',
      description:
        'Dados organizados apoiam decisões sem substituir o contexto educacional.',
    },
  ]

const pilotBenefits = [
  'Organização de horários e compromissos',
  'Planejamento e registros pedagógicos',
  'Acesso antecipado às melhorias do produto',
]

export default function Page() {
  return (
    <>
      <AccessibilityBar />

      <Header />

      <main>
        <section className="relative overflow-hidden bg-[#071827] text-white">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-12 h-72 w-72 rounded-full border border-cyan-300/10"
          />

          <div
            aria-hidden="true"
            className="absolute -right-4 top-36 h-40 w-40 rounded-full border border-cyan-300/10"
          />

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
          />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
            <div className="min-w-0">
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

              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Menos tarefas dispersas. Mais clareza para planejar, registrar e decidir.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                A EduData IA conecta formação profissional, organização da
                rotina, evidências pedagógicas e apoio à gestão em um único
                ecossistema educacional.
              </p>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
                Desenvolvida para professores, equipes pedagógicas, gestores,
                escolas e redes de ensino que precisam transformar trabalho
                educacional em ações acompanháveis e decisões mais claras.
              </p>

              <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
                <Link
                  href="/agenda"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  Conhecer a Agenda EDI
                </Link>

                <Link
                  href="/professor-digital"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-center font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  Professor Digital
                </Link>

                <Link
                  href="#escolas"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-transparent px-7 py-4 text-center font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  Soluções para escolas
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm font-semibold text-slate-300">
                <span>
                  Framework EDI
                </span>

                <span>
                  Evidências
                </span>

                <span>
                  Inclusão
                </span>

                <span>
                  Inteligência
                </span>
              </div>
            </div>

            <aside
              aria-labelledby="agenda-pilot-title"
              className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/10"
            >
              <header className="border-b border-white/10 px-5 py-5 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Comece pela Agenda
                  </p>

                  <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
                    Piloto
                  </span>
                </div>

                <h2
                  id="agenda-pilot-title"
                  className="mt-3 text-2xl font-bold leading-tight text-white"
                >
                  Agenda Inteligente EDI
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Acesso antecipado ao ambiente operacional desenvolvido para
                  organizar a rotina docente e os registros pedagógicos.
                </p>
              </header>

              <div className="divide-y divide-white/10">
                {pilotBenefits.map(
                  (
                    benefit,
                    index,
                  ) => (
                    <div
                      key={benefit}
                      className="grid grid-cols-[38px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7"
                    >
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      <p className="text-sm font-semibold leading-6 text-slate-200">
                        {benefit}
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div className="border-t border-white/10 bg-[#061521] px-5 py-5 sm:px-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Piloto por 30 dias
                    </p>

                    <p className="mt-2 text-4xl font-bold tracking-tight text-white">
                      R$ 15,00
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      pagamento único
                    </p>
                  </div>

                  <Link
                    href={PROFESSOR_PRO_UPGRADE_HREF}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    Ativar acesso ao piloto
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs font-semibold text-slate-400">
                  <span>
                    Ativação manual
                  </span>

                  <span>
                    Sem renovação automática
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          aria-label="Pilares do Framework EDI"
          className="border-b border-slate-200 bg-white"
        >
          <div className="mx-auto grid max-w-7xl sm:grid-cols-3">
            {ediPillars.map(
              (
                pillar,
                index,
              ) => (
                <article
                  key={pillar.title}
                  className={`px-5 py-6 sm:px-7 ${
                    index < 2
                      ? 'border-b border-slate-200 sm:border-b-0 sm:border-r'
                      : ''
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                    {pillar.title}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {pillar.description}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        <ManifestoEDI />

        <FrameworkEDI />

        <section
          id="como-funciona"
          className="scroll-mt-24 bg-[#EEF3F7] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-14">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                  Como funciona por trás
                </p>

                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#071827] sm:text-4xl lg:text-5xl">
                  Uma base compartilhada, sem complicar a experiência.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  O usuário acessa produtos simples e especializados. Por trás
                  deles, uma arquitetura comum conecta metodologia, identidade,
                  dados, segurança e inteligência.
                </p>

                <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#071827] text-white">
                  <div className="border-b border-white/10 px-5 py-5 sm:px-7">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Arquitetura oficial
                    </p>
                  </div>

                  <div className="divide-y divide-white/10">
                    <div className="px-5 py-4 font-semibold sm:px-7">
                      Framework EDI
                    </div>

                    <div className="px-5 py-4 font-semibold sm:px-7">
                      EIOS
                    </div>

                    <div className="px-5 py-4 font-semibold sm:px-7">
                      Core compartilhado
                    </div>

                    <div className="bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100 sm:px-7">
                      Produtos especializados
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Estrutura da plataforma
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-[#071827]">
                    Cada camada possui uma responsabilidade clara.
                  </h3>
                </header>

                <div className="divide-y divide-slate-200">
                  {architectureLayers.map(
                    (layer) => (
                      <article
                        key={layer.code}
                        className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7"
                      >
                        <span className="font-mono text-xs font-bold text-[#0B7491]">
                          {layer.code}
                        </span>

                        <div>
                          <h4 className="text-lg font-bold text-[#071827]">
                            {layer.title}
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {layer.description}
                          </p>
                        </div>
                      </article>
                    ),
                  )}
                </div>

                <footer className="border-t border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-7">
                  <p className="text-sm font-semibold leading-6 text-cyan-950">
                    Um único ecossistema, múltiplas experiências especializadas.
                  </p>
                </footer>
              </div>
            </div>
          </div>
        </section>

        <ProfessorDigital />

        <AgendaInteligente />

        <EcosystemProducts />

        <SolucoesEscolas />

        <EduDataAcademy />

        <Consultorias />

        <SobreEduData />

        <Participacao />
      </main>

      <Footer />
    </>
  )
}
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

import EngineSection from '@/components/home/EngineSection'
import PlatformArchitecture from '@/components/home/PlatformArchitecture'
import EcosystemProducts from '@/components/home/EcosystemProducts'
import ClientsSection from '@/components/home/ClientsSection'
import EcossistemaFlow from '@/components/home/EcossistemaFlow'
import EduDataAnalytics from '@/components/home/EduDataAnalytics'
import SGPA from '@/components/home/SGPA'
import EduDataAcademy from '@/components/home/EduDataAcademy'
import SobreEduData from '@/components/home/SobreEduData'
import ManifestoEDI from '@/components/home/ManifestoEDI'
import Participacao from '@/components/home/Participacao'
import ComeceHoje from '@/components/home/ComeceHoje'
import SolucoesEscolas from '@/components/home/SolucoesEscolas'
import AreasAtuacao from '@/components/home/AreasAtuacao'
import Consultorias from '@/components/home/Consultorias'
import EduDataInsights from '@/components/home/EduDataInsights'

type HeroAction = {
  code: string
  title: string
  description: string
  href: string
  primary?: boolean
}

const PROFESSOR_PRO_UPGRADE_HREF =
  '/upgrade?requestedPlan=edi_professor_pro&product=agenda_edi&source=%2F&returnTo=%2F'

const heroActions:
  HeroAction[] = [
    {
      code: '01',
      title: 'Conhecer o Framework EDI',
      description:
        'Consulte a base científica, metodológica e pedagógica da plataforma.',
      href: '#framework',
      primary: true,
    },
    {
      code: '02',
      title: 'Explorar o ecossistema',
      description:
        'Conheça os produtos especializados conectados pelo EIOS.',
      href: '#ecossistema',
    },
    {
      code: '03',
      title: 'EduData Academy',
      description:
        'Acesse cursos e trilhas de desenvolvimento profissional.',
      href: '/academy',
    },
  ]

const architectureLayers = [
  {
    code: '01',
    title: 'Framework EDI',
    description:
      'Base científica, metodológica e pedagógica.',
  },
  {
    code: '02',
    title: 'EIOS',
    description:
      'Sistema operacional de inteligência educacional.',
  },
  {
    code: '03',
    title: 'Core compartilhado',
    description:
      'Identidade, dados, segurança e inteligência.',
  },
  {
    code: '04',
    title: 'Produtos especializados',
    description:
      'Soluções conectadas para pessoas e instituições.',
  },
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
            className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-cyan-300/10"
          />

          <div
            aria-hidden="true"
            className="absolute right-8 top-36 h-48 w-48 rounded-full border border-cyan-300/10"
          />

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
          />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-24">
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
                Um único ecossistema, um único motor de inteligência, múltiplos produtos especializados.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                A EduData IA integra formação, desenvolvimento
                profissional, gestão pedagógica, evidências, dados,
                analytics e governança educacional em uma única
                plataforma.
              </p>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
                O Framework EDI orienta a plataforma. O EIOS conecta
                identidade, dados, segurança, inteligência e produtos
                especializados.
              </p>

              <section
                aria-labelledby="professor-pro-offer-title"
                className="mt-9 overflow-hidden rounded-2xl border border-cyan-300/30 bg-white/[0.06] shadow-xl shadow-black/10"
              >
                <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_190px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                        Oferta de lançamento
                      </span>

                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Usuário individual
                      </span>
                    </div>

                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                      Professor Pro
                    </p>

                    <h2
                      id="professor-pro-offer-title"
                      className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl"
                    >
                      Agenda Inteligente EDI para organizar sua rotina docente.
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                      Planeje compromissos, organize horários, registre ações
                      pedagógicas e utilize os recursos avançados disponíveis
                      no ecossistema Professor Digital.
                    </p>
                  </div>

                  <div className="rounded-xl border border-cyan-300/20 bg-[#061521] p-5 md:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Acesso por 30 dias
                    </p>

                    <p className="mt-2 text-4xl font-bold tracking-tight text-white">
                      R$ 15,00
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      pagamento único
                    </p>

                    <Link
                      href={PROFESSOR_PRO_UPGRADE_HREF}
                      className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    >
                      Conhecer e ativar
                    </Link>
                  </div>
                </div>

                <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 bg-black/10 px-5 py-4 text-xs font-semibold text-slate-300 sm:px-6">
                  <span>
                    Pagamento pelo Mercado Pago
                  </span>

                  <span>
                    Ativação manual
                  </span>

                  <span>
                    Sem renovação automática
                  </span>
                </footer>
              </section>

              <section
                aria-label="Acessos principais da EduData IA"
                className="mt-5 grid gap-3 md:grid-cols-3"
              >
                {heroActions.map(
                  (action) => (
                    <Link
                      key={action.code}
                      href={action.href}
                      className={`group flex min-h-40 flex-col justify-between rounded-xl border p-5 transition ${
                        action.primary
                          ? 'border-cyan-300/30 bg-[#0B7491] text-white hover:bg-[#09657E]'
                          : 'border-white/15 bg-white/[0.04] text-white hover:border-cyan-300/30 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span
                          className={`font-mono text-xs font-bold ${
                            action.primary
                              ? 'text-cyan-100'
                              : 'text-cyan-300'
                          }`}
                        >
                          {action.code}
                        </span>

                        <span
                          aria-hidden="true"
                          className="text-cyan-300 transition group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </div>

                      <div className="mt-6">
                        <h2 className="font-bold leading-6">
                          {action.title}
                        </h2>

                        <p
                          className={`mt-2 text-sm leading-6 ${
                            action.primary
                              ? 'text-cyan-50'
                              : 'text-slate-300'
                          }`}
                        >
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  ),
                )}
              </section>
            </div>

            <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/10">
              <header className="border-b border-white/10 px-5 py-5 sm:px-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Arquitetura oficial
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  Uma plataforma, uma base compartilhada.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Todos os produtos compartilham os mesmos princípios,
                  serviços e estruturas essenciais.
                </p>
              </header>

              <div className="divide-y divide-white/10">
                {architectureLayers.map(
                  (layer) => (
                    <article
                      key={layer.code}
                      className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7"
                    >
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {layer.code}
                      </span>

                      <div>
                        <h3 className="font-bold text-white">
                          {layer.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {layer.description}
                        </p>
                      </div>
                    </article>
                  ),
                )}
              </div>

              <footer className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-5 sm:px-7">
                <p className="text-sm font-semibold leading-6 text-cyan-100">
                  Framework EDI → EIOS → Core compartilhado → Produtos
                </p>
              </footer>
            </aside>
          </div>
        </section>

        <ManifestoEDI />

        <FrameworkEDI />

        <EngineSection />

        <PlatformArchitecture />

        <EcosystemProducts />

        <ClientsSection />

        <EcossistemaFlow />

        <ProfessorDigital />

        <AgendaInteligente />

        <ComeceHoje />

        <EduDataAnalytics />

        <SGPA />

        <EduDataAcademy />

        <Consultorias />

        <AreasAtuacao />

        <EduDataInsights />

        <SolucoesEscolas />

        <SobreEduData />

        <Participacao />
      </main>

      <Footer />
    </>
  )
}
import type { Metadata } from 'next'
import Link from 'next/link'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { ProfessorDigitalHero } from '@/components/products/ProfessorDigitalHero'

export const metadata: Metadata = {
  title: 'Professor Digital | EduData IA',

  description:
    'Ambiente de inteligência educacional integrado ao EIOS para apoiar o planejamento, a organização, o registro e a análise do trabalho docente.',
}

type ResourceItem = {
  code: string
  title: string
  description: string
}

type AccessPath = {
  code: string
  audience: string
  title: string
  description: string
  action: string
  href: string
  external?: boolean
}

const resources: ResourceItem[] = [
  {
    code: '01',
    title: 'Planejamento docente',
    description:
      'Estruture aulas, sequências didáticas, objetivos de aprendizagem e ações pedagógicas.',
  },
  {
    code: '02',
    title: 'Organização pedagógica',
    description:
      'Centralize turmas, tarefas, compromissos, registros e documentos do professor.',
  },
  {
    code: '03',
    title: 'Acompanhamento',
    description:
      'Registre evidências e acompanhe o desenvolvimento dos estudantes ao longo do processo.',
  },
  {
    code: '04',
    title: 'Inteligência aplicada',
    description:
      'Utilize dados e recomendações para apoiar decisões pedagógicas com mais segurança.',
  },
]

const operationalFlow: ResourceItem[] = [
  {
    code: '01',
    title: 'Planejar',
    description:
      'Organize objetivos, aulas, recursos, estratégias e ações pedagógicas.',
  },
  {
    code: '02',
    title: 'Executar',
    description:
      'Desenvolva o trabalho pedagógico no contexto real da sala de aula.',
  },
  {
    code: '03',
    title: 'Registrar',
    description:
      'Preserve informações, produções, evidências e acontecimentos relevantes.',
  },
  {
    code: '04',
    title: 'Analisar',
    description:
      'Transforme registros em apoio ao acompanhamento e à tomada de decisão.',
  },
]

const accessPaths: AccessPath[] = [
  {
    code: '01',
    audience: 'Usuário existente',
    title: 'Entrar no ambiente',
    description:
      'Acesse sua conta e continue utilizando os recursos já liberados para o seu perfil.',
    action: 'Entrar no Professor Digital',
    href: '/login?redirectTo=/professor-digital/agenda',
  },
  {
    code: '02',
    audience: 'Professor individual',
    title: 'Registrar interesse',
    description:
      'Conheça as possibilidades de uso individual e receba informações sobre acesso, recursos e lançamento.',
    action: 'Quero conhecer o produto',
    href: 'mailto:sabinohc@gmail.com?subject=Interesse%20no%20Professor%20Digital%20-%20Professor%20individual&body=Ol%C3%A1%2C%20gostaria%20de%20receber%20informa%C3%A7%C3%B5es%20sobre%20o%20Professor%20Digital%20para%20uso%20individual.',
    external: true,
  },
  {
    code: '03',
    audience: 'Escola ou instituição',
    title: 'Solicitar apresentação',
    description:
      'Converse com a EduData IA sobre implantação institucional, perfis de acesso, governança e licenciamento.',
    action: 'Falar sobre implantação',
    href: 'mailto:sabinohc@gmail.com?subject=Professor%20Digital%20-%20Apresenta%C3%A7%C3%A3o%20institucional&body=Ol%C3%A1%2C%20gostaria%20de%20conhecer%20a%20proposta%20institucional%20do%20Professor%20Digital.',
    external: true,
  },
]

export default function ProfessorDigitalPage() {
  return (
    <>
      <AccessibilityBar />

      <Header />

      <main className="min-h-screen bg-[#EEF3F7]">
        <ProfessorDigitalHero />

        <section
          id="recursos-professor-digital"
          className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <header className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                Recursos operacionais
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
                Tecnologia para fortalecer o trabalho docente.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                O Professor Digital integra planejamento, organização,
                acompanhamento e inteligência educacional para reduzir
                tarefas operacionais e ampliar o tempo dedicado à
                aprendizagem.
              </p>
            </header>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {resources.map((resource) => (
                <article
                  key={resource.code}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {resource.code}
                    </span>
                  </header>

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-[#071827]">
                      {resource.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {resource.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                Fluxo operacional oficial
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
                Da prática docente à inteligência educacional.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                O Professor Digital funciona como ambiente principal de
                apoio ao professor, preservando sua autonomia e
                transformando atividades cotidianas em informações
                organizadas.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-[#071827] p-5 text-white sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                  Agenda Inteligente EDI
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Dentro dessa experiência, a Agenda Inteligente EDI
                  organiza a camada operacional de compromissos,
                  planejamentos, tarefas, registros e evidências do
                  trabalho docente.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                  Integração EIOS
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Identidade, acesso, segurança, dados e inteligência
                  são compartilhados com os demais produtos da
                  plataforma por meio do EIOS.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              {operationalFlow.map((step, index) => (
                <article
                  key={step.code}
                  className={`grid grid-cols-[44px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7 ${
                    index < operationalFlow.length - 1
                      ? 'border-b border-slate-200'
                      : ''
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    {step.code}
                  </span>

                  <div>
                    <h3 className="text-lg font-bold text-[#071827]">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="acesso-professor-digital"
          className="bg-[#EEF3F7] px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <header className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                Acesso e apresentação
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
                Escolha o caminho adequado para você.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                O Professor Digital atende usuários individuais e
                instituições por modelos de acesso distintos, respeitando
                perfis, permissões e regras de governança.
              </p>
            </header>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {accessPaths.map((path) => (
                <article
                  key={path.code}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <header className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-xs font-bold text-[#0B7491]">
                        {path.code}
                      </span>

                      <span className="rounded-lg border border-[#0B7491]/20 bg-[#0B7491]/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">
                        {path.audience}
                      </span>
                    </div>
                  </header>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-2xl font-bold text-[#071827]">
                      {path.title}
                    </h3>

                    <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">
                      {path.description}
                    </p>

                    {path.external ? (
                      <a
                        href={path.href}
                        className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl border border-[#0B7491] px-5 py-3 text-center font-semibold text-[#0B7491] transition hover:bg-[#0B7491] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-offset-2"
                      >
                        {path.action}
                      </a>
                    ) : (
                      <Link
                        href={path.href}
                        className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#09657E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-offset-2"
                      >
                        {path.action}
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#071827] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Arquitetura oficial
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Produto especializado integrado ao EIOS.
              </h2>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                O Professor Digital não funciona como uma solução
                isolada. Ele faz parte da Plataforma Operacional de
                Inteligência Educacional da EduData IA.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                  Estrutura
                </p>
              </div>

              <div className="divide-y divide-white/10">
                <div className="px-5 py-4 font-semibold">
                  Framework EDI
                </div>

                <div className="px-5 py-4 font-semibold">
                  EIOS
                </div>

                <div className="px-5 py-4 font-semibold">
                  Core compartilhado
                </div>

                <div className="bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100">
                  Professor Digital
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
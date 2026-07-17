import type {
  Metadata,
} from 'next'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import {
  ProfessorDigitalHero,
} from '@/components/products/ProfessorDigitalHero'

export const metadata:
  Metadata = {
  title:
    'Professor Digital | EduData IA',

  description:
    'Inteligência educacional para apoiar o planejamento, a organização e o acompanhamento do trabalho docente.',
}

type ResourceItem = {
  code: string
  title: string
  description: string
}

const resources:
  ResourceItem[] = [
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

const operationalFlow:
  ResourceItem[] = [
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
        'Acompanhe o trabalho realizado no contexto real da sala de aula.',
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
              {resources.map(
                (resource) => (
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
                ),
              )}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                Fluxo operacional
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
                Da organização docente à inteligência educacional.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                O Professor Digital funciona como camada de apoio ao
                trabalho do professor, preservando sua autonomia e
                transformando atividades cotidianas em informações
                organizadas.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-[#071827] p-5 text-white sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                  Integração EIOS
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  O produto compartilha identidade, acesso, dados,
                  segurança e inteligência com os demais componentes da
                  plataforma EduData IA.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              {operationalFlow.map(
                (
                  step,
                  index,
                ) => (
                  <article
                    key={step.code}
                    className={`grid grid-cols-[44px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7 ${
                      index <
                      operationalFlow.length -
                        1
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
                ),
              )}
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
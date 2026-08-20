import Link from 'next/link'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

type ArchitectureLayer = {
  code: string
  title: string
  description: string
}

const architectureLayers: ArchitectureLayer[] = [
  {
    code: '01',
    title: 'Framework EDI',
    description:
      'Define os princípios científicos, metodológicos e pedagógicos que orientam a plataforma e suas experiências educacionais.',
  },
  {
    code: '02',
    title: 'EIOS',
    description:
      'Conecta identidade, dados, segurança, conhecimento e inteligência para transformar registros educacionais em suporte à decisão.',
  },
  {
    code: '03',
    title: 'Core compartilhado',
    description:
      'Mantém serviços essenciais integrados entre os produtos, evitando experiências isoladas e duplicação desnecessária de recursos.',
  },
  {
    code: '04',
    title: 'Produtos especializados',
    description:
      'Entrega experiências específicas para professores, gestores, escolas e redes, mantendo uma base tecnológica e metodológica comum.',
  },
]

const principles = [
  {
    title: 'Evidências',
    description:
      'Registros contextualizados e confiáveis sustentam acompanhamento, análise e aprendizagem institucional.',
  },
  {
    title: 'Inclusão',
    description:
      'A experiência deve ser clara, acessível e respeitosa às diferentes pessoas e contextos educacionais.',
  },
  {
    title: 'Inteligência',
    description:
      'Dados organizados apoiam decisões humanas sem substituir o conhecimento profissional e o contexto pedagógico.',
  },
]

export const metadata = {
  title: 'Arquitetura | EduData IA',
  description:
    'Conheça a arquitetura do ecossistema EduData IA: Framework EDI, EIOS, Core compartilhado e produtos especializados.',
}

export default function ArquiteturaPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main>
        <section className="bg-[#071827] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 hover:text-cyan-200"
            >
              ← EduData IA
            </Link>

            <p className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Arquitetura da plataforma
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Uma base compartilhada para experiências educacionais especializadas.
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              A EduData IA organiza sua arquitetura em camadas com responsabilidades claras. O objetivo é oferecer produtos simples para quem usa, mantendo uma infraestrutura comum de dados, segurança, conhecimento e inteligência.
            </p>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start lg:gap-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                  Estrutura oficial
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#071827] sm:text-4xl">
                  Framework EDI → EIOS → Core → Produtos
                </h2>
                <p className="mt-5 text-base leading-7 text-slate-600">
                  Cada camada possui uma função específica e contribui para que a experiência final permaneça coerente, segura e orientada ao trabalho educacional.
                </p>

                <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-[#071827] text-white">
                  {architectureLayers.map((layer) => (
                    <div
                      key={layer.code}
                      className={`flex items-center gap-4 border-b border-white/10 px-5 py-4 last:border-b-0 ${
                        layer.code === '04' ? 'bg-cyan-300/10' : ''
                      }`}
                    >
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {layer.code}
                      </span>
                      <span className="font-semibold">{layer.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <div className="divide-y divide-slate-200">
                  {architectureLayers.map((layer) => (
                    <article
                      key={layer.code}
                      className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-6 sm:px-7"
                    >
                      <span className="font-mono text-xs font-bold text-[#0B7491]">
                        {layer.code}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-[#071827]">
                          {layer.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {layer.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#EEF3F7] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Framework EDI
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Princípios que orientam toda a plataforma.
            </h2>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {principles.map((principle) => (
                <article
                  key={principle.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-xl font-bold text-[#071827]">
                    {principle.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[1.5rem] border border-slate-200 bg-[#071827] p-6 text-white sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-bold">Conheça as experiências da plataforma.</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A arquitetura existe para tornar os produtos mais simples para quem trabalha na educação.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 text-sm font-bold text-white hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Voltar para a Home
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

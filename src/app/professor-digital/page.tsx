import type { Metadata } from 'next'

import { ProductHeader } from '@/components/products/ProductHeader'
import { ProfessorDigitalHero } from '@/components/products/ProfessorDigitalHero'

export const metadata: Metadata = {
  title: 'Professor Digital | EduData IA',
  description:
    'Inteligência educacional para apoiar o planejamento, a organização e o acompanhamento do trabalho docente.',
}

const recursos = [
  {
    numero: '01',
    titulo: 'Planejamento docente',
    descricao:
      'Estruture aulas, sequências didáticas, objetivos de aprendizagem e ações pedagógicas.',
  },
  {
    numero: '02',
    titulo: 'Organização pedagógica',
    descricao:
      'Centralize turmas, tarefas, compromissos, registros e documentos do professor.',
  },
  {
    numero: '03',
    titulo: 'Acompanhamento',
    descricao:
      'Registre evidências e acompanhe o desenvolvimento dos estudantes ao longo do processo.',
  },
  {
    numero: '04',
    titulo: 'Inteligência aplicada',
    descricao:
      'Utilize dados e recomendações para apoiar decisões pedagógicas com mais segurança.',
  },
]

export default function ProfessorDigitalPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <ProductHeader
        logoSrc="/logo-professor-digital.png"
        logoAlt="Professor Digital"
        productName="Professor Digital"
        accessHref="/professor-digital/dashboard"
        accessLabel="Acessar plataforma"
      />

      <ProfessorDigitalHero />

      <section
        id="recursos-professor-digital"
        className="scroll-mt-24 bg-slate-50 px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
              Recursos para professores
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Tecnologia para fortalecer o trabalho docente.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              O Professor Digital integra planejamento, organização,
              acompanhamento e inteligência educacional para reduzir tarefas
              operacionais e ampliar o tempo dedicado à aprendizagem.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recursos.map((recurso) => (
              <article
                key={recurso.numero}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <span className="text-sm font-bold text-blue-700">
                  {recurso.numero}
                </span>

                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {recurso.titulo}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {recurso.descricao}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
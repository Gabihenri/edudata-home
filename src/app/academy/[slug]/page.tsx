import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

import EnrollmentForm from '@/components/academy/EnrollmentForm'

interface PageProps {
  params: {
    slug: string
  }
}

export default function CoursePage({ params }: PageProps) {
  const courseName =
    params?.slug?.replace(/-/g, ' ') ?? 'Curso'

  return (
    <>
      <AccessibilityBar />

      <Header />

      <main className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">

          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                EduData IA Academy
              </p>

              <h1 className="mt-4 text-5xl font-bold text-[#0A3A5E]">
                {courseName}
              </h1>

              <p className="mt-8 text-lg leading-8 text-slate-600">
                Esta página apresentará todas as informações do curso,
                objetivos, conteúdos, carga horária, certificação,
                metodologia, cronograma e demais detalhes da formação.
              </p>

              <div className="mt-12 rounded-3xl bg-white p-10 shadow-sm">

                <h2 className="text-2xl font-bold text-[#0A3A5E]">
                  Conteúdo Programático
                </h2>

                <ul className="mt-6 list-disc space-y-3 pl-6 text-slate-700">
                  <li>Fundamentos</li>
                  <li>Metodologia EDI</li>
                  <li>Aplicações práticas</li>
                  <li>Projetos</li>
                  <li>Estudos de Caso</li>
                  <li>Certificação</li>
                </ul>

              </div>

            </div>

            <EnrollmentForm />

          </div>

        </div>
      </main>

      <Footer />
    </>
  )
}
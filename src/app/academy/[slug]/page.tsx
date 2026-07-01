import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

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
        <div className="mx-auto max-w-6xl px-6">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            EduData IA Academy
          </p>

          <h1 className="mt-4 text-5xl font-bold text-[#0A3A5E]">
            {courseName}
          </h1>

          <p className="mt-8 text-lg leading-8 text-slate-600">
            Esta será a página oficial de cada curso da EduData IA Academy.
          </p>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

            <h2 className="text-2xl font-bold text-[#0A3A5E]">
              Página em desenvolvimento
            </h2>

            <p className="mt-4 text-slate-600">
              Em breve esta página apresentará:
            </p>

            <ul className="mt-6 list-disc space-y-2 pl-6 text-slate-700">
              <li>Descrição completa do curso</li>
              <li>Objetivos</li>
              <li>Conteúdo programático</li>
              <li>Carga horária</li>
              <li>Professor responsável</li>
              <li>Cronograma</li>
              <li>Modalidade</li>
              <li>Certificado</li>
              <li>Investimento</li>
              <li>Botão de inscrição</li>
            </ul>

          </div>

        </div>
      </main>

      <Footer />
    </>
  )
}
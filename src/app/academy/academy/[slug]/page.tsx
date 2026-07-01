import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

interface PageProps {
  params: {
    slug: string
  }
}

export default function CoursePage({ params }: PageProps) {
  const courseName = params?.slug
    ? params.slug.replace(/-/g, ' ')
    : 'Curso'

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

          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-600">
            Esta será a página oficial do curso da EduData IA Academy.
            Aqui serão apresentados objetivos, conteúdo programático,
            carga horária, certificação, cronograma, instrutor e
            informações para inscrição.
          </p>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Em desenvolvimento
            </h2>

            <p className="mt-4 text-slate-600">
              Esta página está sendo preparada e será integrada
              ao ecossistema da EduData IA Academy.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </>
  )
}

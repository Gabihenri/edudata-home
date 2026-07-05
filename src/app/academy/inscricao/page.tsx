import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

export const metadata = {
  title: 'Inscrição | EduData IA Academy',
  description: 'Formulário de inscrição nos cursos da EduData IA Academy.',
}

export default function InscricaoAcademyPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main className="min-h-screen bg-[#F8FAFC] px-6 py-20">
        <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1B6B3A]">
            EduData IA Academy
          </p>

          <h1 className="mt-4 text-4xl font-bold text-[#081C2E]">
            Inscrição no curso
          </h1>

          <p className="mt-4 leading-8 text-slate-600">
            Preencha seus dados para registrar interesse na formação. A equipe
            EduData IA entrará em contato com as próximas orientações.
          </p>

          <form className="mt-8 space-y-4">
            <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Nome completo" />
            <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="E-mail" />
            <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Telefone" />
            <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Escola" />
            <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Cargo/Função" />

            <button
              type="button"
              className="w-full rounded-2xl bg-[#1B6B3A] px-6 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Enviar inscrição
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </>
  )
}
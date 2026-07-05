import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

export default function InscricaoSucessoPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main className="min-h-screen bg-[#F8FAFC] px-6 py-20">
        <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1B6B3A]">
            Inscrição registrada
          </p>

          <h1 className="mt-4 text-4xl font-bold text-[#081C2E]">
            Sua inscrição foi enviada com sucesso.
          </h1>

          <p className="mt-6 leading-8 text-slate-600">
            A equipe EduData IA entrará em contato com as próximas orientações.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/academy"
              className="rounded-full bg-[#0A3A5E] px-8 py-4 font-semibold text-white"
            >
              Voltar para Academy
            </Link>

            <Link
              href="/professor-digital"
              className="rounded-full border border-[#0A3A5E] px-8 py-4 font-semibold text-[#0A3A5E]"
            >
              Ir para Professor Digital
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

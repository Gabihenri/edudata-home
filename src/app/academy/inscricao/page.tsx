'use client'

import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

export default function InscricaoAcademyPage() {
  const searchParams = useSearchParams()
  const curso = searchParams.get('curso') || 'curso-nao-informado'

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    const enrollment = {
      curso,
      nome: formData.get('nome'),
      email: formData.get('email'),
      telefone: formData.get('telefone'),
      escola: formData.get('escola'),
      cargo: formData.get('cargo'),
      createdAt: new Date().toISOString(),
    }

    const saved = localStorage.getItem('academy_enrollments')
    const enrollments = saved ? JSON.parse(saved) : []

    localStorage.setItem(
      'academy_enrollments',
      JSON.stringify([...enrollments, enrollment]),
    )

    window.location.href = `/academy/inscricao/sucesso?curso=${curso}`
  }

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
            Curso selecionado: <strong>{curso}</strong>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              name="nome"
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Nome completo"
            />

            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="E-mail"
            />

            <input
              name="telefone"
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Telefone"
            />

            <input
              name="escola"
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Escola"
            />

            <input
              name="cargo"
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Cargo/Função"
            />

            <button
              type="submit"
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
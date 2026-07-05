'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

export default function InscricaoAcademyPage() {
  const [curso, setCurso] = useState('curso-nao-informado')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCurso(params.get('curso') || 'curso-nao-informado')
  }, [])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    const enrollment = {
      curso,
      nome: String(formData.get('nome') || ''),
      email: String(formData.get('email') || ''),
      telefone: String(formData.get('telefone') || ''),
      escola: String(formData.get('escola') || ''),
      cargo: String(formData.get('cargo') || ''),
      status: 'novo',
      createdAt: new Date().toISOString(),
    }

    const current = localStorage.getItem('academy_enrollments')
    const list = current ? JSON.parse(current) : []

    localStorage.setItem(
      'academy_enrollments',
      JSON.stringify([...list, enrollment]),
    )

    setStatus('Inscrição salva com sucesso. Redirecionando...')

    setTimeout(() => {
      window.location.href = `/academy/inscricao/sucesso?curso=${curso}`
    }, 1000)
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

          {status && (
            <div className="mt-6 rounded-2xl bg-emerald-100 px-5 py-4 font-semibold text-emerald-800">
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input name="nome" required className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Nome completo" />
            <input name="email" type="email" required className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="E-mail" />
            <input name="telefone" required className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Telefone" />
            <input name="escola" required className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Escola" />
            <input name="cargo" required className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Cargo/Função" />

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
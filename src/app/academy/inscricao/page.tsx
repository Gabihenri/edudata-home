'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

export default function InscricaoAcademyPage() {
  const [curso, setCurso] = useState('curso-nao-informado')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCurso(params.get('curso') || 'curso-nao-informado')
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setStatus('Enviando inscrição...')

    const formData = new FormData(event.currentTarget)

    const payload = {
      curso,
      nome: String(formData.get('nome') || ''),
      email: String(formData.get('email') || ''),
      telefone: String(formData.get('telefone') || ''),
      escola: String(formData.get('escola') || ''),
      cargo: String(formData.get('cargo') || ''),
      lgpd: formData.get('lgpd') === 'on',
    }

    const response = await fetch('/api/academy/enrollments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      setLoading(false)
      setStatus(`Erro ao enviar inscrição: ${result.error || 'tente novamente.'}`)
      return
    }

    setStatus('Inscrição salva com sucesso. Redirecionando...')

    setTimeout(() => {
      window.location.href = `/academy/inscricao/sucesso?curso=${curso}`
    }, 900)
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

            <label className="flex gap-3 rounded-2xl border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-700">
              <input
                name="lgpd"
                type="checkbox"
                required
                className="mt-1 h-5 w-5"
              />
              <span>
                Aceito a Política de Privacidade e autorizo o uso dos meus dados
                para fins de inscrição, contato e acompanhamento pela EduData IA.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#1B6B3A] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar inscrição'}
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </>
  )
}
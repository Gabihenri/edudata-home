 'use client'

import { useState } from 'react'

export default function EnrollmentForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    school: '',
    city: '',
    state: '',
    role: '',
    courseId: '',
    lgpd: false,
  })

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    setLoading(true)
    setMessage('Enviando inscrição...')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch('/api/academy/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
        signal: controller.signal,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao enviar inscrição.')
      }

      setMessage('Inscrição realizada com sucesso!')

      setForm({
        fullName: '',
        email: '',
        whatsapp: '',
        school: '',
        city: '',
        state: '',
        role: '',
        courseId: '',
        lgpd: false,
      })
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessage('O envio demorou muito. Tente novamente.')
      } else {
        setMessage(error.message || 'Não foi possível realizar a inscrição.')
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl bg-white p-10 shadow-xl">
      <h2 className="mb-8 text-3xl font-bold text-[#0A3A5E]">
        Inscrição
      </h2>

      {message && (
        <div className="mb-6 rounded-2xl bg-emerald-100 px-6 py-4 text-center font-semibold text-emerald-800">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input name="fullName" placeholder="Nome completo" value={form.fullName} onChange={handleChange} required className="w-full rounded-xl border p-4" />

        <input name="email" type="email" placeholder="E-mail" value={form.email} onChange={handleChange} required className="w-full rounded-xl border p-4" />

        <input name="whatsapp" placeholder="WhatsApp" value={form.whatsapp} onChange={handleChange} className="w-full rounded-xl border p-4" />

        <input name="school" placeholder="Escola" value={form.school} onChange={handleChange} required className="w-full rounded-xl border p-4" />

        <input name="city" placeholder="Cidade" value={form.city} onChange={handleChange} className="w-full rounded-xl border p-4" />

        <input name="state" placeholder="Estado" value={form.state} onChange={handleChange} className="w-full rounded-xl border p-4" />

        <input name="role" placeholder="Cargo" value={form.role} onChange={handleChange} required className="w-full rounded-xl border p-4" />

        <input name="courseId" placeholder="ID do Curso" value={form.courseId} onChange={handleChange} className="w-full rounded-xl border p-4" />

        <label className="flex items-center gap-3">
          <input type="checkbox" name="lgpd" checked={form.lgpd} onChange={handleChange} required />
          <span>Concordo com a Política de Privacidade.</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#0A3A5E] py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Finalizar inscrição'}
        </button>
      </form>
    </section>
  )
}
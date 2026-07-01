'use client'

import { useState } from 'react'

export default function EnrollmentForm() {
  const [loading, setLoading] = useState(false)

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

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value, type } = event.target

    setForm((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? (event.target as HTMLInputElement).checked
          : value,
    }))
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault()

    setLoading(true)

    try {
      const response = await fetch('/api/academy/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error()
      }

      alert('Inscrição realizada com sucesso!')

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
    } catch {
      alert('Não foi possível realizar a inscrição.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl bg-white p-10 shadow-xl">
      <h2 className="mb-8 text-3xl font-bold text-[#0A3A5E]">
        Inscrição
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <input
          name="fullName"
          placeholder="Nome completo"
          value={form.fullName}
          onChange={handleChange}
          className="w-full rounded-xl border p-4"
        />

        <input
          name="email"
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-xl border p-4"
        />

        <input
          name="whatsapp"
          placeholder="WhatsApp"
          value={form.whatsapp}
          onChange={handleChange}
          className="w-full rounded-xl border p-4"
        />

        <input
          name="school"
          placeholder="Escola"
          value={form.school}
          onChange={handleChange}
          className="w-full rounded-xl border p-4"
        />

        <input
          name="city"
          placeholder="Cidade"
          value={form.city}
          onChange={handleChange}
          className="w-full rounded-xl border p-4"
        />

        <input
          name="state"
          placeholder="Estado"
          value={form.state}
          onChange={handleChange}
          className="w-full rounded-xl border p-4"
        />

        <input
          name="role"
          placeholder="Cargo"
          value={form.role}
          onChange={handleChange}
          className="w-full rounded-xl border p-4"
        />

        <input
          name="courseId"
          placeholder="ID do Curso"
          value={form.courseId}
          onChange={handleChange}
          className="w-full rounded-xl border p-4"
        />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="lgpd"
            checked={form.lgpd}
            onChange={handleChange}
          />

          <span>
            Concordo com a Política de Privacidade.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#0A3A5E] py-4 font-semibold text-white"
        >
          {loading
            ? 'Enviando...'
            : 'Finalizar inscrição'}
        </button>
      </form>
    </section>
  )
}
 
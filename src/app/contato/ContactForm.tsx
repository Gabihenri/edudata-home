'use client'

import { FormEvent, useState } from 'react'

const initialForm = {
  name: '',
  institution: '',
  municipality: '',
  state: '',
  need: '',
  phone: '',
  email: '',
  website: '',
}

export default function ContactForm() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Não foi possível enviar a mensagem.')
      }

      setForm(initialForm)
      setStatus('success')
      setMessage('Mensagem enviada. Em breve entraremos em contato.')
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar a mensagem.',
      )
    }
  }

  const inputClassName =
    'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none transition placeholder:text-slate-400 focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#071827]">
          Nome
          <input
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className={inputClassName}
            autoComplete="name"
          />
        </label>

        <label className="text-sm font-semibold text-[#071827]">
          Instituição
          <input
            required
            value={form.institution}
            onChange={(event) => updateField('institution', event.target.value)}
            className={inputClassName}
            autoComplete="organization"
          />
        </label>

        <label className="text-sm font-semibold text-[#071827]">
          Município
          <input
            required
            value={form.municipality}
            onChange={(event) => updateField('municipality', event.target.value)}
            className={inputClassName}
            autoComplete="address-level2"
          />
        </label>

        <label className="text-sm font-semibold text-[#071827]">
          UF
          <input
            required
            maxLength={2}
            value={form.state}
            onChange={(event) => updateField('state', event.target.value.toUpperCase())}
            className={inputClassName}
            autoComplete="address-level1"
          />
        </label>

        <label className="text-sm font-semibold text-[#071827]">
          Telefone
          <input
            required
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            className={inputClassName}
            autoComplete="tel"
          />
        </label>

        <label className="text-sm font-semibold text-[#071827]">
          E-mail <span className="font-normal text-slate-400">(opcional)</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className={inputClassName}
            autoComplete="email"
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-[#071827]">
        Como podemos ajudar?
        <textarea
          required
          minLength={10}
          rows={5}
          value={form.need}
          onChange={(event) => updateField('need', event.target.value)}
          className={`${inputClassName} resize-y`}
        />
      </label>

      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => updateField('website', event.target.value)}
          />
        </label>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            status === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-6 py-3 font-bold text-white transition hover:bg-[#102B3D] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#0B7491] sm:w-auto"
      >
        {status === 'sending' ? 'Enviando…' : 'Enviar mensagem'}
      </button>
    </form>
  )
}

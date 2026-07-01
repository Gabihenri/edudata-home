'use client'

import { useState } from 'react'

export default function EnrollmentForm() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    escola: '',
    cidade: '',
    estado: '',
    cargo: '',
    curso: '',
    lgpd: false,
  })

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    console.log(form)

    alert(
      'Inscrição registrada! Em breve ela será integrada ao banco de dados da EduData IA.'
    )
  }

  return (
    <section className="rounded-[2rem] bg-white p-10 shadow-xl">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          EduData IA Academy
        </p>

        <h2 className="mt-3 text-4xl font-bold text-[#0A3A5E]">
          Faça sua inscrição
        </h2>

        <p className="mt-4 text-slate-600">
          Preencha os dados abaixo para entrar na lista de participantes.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <input
          name="nome"
          placeholder="Nome completo"
          value={form.nome}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-5 py-4"
        />

        <input
          name="email"
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-5 py-4"
        />

        <input
          name="whatsapp"
          placeholder="WhatsApp"
          value={form.whatsapp}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-5 py-4"
        />

        <input
          name="escola"
          placeholder="Escola / Instituição"
          value={form.escola}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-5 py-4"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <input
            name="cidade"
            placeholder="Cidade"
            value={form.cidade}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-5 py-4"
          />

          <input
            name="estado"
            placeholder="Estado"
            value={form.estado}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-5 py-4"
          />
        </div>

        <input
          name="cargo"
          placeholder="Cargo"
          value={form.cargo}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-5 py-4"
        />

        <input
          name="curso"
          placeholder="Curso desejado"
          value={form.curso}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-5 py-4"
        />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="lgpd"
            checked={form.lgpd}
            onChange={handleChange}
          />

          <span className="text-sm text-slate-600">
            Concordo com a Política de Privacidade e LGPD.
          </span>
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-[#0A3A5E] px-8 py-4 text-lg font-semibold text-white transition hover:opacity-90"
        >
          Finalizar inscrição
        </button>
      </form>
    </section>
  )
}
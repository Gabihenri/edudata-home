'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type LoginResponse = {
  success: boolean
  error?: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const result = (await response.json()) as LoginResponse

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Não foi possível entrar.')
      }

      const redirectTo = searchParams.get('redirectTo')

      router.push(
        redirectTo?.startsWith('/') ? redirectTo : '/agenda/dashboard',
      )

      router.refresh()
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Erro inesperado ao entrar.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8] px-6 py-16">
      <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
            EduData IA
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            Entrar na plataforma
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Acesse a Agenda Inteligente EDI e os módulos integrados ao
            ecossistema EduData IA.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Senha
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
              placeholder="Digite sua senha"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#081C2E] px-6 py-4 font-semibold text-white transition hover:bg-[#0A3A5E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <a
            href="/"
            className="text-sm font-semibold text-[#5C1A8C] transition hover:opacity-75"
          >
            Voltar para a página inicial
          </a>
        </div>
      </section>
    </main>
  )
}
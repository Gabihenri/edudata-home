'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type SignUpApiResponse = {
  success: boolean
  error?: string
  requiresEmailConfirmation?: boolean
}

export default function CadastroPage() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve possuir pelo menos 8 caracteres.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName,
          email,
          password,
        }),
      })

      const result = (await response.json()) as SignUpApiResponse

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Não foi possível criar sua conta.')
        return
      }

      if (result.requiresEmailConfirmation) {
        setSuccess(
          'Conta criada. Confirme seu e-mail para continuar e depois entre na Agenda.',
        )
        setPassword('')
        setConfirmPassword('')
        return
      }

      router.replace('/agenda/dashboard')
      router.refresh()
    } catch {
      setError('Não foi possível conectar ao serviço de cadastro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#081C2E] px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-stretch">
        <section className="rounded-[1.75rem] border border-white/10 bg-[#071827] p-6 text-white shadow-2xl sm:p-8 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Agenda Inteligente EDI
          </p>

          <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Crie sua conta e comece a organizar sua rotina pedagógica.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Planejamento, Diário de Classe, avaliações, evidências e acompanhamento pedagógico em um único ambiente operacional.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[
              ['01', 'Planejar', 'Organize aulas, objetivos e ações.'],
              ['02', 'Registrar', 'Frequência, notas e evidências.'],
              ['03', 'Acompanhar', 'Histórico e evolução pedagógica.'],
              ['04', 'Decidir', 'Use dados com contexto e revisão humana.'],
            ].map(([code, title, description]) => (
              <article
                key={code}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="font-mono text-xs font-bold text-cyan-300">{code}</p>
                <p className="mt-2 font-bold text-white">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
              </article>
            ))}
          </div>

          <p className="mt-8 text-xs leading-6 text-slate-400">
            Produto EduData IA · Framework EDI · EIOS
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Primeiro acesso
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#071827] sm:text-3xl">
              Criar conta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use seu e-mail e uma senha segura. Se preferir Google, entre pela tela de acesso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Nome
              <input
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                autoComplete="name"
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                placeholder="Seu nome"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              E-mail
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                placeholder="voce@exemplo.com"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Senha
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                placeholder="Mínimo de 8 caracteres"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Confirmar senha
              <input
                type="password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900"
              >
                {error}
              </p>
            ) : null}

            {success ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"
              >
                <p className="font-semibold">{success}</p>
                <Link
                  href="/login?redirectTo=%2Fagenda%2Fdashboard"
                  className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-4 py-2.5 font-bold text-white"
                >
                  Ir para o login
                </Link>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2940] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Criando conta...' : 'Criar minha conta'}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            Já possui conta?{' '}
            <Link
              href="/login?redirectTo=%2Fagenda%2Fdashboard"
              className="font-bold text-[#075F78] hover:underline"
            >
              Entrar na Agenda
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

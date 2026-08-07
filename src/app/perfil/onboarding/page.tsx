'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type ProfileResponse = {
  success: boolean
  error?: string
  profile?: {
    displayName: string | null
    phone: string | null
    onboardingCompleted: boolean
  }
}

export default function ProfileOnboardingPage() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        const result = (await response.json()) as ProfileResponse

        if (!active) {
          return
        }

        if (response.status === 401) {
          router.replace('/login?redirectTo=%2Fperfil%2Fonboarding')
          return
        }

        if (!response.ok || !result.success || !result.profile) {
          setError(result.error ?? 'Não foi possível carregar seu perfil.')
          return
        }

        if (result.profile.onboardingCompleted) {
          router.replace('/agenda/dashboard')
          return
        }

        setDisplayName(result.profile.displayName ?? '')
        setPhone(result.profile.phone ?? '')
      } catch {
        if (active) {
          setError('Não foi possível carregar seu perfil.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('Informe seu nome.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          phone: phone.trim(),
        }),
      })

      const result = (await response.json()) as ProfileResponse

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Não foi possível concluir seu perfil.')
        return
      }

      router.replace('/agenda/dashboard')
      router.refresh()
    } catch {
      setError('Não foi possível salvar seu perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#EEF3F7] px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl">
        <header className="bg-[#071827] px-5 py-7 text-white sm:px-8 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            Primeiro acesso
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Bem-vindo à Agenda Inteligente EDI
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Confirme seus dados básicos para personalizar sua experiência. Você poderá alterar essas informações depois.
          </p>
        </header>

        <div className="p-5 sm:p-8">
          {loading ? (
            <p className="text-sm text-slate-600">Carregando seu perfil...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700">
                Nome
                <input
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  autoComplete="name"
                  required
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Telefone ou WhatsApp
                <input
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  placeholder="Opcional"
                />
              </label>

              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700">
                Seu perfil inicial é individual. Perfis institucionais de coordenação, direção ou gestão dependem de vínculo com uma organização.
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2940] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Entrar na Agenda'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

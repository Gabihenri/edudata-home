'use client'

import { useEffect, useState } from 'react'
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

        if (!active) return

        if (response.status === 401) {
          router.replace('/login?redirectTo=%2Fperfil%2Fonboarding')
          return
        }

        if (!response.ok || !result.success || !result.profile) {
          setError(result.error ?? 'Não foi possível carregar seu perfil.')
          return
        }

        setDisplayName(result.profile.displayName ?? '')
        setPhone(result.profile.phone ?? '')
      } catch {
        if (active) {
          setError('Não foi possível carregar seu perfil.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [router])

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
            Seu perfil individual é provisionado automaticamente pelo sistema de autenticação.
          </p>
        </header>

        <div className="space-y-5 p-5 sm:p-8">
          {loading ? (
            <p className="text-sm text-slate-600">Carregando seu perfil...</p>
          ) : (
            <>
              {error ? (
                <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
                  {error}
                </p>
              ) : (
                <>
                  <label className="block text-sm font-semibold text-slate-700">
                    Nome de exibição
                    <input
                      value={displayName}
                      readOnly
                      disabled
                      className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal text-slate-600"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Telefone ou WhatsApp
                    <input
                      value={phone}
                      readOnly
                      disabled
                      className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal text-slate-600"
                    />
                  </label>
                </>
              )}
            </>
          )}

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700">
            A edição de dados pessoais está temporariamente suspensa enquanto concluímos a política de atualização segura no banco. Seu acesso à Agenda não depende da conclusão desta etapa.
          </div>

          <button
            type="button"
            disabled={loading || Boolean(error)}
            onClick={() => {
              router.replace('/agenda/dashboard')
              router.refresh()
            }}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2940] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continuar para a Agenda
          </button>
        </div>
      </section>
    </main>
  )
}

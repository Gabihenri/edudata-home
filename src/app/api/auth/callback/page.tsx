'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  createClient,
  type Session,
} from '@supabase/supabase-js'

type OAuthApiResponse = {
  success: boolean
  error?: string
}

function getSafeRedirect(
  redirectValue: string | null,
): string {
  if (
    redirectValue &&
    redirectValue.startsWith('/') &&
    !redirectValue.startsWith('//')
  ) {
    return redirectValue
  }

  return '/agenda'
}

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [errorMessage, setErrorMessage] = useState('')

  const redirectTo = useMemo(
    () =>
      getSafeRedirect(
        searchParams.get('redirectTo'),
      ),
    [searchParams],
  )

  useEffect(() => {
    let isMounted = true
    let isCompleted = false

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      setErrorMessage(
        'A conexão com o Supabase não está configurada.',
      )

      return
    }

    const oauthError =
      searchParams.get('error_description') ??
      searchParams.get('error')

    if (oauthError) {
      setErrorMessage(
        `O Google não concluiu o acesso: ${oauthError}`,
      )

      return
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )

    async function completeOAuthSession(
      session: Session,
    ) {
      if (
        !isMounted ||
        isCompleted
      ) {
        return
      }

      isCompleted = true

      try {
        const response = await fetch(
          '/api/auth/oauth',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              accessToken:
                session.access_token,
              refreshToken:
                session.refresh_token,
            }),
          },
        )

        const result =
          (await response.json()) as OAuthApiResponse

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ??
              'Não foi possível concluir o acesso pelo Google.',
          )
        }

        router.replace(redirectTo)
        router.refresh()
      } catch (error) {
        if (!isMounted) {
          return
        }

        isCompleted = false

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível concluir o acesso pelo Google.',
        )
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          void completeOAuthSession(session)
        }
      },
    )

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return
        }

        if (error) {
          setErrorMessage(
            'Não foi possível validar a sessão do Google.',
          )

          return
        }

        if (data.session) {
          void completeOAuthSession(
            data.session,
          )
        }
      })

    const timeout = window.setTimeout(() => {
      if (
        isMounted &&
        !isCompleted
      ) {
        setErrorMessage(
          'O acesso demorou mais do que o esperado. Volte ao login e tente novamente.',
        )
      }
    }, 15000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      window.clearTimeout(timeout)
    }
  }, [
    redirectTo,
    router,
    searchParams,
  ])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#081C2E] px-6 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
          EduData IA
        </p>

        {errorMessage ? (
          <>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              Não foi possível entrar
            </h1>

            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700"
            >
              {errorMessage}
            </div>

            <button
              type="button"
              onClick={() =>
                router.replace('/login')
              }
              className="mt-6 w-full rounded-xl bg-[#081C2E] px-5 py-3 font-semibold text-white transition hover:bg-[#0D2B45]"
            >
              Voltar para o login
            </button>
          </>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="mx-auto mt-8 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600"
            />

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Concluindo seu acesso
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              Estamos validando sua conta Google e preparando seu ambiente.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
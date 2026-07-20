'use client'

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

type ScreenMode =
  | 'login'
  | 'recovery'

type LoginApiResponse = {
  success: boolean
  error?: string
}

let browserSupabaseClient:
  | SupabaseClient
  | null = null

function getBrowserSupabaseClient(): SupabaseClient {
  if (browserSupabaseClient) {
    return browserSupabaseClient
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      'A conexão com o Supabase não está configurada.',
    )
  }

  if (
    !supabaseUrl.startsWith(
      'https://',
    ) ||
    !supabaseUrl.includes(
      '.supabase.co',
    )
  ) {
    throw new Error(
      'A URL configurada para o Supabase é inválida.',
    )
  }

  browserSupabaseClient =
    createClient(
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

  return browserSupabaseClient
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

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback
}

export default function LoginContent() {
  const router = useRouter()
  const searchParams =
    useSearchParams()

  const [
    mode,
    setMode,
  ] =
    useState<ScreenMode>(
      'login',
    )

  const [
    email,
    setEmail,
  ] =
    useState('')

  const [
    password,
    setPassword,
  ] =
    useState('')

  const [
    newPassword,
    setNewPassword,
  ] =
    useState('')

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] =
    useState('')

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false)

  const [
    isGoogleLoading,
    setIsGoogleLoading,
  ] =
    useState(false)

  const [
    isSendingRecovery,
    setIsSendingRecovery,
  ] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('')

  const redirectTo =
    useMemo(() => {
      const requestedRedirect =
        searchParams.get(
          'redirectTo',
        ) ??
        searchParams.get(
          'redirect',
        ) ??
        searchParams.get(
          'next',
        )

      return getSafeRedirect(
        requestedRedirect,
      )
    }, [searchParams])

  const changeAccountRequested =
    useMemo(
      () =>
        searchParams.get(
          'changeAccount',
        ) === '1',
      [searchParams],
    )

  useEffect(() => {
    const recoveryRequested =
      searchParams.get(
        'recovery',
      ) === '1'

    const recoveryHashDetected =
      typeof window !==
        'undefined' &&
      window.location.hash.includes(
        'type=recovery',
      )

    if (
      !recoveryRequested &&
      !recoveryHashDetected
    ) {
      return
    }

    let isMounted = true

    let unsubscribe:
      | (() => void)
      | undefined

    try {
      const supabase =
        getBrowserSupabaseClient()

      const {
        data: {
          subscription,
        },
      } =
        supabase.auth
          .onAuthStateChange(
            (
              event,
              session,
            ) => {
              if (!isMounted) {
                return
              }

              if (
                event ===
                  'PASSWORD_RECOVERY' ||
                session
              ) {
                setMode(
                  'recovery',
                )

                setErrorMessage(
                  '',
                )

                setSuccessMessage(
                  '',
                )
              }
            },
          )

      unsubscribe = () =>
        subscription.unsubscribe()

      void supabase.auth
        .getSession()
        .then(
          ({
            data,
            error,
          }) => {
            if (!isMounted) {
              return
            }

            if (error) {
              setErrorMessage(
                'Não foi possível validar o link de recuperação.',
              )

              return
            }

            if (data.session) {
              setMode(
                'recovery',
              )
            }
          },
        )
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Não foi possível iniciar a recuperação de senha.',
        ),
      )
    }

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [searchParams])

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function handleGoogleLogin() {
    clearMessages()
    setIsGoogleLoading(true)

    try {
      const supabase =
        getBrowserSupabaseClient()

      const callbackUrl =
        new URL(
          '/auth/callback',
          window.location.origin,
        )

      callbackUrl.searchParams.set(
        'redirectTo',
        redirectTo,
      )

      const {
        error,
      } =
        await supabase.auth
          .signInWithOAuth({
            provider: 'google',

            options: {
              redirectTo:
                callbackUrl.toString(),

              queryParams:
                changeAccountRequested
                  ? {
                      prompt:
                        'select_account',
                    }
                  : undefined,
            },
          })

      if (error) {
        setErrorMessage(
          'Não foi possível iniciar o acesso com o Google.',
        )

        setIsGoogleLoading(
          false,
        )
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Não foi possível conectar ao Google.',
        ),
      )

      setIsGoogleLoading(
        false,
      )
    }
  }

  async function handleLogin(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    clearMessages()
    setIsLoading(true)

    try {
      const response =
        await fetch(
          '/api/auth/login',
          {
            method: 'POST',

            credentials:
              'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                email:
                  email.trim(),

                password,
              }),
          },
        )

      const result =
        (await response.json()) as
          LoginApiResponse

      if (
        !response.ok ||
        !result.success
      ) {
        setErrorMessage(
          result.error ??
            'E-mail ou senha inválidos.',
        )

        return
      }

      router.replace(
        redirectTo,
      )

      router.refresh()
    } catch {
      setErrorMessage(
        'Não foi possível conectar ao serviço de autenticação.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword() {
    clearMessages()

    const normalizedEmail =
      email
        .trim()
        .toLowerCase()

    if (!normalizedEmail) {
      setErrorMessage(
        'Digite seu e-mail antes de solicitar a recuperação.',
      )

      return
    }

    setIsSendingRecovery(
      true,
    )

    try {
      const supabase =
        getBrowserSupabaseClient()

      const recoveryUrl =
        `${window.location.origin}/login?recovery=1`

      const {
        error,
      } =
        await supabase.auth
          .resetPasswordForEmail(
            normalizedEmail,
            {
              redirectTo:
                recoveryUrl,
            },
          )

      if (error) {
        setErrorMessage(
          'Não foi possível enviar o e-mail de recuperação.',
        )

        return
      }

      setSuccessMessage(
        'Enviamos as instruções para seu e-mail. Verifique também a pasta de spam.',
      )
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Não foi possível solicitar a recuperação da senha.',
        ),
      )
    } finally {
      setIsSendingRecovery(
        false,
      )
    }
  }

  async function handleUpdatePassword(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    clearMessages()

    if (
      newPassword.length < 8
    ) {
      setErrorMessage(
        'A nova senha deve possuir pelo menos 8 caracteres.',
      )

      return
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setErrorMessage(
        'A confirmação não corresponde à nova senha.',
      )

      return
    }

    setIsLoading(true)

    try {
      const supabase =
        getBrowserSupabaseClient()

      const {
        error,
      } =
        await supabase.auth
          .updateUser({
            password:
              newPassword,
          })

      if (error) {
        setErrorMessage(
          'Não foi possível atualizar a senha. O link pode ter expirado.',
        )

        return
      }

      await supabase.auth
        .signOut()

      setNewPassword('')
      setConfirmNewPassword('')
      setPassword('')
      setMode('login')

      setSuccessMessage(
        'Senha atualizada. Entre novamente com sua nova senha.',
      )

      router.replace(
        '/login',
      )

      router.refresh()
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Não foi possível atualizar a senha.',
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const isAnyActionLoading =
    isLoading ||
    isGoogleLoading ||
    isSendingRecovery

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#081C2E] px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
            EduData IA
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            {mode ===
            'recovery'
              ? 'Redefinir senha'
              : changeAccountRequested
                ? 'Trocar de conta'
                : 'Acessar plataforma'}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {mode ===
            'recovery'
              ? 'Crie uma nova senha para continuar acessando o ecossistema EDI.'
              : changeAccountRequested
                ? 'Escolha a conta que deseja utilizar na plataforma.'
                : 'Entre com sua conta Google ou utilize suas credenciais.'}
          </p>
        </div>

        {mode === 'login' ? (
          <>
            {changeAccountRequested ? (
              <div
                role="status"
                className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm leading-6 text-cyan-900"
              >
                A sessão anterior foi encerrada. Selecione outra conta Google ou entre com outro e-mail.
              </div>
            ) : null}

            <button
              type="button"
              onClick={
                handleGoogleLogin
              }
              disabled={
                isAnyActionLoading
              }
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.02v2.54h3.23c1.89-1.74 2.98-4.3 2.98-7.41Z"
                />

                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.96-.9 6.62-2.36l-3.23-2.54c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.62A10 10 0 0 0 12 22Z"
                />

                <path
                  fill="#FBBC05"
                  d="M6.4 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.32-1.93V7.45H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.55l3.34-2.62Z"
                />

                <path
                  fill="#EA4335"
                  d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.45l3.34 2.62C7.19 7.7 9.4 5.94 12 5.94Z"
                />
              </svg>

              {isGoogleLoading
                ? 'Conectando ao Google...'
                : changeAccountRequested
                  ? 'Escolher conta Google'
                  : 'Continuar com Google'}
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                ou continue com e-mail
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form
              onSubmit={
                handleLogin
              }
              className="space-y-5"
            >
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
                  onChange={event =>
                    setEmail(
                      event.target
                        .value,
                    )
                  }
                  placeholder="seuemail@exemplo.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Senha
                  </label>

                  <button
                    type="button"
                    onClick={
                      handleForgotPassword
                    }
                    disabled={
                      isAnyActionLoading
                    }
                    className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingRecovery
                      ? 'Enviando...'
                      : 'Esqueceu a senha?'}
                  </button>
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={event =>
                    setPassword(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Digite sua senha"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
              </div>

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                >
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  isAnyActionLoading
                }
                className="w-full rounded-xl bg-[#081C2E] px-4 py-3 font-semibold text-white transition hover:bg-[#0D2B45] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'Entrando...'
                  : 'Entrar com e-mail'}
              </button>
            </form>
          </>
        ) : (
          <form
            onSubmit={
              handleUpdatePassword
            }
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nova senha
              </label>

              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={event =>
                  setNewPassword(
                    event.target
                      .value,
                  )
                }
                placeholder="Digite a nova senha"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirmar nova senha
              </label>

              <input
                id="confirm-new-password"
                name="confirm-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={
                  confirmNewPassword
                }
                onChange={event =>
                  setConfirmNewPassword(
                    event.target
                      .value,
                  )
                }
                placeholder="Repita a nova senha"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              />
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#081C2E] px-4 py-3 font-semibold text-white transition hover:bg-[#0D2B45] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? 'Atualizando...'
                : 'Salvar nova senha'}
            </button>

            <button
              type="button"
              onClick={() => {
                clearMessages()
                setMode('login')
                router.replace(
                  '/login',
                )
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar para o login
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
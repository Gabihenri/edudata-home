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

type ScreenMode = 'login' | 'recovery'

type LoginApiResponse = {
  success: boolean
  error?: string
}

let browserSupabaseClient: SupabaseClient | null = null

function getBrowserSupabaseClient(): SupabaseClient {
  if (browserSupabaseClient) {
    return browserSupabaseClient
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'A conexão com o Supabase não está configurada.',
    )
  }

  if (
    !supabaseUrl.startsWith('https://') ||
    !supabaseUrl.includes('.supabase.co')
  ) {
    throw new Error(
      'A URL configurada para o Supabase é inválida.',
    )
  }

  browserSupabaseClient = createClient(
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
  const searchParams = useSearchParams()

  const [mode, setMode] =
    useState<ScreenMode>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState('')

  const [isLoading, setIsLoading] =
    useState(false)

  const [
    isSendingRecovery,
    setIsSendingRecovery,
  ] = useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const redirectTo = useMemo(() => {
    const requestedRedirect =
      searchParams.get('redirectTo') ??
      searchParams.get('redirect') ??
      searchParams.get('next')

    return getSafeRedirect(requestedRedirect)
  }, [searchParams])

  useEffect(() => {
    const recoveryRequested =
      searchParams.get('recovery') === '1'

    const recoveryHashDetected =
      typeof window !== 'undefined' &&
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
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!isMounted) {
            return
          }

          if (
            event === 'PASSWORD_RECOVERY' ||
            session
          ) {
            setMode('recovery')
            setErrorMessage('')
            setSuccessMessage('')
          }
        },
      )

      unsubscribe = () =>
        subscription.unsubscribe()

      void supabase.auth
        .getSession()
        .then(({ data, error }) => {
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
            setMode('recovery')
          }
        })
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

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    clearMessages()
    setIsLoading(true)

    try {
      const response = await fetch(
        '/api/auth/login',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      )

      const result =
        (await response.json()) as LoginApiResponse

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.error ??
            'E-mail ou senha inválidos.',
        )

        return
      }

      router.replace(redirectTo)
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
      email.trim().toLowerCase()

    if (!normalizedEmail) {
      setErrorMessage(
        'Digite seu e-mail antes de solicitar a recuperação.',
      )

      return
    }

    setIsSendingRecovery(true)

    try {
      const supabase =
        getBrowserSupabaseClient()

      const recoveryUrl =
        `${window.location.origin}/login?recovery=1`

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo: recoveryUrl,
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
      setIsSendingRecovery(false)
    }
  }

  async function handleUpdatePassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    clearMessages()

    if (newPassword.length < 8) {
      setErrorMessage(
        'A nova senha deve possuir pelo menos 8 caracteres.',
      )

      return
    }

    if (
      newPassword !== confirmNewPassword
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

      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        })

      if (error) {
        setErrorMessage(
          'Não foi possível atualizar a senha. O link pode ter expirado.',
        )

        return
      }

      await supabase.auth.signOut()

      setNewPassword('')
      setConfirmNewPassword('')
      setPassword('')
      setMode('login')

      setSuccessMessage(
        'Senha atualizada. Entre novamente com sua nova senha.',
      )

      router.replace('/login')
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#081c2e] px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
            EduData IA
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            {mode === 'recovery'
              ? 'Redefinir senha'
              : 'Acessar plataforma'}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {mode === 'recovery'
              ? 'Crie uma nova senha para continuar acessando o ecossistema EDI.'
              : 'Entre com suas credenciais para acessar o ecossistema EDI.'}
          </p>
        </div>

        {mode === 'login' ? (
          <form
            onSubmit={handleLogin}
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
                onChange={(event) =>
                  setEmail(event.target.value)
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
                    isSendingRecovery ||
                    isLoading
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
                onChange={(event) =>
                  setPassword(
                    event.target.value,
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
                isLoading ||
                isSendingRecovery
              }
              className="w-full rounded-xl bg-[#081c2e] px-4 py-3 font-semibold text-white transition hover:bg-[#0d2b45] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? 'Entrando...'
                : 'Entrar'}
            </button>
          </form>
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
                onChange={(event) =>
                  setNewPassword(
                    event.target.value,
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
                value={confirmNewPassword}
                onChange={(event) =>
                  setConfirmNewPassword(
                    event.target.value,
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
              className="w-full rounded-xl bg-[#081c2e] px-4 py-3 font-semibold text-white transition hover:bg-[#0d2b45] disabled:cursor-not-allowed disabled:opacity-60"
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
                router.replace('/login')
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
'use client'

import Image from 'next/image'
import Link from 'next/link'

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

type ContactPreference =
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'no_preference'

type UpgradeContext = {
  featureCode: string | null
  requestedPlanCode: string
  sourceProduct: string
  sourceModule: string | null
  sourcePath: string | null
  returnTo: string
}

type FeatureContent = {
  eyebrow: string
  name: string
  title: string
  description: string
  benefits: readonly string[]
}

type ProfileApiResponse = {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string | null
  }
  profile?: {
    userId: string
    displayName: string | null
    phone: string | null
    role: string
    status: string
    onboardingCompleted: boolean
  }
}

type UpgradeApiResponse = {
  success: boolean
  error?: string
  message?: string
  data?: {
    id: string
    requestedPlanCode: string
    featureCode: string | null
    sourceProduct: string
  }
}

const PROMOTIONAL_PRICE = 'R$ 15,00'
const PROMOTIONAL_PRICE_NUMBER = 15
const PROMOTIONAL_ACCESS_DAYS = 30

const MERCADO_PAGO_PAYMENT_URL =
  'https://mpago.la/2XBhHCe'

const MERCADO_PAGO_LOGO_PATH =
  '/mercado-pago-logo.svg.webp'

const DEFAULT_CONTEXT: UpgradeContext = {
  featureCode: null,
  requestedPlanCode: 'edi_professor_pro',
  sourceProduct: 'agenda_edi',
  sourceModule: null,
  sourcePath: null,
  returnTo: '/agenda',
}

const CONTACT_OPTIONS: readonly {
  value: ContactPreference
  label: string
}[] = [
  {
    value: 'email',
    label: 'E-mail',
  },
  {
    value: 'whatsapp',
    label: 'WhatsApp',
  },
  {
    value: 'phone',
    label: 'Telefone',
  },
  {
    value: 'no_preference',
    label: 'Sem preferência',
  },
]

const OFFER_CONDITIONS = [
  'Acesso individual por 30 dias corridos.',
  'O período começa na data da ativação do plano.',
  'Pagamento único pelo Mercado Pago.',
  'Sem renovação ou cobrança automática.',
  'Ativação manual após confirmação do pagamento.',
  'Oferta destinada a usuários individuais.',
  'Não inclui perfil institucional de coordenação, direção ou gestão.',
  'O valor promocional não garante o mesmo preço em futuras renovações.',
] as const

const FEATURE_CONTENT: Record<
  string,
  FeatureContent
> = {
  'agenda.recurring': {
    eyebrow: 'Automação da rotina',
    name: 'Eventos recorrentes',
    title:
      'Organize compromissos semanais de forma automática',
    description:
      'Configure uma única vez os compromissos que se repetem durante o período letivo e deixe a Agenda Inteligente EDI estruturar as próximas semanas.',
    benefits: [
      'Criação automática de eventos semanais',
      'Menos preenchimento repetitivo',
      'Maior continuidade na rotina pedagógica',
      'Visualização organizada dos compromissos futuros',
    ],
  },

  'agenda.templates': {
    eyebrow: 'Horários-padrão',
    name: 'Horários-padrão reutilizáveis',
    title:
      'Cadastre sua rotina uma vez e aplique quando precisar',
    description:
      'Salve estruturas de horários e utilize modelos para preencher semanas letivas com mais rapidez e consistência.',
    benefits: [
      'Modelos reutilizáveis de horários',
      'Aplicação rápida na semana selecionada',
      'Redução de tarefas manuais',
      'Maior padronização da agenda docente',
    ],
  },

  'agenda.planning': {
    eyebrow: 'Planejamento pedagógico',
    name: 'Planejamento avançado',
    title:
      'Conecte planejamento, turmas e compromissos pedagógicos',
    description:
      'Amplie a organização do trabalho docente com registros estruturados e integrados aos demais módulos da Agenda EDI.',
    benefits: [
      'Planejamento organizado por período',
      'Integração com turmas e agenda',
      'Histórico pedagógico estruturado',
      'Acompanhamento contínuo das ações',
    ],
  },

  'evidences.upload': {
    eyebrow: 'Evidências protegidas',
    name: 'Upload de evidências',
    title:
      'Organize imagens e documentos em um ambiente protegido',
    description:
      'Vincule arquivos aos registros pedagógicos e mantenha as evidências organizadas, rastreáveis e protegidas.',
    benefits: [
      'Upload protegido de documentos',
      'Vínculo com registros pedagógicos',
      'Organização das evidências',
      'Rastreabilidade dos arquivos',
    ],
  },

  'evidences.text': {
    eyebrow: 'Registro pedagógico',
    name: 'Evidências textuais',
    title:
      'Transforme acontecimentos pedagógicos em registros organizados',
    description:
      'Registre observações, resultados e ações desenvolvidas diretamente no fluxo operacional da Agenda Inteligente EDI.',
    benefits: [
      'Registros pedagógicos estruturados',
      'Histórico vinculado à rotina docente',
      'Acompanhamento das ações realizadas',
      'Base organizada para análise posterior',
    ],
  },
}

const DEFAULT_FEATURE_CONTENT: FeatureContent = {
  eyebrow: 'Experiência avançada',
  name: 'Recursos do Professor Digital Pro',
  title:
    'Amplie sua experiência na Plataforma EduData IA',
  description:
    'Ative recursos adicionais para reduzir tarefas manuais, organizar sua rotina e utilizar uma camada mais completa de inteligência educacional.',
  benefits: [
    'Mais automação para sua rotina',
    'Recursos avançados da Agenda EDI',
    'Integração com o Professor Digital',
    'Evolução contínua da experiência',
  ],
}

function normalizeCode(
  value: string | null,
  fallback: string,
): string {
  const normalizedValue =
    value?.trim().toLowerCase() ?? ''

  if (
    normalizedValue &&
    /^[a-z0-9][a-z0-9._-]*$/.test(
      normalizedValue,
    )
  ) {
    return normalizedValue
  }

  return fallback
}

function normalizeOptionalCode(
  value: string | null,
): string | null {
  const normalizedValue =
    value?.trim().toLowerCase() ?? ''

  if (
    normalizedValue &&
    /^[a-z0-9][a-z0-9._-]*$/.test(
      normalizedValue,
    )
  ) {
    return normalizedValue
  }

  return null
}

function normalizeOptionalText(
  value: string | null,
  maximumLength: number,
): string | null {
  const normalizedValue =
    value?.trim() ?? ''

  if (!normalizedValue) {
    return null
  }

  return normalizedValue.slice(
    0,
    maximumLength,
  )
}

function getSafeInternalPath(
  value: string | null,
  fallback: string,
): string {
  if (
    value &&
    value.startsWith('/') &&
    !value.startsWith('//')
  ) {
    return value
  }

  return fallback
}

function readUpgradeContext(): UpgradeContext {
  if (
    typeof window ===
    'undefined'
  ) {
    return DEFAULT_CONTEXT
  }

  const searchParams =
    new URLSearchParams(
      window.location.search,
    )

  const featureCode =
    normalizeOptionalCode(
      searchParams.get('feature'),
    )

  const requestedPlanCode =
    normalizeCode(
      searchParams.get(
        'requestedPlan',
      ),
      'edi_professor_pro',
    )

  const sourceProduct =
    normalizeCode(
      searchParams.get('product'),
      'agenda_edi',
    )

  const sourceModule =
    normalizeOptionalCode(
      searchParams.get('module'),
    )

  const sourcePath =
    normalizeOptionalText(
      searchParams.get('source'),
      500,
    )

  const returnTo =
    getSafeInternalPath(
      searchParams.get('returnTo'),
      sourcePath?.startsWith('/')
        ? sourcePath
        : '/agenda',
    )

  return {
    featureCode,
    requestedPlanCode,
    sourceProduct,
    sourceModule,
    sourcePath,
    returnTo,
  }
}

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof Error
    ? error.message
    : fallbackMessage
}

export default function UpgradePage() {
  const [
    context,
    setContext,
  ] = useState<UpgradeContext>(
    DEFAULT_CONTEXT,
  )

  const [
    displayName,
    setDisplayName,
  ] = useState('')

  const [
    payerName,
    setPayerName,
  ] = useState('')

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    phone,
    setPhone,
  ] = useState('')

  const [
    contactPreference,
    setContactPreference,
  ] =
    useState<ContactPreference>(
      'email',
    )

  const [
    commercialConsent,
    setCommercialConsent,
  ] = useState(false)

  const [
    offerAccepted,
    setOfferAccepted,
  ] = useState(false)

  const [
    isLoadingProfile,
    setIsLoadingProfile,
  ] = useState(true)

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    authenticationRequired,
    setAuthenticationRequired,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [
    requestId,
    setRequestId,
  ] = useState('')

  useEffect(() => {
    setContext(
      readUpgradeContext(),
    )
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setIsLoadingProfile(true)
      setErrorMessage('')

      try {
        const response =
          await fetch(
            '/api/profile',
            {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            },
          )

        const result =
          (await response.json()) as
            ProfileApiResponse

        if (!isMounted) {
          return
        }

        if (
          response.status === 401
        ) {
          setAuthenticationRequired(
            true,
          )

          return
        }

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ??
              'Não foi possível carregar seu perfil.',
          )
        }

        const profileName =
          result.profile
            ?.displayName?.trim() ??
          ''

        setDisplayName(profileName)
        setPayerName(profileName)

        setEmail(
          result.user?.email ?? '',
        )

        setPhone(
          result.profile?.phone ?? '',
        )

        if (
          result.profile?.phone
        ) {
          setContactPreference(
            'whatsapp',
          )
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getErrorMessage(
            error,
            'Não foi possível carregar os dados para contato.',
          ),
        )
      } finally {
        if (isMounted) {
          setIsLoadingProfile(
            false,
          )
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const featureContent =
    useMemo(() => {
      if (
        context.featureCode
      ) {
        return (
          FEATURE_CONTENT[
            context.featureCode
          ] ?? {
            ...DEFAULT_FEATURE_CONTENT,
            name:
              context.featureCode,
          }
        )
      }

      return DEFAULT_FEATURE_CONTENT
    }, [context.featureCode])

  const loginHref =
    useMemo(() => {
      const currentUpgradePath =
        typeof window !==
        'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/upgrade'

      return (
        `/login?redirectTo=` +
        encodeURIComponent(
          currentUpgradePath,
        )
      )
    }, [])

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')
    setRequestId('')

    if (!payerName.trim()) {
      setErrorMessage(
        'Informe o nome que será utilizado no pagamento.',
      )

      return
    }

    if (!offerAccepted) {
      setErrorMessage(
        'Confirme que leu e aceitou as condições da oferta promocional.',
      )

      return
    }

    if (!commercialConsent) {
      setErrorMessage(
        'Confirme a autorização para contato sobre o upgrade.',
      )

      return
    }

    if (
      contactPreference ===
        'email' &&
      !email.trim()
    ) {
      setErrorMessage(
        'Informe um e-mail para contato.',
      )

      return
    }

    if (
      (
        contactPreference ===
          'phone' ||
        contactPreference ===
          'whatsapp'
      ) &&
      !phone.trim()
    ) {
      setErrorMessage(
        'Informe um telefone para contato.',
      )

      return
    }

    setIsSubmitting(true)

    try {
      const response =
        await fetch(
          '/api/commercial/upgrade-requests',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              requestedPlanCode:
                context
                  .requestedPlanCode,

              featureCode:
                context.featureCode,

              sourceProduct:
                context.sourceProduct,

              sourceModule:
                context.sourceModule,

              sourcePath:
                context.sourcePath,

              contactPreference,

              contactEmail:
                email.trim() || null,

              contactPhone:
                phone.trim() || null,

              commercialContactConsent:
                true,

              sourceContext: {
                origin:
                  'upgrade_page',
                pageVersion:
                  'v1.3',
                requestedFeature:
                  context
                    .featureCode ??
                  'general',
                returnTo:
                  context.returnTo,
                offerCode:
                  'professor_pro_launch_15_30d',
                offerPrice:
                  PROMOTIONAL_PRICE_NUMBER,
                offerCurrency:
                  'BRL',
                accessDays:
                  PROMOTIONAL_ACCESS_DAYS,
                paymentMethod:
                  'mercado_pago_payment_link',
                paymentProvider:
                  'mercado_pago',
                payerName:
                  payerName.trim(),
                termsAccepted:
                  true,
                automaticRenewal:
                  false,
              },
            }),
          },
        )

      const result =
        (await response.json()) as
          UpgradeApiResponse

      if (
        response.status === 401
      ) {
        setAuthenticationRequired(
          true,
        )

        return
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            'Não foi possível registrar sua solicitação.',
        )
      }

      setSuccessMessage(
        'Sua solicitação foi registrada. Agora utilize o botão abaixo para realizar o pagamento de R$ 15,00 no Mercado Pago.',
      )

      setRequestId(
        result.data?.id ?? '',
      )
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Não foi possível registrar sua solicitação.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="relative overflow-hidden border-b border-white/10 bg-[#071827] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-cyan-300/15" />

          <div className="absolute right-10 top-10 h-48 w-48 rounded-full border border-cyan-300/10" />

          <div className="absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-l from-cyan-300/40 to-transparent" />

          <div className="absolute bottom-0 right-[22%] h-32 w-px bg-gradient-to-t from-cyan-300/30 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-12 lg:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
                EIOS — Experiência comercial
              </p>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Professor Pro com Agenda
                Inteligente EDI
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Ative recursos avançados
                para organizar sua rotina,
                planejar o trabalho docente
                e registrar evidências
                pedagógicas em um único
                ecossistema.
              </p>
            </div>

            <Link
              href={context.returnTo}
              className="inline-flex min-h-12 w-fit items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Voltar para a Agenda
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:py-12">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-cyan-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-cyan-200/70" />

            <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0B7491]" />
          </div>

          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0B7491]">
                  Oferta promocional
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Professor Digital Pro
                </p>
              </div>

              <div className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2">
                <p className="text-xs font-bold text-[#075E75]">
                  Primeiros usuários
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-[1.5rem] border border-cyan-200 bg-[#071827] px-6 py-6 text-white sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Acesso por 30 dias
              </p>

              <div className="mt-3 flex flex-wrap items-end gap-3">
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {PROMOTIONAL_PRICE}
                </p>

                <p className="pb-1 text-sm font-semibold text-slate-300">
                  pagamento único
                </p>
              </div>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                Sem assinatura e sem
                renovação automática nesta
                fase inicial. A ativação será
                realizada após a confirmação
                do pagamento.
              </p>
            </div>

            <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-[#071827] sm:text-4xl">
              {featureContent.title}
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {
                featureContent.description
              }
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {featureContent.benefits.map(
                (
                  benefit,
                  index,
                ) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-white text-[10px] font-bold text-[#0B7491]"
                    >
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </span>

                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      {benefit}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Condições da promoção
              </p>

              <div className="mt-4 grid gap-3">
                {OFFER_CONDITIONS.map(
                  (
                    condition,
                    index,
                  ) => (
                    <div
                      key={condition}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-[10px] font-bold text-[#0B7491]"
                      >
                        {index + 1}
                      </span>

                      <p className="text-sm leading-6 text-slate-600">
                        {condition}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="h-1 w-16 bg-[#0B7491]" />

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
            Ativação promocional
          </p>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#071827]">
            Registre seu interesse
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            A solicitação será vinculada
            à sua conta antes de liberar
            o acesso ao pagamento.
          </p>

          {isLoadingProfile ? (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6">
              <p className="text-sm font-semibold text-slate-600">
                Carregando seus dados de
                acesso...
              </p>
            </div>
          ) : null}

          {authenticationRequired ? (
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5">
              <p className="text-sm font-bold text-amber-900">
                Entre na plataforma para
                continuar
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                A solicitação e o
                pagamento precisam ser
                vinculados à conta que
                receberá o plano.
              </p>

              <Link
                href={loginHref}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2B43] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Entrar na plataforma
              </Link>
            </div>
          ) : null}

          {!isLoadingProfile &&
          !authenticationRequired &&
          !successMessage ? (
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="account-name"
                  className="block text-sm font-bold text-slate-800"
                >
                  Nome da conta
                </label>

                <input
                  id="account-name"
                  type="text"
                  value={displayName}
                  readOnly
                  placeholder="Nome não informado no perfil"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="payer-name"
                  className="block text-sm font-bold text-slate-800"
                >
                  Nome utilizado no
                  pagamento
                </label>

                <input
                  id="payer-name"
                  type="text"
                  value={payerName}
                  onChange={event =>
                    setPayerName(
                      event.target.value,
                    )
                  }
                  autoComplete="name"
                  maxLength={150}
                  placeholder="Nome completo do pagador"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Use o mesmo nome que
                  aparecerá no comprovante
                  para facilitar a
                  conferência.
                </p>
              </div>

              <div>
                <label
                  htmlFor="upgrade-email"
                  className="block text-sm font-bold text-slate-800"
                >
                  E-mail da conta
                </label>

                <input
                  id="upgrade-email"
                  type="email"
                  value={email}
                  onChange={event =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label
                  htmlFor="upgrade-phone"
                  className="block text-sm font-bold text-slate-800"
                >
                  Telefone ou WhatsApp
                </label>

                <input
                  id="upgrade-phone"
                  type="tel"
                  value={phone}
                  onChange={event =>
                    setPhone(
                      event.target.value,
                    )
                  }
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <fieldset>
                <legend className="text-sm font-bold text-slate-800">
                  Preferência de contato
                </legend>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {CONTACT_OPTIONS.map(
                    option => (
                      <label
                        key={
                          option.value
                        }
                        className={[
                          'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition',
                          contactPreference ===
                          option.value
                            ? 'border-cyan-300 bg-cyan-50 text-[#064E63]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="contactPreference"
                          value={
                            option.value
                          }
                          checked={
                            contactPreference ===
                            option.value
                          }
                          onChange={() =>
                            setContactPreference(
                              option.value,
                            )
                          }
                          className="h-4 w-4 accent-[#0B7491]"
                        />

                        <span className="text-sm font-semibold">
                          {
                            option.label
                          }
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </fieldset>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4">
                <input
                  type="checkbox"
                  checked={offerAccepted}
                  onChange={event =>
                    setOfferAccepted(
                      event.target
                        .checked,
                    )
                  }
                  className="mt-1 h-4 w-4 shrink-0 accent-[#0B7491]"
                />

                <span className="text-sm leading-6 text-slate-700">
                  Li e aceito as
                  condições da oferta de{' '}
                  <strong>
                    {PROMOTIONAL_PRICE}
                  </strong>{' '}
                  por 30 dias, com
                  pagamento único e sem
                  renovação automática.
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="checkbox"
                  checked={
                    commercialConsent
                  }
                  onChange={event =>
                    setCommercialConsent(
                      event.target
                        .checked,
                    )
                  }
                  className="mt-1 h-4 w-4 shrink-0 accent-[#0B7491]"
                />

                <span className="text-sm leading-6 text-slate-600">
                  Autorizo a EduData IA
                  a entrar em contato
                  para confirmar o
                  pagamento, realizar a
                  ativação e prestar as
                  orientações iniciais.
                </span>
              </label>

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4"
                >
                  <p className="text-sm font-semibold leading-6 text-red-700">
                    {errorMessage}
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2B43] focus:outline-none focus:ring-2 focus:ring-[#0B7491] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Registrando solicitação...'
                  : 'Registrar e continuar para o pagamento'}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                O envio do formulário
                não ativa o plano e não
                realiza cobrança
                automática.
              </p>
            </form>
          ) : null}

          {!isLoadingProfile &&
          !authenticationRequired &&
          successMessage ? (
            <div className="mt-7 space-y-5">
              <div
                role="status"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5"
              >
                <p className="text-sm font-bold text-emerald-800">
                  Solicitação registrada
                </p>

                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  {successMessage}
                </p>

                {requestId ? (
                  <p className="mt-2 text-xs text-emerald-700">
                    A solicitação está
                    vinculada à sua conta.
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Valor da cobrança
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-[#071827]">
                  {PROMOTIONAL_PRICE}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Professor Pro —
                  Agenda Inteligente EDI
                  por 30 dias.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col items-center px-5 py-6 text-center">
                  <Image
                    src={
                      MERCADO_PAGO_LOGO_PATH
                    }
                    alt="Mercado Pago"
                    width={420}
                    height={140}
                    className="h-auto w-full max-w-[260px] object-contain"
                  />

                  <p className="mt-5 text-sm font-bold text-[#071827]">
                    Pagamento realizado no
                    ambiente do Mercado Pago
                  </p>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                    Ao continuar, uma nova
                    página será aberta para
                    que você confira o valor
                    e escolha o meio de
                    pagamento disponível.
                  </p>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Link de pagamento
                  </p>

                  <a
                    href={
                      MERCADO_PAGO_PAYMENT_URL
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex break-all text-sm font-bold text-[#0B7491] underline decoration-cyan-300 underline-offset-4 transition hover:text-[#075E75] focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    mpago.la/2XBhHCe
                  </a>
                </div>
              </div>

              <a
                href={
                  MERCADO_PAGO_PAYMENT_URL
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[#0B7491] px-5 py-4 text-center text-sm font-bold text-white transition hover:bg-[#075E75] focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Pagar R$ 15,00 no Mercado
                Pago
              </a>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5">
                <p className="text-sm font-bold text-amber-900">
                  Como concluir
                </p>

                <ol className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
                  <li>
                    1. Toque no botão de
                    pagamento.
                  </li>

                  <li>
                    2. Confira o valor de
                    R$ 15,00.
                  </li>

                  <li>
                    3. Escolha o meio de
                    pagamento disponível.
                  </li>

                  <li>
                    4. Confirme os dados
                    antes de finalizar.
                  </li>

                  <li>
                    5. Conclua o
                    pagamento no Mercado
                    Pago.
                  </li>
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
                <p className="text-sm font-bold text-[#071827]">
                  Ativação manual
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Após a confirmação do
                  pagamento, a equipe da
                  EduData IA verificará
                  os dados e realizará a
                  ativação do Professor
                  Pro. O prazo de 30 dias
                  começará na data da
                  ativação.
                </p>
              </div>

              <Link
                href={context.returnTo}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Voltar para a Agenda
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
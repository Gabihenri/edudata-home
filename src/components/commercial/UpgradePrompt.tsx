import Link from 'next/link'

type UpgradePromptProps = {
  featureCode: string

  featureName?: string | null

  currentPlanName?: string | null

  requestedPlanCode?: string

  requestedPlanName?: string

  sourceProduct?: string

  sourceModule?: string

  sourcePath?: string

  returnHref?: string

  compact?: boolean

  className?: string
}

type FeatureMarketingContent = {
  eyebrow: string

  title: string

  description: string

  benefits: readonly string[]
}

const FEATURE_MARKETING:
  Record<
    string,
    FeatureMarketingContent
  > = {
    'agenda.recurring': {
      eyebrow:
        'Automação da rotina',

      title:
        'Transforme compromissos repetitivos em uma agenda automática',

      description:
        'Crie uma única configuração e organize todos os compromissos que se repetem durante as semanas letivas.',

      benefits: [
        'Criação automática de eventos semanais',
        'Redução do preenchimento manual',
        'Organização contínua da rotina pedagógica',
      ],
    },

    'agenda.templates': {
      eyebrow:
        'Horários-padrão',

      title:
        'Salve sua rotina uma vez e reutilize sempre que precisar',

      description:
        'Cadastre horários-padrão e aplique rapidamente sua estrutura semanal, sem reconstruir cada compromisso.',

      benefits: [
        'Modelos reutilizáveis de horários',
        'Aplicação rápida na semana selecionada',
        'Mais consistência na organização docente',
      ],
    },

    'agenda.planning': {
      eyebrow:
        'Planejamento pedagógico',

      title:
        'Amplie seu planejamento com uma estrutura integrada à agenda',

      description:
        'Conecte objetivos, turmas, registros e compromissos em um fluxo pedagógico contínuo.',

      benefits: [
        'Planejamento organizado por período',
        'Integração com turmas e agenda',
        'Histórico estruturado do trabalho docente',
      ],
    },

    'evidences.upload': {
      eyebrow:
        'Evidências protegidas',

      title:
        'Organize arquivos pedagógicos em um ambiente protegido',

      description:
        'Vincule imagens e documentos aos seus registros, mantendo rastreabilidade e proteção das evidências.',

      benefits: [
        'Upload protegido de imagens e documentos',
        'Vínculo com registros pedagógicos',
        'Organização segura das evidências',
      ],
    },

    'evidences.text': {
      eyebrow:
        'Registro de evidências',

      title:
        'Transforme acontecimentos pedagógicos em evidências organizadas',

      description:
        'Registre observações e resultados diretamente no fluxo de trabalho da Agenda Inteligente EDI.',

      benefits: [
        'Registros pedagógicos estruturados',
        'Histórico vinculado à rotina docente',
        'Base organizada para acompanhamento',
      ],
    },
  }

const DEFAULT_MARKETING:
  FeatureMarketingContent = {
    eyebrow:
      'Recurso avançado',

    title:
      'Amplie sua experiência com o Professor Digital Pro',

    description:
      'Ative recursos adicionais para reduzir tarefas manuais, organizar sua rotina e aprofundar o uso da inteligência educacional.',

    benefits: [
      'Mais automação para sua rotina',
      'Recursos avançados da Agenda EDI',
      'Experiência integrada ao Professor Digital',
    ],
  }

function normalizeFeatureCode(
  featureCode: string,
): string {
  return featureCode
    .trim()
    .toLowerCase()
}

function buildUpgradeHref({
  featureCode,
  requestedPlanCode,
  sourceProduct,
  sourceModule,
  sourcePath,
  returnHref,
}: {
  featureCode: string

  requestedPlanCode: string

  sourceProduct: string

  sourceModule?: string

  sourcePath?: string

  returnHref?: string
}): string {
  const searchParams =
    new URLSearchParams()

  searchParams.set(
    'feature',
    featureCode,
  )

  searchParams.set(
    'requestedPlan',
    requestedPlanCode,
  )

  searchParams.set(
    'product',
    sourceProduct,
  )

  if (sourceModule) {
    searchParams.set(
      'module',
      sourceModule,
    )
  }

  if (sourcePath) {
    searchParams.set(
      'source',
      sourcePath,
    )
  }

  if (returnHref) {
    searchParams.set(
      'returnTo',
      returnHref,
    )
  }

  return `/upgrade?${searchParams.toString()}`
}

export function UpgradePrompt({
  featureCode,

  featureName,

  currentPlanName,

  requestedPlanCode =
    'edi_professor_pro',

  requestedPlanName =
    'EDI Professor Pro',

  sourceProduct =
    'agenda_edi',

  sourceModule,

  sourcePath,

  returnHref,

  compact = false,

  className,
}: UpgradePromptProps) {
  const normalizedFeatureCode =
    normalizeFeatureCode(
      featureCode,
    )

  const marketing =
    FEATURE_MARKETING[
      normalizedFeatureCode
    ] ??
    DEFAULT_MARKETING

  const upgradeHref =
    buildUpgradeHref({
      featureCode:
        normalizedFeatureCode,

      requestedPlanCode,

      sourceProduct,

      sourceModule,

      sourcePath,

      returnHref,
    })

  const containerClassName = [
    'relative overflow-hidden',
    'rounded-[1.75rem]',
    'border border-cyan-200',
    'bg-white',
    'shadow-[0_24px_70px_-42px_rgba(7,24,39,0.55)]',
    compact
      ? 'p-5 sm:p-6'
      : 'p-6 sm:p-8 lg:p-10',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <aside
      className={
        containerClassName
      }
      aria-labelledby={
        `upgrade-${normalizedFeatureCode}`
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-cyan-200/60" />

        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-cyan-300/40" />

        <div className="absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-l from-cyan-300/70 to-transparent" />

        <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0B7491]" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              {marketing.eyebrow}
            </p>

            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Disponível no plano Pro
            </p>
          </div>

          <div className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2">
            <p className="text-xs font-bold text-[#075E75]">
              Upgrade recomendado
            </p>
          </div>
        </div>

        <div
          className={
            compact
              ? 'mt-5'
              : 'mt-7'
          }
        >
          <h2
            id={
              `upgrade-${normalizedFeatureCode}`
            }
            className={
              compact
                ? 'max-w-3xl text-2xl font-bold leading-tight tracking-tight text-[#071827]'
                : 'max-w-4xl text-3xl font-bold leading-tight tracking-tight text-[#071827] sm:text-4xl'
            }
          >
            {marketing.title}
          </h2>

          <p
            className={
              compact
                ? 'mt-3 max-w-3xl text-sm leading-6 text-slate-600'
                : 'mt-4 max-w-4xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8'
            }
          >
            {marketing.description}
          </p>
        </div>

        <div
          className={
            compact
              ? 'mt-5 grid gap-3 sm:grid-cols-2'
              : 'mt-7 grid gap-4 sm:grid-cols-2'
          }
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Seu plano atual
            </p>

            <p className="mt-2 text-base font-bold text-slate-800">
              {currentPlanName ??
                'EDI Gratuito'}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">
              Plano recomendado
            </p>

            <p className="mt-2 text-base font-bold text-[#064E63]">
              {requestedPlanName}
            </p>
          </div>
        </div>

        <div
          className={
            compact
              ? 'mt-5'
              : 'mt-7'
          }
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            O que você poderá fazer
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {marketing.benefits.map(
              (
                benefit,
                index,
              ) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-[10px] font-bold text-[#0B7491]"
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
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-[#071827] px-5 py-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              Recurso solicitado
            </p>

            <p className="mt-2 text-base font-bold">
              {featureName ??
                normalizedFeatureCode}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:mt-0 sm:min-w-[220px]">
            <Link
              href={upgradeHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-center text-sm font-bold text-[#071827] transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#071827]"
            >
              Solicitar upgrade
            </Link>

            {returnHref ? (
              <Link
                href={returnHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-5 py-2.5 text-center text-sm font-semibold text-slate-200 transition hover:border-white/40 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Continuar no plano atual
              </Link>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          A solicitação não realiza cobrança
          automática. Os dados serão usados
          apenas para apresentar as condições
          disponíveis para o upgrade.
        </p>
      </div>
    </aside>
  )
}

export default UpgradePrompt
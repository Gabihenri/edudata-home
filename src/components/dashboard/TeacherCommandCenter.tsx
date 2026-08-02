'use client'

import {
  useMemo,
} from 'react'

import {
  TeacherPerformanceSnapshotPanel,
} from '@/components/agenda/TeacherPerformanceSnapshotPanel'

import {
  useTeacherCommandCenter,
  type TeacherCommandCenterStatus,
} from '@/lib/agenda/hooks/useTeacherCommandCenter'

import type {
  TeacherSnapshotContext,
  TeacherSnapshotRole,
} from '@/lib/agenda/services/teacher-intelligence.service'

export type TeacherCommandCenterProps = {
  userName?: string | null

  role?: TeacherSnapshotRole

  teacherContext?: TeacherSnapshotContext

  autoLoad?: boolean

  className?: string
}

type StatusPresentation = {
  label: string
  description: string
  containerClassName: string
  markerClassName: string
}

const STATUS_PRESENTATION:
  Record<
    TeacherCommandCenterStatus,
    StatusPresentation
  > = {
    idle: {
      label:
        'Aguardando processamento',

      description:
        'A inteligência docente será gerada a partir dos registros autorizados da Agenda.',

      containerClassName:
        'border-slate-200 bg-slate-50 text-slate-700',

      markerClassName:
        'bg-slate-400',
    },

    loading_agenda: {
      label:
        'Carregando inteligência da Agenda',

      description:
        'Recuperando os indicadores operacionais já processados pelo EIOS.',

      containerClassName:
        'border-cyan-200 bg-cyan-50 text-[#075F78]',

      markerClassName:
        'bg-cyan-600',
    },

    loading_snapshot: {
      label:
        'Carregando ciclo operacional',

      description:
        'Reunindo planejamentos, objetivos, aulas e evidências autorizadas.',

      containerClassName:
        'border-cyan-200 bg-cyan-50 text-[#075F78]',

      markerClassName:
        'bg-cyan-600',
    },

    processing: {
      label:
        'Processando inteligência docente',

      description:
        'Executando as capacidades da Educational Capability Platform.',

      containerClassName:
        'border-blue-200 bg-blue-50 text-blue-800',

      markerClassName:
        'bg-blue-600',
    },

    success: {
      label:
        'Inteligência atualizada',

      description:
        'O snapshot operacional está disponível para consulta.',

      containerClassName:
        'border-emerald-200 bg-emerald-50 text-emerald-800',

      markerClassName:
        'bg-emerald-600',
    },

    error: {
      label:
        'Falha no processamento',

      description:
        'Não foi possível concluir a inteligência docente neste momento.',

      containerClassName:
        'border-red-200 bg-red-50 text-red-800',

      markerClassName:
        'bg-red-600',
    },

    cancelled: {
      label:
        'Processamento cancelado',

      description:
        'A geração foi interrompida antes da conclusão.',

      containerClassName:
        'border-amber-200 bg-amber-50 text-amber-900',

      markerClassName:
        'bg-amber-500',
    },
  }

function normalizeText(
  value:
    string
    | null
    | undefined,
): string {
  if (
    typeof value !==
      'string'
  ) {
    return ''
  }

  return value.trim()
}

function formatDateTime(
  value:
    string
    | null,
): string {
  if (!value) {
    return (
      'Ainda não atualizado'
    )
  }

  const date =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return (
      'Data não disponível'
    )
  }

  return (
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        dateStyle:
          'short',

        timeStyle:
          'short',
      },
    ).format(
      date,
    )
  )
}

function getGreeting(): string {
  const hour =
    new Date()
      .getHours()

  if (
    hour >= 5
    && hour < 12
  ) {
    return 'Bom dia'
  }

  if (
    hour >= 12
    && hour < 18
  ) {
    return 'Boa tarde'
  }

  return 'Boa noite'
}

function getCurrentDateLabel(): string {
  const formattedDate =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        weekday:
          'long',

        day:
          '2-digit',

        month:
          'long',

        year:
          'numeric',
      },
    ).format(
      new Date(),
    )

  return (
    formattedDate
      .charAt(0)
      .toUpperCase()
    + formattedDate.slice(
      1,
    )
  )
}

function ProgressPanel({
  status,
  progress,
  stepLabel,
}: {
  status:
    TeacherCommandCenterStatus

  progress:
    number

  stepLabel:
    string | null
}) {
  const presentation =
    STATUS_PRESENTATION[
      status
    ]

  const normalizedProgress =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(
          progress,
        ),
      ),
    )

  return (
    <section
      aria-live="polite"
      aria-label="Estado da inteligência docente"
      className={`
        rounded-2xl
        border
        p-4
        ${presentation.containerClassName}
      `}
    >
      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <span
            aria-hidden="true"
            className={`
              mt-1.5
              h-2.5
              w-2.5
              shrink-0
              rounded-full
              ${presentation.markerClassName}
            `}
          />

          <div>
            <p
              className="
                text-sm
                font-bold
              "
            >
              {
                stepLabel
                || presentation.label
              }
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                opacity-80
              "
            >
              {
                presentation.description
              }
            </p>
          </div>
        </div>

        <span
          className="
            font-mono
            text-sm
            font-bold
          "
        >
          {
            normalizedProgress
          }%
        </span>
      </div>

      <div
        className="
          mt-4
          h-2
          overflow-hidden
          rounded-full
          bg-black/10
        "
      >
        <div
          className="
            h-full
            rounded-full
            bg-current
            transition-[width]
            duration-300
          "
          style={{
            width:
              `${normalizedProgress}%`,
          }}
        />
      </div>
    </section>
  )
}

function OperationalSummary({
  totalPlanning,
  totalObjectives,
  totalLessons,
  totalEvidences,
}: {
  totalPlanning: number
  totalObjectives: number
  totalLessons: number
  totalEvidences: number
}) {
  const metrics = [
    {
      code:
        '01',

      label:
        'Planejamentos',

      value:
        totalPlanning,

      href:
        '/agenda/planejamento',
    },
    {
      code:
        '02',

      label:
        'Objetivos',

      value:
        totalObjectives,

      href:
        '/agenda/objetivos',
    },
    {
      code:
        '03',

      label:
        'Aulas',

      value:
        totalLessons,

      href:
        '/agenda/aulas',
    },
    {
      code:
        '04',

      label:
        'Evidências',

      value:
        totalEvidences,

      href:
        '/agenda/evidencias',
    },
  ]

  return (
    <section
      aria-labelledby="teacher-command-center-records"
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      <header
        className="
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-7
        "
      >
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.18em]
            text-cyan-700
          "
        >
          Base operacional
        </p>

        <h2
          id="teacher-command-center-records"
          className="
            mt-1
            text-xl
            font-bold
            text-slate-950
          "
        >
          Registros analisados
        </h2>

        <p
          className="
            mt-2
            max-w-3xl
            text-sm
            leading-6
            text-slate-600
          "
        >
          Dados autorizados utilizados pelo EIOS para
          produzir o snapshot docente.
        </p>
      </header>

      <div
        className="
          grid
          gap-px
          bg-slate-200
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {
          metrics.map(
            metric => (
              <a
                key={
                  metric.code
                }
                href={
                  metric.href
                }
                className="
                  group
                  bg-white
                  p-5
                  transition
                  hover:bg-cyan-50/60
                  sm:p-6
                "
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <span
                    className="
                      font-mono
                      text-xs
                      font-bold
                      tracking-[0.14em]
                      text-cyan-700
                    "
                  >
                    {
                      metric.code
                    }
                  </span>

                  <span
                    aria-hidden="true"
                    className="
                      h-2.5
                      w-2.5
                      rotate-45
                      border
                      border-cyan-500
                      transition
                      group-hover:bg-cyan-500
                    "
                  />
                </div>

                <p
                  className="
                    mt-6
                    text-3xl
                    font-bold
                    tracking-tight
                    text-slate-950
                  "
                >
                  {
                    new Intl.NumberFormat(
                      'pt-BR',
                    ).format(
                      metric.value,
                    )
                  }
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  {
                    metric.label
                  }
                </p>

                <p
                  className="
                    mt-5
                    text-sm
                    font-semibold
                    text-cyan-800
                    transition
                    group-hover:translate-x-1
                  "
                >
                  Consultar módulo
                </p>
              </a>
            ),
          )
        }
      </div>
    </section>
  )
}

export default function TeacherCommandCenter({
  userName = null,
  role = 'professor',
  teacherContext,
  autoLoad = true,
  className = '',
}: TeacherCommandCenterProps) {
  const commandCenter =
    useTeacherCommandCenter({
      autoLoad,

      role,

      teacherContext: {
        ...teacherContext,

        name:
          teacherContext
            ?.name
          ?? userName,
      },
    })

  const {
    snapshot,
    operationalSummary,
    status,
    currentStep,
    loading,
    refreshing,
    error,
    generatedAt,
    progress,
    load,
    reload,
    cancel,
  } = commandCenter

  const normalizedUserName =
    normalizeText(
      snapshot
        ?.teacher
        .name
      ?? teacherContext
        ?.name
      ?? userName,
    )

  const title =
    normalizedUserName
      ? `${getGreeting()}, ${normalizedUserName}.`
      : `${getGreeting()}.`

  const statusPresentation =
    STATUS_PRESENTATION[
      status
    ]

  const stepLabel =
    currentStep
      ?.label
    ?? null

  const isProcessing =
    loading
    || refreshing

  const summaryMetrics =
    useMemo(
      () => ({
        totalPlanning:
          operationalSummary
            ?.totalPlanning
          ?? 0,

        totalObjectives:
          operationalSummary
            ?.totalObjectives
          ?? 0,

        totalLessons:
          operationalSummary
            ?.totalLessons
          ?? 0,

        totalEvidences:
          operationalSummary
            ?.totalEvidences
          ?? 0,
      }),
      [
        operationalSummary,
      ],
    )

  return (
    <div
      className={`
        space-y-6
        sm:space-y-8
        ${className}
      `}
    >
      <section
        aria-labelledby="teacher-command-center-title"
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-slate-800
          bg-[#071827]
          text-white
          shadow-[0_28px_90px_-45px_rgba(7,24,39,0.9)]
        "
      >
        <div
          className="
            relative
            overflow-hidden
            px-5
            py-7
            sm:px-8
            sm:py-9
          "
        >
          <div
            aria-hidden="true"
            className="
              absolute
              -right-20
              -top-24
              h-64
              w-64
              rotate-12
              border
              border-cyan-400/15
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute
              -bottom-24
              right-20
              h-48
              w-48
              rotate-45
              border
              border-white/10
            "
          />

          <div
            className="
              relative
              z-10
              flex
              flex-col
              gap-7
              xl:flex-row
              xl:items-end
              xl:justify-between
            "
          >
            <div
              className="
                max-w-3xl
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-cyan-300
                "
              >
                Centro Operacional Inteligente
              </p>

              <h1
                id="teacher-command-center-title"
                className="
                  mt-3
                  text-3xl
                  font-bold
                  tracking-tight
                  sm:text-4xl
                "
              >
                {
                  title
                }
              </h1>

              <p
                className="
                  mt-3
                  text-sm
                  font-medium
                  text-slate-300
                  sm:text-base
                "
              >
                {
                  getCurrentDateLabel()
                }
              </p>

              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-300
                "
              >
                Acompanhe sua situação operacional, os pontos
                que exigem atenção e as ações prioritárias
                produzidas pelo EIOS.
              </p>
            </div>

            <div
              className="
                grid
                gap-3
                sm:grid-cols-2
                xl:min-w-[410px]
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-white/15
                  bg-white/5
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.14em]
                    text-slate-400
                  "
                >
                  Score operacional
                </p>

                <p
                  className="
                    mt-2
                    text-4xl
                    font-bold
                    tracking-tight
                  "
                >
                  {
                    snapshot
                      ? Math.round(
                          snapshot
                            .summary
                            .overall_score,
                        )
                      : '--'
                  }
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Escala de 0 a 100
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-white/15
                  bg-white/5
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.14em]
                    text-slate-400
                  "
                >
                  Estado atual
                </p>

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    gap-2
                  "
                >
                  <span
                    aria-hidden="true"
                    className={`
                      h-2.5
                      w-2.5
                      rounded-full
                      ${statusPresentation.markerClassName}
                    `}
                  />

                  <p
                    className="
                      text-sm
                      font-bold
                    "
                  >
                    {
                      statusPresentation.label
                    }
                  </p>
                </div>

                <p
                  className="
                    mt-3
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Atualizado em{' '}
                  {
                    formatDateTime(
                      generatedAt,
                    )
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="
            flex
            flex-col
            gap-3
            border-t
            border-white/10
            bg-black/10
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-8
          "
        >
          <p
            className="
              text-xs
              leading-5
              text-slate-400
            "
          >
            Framework EDI · EIOS · Educational Capability Platform
          </p>

          <div
            className="
              flex
              flex-col
              gap-2
              sm:flex-row
            "
          >
            {
              isProcessing
                ? (
                  <button
                    type="button"
                    onClick={
                      cancel
                    }
                    className="
                      inline-flex
                      min-h-11
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/20
                      bg-white/5
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-white/10
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-cyan-400
                    "
                  >
                    Cancelar processamento
                  </button>
                )
                : (
                  <button
                    type="button"
                    onClick={
                      () => {
                        void (
                          snapshot
                            ? reload()
                            : load()
                        )
                      }
                    }
                    className="
                      inline-flex
                      min-h-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-cyan-500
                      px-4
                      py-2.5
                      text-sm
                      font-bold
                      text-slate-950
                      transition
                      hover:bg-cyan-400
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-cyan-300
                      focus-visible:ring-offset-2
                      focus-visible:ring-offset-slate-950
                    "
                  >
                    {
                      snapshot
                        ? 'Atualizar inteligência'
                        : 'Gerar inteligência docente'
                    }
                  </button>
                )
            }
          </div>
        </div>
      </section>

      {
        (
          isProcessing
          || status === 'error'
          || status === 'cancelled'
        )
          ? (
            <ProgressPanel
              status={
                status
              }
              progress={
                progress
              }
              stepLabel={
                stepLabel
              }
            />
          )
          : null
      }

      {
        operationalSummary
          ? (
            <OperationalSummary
              totalPlanning={
                summaryMetrics
                  .totalPlanning
              }
              totalObjectives={
                summaryMetrics
                  .totalObjectives
              }
              totalLessons={
                summaryMetrics
                  .totalLessons
              }
              totalEvidences={
                summaryMetrics
                  .totalEvidences
              }
            />
          )
          : null
      }

      <TeacherPerformanceSnapshotPanel
        snapshot={
          snapshot
        }
        loading={
          isProcessing
        }
        error={
          error
        }
        onGenerate={
          () => {
            void load()
          }
        }
        onRetry={
          () => {
            void reload()
          }
        }
        onCancel={
          cancel
        }
      />
    </div>
  )
}
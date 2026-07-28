import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

import EDIIntelligencePanel from '@/components/core/intelligence/EDIIntelligencePanel'

type AgendaModuleLink = {
  code: string
  title: string
  description: string
  href: string
  emphasis?: boolean
}

const agendaModules:
  AgendaModuleLink[] = [
    {
      code: '01',
      title: 'Planejamento',
      description:
        'Organize propostas, períodos, metodologias e ações pedagógicas.',
      href:
        '/agenda/planejamento',
      emphasis:
        true,
    },
    {
      code: '02',
      title: 'Objetivos',
      description:
        'Defina e acompanhe objetivos vinculados ao ciclo pedagógico.',
      href:
        '/agenda/objetivos',
    },
    {
      code: '03',
      title: 'Aulas',
      description:
        'Registre a execução do planejamento e acompanhe seu desenvolvimento.',
      href:
        '/agenda/aulas',
    },
    {
      code: '04',
      title: 'Evidências',
      description:
        'Documente o trabalho pedagógico com proteção e rastreabilidade.',
      href:
        '/agenda/evidencias',
    },
    {
      code: '05',
      title: 'Calendário',
      description:
        'Acompanhe compromissos, reuniões, formações e prazos.',
      href:
        '/agenda/calendario',
    },
    {
      code: '06',
      title: 'Histórico',
      description:
        'Consulte versões, exclusões, restaurações e registros de auditoria.',
      href:
        '/agenda/historico',
    },
  ]

export default function AgendaDashboardPage() {
  return (
    <AgendaPageShell
      eyebrow="Centro de Inteligência Pedagógica"
      title="Inteligência EDI"
      description="Acompanhe o ciclo pedagógico, identifique prioridades e acesse as ações recomendadas pelo EIOS a partir dos seus registros autorizados."
    >
      <div
        className="
          space-y-6
          sm:space-y-8
        "
      >
        <EDIIntelligencePanel
          source="agenda"
          title="Inteligência EDI"
          description="Leitura operacional da Agenda Inteligente EDI, produzida pelo EIOS a partir de planejamentos, objetivos, aulas e evidências autorizadas."
          maximumInsights={6}
          maximumRecommendations={6}
        />

        <section
          aria-labelledby="agenda-operational-modules"
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-slate-200
            bg-white
            shadow-[0_20px_70px_-50px_rgba(15,23,42,0.55)]
          "
        >
          <div
            className="
              border-b
              border-slate-100
              px-5
              py-5
              sm:px-7
            "
          >
            <div
              className="
                flex
                flex-col
                gap-3
                lg:flex-row
                lg:items-end
                lg:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-cyan-700
                  "
                >
                  Operação pedagógica
                </p>

                <h2
                  id="agenda-operational-modules"
                  className="
                    mt-1
                    text-xl
                    font-bold
                    tracking-tight
                    text-slate-950
                    sm:text-2xl
                  "
                >
                  Módulos da Agenda
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
                  Acesse os registros que alimentam a análise do EIOS e
                  mantenha o ciclo Planejar, Executar, Evidenciar e Analisar
                  atualizado.
                </p>
              </div>

              <Link
                href="/agenda/indicadores"
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-800
                  transition
                  hover:border-cyan-400
                  hover:text-cyan-800
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-cyan-600
                  focus-visible:ring-offset-2
                "
              >
                Consultar indicadores
              </Link>
            </div>
          </div>

          <div
            className="
              grid
              gap-px
              bg-slate-200
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            {agendaModules.map(
              module => (
                <Link
                  key={module.code}
                  href={module.href}
                  className={`
                    group
                    flex
                    min-h-48
                    flex-col
                    bg-white
                    p-5
                    transition
                    hover:bg-cyan-50/60
                    sm:p-6
                    ${
                      module.emphasis
                        ? 'relative'
                        : ''
                    }
                  `}
                >
                  {module.emphasis ? (
                    <span
                      className="
                        absolute
                        inset-x-0
                        top-0
                        h-1
                        bg-cyan-600
                      "
                    />
                  ) : null}

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
                      {module.code}
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

                  <h3
                    className="
                      mt-6
                      text-lg
                      font-bold
                      text-slate-950
                    "
                  >
                    {module.title}
                  </h3>

                  <p
                    className="
                      mt-2
                      text-sm
                      leading-6
                      text-slate-600
                    "
                  >
                    {module.description}
                  </p>

                  <span
                    className="
                      mt-auto
                      pt-5
                      text-sm
                      font-semibold
                      text-cyan-800
                      transition
                      group-hover:translate-x-1
                    "
                  >
                    Acessar módulo
                  </span>
                </Link>
              ),
            )}
          </div>

          <footer
            className="
              border-t
              border-slate-100
              bg-slate-50/70
              px-5
              py-4
              sm:px-7
            "
          >
            <div
              className="
                flex
                flex-col
                gap-2
                text-xs
                text-slate-500
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p>
                Os registros permanecem sob as regras de acesso,
                privacidade e governança já homologadas.
              </p>

              <p
                className="
                  font-medium
                  text-slate-600
                "
              >
                Framework EDI · EIOS
              </p>
            </div>
          </footer>
        </section>
      </div>
    </AgendaPageShell>
  )
}
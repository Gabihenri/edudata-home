import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

import TeacherCommandCenter from '@/components/dashboard/TeacherCommandCenter'

type AgendaModuleLink = {
  code:
    string

  title:
    string

  description:
    string

  href:
    string

  emphasis?:
    boolean

  intelligence?:
    boolean
}

const agendaModules:
  AgendaModuleLink[] = [
    {
      code:
        '01',

      title:
        'Planejamento',

      description:
        'Organize propostas, períodos, metodologias e ações pedagógicas.',

      href:
        '/agenda/planejamento',

      emphasis:
        true,
    },
    {
      code:
        '02',

      title:
        'Objetivos',

      description:
        'Defina e acompanhe objetivos vinculados ao ciclo pedagógico.',

      href:
        '/agenda/objetivos',
    },
    {
      code:
        '03',

      title:
        'Aulas',

      description:
        'Registre a execução do planejamento e acompanhe seu desenvolvimento.',

      href:
        '/agenda/aulas',
    },
    {
      code:
        '04',

      title:
        'Evidências',

      description:
        'Documente o trabalho pedagógico com proteção e rastreabilidade.',

      href:
        '/agenda/evidencias',
    },
    {
      code:
        '05',

      title:
        'Evidências Inteligentes',

      description:
        'Consulte qualidade, confiabilidade, classificações EDI, revisões humanas e histórico de processamento.',

      href:
        '/agenda/evidencias/inteligencia',

      intelligence:
        true,
    },
    {
      code:
        '06',

      title:
        'Calendário',

      description:
        'Acompanhe compromissos, reuniões, formações e prazos.',

      href:
        '/agenda/calendario',
    },
    {
      code:
        '07',

      title:
        'Histórico',

      description:
        'Consulte versões, exclusões, restaurações e registros de auditoria.',

      href:
        '/agenda/historico',
    },
  ]

export default function AgendaDashboardPage() {
  return (
    <AgendaPageShell
      eyebrow="Centro de Comando Pedagógico"
      title="Agenda Inteligente EDI"
      description="Acompanhe sua situação operacional, identifique prioridades e acesse as recomendações produzidas pelo EIOS a partir dos seus registros autorizados."
    >
      <div
        className="
          space-y-6
          sm:space-y-8
        "
      >
        <TeacherCommandCenter />

        <section
          aria-labelledby="evidence-intelligence-highlight"
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-cyan-200
            bg-[#071827]
            text-white
            shadow-[0_24px_80px_-50px_rgba(8,145,178,0.75)]
          "
        >
          <div
            className="
              grid
              gap-6
              px-5
              py-6
              sm:px-7
              sm:py-7
              lg:grid-cols-[1fr_auto]
              lg:items-center
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-cyan-300
                "
              >
                Evidence Intelligence
              </p>

              <h2
                id="evidence-intelligence-highlight"
                className="
                  mt-2
                  text-2xl
                  font-bold
                  tracking-tight
                  sm:text-3xl
                "
              >
                Evidências Inteligentes v0.1
              </h2>

              <p
                className="
                  mt-3
                  max-w-3xl
                  text-sm
                  leading-6
                  text-slate-300
                "
              >
                Consulte as análises persistidas das evidências pedagógicas,
                acompanhe qualidade, confiabilidade, classificações do
                Framework EDI e situações que exigem revisão humana.
              </p>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  gap-2
                "
              >
                {[
                  'Qualidade',
                  'Confiabilidade',
                  'Classificações EDI',
                  'Revisão humana',
                  'Rastreabilidade',
                ].map(
                  item => (
                    <span
                      key={item}
                      className="
                        rounded-full
                        border
                        border-cyan-300/30
                        bg-cyan-300/10
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-cyan-100
                      "
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
                lg:flex-col
              "
            >
              <Link
                href="/agenda/evidencias/inteligencia"
                className="
                  inline-flex
                  min-h-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-cyan-400
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-[#071827]
                  transition
                  hover:bg-cyan-300
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-cyan-200
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-[#071827]
                "
              >
                Abrir inteligência
              </Link>

              <Link
                href="/agenda/evidencias"
                className="
                  inline-flex
                  min-h-12
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/20
                  bg-white/5
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-white/10
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-white
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-[#071827]
                "
              >
                Registrar evidência
              </Link>
            </div>
          </div>

          <footer
            className="
              border-t
              border-white/10
              bg-white/[0.03]
              px-5
              py-4
              sm:px-7
            "
          >
            <p
              className="
                text-xs
                leading-5
                text-slate-400
              "
            >
              Os resultados apoiam a análise profissional e não substituem a
              decisão pedagógica humana.
            </p>
          </footer>
        </section>

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
                    relative
                    flex
                    min-h-48
                    flex-col
                    p-5
                    transition
                    sm:p-6
                    ${
                      module.intelligence
                        ? 'bg-[#071827] text-white hover:bg-[#0B2638]'
                        : 'bg-white hover:bg-cyan-50/60'
                    }
                  `}
                >
                  {module.emphasis ? (
                    <span
                      aria-hidden="true"
                      className="
                        absolute
                        inset-x-0
                        top-0
                        h-1
                        bg-cyan-600
                      "
                    />
                  ) : null}

                  {module.intelligence ? (
                    <span
                      aria-hidden="true"
                      className="
                        absolute
                        inset-x-0
                        top-0
                        h-1
                        bg-cyan-400
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
                      className={`
                        font-mono
                        text-xs
                        font-bold
                        tracking-[0.14em]
                        ${
                          module.intelligence
                            ? 'text-cyan-300'
                            : 'text-cyan-700'
                        }
                      `}
                    >
                      {module.code}
                    </span>

                    <span
                      aria-hidden="true"
                      className={`
                        h-2.5
                        w-2.5
                        rotate-45
                        border
                        transition
                        ${
                          module.intelligence
                            ? 'border-cyan-300 group-hover:bg-cyan-300'
                            : 'border-cyan-500 group-hover:bg-cyan-500'
                        }
                      `}
                    />
                  </div>

                  <h3
                    className={`
                      mt-6
                      text-lg
                      font-bold
                      ${
                        module.intelligence
                          ? 'text-white'
                          : 'text-slate-950'
                      }
                    `}
                  >
                    {module.title}
                  </h3>

                  <p
                    className={`
                      mt-2
                      text-sm
                      leading-6
                      ${
                        module.intelligence
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }
                    `}
                  >
                    {module.description}
                  </p>

                  {module.intelligence ? (
                    <span
                      className="
                        mt-4
                        inline-flex
                        w-fit
                        rounded-full
                        border
                        border-cyan-300/30
                        bg-cyan-300/10
                        px-3
                        py-1
                        text-xs
                        font-bold
                        text-cyan-200
                      "
                    >
                      EIOS ativo
                    </span>
                  ) : null}

                  <span
                    className={`
                      mt-auto
                      pt-5
                      text-sm
                      font-semibold
                      transition
                      group-hover:translate-x-1
                      ${
                        module.intelligence
                          ? 'text-cyan-300'
                          : 'text-cyan-800'
                      }
                    `}
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
                Os registros permanecem sob as regras de acesso, privacidade e
                governança já homologadas.
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
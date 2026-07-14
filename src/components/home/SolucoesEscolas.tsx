type Solucao = {
  numero: string
  eixo: string
  titulo: string
  descricao: string
  entregas: string[]
  cta: string
  href: string
  status?: string
}

function createMailto(subject: string, body: string): string {
  return `mailto:sabinohc@gmail.com?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`
}

const solucoes: Solucao[] = [
  {
    numero: '01',
    eixo: 'Evidências',
    titulo: 'Diagnóstico EDI da Escola',
    descricao:
      'Mapeamento institucional da escola com análise de processos pedagógicos, indicadores, organização documental, uso de tecnologias, desenvolvimento profissional e capacidade de tomada de decisão baseada em evidências.',
    entregas: [
      'Diagnóstico institucional',
      'Identificação de necessidades',
      'Prioridades de intervenção',
      'Relatório executivo',
      'Plano inicial de desenvolvimento',
    ],
    cta: 'Solicitar diagnóstico',
    href: createMailto(
      'Diagnóstico EDI da Escola',
      'Olá, gostaria de solicitar informações sobre o Diagnóstico EDI da Escola.\n\nEscola ou rede:\nMunicípio/UF:\nNome do responsável:\nTelefone para contato:',
    ),
  },
  {
    numero: '02',
    eixo: 'Desenvolvimento',
    titulo: 'Desenvolvimento Profissional Docente',
    descricao:
      'Programas de formação para professores e equipes pedagógicas, integrando inteligência artificial, dados educacionais, planejamento, metodologias digitais e práticas aplicáveis à realidade da escola. A solução poderá articular o Professor Digital e as formações da EduData Academy.',
    entregas: [
      'Formação continuada',
      'Trilhas de aprendizagem',
      'Oficinas práticas',
      'Acompanhamento profissional',
      'Certificação, quando disponível',
    ],
    cta: 'Conhecer as formações',
    href: '/academy',
  },
  {
    numero: '03',
    eixo: 'Desenvolvimento',
    titulo: 'Planejamento e Gestão Pedagógica',
    descricao:
      'Estruturação dos processos de planejamento, acompanhamento, registro de ações, evidências pedagógicas, reuniões, intervenções e responsabilidades das equipes escolares, com a Agenda Inteligente EDI apresentada como solução em desenvolvimento, piloto e lista de interesse.',
    entregas: [
      'Organização dos processos pedagógicos',
      'Acompanhamento de ações',
      'Registro de evidências',
      'Definição de responsabilidades',
      'Redução de retrabalho',
    ],
    cta: 'Conhecer a Agenda EDI',
    href: '/agenda',
    status: 'Em desenvolvimento · piloto e lista de interesse',
  },
  {
    numero: '04',
    eixo: 'Inteligência',
    titulo: 'Indicadores e Inteligência Educacional',
    descricao:
      'Construção de dashboards, relatórios e análises para transformar dados escolares em informações úteis para professores, coordenadores, diretores e redes de ensino, conectando EduData Analytics e EduData Insights.',
    entregas: [
      'Painéis de indicadores',
      'Identificação de tendências',
      'Alertas e prioridades',
      'Relatórios executivos',
      'Apoio à tomada de decisão',
    ],
    cta: 'Conhecer a inteligência educacional',
    href: '/#analytics',
    status: 'Em desenvolvimento',
  },
  {
    numero: '05',
    eixo: 'Inteligência',
    titulo: 'Automação e Organização Institucional',
    descricao:
      'Revisão e automação de processos administrativos e pedagógicos repetitivos, reduzindo tarefas manuais, duplicação de informações, perda de documentos e dependência de controles dispersos.',
    entregas: [
      'Mapeamento de processos',
      'Automação de fluxos',
      'Organização de documentos',
      'Integração de ferramentas',
      'Redução da carga operacional',
    ],
    cta: 'Solicitar uma análise',
    href: createMailto(
      'Análise de Automação e Organização Institucional',
      'Olá, gostaria de solicitar uma análise de automação e organização institucional.\n\nEscola ou rede:\nMunicípio/UF:\nProcesso que precisa ser analisado:\nNome do responsável:\nTelefone para contato:',
    ),
  },
  {
    numero: '06',
    eixo: 'Evidências · Desenvolvimento · Inteligência',
    titulo: 'Plano EDI de Transformação Escolar',
    descricao:
      'Programa integrado para escolas que desejam desenvolver uma estratégia institucional baseada em evidências, desenvolvimento profissional, organização de processos, indicadores e inteligência educacional.',
    entregas: [
      'Diagnóstico inicial',
      'Objetivos estratégicos',
      'Plano de ação por etapas',
      'Indicadores de acompanhamento',
      'Acompanhamento consultivo e relatório de evolução',
    ],
    cta: 'Agendar uma conversa',
    href: createMailto(
      'Plano EDI de Transformação Escolar',
      'Olá, gostaria de agendar uma conversa sobre o Plano EDI de Transformação Escolar.\n\nEscola ou rede:\nMunicípio/UF:\nPrincipal necessidade institucional:\nNome do responsável:\nTelefone para contato:',
    ),
  },
]

const jornada = [
  'Diagnosticar',
  'Desenvolver pessoas',
  'Organizar processos',
  'Produzir evidências',
  'Analisar indicadores',
  'Apoiar decisões',
  'Promover evolução institucional',
]

export default function SolucoesEscolas() {
  return (
    <section
      id="escolas"
      className="bg-[#F5F6F8] px-6 py-24 md:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Para Escolas
          </p>

          <h2 className="text-4xl font-bold text-[#0A3A5E] md:text-5xl">
            Soluções para Escolas
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            A EduData IA apoia escolas e redes de ensino em uma jornada
            integrada de diagnóstico, desenvolvimento profissional,
            organização de processos, produção de evidências e apoio à tomada
            de decisão.
          </p>
        </div>

        <div className="mb-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0A3A5E]">
            Jornada institucional EDI
          </p>

          <ol className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
            {jornada.map((etapa, index) => (
              <li
                key={etapa}
                className="flex items-center gap-2"
              >
                <span className="rounded-full bg-[#E8EEF4] px-4 py-2">
                  {etapa}
                </span>

                {index < jornada.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="text-[#0A3A5E]"
                  >
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {solucoes.map((solucao) => (
            <a
              key={solucao.numero}
              href={solucao.href}
              aria-label={`${solucao.cta}: ${solucao.titulo}`}
              className="group flex h-full flex-col rounded-3xl border border-white bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#0A3A5E]/20 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A3A5E]/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A3A5E] text-sm font-bold text-white">
                  {solucao.numero}
                </span>

                <span className="rounded-full bg-[#E8EEF4] px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-[#0A3A5E]">
                  {solucao.eixo}
                </span>
              </div>

              {solucao.status ? (
                <p className="mt-5 w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                  {solucao.status}
                </p>
              ) : null}

              <h3 className="mt-6 text-2xl font-bold leading-tight text-[#0A3A5E]">
                {solucao.titulo}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {solucao.descricao}
              </p>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Entregas
                </p>

                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  {solucao.entregas.map((entrega) => (
                    <li
                      key={entrega}
                      className="flex gap-2"
                    >
                      <span
                        aria-hidden="true"
                        className="text-[#1B6B3A]"
                      >
                        ✓
                      </span>

                      <span>{entrega}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <span className="mt-auto inline-flex items-center gap-2 pt-7 font-semibold text-[#0A3A5E]">
                {solucao.cta}

                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </a>
          ))}
        </div>

        <a
          href="#participacao"
          className="mt-10 inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A3A5E]/20"
        >
          Agendar Conversa
        </a>
      </div>
    </section>
  )
}
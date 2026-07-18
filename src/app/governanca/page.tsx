import type { Metadata } from 'next'
import Link from 'next/link'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Governança, Privacidade e Acessibilidade | EduData IA',

  description:
    'Diretrizes institucionais de governança, privacidade, proteção de dados, termos de uso e acessibilidade da plataforma EduData IA.',
}

type GovernanceSection = {
  id: string
  code: string
  label: string
  title: string
  description: string
  items: string[]
}

const governanceSections: GovernanceSection[] = [
  {
    id: 'privacidade',
    code: '01',
    label: 'Privacidade e proteção de dados',
    title: 'Tratamento responsável de informações.',
    description:
      'A EduData IA orienta a evolução de seus produtos pelos princípios de finalidade, necessidade, transparência, segurança e prestação de contas.',
    items: [
      'Os dados devem ser tratados somente para finalidades legítimas, específicas e relacionadas à prestação dos serviços da plataforma.',
      'A coleta deve ser limitada às informações necessárias para cadastro, autenticação, funcionamento dos produtos, suporte e segurança.',
      'Os usuários devem receber informações claras sobre o uso de seus dados e sobre os recursos em que essas informações são utilizadas.',
      'Medidas técnicas e administrativas devem ser adotadas para reduzir riscos de acesso, alteração, perda ou divulgação não autorizada.',
      'Solicitações relacionadas a dados pessoais podem ser encaminhadas pelos canais oficiais de contato da EduData IA.',
    ],
  },
  {
    id: 'termos',
    code: '02',
    label: 'Termos de uso',
    title: 'Uso responsável da plataforma.',
    description:
      'O acesso aos produtos da EduData IA pressupõe utilização legítima, responsável e compatível com as finalidades educacionais da plataforma.',
    items: [
      'Cada usuário é responsável por proteger suas credenciais e não deve compartilhar o acesso à sua conta com pessoas não autorizadas.',
      'Os recursos não devem ser utilizados para atividades ilícitas, discriminatórias, abusivas ou que violem direitos de terceiros.',
      'Perfis, permissões e funcionalidades disponíveis podem variar conforme o plano, o vínculo institucional e o papel atribuído ao usuário.',
      'Registros pedagógicos, documentos e evidências devem ser inseridos apenas quando houver finalidade educacional e autorização adequada.',
      'Funcionalidades em desenvolvimento podem ser alteradas, aperfeiçoadas ou temporariamente indisponibilizadas durante a evolução da plataforma.',
    ],
  },
  {
    id: 'acessibilidade',
    code: '03',
    label: 'Acessibilidade',
    title: 'Experiências digitais mais inclusivas.',
    description:
      'A acessibilidade integra o Framework EDI e deve ser considerada na concepção, implementação e evolução das interfaces da EduData IA.',
    items: [
      'As interfaces devem priorizar estrutura semântica, contraste adequado, navegação por teclado e textos compreensíveis.',
      'Elementos interativos devem possuir identificação clara e estados de foco perceptíveis.',
      'Imagens funcionais devem apresentar descrições apropriadas, enquanto elementos decorativos não devem criar ruído para tecnologias assistivas.',
      'A plataforma deve evoluir continuamente com base em testes, avaliações técnicas e contribuições dos usuários.',
      'Barreiras de acesso podem ser comunicadas à equipe para análise e priorização de correções.',
    ],
  },
  {
    id: 'menores',
    code: '04',
    label: 'Crianças e adolescentes',
    title: 'Proteção reforçada no contexto educacional.',
    description:
      'Informações relacionadas a crianças e adolescentes exigem cuidado adicional, finalidade pedagógica legítima e controle de acesso.',
    items: [
      'Imagens, nomes, produções ou outros elementos identificáveis devem ser registrados somente quando necessários para a atividade educacional.',
      'Quando aplicável, o registro deve possuir autorização do responsável legal ou outra base adequada definida pela instituição.',
      'A plataforma deve recomendar anonimização, desfoque e remoção de identificadores sempre que a identificação não for necessária.',
      'Evidências educacionais não devem ser utilizadas para exposição pública, constrangimento, discriminação ou finalidade incompatível.',
      'O acesso institucional deve seguir papéis, permissões e o princípio do menor privilégio.',
    ],
  },
]

const principles = [
  'Finalidade',
  'Adequação',
  'Necessidade',
  'Transparência',
  'Segurança',
  'Prevenção',
  'Não discriminação',
  'Prestação de contas',
]

export default function GovernancePage() {
  return (
    <>
      <AccessibilityBar />

      <Header />

      <main className="min-h-screen bg-[#EEF3F7]">
        <section className="relative overflow-hidden bg-[#071827] px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cyan-300/10"
          />

          <div
            aria-hidden="true"
            className="absolute right-20 top-36 h-40 w-40 rounded-full border border-cyan-300/10"
          />

          <div className="relative mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Governança institucional
            </p>

            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Privacidade, segurança e responsabilidade no ecossistema
              EduData IA.
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Esta central apresenta as diretrizes iniciais que orientam
              a utilização responsável dos produtos, o tratamento de
              informações e a evolução das experiências digitais da
              plataforma.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {principles.map((principle) => (
                <span
                  key={principle}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  {principle}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="#privacidade"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071827]"
              >
                Consultar diretrizes
              </Link>

              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071827]"
              >
                Voltar para a página inicial
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
                Versão institucional inicial
              </p>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-950">
                Estas diretrizes apresentam compromissos gerais da
                EduData IA e não substituem contratos, avisos específicos,
                termos de consentimento ou políticas complementares
                aplicáveis a cada produto, plano ou implantação
                institucional.
              </p>

              <p className="mt-3 text-sm font-semibold text-amber-900">
                Última atualização: 17 de julho de 2026.
              </p>
            </div>

            <nav
              aria-label="Seções da Central de Governança"
              className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {governanceSections.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0B7491]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-offset-2"
                >
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    {section.code}
                  </span>

                  <span className="mt-3 block font-bold text-[#071827]">
                    {section.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {governanceSections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
              >
                <header className="border-b border-slate-200 bg-slate-50 px-6 py-6 sm:px-8">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {section.code}
                    </span>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                      {section.label}
                    </p>
                  </div>

                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#071827] sm:text-3xl">
                    {section.title}
                  </h2>

                  <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
                    {section.description}
                  </p>
                </header>

                <div className="px-6 py-6 sm:px-8 sm:py-8">
                  <ul className="space-y-4">
                    {section.items.map((item, index) => (
                      <li
                        key={item}
                        className="grid grid-cols-[32px_minmax(0,1fr)] gap-4"
                      >
                        <span className="font-mono text-xs font-bold text-[#0B7491]">
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        <p className="text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                          {item}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#071827] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Canal de contato
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Dúvidas sobre privacidade, acesso ou acessibilidade?
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Envie sua solicitação com uma descrição objetiva do
                pedido. Demandas institucionais devem informar também o
                nome da organização ou escola relacionada.
              </p>
            </div>

            <a
              href="mailto:sabinohc@gmail.com?subject=Governan%C3%A7a%2C%20privacidade%20ou%20acessibilidade%20-%20EduData%20IA"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071827]"
            >
              Entrar em contato
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
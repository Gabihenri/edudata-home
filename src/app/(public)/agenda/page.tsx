import type { Metadata } from 'next'

import Link from 'next/link'

import AgendaPublicHeader from '@/components/products/AgendaPublicHeader'

export const metadata: Metadata = {
  title: 'Agenda Inteligente EDI | EduData IA',
  description:
    'Planejamento, registros, evidências e inteligência educacional integrados ao EIOS.',
}

const operationalFlow = [
  {
    code: '01',
    title: 'Planejar',
    description:
      'Organize eventos, aulas, reuniões, tarefas e ações pedagógicas.',
  },
  {
    code: '02',
    title: 'Registrar',
    description:
      'Documente a execução do trabalho pedagógico e institucional.',
  },
  {
    code: '03',
    title: 'Evidenciar',
    description:
      'Relacione registros, documentos, produções e resultados observáveis.',
  },
  {
    code: '04',
    title: 'Analisar',
    description:
      'Acompanhe indicadores, histórico, pendências e prioridades.',
  },
]

const resources = [
  {
    code: '01',
    title: 'Calendário pedagógico',
    description:
      'Organize eventos pontuais, compromissos recorrentes e horários-padrão.',
  },
  {
    code: '02',
    title: 'Planejamento',
    description:
      'Registre objetivos, estratégias, recursos e formas de acompanhamento.',
  },
  {
    code: '03',
    title: 'Evidências',
    description:
      'Preserve registros pedagógicos com segurança, contexto e governança.',
  },
  {
    code: '04',
    title: 'Histórico',
    description:
      'Consulte registros, versões, exclusões preservadas e restaurações.',
  },
]

const pilotOffer = {
  price: 'R$ 15,00',
  duration: '30 dias',
  payment: 'Pagamento único',
  renewal: 'Sem renovação automática',
}

const faqs = [
  {
    question: 'O que acontece depois dos 30 dias?',
    answer:
      'O piloto termina ao final do período contratado. Nenhuma renovação automática é realizada. As próximas condições de continuidade são apresentadas antes de qualquer nova cobrança.',
  },
  {
    question: 'Posso cancelar ou pedir reembolso?',
    answer:
      'Como o piloto é uma contratação pontual, não há renovação automática para cancelar. As solicitações relacionadas ao pagamento são avaliadas pelo canal de suporte conforme a política aplicável à compra.',
  },
  {
    question: 'Há suporte durante o piloto?',
    answer:
      'Sim. Durante o período do piloto, o usuário conta com os canais de suporte disponíveis para esclarecer dúvidas de acesso e uso da Agenda.',
  },
]

const upgradeHref =
  '/upgrade?requestedPlan=edi_professor_pro&product=agenda_edi'

export default function AgendaPage() {
  return (
    <main className="min-h-screen bg-[#EEF3F7]">
      <AgendaPublicHeader />

      <section className="relative overflow-hidden bg-[#071827] text-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 top-12 h-72 w-72 rounded-full border border-cyan-300/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-4 top-36 h-40 w-40 rounded-full border border-cyan-300/10"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                Produto especializado
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Integrado ao EIOS
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Agenda Inteligente EDI
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Organize o trabalho pedagógico em um único fluxo operacional.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Planejamento, calendário, tarefas, turmas, evidências,
              indicadores e histórico conectados ao ecossistema da EduData IA.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/cadastro"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
              >
                Criar conta gratuita
              </Link>
              <Link
                href="#recursos-agenda"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-7 py-4 text-center font-semibold text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-200/15"
              >
                Ver recursos da Agenda
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                    Piloto de acesso
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {pilotOffer.price}
                  </p>
                </div>
                <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-cyan-100">
                  {pilotOffer.duration}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
                <p>• {pilotOffer.payment}</p>
                <p>• {pilotOffer.renewal}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Criar a conta é gratuito. Depois, você pode ativar o piloto de 30 dias por R$ 15,00 na etapa de contratação. Nenhuma cobrança acontece durante o cadastro.
              </p>
              <Link
                href={upgradeHref}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-200/35 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Ativar acesso ao piloto
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Já possui conta?{' '}
              <Link
                href="/login?redirectTo=%2Fagenda%2Fdashboard"
                className="font-semibold text-cyan-200 hover:underline"
              >
                Entrar na Agenda
              </Link>
            </p>
          </div>

          <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04]">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Método operacional
              </p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Do planejamento à análise
              </h2>
            </header>
            <div className="divide-y divide-white/10">
              {operationalFlow.map((step) => (
                <article
                  key={step.code}
                  className="grid grid-cols-[38px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7 sm:py-5"
                >
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {step.code}
                  </span>
                  <div>
                    <h3 className="font-bold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section
        id="recursos-agenda"
        tabIndex={-1}
        className="scroll-mt-6 border-y border-transparent px-4 py-14 outline-none transition duration-500 target:border-cyan-200 target:bg-cyan-50/70 target:ring-4 target:ring-inset target:ring-cyan-100 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Recursos operacionais
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Uma agenda construída para o trabalho educacional.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Os módulos compartilham a mesma identidade, os mesmos princípios de governança e a mesma base operacional do EIOS.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                title: 'Calendário pedagógico',
                subtitle: 'Visualização da rotina',
                lines: ['Reunião pedagógica · 14h', 'Aula · 2º Ano A · 16h', 'Entrega de evidência · sexta'],
              },
              {
                title: 'Planejamento',
                subtitle: 'Objetivos e ações',
                lines: ['Objetivo de aprendizagem definido', 'Estratégia e recursos organizados', 'Próxima aula vinculada ao planejamento'],
              },
              {
                title: 'Evidências e histórico',
                subtitle: 'Registros com contexto',
                lines: ['Registro vinculado à ação', 'Arquivo e descrição organizados', 'Histórico disponível para acompanhamento'],
              },
            ].map((preview) => (
              <article
                key={preview.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-200 bg-[#071827] px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                    Ambiente operacional
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-white">
                    {preview.title}
                  </h3>
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    {preview.subtitle}
                  </p>
                  {preview.lines.map((line) => (
                    <div
                      key={line}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-500">
            Representações ilustrativas do ambiente operacional. A interface real continua evoluindo conforme os recursos disponíveis na sua conta.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {resources.map((resource) => (
              <article
                key={resource.code}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    {resource.code}
                  </span>
                </header>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#071827]">
                    {resource.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {resource.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Arquitetura da plataforma
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Um produto especializado construído sobre o EIOS.
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              A Agenda Inteligente EDI não funciona como uma solução isolada. Ela compartilha identidade, acesso, dados, segurança e inteligência com os demais produtos da plataforma.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#071827] text-white">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                Estrutura oficial
              </p>
            </div>
            <div className="divide-y divide-white/10">
              <div className="px-5 py-4 font-semibold">Framework EDI</div>
              <div className="px-5 py-4 font-semibold">EIOS</div>
              <div className="px-5 py-4 font-semibold">Core compartilhado</div>
              <div className="bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100">
                Agenda Inteligente EDI
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071827] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Primeiro acesso
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Comece com uma conta gratuita.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Crie sua conta sem cobrança. Depois, quando estiver pronto, ative o piloto da Agenda por R$ 15,00 durante 30 dias.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
            >
              Criar conta gratuita
            </Link>
            <Link
              href={upgradeHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-200/35 bg-white/5 px-7 py-4 text-center font-semibold text-white transition hover:bg-white/10"
            >
              Ativar piloto
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#F8FAFB] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
            Dúvidas sobre o piloto
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
            Informações claras antes de começar.
          </h2>
          <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {faqs.map((faq) => (
              <article key={faq.question} className="p-5 sm:p-6">
                <h3 className="font-bold text-[#071827]">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Agenda Inteligente EDI</p>
          <p>Produto operacional integrado ao EIOS</p>
        </div>
      </footer>
    </main>
  )
}

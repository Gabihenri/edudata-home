import type { Metadata } from 'next'

import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Professor Digital | EduData IA',
  description:
    'Ambiente de autoanálise e inteligência profissional para compreender a trajetória docente, reconhecer padrões e identificar possibilidades de desenvolvimento.',
}

const nuclei = [
  {
    code: '01',
    eyebrow: 'Autoanálise profissional',
    title: 'Minha Atuação',
    description:
      'Ajuda a observar padrões da própria atuação a partir de dados autorizados e objetivos definidos pelo profissional, sem notas, rótulos ou classificações automáticas.',
    example:
      'Que padrões da minha atuação nesta semana eu reconheço e quais gostaria de compreender melhor?',
  },
  {
    code: '02',
    eyebrow: 'Mapa profissional',
    title: 'Meu Conhecimento',
    description:
      'Organiza temas, interesses, produções e conexões para tornar visíveis os territórios de conhecimento que o educador já explora e deseja aprofundar.',
    example:
      'Quais temas aparecem de forma recorrente nas minhas produções e que novas conexões posso explorar?',
  },
  {
    code: '03',
    eyebrow: 'Memória profissional',
    title: 'Minha Produção',
    description:
      'Transforma registros e produções autorizados em sínteses reflexivas que ajudam a reconhecer o que foi desenvolvido e o que merece continuidade.',
    example:
      'O que minha produção desta semana revela sobre os projetos e ideias que estão ganhando força?',
  },
  {
    code: '04',
    eyebrow: 'Possibilidades de evolução',
    title: 'Meu Desenvolvimento',
    description:
      'Conecta objetivos, interesses e evidências autorizadas às possibilidades identificadas pelo EIOS e às experiências formativas da EduData Academy.',
    example:
      'Que caminhos de aprofundamento fazem sentido para os objetivos que escolhi desenvolver agora?',
  },
]

const principles = [
  {
    title: 'Autonomia preservada',
    description:
      'O profissional continua responsável pelas interpretações, escolhas e decisões sobre sua própria trajetória.',
  },
  {
    title: 'Dados e análises transparentes',
    description:
      'As análises devem deixar claro quais informações autorizadas foram consideradas e como sustentam cada leitura.',
  },
  {
    title: 'Direito de validar e corrigir',
    description:
      'O professor pode confirmar, contextualizar, corrigir ou rejeitar interpretações que não representem sua experiência.',
  },
  {
    title: 'Sem rótulos ou avaliação psicológica',
    description:
      'O produto não define perfis comportamentais, diagnósticos psicológicos ou classificações ocultas de desempenho.',
  },
  {
    title: 'Autoanálise não é avaliação institucional',
    description:
      'A experiência pessoal de reflexão é separada de processos formais de avaliação, gestão ou responsabilização institucional.',
  },
]

const differences = [
  {
    agenda: 'Organiza, planeja e acompanha o trabalho',
    professor: 'Ajuda o profissional a compreender o que sua trajetória e prática revelam',
  },
  {
    agenda: 'Registra ações, acontecimentos e evidências',
    professor: 'Transforma dados autorizados em sínteses e perguntas para reflexão',
  },
  {
    agenda: 'Sustenta a rotina operacional',
    professor: 'Constrói memória profissional, conhecimento e possibilidades de desenvolvimento',
  },
]

export default function ProfessorDigitalPage() {
  return (
    <main className="min-h-screen bg-[#EEF3F7] text-slate-950">
      <section className="relative overflow-hidden bg-[#071827] text-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 top-8 h-72 w-72 rounded-full border border-cyan-300/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-2 top-32 h-40 w-40 rounded-full border border-cyan-300/10"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                Produto em validação
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Integrado ao EIOS
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Professor Digital
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Um espelho inteligente da sua trajetória profissional.
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              O Professor Digital é o ambiente de autoanálise e inteligência
              profissional da EduData IA. A partir de dados, produções e objetivos
              que o próprio educador autoriza, ele ajuda a compreender a própria
              trajetória, visualizar padrões de atuação, construir uma base de
              conhecimento e identificar possibilidades de desenvolvimento — sempre
              com o professor no controle das interpretações.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="#nucleos"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Conhecer os núcleos do produto
              </Link>
              <Link
                href="/agenda"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-7 py-4 text-center font-semibold text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-200/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
              >
                Conhecer a Agenda Inteligente EDI
              </Link>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              A Agenda Inteligente EDI organiza e registra a rotina. O Professor
              Digital interpreta a trajetória e apoia reflexão e desenvolvimento.
            </p>
          </div>

          <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04]">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Função do produto
              </p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Compreender a trajetória, não executar a rotina
              </h2>
            </header>

            <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                  O que faz
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Apoia autoanálise, organiza uma visão da produção e do conhecimento
                  profissional e identifica possibilidades de aprofundamento.
                </p>
              </div>

              <div className="border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  O que não faz
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Não é agenda, calendário ou gerenciador de tarefas e não substitui
                  os registros operacionais, o planejamento ou as evidências da rotina.
                </p>
              </div>
            </div>

            <footer className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-4 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-100">
                Observar → refletir → compreender → desenvolver.
              </p>
            </footer>
          </aside>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Uma função complementar à Agenda
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Dois produtos, dois territórios diferentes.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              A Agenda Inteligente EDI responde como o profissional organiza, registra
              e acompanha seu trabalho. O Professor Digital responde o que a trajetória
              e a prática podem revelar sobre atuação, produção, conhecimentos e
              possibilidades de desenvolvimento.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="grid border-b border-slate-200 bg-slate-50 text-sm font-bold text-[#071827] sm:grid-cols-2">
              <div className="px-5 py-4 sm:px-7">Agenda Inteligente EDI</div>
              <div className="border-t border-slate-200 px-5 py-4 text-[#0B7491] sm:border-l sm:border-t-0 sm:px-7">
                Professor Digital
              </div>
            </div>
            {differences.map((item, index) => (
              <div
                key={item.agenda}
                className={`grid text-sm leading-6 sm:grid-cols-2 ${
                  index < differences.length - 1 ? 'border-b border-slate-200' : ''
                }`}
              >
                <div className="px-5 py-5 text-slate-600 sm:px-7">{item.agenda}</div>
                <div className="border-t border-slate-200 px-5 py-5 text-slate-700 sm:border-l sm:border-t-0 sm:px-7">
                  {item.professor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="nucleos" className="scroll-mt-24 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Em construção
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Quatro núcleos para compreender e desenvolver a trajetória profissional.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Estes núcleos estão em validação como parte da arquitetura do produto. A
              proposta não é avaliar automaticamente o professor, mas oferecer
              instrumentos para que ele próprio possa analisar sua experiência.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {nuclei.map((item) => (
              <article
                key={item.code}
                className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm"
              >
                <div aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-[#0B7491]" />
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    {item.eyebrow}
                  </p>
                  <span className="font-mono text-xs font-bold text-slate-400">{item.code}</span>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-[#071827]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                <div className="mt-6 rounded-xl border border-cyan-100 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                    Uma pergunta possível
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">“{item.example}”</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Desenvolvimento conectado ao ecossistema
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              O EIOS conecta possibilidades. O professor escolhe o caminho.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Quando autorizado, o EIOS pode relacionar objetivos, interesses,
              produções e territórios de conhecimento a possibilidades de formação.
              A EduData Academy é o espaço para aprofundar essas escolhas por meio de
              cursos, trilhas e experiências de aprendizagem.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-4 text-sm leading-6 text-slate-600">
              <div>
                <p className="font-bold text-[#071827]">Professor Digital</p>
                <p className="mt-1">Ajuda a compreender a trajetória e explicitar objetivos de desenvolvimento.</p>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="font-bold text-[#071827]">EIOS</p>
                <p className="mt-1">Identifica conexões e apresenta possibilidades com base apenas no contexto autorizado.</p>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="font-bold text-[#071827]">EduData Academy</p>
                <p className="mt-1">Oferece experiências formativas para aprofundar os caminhos que o profissional decide explorar.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Como o Professor Digital trata seus dados
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Inteligência profissional com autonomia, transparência e controle humano.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {principles.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
                <h3 className="font-bold text-[#071827]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[1.75rem] bg-[#071827] px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            Próxima etapa
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            O produto continua em desenvolvimento e validação.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Estamos validando quais análises e experiências realmente ajudam o
            profissional a compreender sua trajetória sem transformar inteligência em
            vigilância ou substituir a autonomia humana.
          </p>
          <div className="mt-8">
            <Link
              href="/agenda"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Conhecer a Agenda Inteligente EDI
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

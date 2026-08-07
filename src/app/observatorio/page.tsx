import Link from 'next/link'

export const metadata = {
  title: 'Observatório da Educação | EduData IA',
  description:
    'Ambiente de pesquisa, estudos, indicadores e conhecimento educacional integrado ao EIOS.',
}

export default function ObservatoryPage() {
  return (
    <main className="min-h-screen bg-[#EEF3F7] text-slate-950">
      <section className="bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Pesquisa e conhecimento
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Observatório da Educação
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            O Observatório transforma dados e análises governadas em estudos, séries históricas, indicadores e conhecimento educacional reutilizável.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/observatorio/dashboard"
              className="rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#09657E]"
            >
              Acessar ambiente de pesquisa
            </Link>
            <Link
              href="/analytics"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Conhecer o Analytics
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Estudar', 'Registrar perguntas, escopo e metodologia de estudos educacionais.'],
            ['Comparar', 'Organizar análises longitudinais e benchmarking com contexto.'],
            ['Publicar', 'Transformar achados revisados em conhecimento reutilizável.'],
            ['Pesquisar', 'Criar uma base rastreável para Research Intelligence do EIOS.'],
          ].map(([title, description]) => (
            <article key={title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#071827]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

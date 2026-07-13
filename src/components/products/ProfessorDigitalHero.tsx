import Image from 'next/image'
import Link from 'next/link'

export function ProfessorDigitalHero() {
  return (
    <section className="bg-[#071826] px-6 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Professor Digital
          </p>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Inteligência educacional para apoiar o trabalho docente.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Planeje aulas, organize evidências, acompanhe estudantes e reduza
            tarefas operacionais com recursos integrados ao ecossistema
            EduData IA.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/professor-digital/dashboard"
              className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-4 font-semibold text-slate-950 transition hover:opacity-90"
            >
              Acessar o Professor Digital
            </Link>

            <Link
              href="#recursos-professor-digital"
              className="rounded-full border border-white/20 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Conhecer recursos
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Image
            src="/logo-professor-digital.png"
            alt="Professor Digital"
            width={720}
            height={420}
            priority
            className="h-auto w-full max-w-xl object-contain"
          />
        </div>
      </div>
    </section>
  )
}
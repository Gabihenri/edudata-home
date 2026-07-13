import Image from 'next/image'
import Link from 'next/link'

export function AgendaHero() {
  return (
    <section className="bg-[#081C2E] px-6 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
            Agenda Inteligente EDI
          </p>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Planejamento, evidências e inteligência educacional em um único
            ambiente.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Organize eventos, planejamentos, tarefas, turmas, evidências e
            histórico pedagógico com integração ao ecossistema EduData IA.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/agenda/dashboard"
              className="rounded-full bg-[#5C1A8C] px-7 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Acessar a Agenda
            </Link>

            <Link
              href="#recursos-agenda"
              className="rounded-full border border-white/20 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Conhecer recursos
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Image
            src="/logo-agenda-inteligente-edi.png"
            alt="Agenda Inteligente EDI"
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
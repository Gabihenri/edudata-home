import Link from 'next/link'

const cards = [
  { title: 'Escolas', href: '/admin/escolas', description: 'Gerenciar base institucional de escolas.' },
  { title: 'Professores', href: '/admin/professores', description: 'Gerenciar perfis docentes.' },
  { title: 'Academy', href: '/admin/academy', description: 'Cursos, trilhas e certificações.' },
  { title: 'Professor Digital', href: '/admin/professor-digital', description: 'Acompanhar desenvolvimento docente.' },
  { title: 'Agenda EDI', href: '/admin/agenda', description: 'Planejamento, ações e evidências.' },
  { title: 'Analytics', href: '/admin/analytics', description: 'Indicadores e inteligência educacional.' },
]

export default function AdminPage() {
  return (
    <main>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">
          Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-bold text-[#081C2E]">
          BackOffice EIOS
        </h1>

        <p className="mt-4 max-w-3xl leading-8 text-slate-600">
          Centro operacional da EduData IA para gestão de escolas, professores,
          produtos, cursos, indicadores e integrações do ecossistema.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold text-[#081C2E]">
              {card.title}
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  )
}

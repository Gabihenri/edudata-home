import Link from 'next/link'

export default function AssessmentCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <nav
          aria-label="Navegação do Centro de Avaliações"
          className="mx-auto flex w-full max-w-7xl flex-wrap gap-2"
        >
          <Link
            href="/agenda/avaliacoes"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Centro de Avaliações
          </Link>
          <Link
            href="/agenda/avaliacoes/notas"
            className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-[#075F78] transition hover:bg-cyan-100"
          >
            Diário de Notas
          </Link>
          <Link
            href="/agenda/ocorrencias"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Ocorrências
          </Link>
        </nav>
      </div>
      {children}
    </>
  )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-bold tracking-tight text-[#0A3A5E]">
          EduData IA
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <a className="hover:text-[#0A3A5E]" href="#framework">
            Framework EDI
          </a>
          <a className="hover:text-[#0A3A5E]" href="#professor">
            Professor Digital
          </a>
          <a className="hover:text-[#0A3A5E]" href="#agenda">
            Agenda Inteligente
          </a>
          <a className="hover:text-[#1B6B3A]" href="#inclusao">
            Inclusão
          </a>
          <a className="hover:text-[#5C1A8C]" href="#ecossistema">
            Ecossistema
          </a>
        </nav>

        <a
          href="#participacao"
          className="rounded-full bg-[#0A3A5E] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Participar
        </a>
      </div>
    </header>
  )
}

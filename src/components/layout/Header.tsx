export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#081C2E] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center">
          <img
            src="/logo-edudata-ia-dark.png"
            alt="EduData IA"
            className="h-24 w-auto md:h-28"
          />
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-200 md:flex">
          <a href="#framework" className="hover:text-white">
            Framework
          </a>

          <a href="#professor-digital" className="hover:text-white">
            Professor Digital
          </a>

          <a href="#agenda" className="hover:text-white">
            Agenda EDI
          </a>

          <a href="#ecossistema" className="hover:text-white">
            Ecossistema
          </a>
        </nav>

        <a
          href="#participacao"
          className="rounded-full bg-white px-7 py-3 font-semibold text-[#081C2E] transition hover:opacity-90"
        >
          Comunidade
        </a>
      </div>
    </header>
  )
}